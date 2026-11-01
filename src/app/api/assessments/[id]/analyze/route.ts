import { NextRequest, NextResponse } from "next/server";
import { MatchingEngine } from "@/lib/matching/engine";
import { auditFindingsAccuracy } from "@/lib/evidence/verification";
import { detectRequirementConflicts } from "@/lib/matching/rules";
import { inMemoryStore } from "@/lib/db/in-memory-store";
import { connectToDatabase, getDatabaseMode } from "@/lib/db/connection";
import { enhanceAssessmentWithAi } from "@/lib/ai/provider";
import { AssessmentModel } from "@/models/Assessment";
import { ReportModel } from "@/models/Report";
import { AssessmentSubmissionSchema, AssessmentSubmissionInput } from "@/lib/validation/assessment-schema";
import { getSampleScenario, isSampleScenario } from "@/lib/evidence/scenarios";
import { getUserFromRequest } from "@/lib/auth/jwt";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const tokenUser = await getUserFromRequest(req);
    const isSample = isSampleScenario(id);

    // 1. Check if body provides submission input directly
    let inputData: AssessmentSubmissionInput | null = null;
    let bodyProvided = false;

    try {
      const body = await req.json();
      if (body && (body.organization || body.environment)) {
        bodyProvided = true;
        const parseResult = AssessmentSubmissionSchema.safeParse(body);
        if (!parseResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid assessment submission input",
              details: parseResult.error.format(),
            },
            { status: 400 }
          );
        }
        inputData = parseResult.data;
      }
    } catch {
      // Body empty or not valid JSON; fallback to loading existing stored assessment
    }

    // 2. Load existing assessment from memory or MongoDB
    let existingAssessment = inMemoryStore.getAssessment(id);
    if (!existingAssessment && !isSample) {
      const dbStatus = await connectToDatabase();
      if (dbStatus.isConnected) {
        try {
          const doc = await AssessmentModel.findOne({ id }).lean();
          if (doc) {
            existingAssessment = doc as any;
          }
        } catch (dbErr) {
          console.warn("MongoDB assessment lookup failed:", (dbErr as Error).message);
        }
      }
    }

    // 3. Ownership / Authorization Check
    if (existingAssessment && existingAssessment.ownerId && !isSample) {
      if (!tokenUser || tokenUser.userId !== existingAssessment.ownerId) {
        return NextResponse.json(
          {
            success: false,
            error: "Access denied. You do not own this assessment.",
          },
          { status: 403 }
        );
      }
    }

    // 4. Return cached report if already analyzed and no new body was provided
    if (!bodyProvided) {
      let cachedReport = inMemoryStore.getReportByAssessmentId(id) || inMemoryStore.getReport(id);
      if (!cachedReport && !isSample) {
        const dbStatus = await connectToDatabase();
        if (dbStatus.isConnected) {
          try {
            const reportDoc = await ReportModel.findOne({ assessmentId: id }).lean();
            if (reportDoc) {
              cachedReport = reportDoc as any;
            }
          } catch (dbErr) {
            console.warn("MongoDB report lookup failed:", (dbErr as Error).message);
          }
        }
      }

      if (cachedReport) {
        return NextResponse.json({
          success: true,
          assessmentId: id,
          reportId: cachedReport.id,
          assessment: existingAssessment,
          report: cachedReport,
          findings: cachedReport.findings,
          audit: auditFindingsAccuracy(cachedReport.findings),
          conflicts: [],
          nextSteps: cachedReport.recommendedNextSteps,
          executiveSummary: cachedReport.executiveSummary,
          isAiEnhanced: cachedReport.isAiEnhanced,
          aiProvider: cachedReport.isAiEnhanced ? "cached_ai_report" : "deterministic_engine",
          storageMode: getDatabaseMode(),
          cached: true,
        });
      }
    }

    // 5. If inputData was not in the body, reconstruct from existing assessment or sample
    if (!inputData) {
      if (!existingAssessment) {
        const sample = getSampleScenario(id);
        if (sample) {
          inputData = sample.input;
        } else {
          return NextResponse.json(
            { success: false, error: "Assessment record not found to analyze." },
            { status: 404 }
          );
        }
      } else {
        inputData = {
          organization: {
            industry: existingAssessment.organization.industry || "other",
            companySize: existingAssessment.organization.companySize || "enterprise",
            userRole: existingAssessment.organization.userRole || "it_decision_maker",
            companyName: existingAssessment.organization.companyName || null,
            assessmentGoal: existingAssessment.organization.assessmentGoal || "Data Lakehouse Evaluation",
          },
          environment: {
            deployment: (existingAssessment.environment.deployment as any) || "customer_cloud_vpc",
            dataSources: existingAssessment.environment.dataSources || ["Internal Data"],
            analyticsTools: existingAssessment.environment.analyticsTools || [],
            dataVolume: existingAssessment.environment.dataVolume || null,
            processingApproach: existingAssessment.environment.processingApproach || null,
          },
          selectedChallenges: existingAssessment.requirements.map(r => r.rawInput || r.description),
          freeTextChallenges: "",
          technicalRequirements: {
            integrationRequirements: [],
          },
        };
      }
    }

    if (!inputData) {
      return NextResponse.json(
        { success: false, error: "Assessment record not found to analyze." },
        { status: 404 }
      );
    }

    const ownerId = existingAssessment?.ownerId || (!isSample ? tokenUser?.userId || null : null);

    // 6. Run matching engine
    const engine = new MatchingEngine();
    const normalizedRequirements = engine.normalizeRequirements(inputData);
    const conflicts = detectRequirementConflicts(inputData);
    const findings = engine.evaluateRequirements(normalizedRequirements, inputData);
    const nextSteps = engine.generateNextSteps(findings, conflicts);

    // 7. Validate evidence accuracy
    const auditResult = auditFindingsAccuracy(findings);

    // 8. Draft baseline report
    const baseReport = engine.generateReport(
      id,
      inputData.organization,
      inputData.environment,
      findings,
      nextSteps,
      conflicts,
      false,
      ownerId
    );

    // 9. Optional AI enhancement (grounded, failsafe fallback)
    const aiResult = await enhanceAssessmentWithAi(
      inputData.organization,
      inputData.environment,
      findings,
      baseReport.executiveSummary
    );

    if (aiResult.isAiEnhanced) {
      baseReport.executiveSummary = aiResult.executiveSummary;
      baseReport.isAiEnhanced = true;
    }

    // 10. Save in memory store
    inMemoryStore.saveReport(baseReport);

    const updatedAssessment = {
      id,
      ownerId,
      organization: inputData.organization,
      environment: inputData.environment,
      requirements: normalizedRequirements,
      status: "completed" as const,
      createdAt: existingAssessment?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryStore.saveAssessment(updatedAssessment);

    // 11. Save in MongoDB if connected (non-blocking parallel write for instant client response)
    const dbStatus = await connectToDatabase();
    if (dbStatus.isConnected) {
      Promise.all([
        ReportModel.findOneAndUpdate(
          { assessmentId: id },
          { ...baseReport, ownerId },
          { upsert: true, new: true }
        ),
        AssessmentModel.findOneAndUpdate(
          { id },
          {
            ownerId,
            organization: inputData.organization,
            environment: inputData.environment,
            requirements: normalizedRequirements,
            status: "completed",
            updatedAt: new Date().toISOString(),
          },
          { upsert: true }
        ),
      ]).catch(dbErr => {
        console.warn("MongoDB write failed during analyze:", (dbErr as Error).message);
      });
    }

    return NextResponse.json({
      success: true,
      assessmentId: id,
      reportId: baseReport.id,
      assessment: updatedAssessment,
      report: baseReport,
      findings,
      audit: auditResult,
      conflicts,
      nextSteps,
      executiveSummary: baseReport.executiveSummary,
      isAiEnhanced: baseReport.isAiEnhanced,
      aiProvider: aiResult.providerName,
      storageMode: getDatabaseMode(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze assessment",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
