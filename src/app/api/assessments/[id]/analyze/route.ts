import { NextRequest, NextResponse } from "next/server";
import { MatchingEngine } from "@/lib/matching/engine";
import { auditFindingsAccuracy } from "@/lib/evidence/verification";
import { detectRequirementConflicts } from "@/lib/matching/rules";
import { inMemoryStore } from "@/lib/db/in-memory-store";
import { connectToDatabase, getDatabaseMode } from "@/lib/db/connection";
import { enhanceAssessmentWithAi } from "@/lib/ai/provider";
import { AssessmentModel } from "@/models/Assessment";
import { ReportModel } from "@/models/Report";
import { AssessmentSubmissionInput } from "@/lib/validation/assessment-schema";
import sampleScenarios from "@/data/sample-scenarios.json";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if body provides submission input directly, or fetch from store
    let inputData: AssessmentSubmissionInput | null = null;

    try {
      const body = await req.json();
      if (body && body.organization && body.environment) {
        inputData = body as AssessmentSubmissionInput;
      }
    } catch {
      // Body empty or not JSON, load from existing assessment
    }

    let existingAssessment = inMemoryStore.getAssessment(id);

    if (!inputData) {
      if (!existingAssessment) {
        // Check sample scenarios
        const sample = sampleScenarios.find(s => s.id === id);
        if (sample) {
          inputData = sample.input as any;
        } else {
          return NextResponse.json(
            { success: false, error: "Assessment record not found to analyze." },
            { status: 404 }
          );
        }
      } else {
        // Reconstruct input data from stored assessment
        inputData = {
          organization: {
            industry: existingAssessment.organization.industry || "other",
            companySize: existingAssessment.organization.companySize || "enterprise",
            userRole: existingAssessment.organization.userRole || "it_decision_maker",
            companyName: existingAssessment.organization.companyName || null,
            assessmentGoal: existingAssessment.organization.assessmentGoal || "Data Lakehouse Evaluation",
          },
          environment: {
            deployment: existingAssessment.environment.deployment || "customer_cloud_vpc",
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
        { success: false, error: "Invalid assessment data." },
        { status: 400 }
      );
    }

    // Run matching engine
    const engine = new MatchingEngine();
    const normalizedRequirements = engine.normalizeRequirements(inputData);
    const findings = engine.evaluateRequirements(normalizedRequirements, inputData);
    const conflicts = detectRequirementConflicts(inputData);
    const nextSteps = engine.generateNextSteps(findings, conflicts);

    // Validate evidence accuracy according to PRD release gate rules
    const auditResult = auditFindingsAccuracy(findings);

    // Draft baseline report
    const baseReport = engine.generateReport(
      id,
      inputData.organization,
      inputData.environment,
      findings,
      nextSteps,
      conflicts,
      false
    );

    // Optional AI enhancement (strictly grounded, failsafe fallback)
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

    // Save report in memory store
    inMemoryStore.saveReport(baseReport);

    // Update assessment status
    if (existingAssessment) {
      existingAssessment.requirements = normalizedRequirements;
      existingAssessment.status = "completed";
      inMemoryStore.saveAssessment(existingAssessment);
    } else {
      inMemoryStore.saveAssessment({
        id,
        organization: inputData.organization,
        environment: inputData.environment,
        requirements: normalizedRequirements,
        status: "completed",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // If MongoDB is available, persist there as well
    const dbStatus = await connectToDatabase();
    if (dbStatus.isConnected) {
      try {
        await ReportModel.findOneAndUpdate(
          { assessmentId: id },
          { ...baseReport },
          { upsert: true, new: true }
        );
        await AssessmentModel.findOneAndUpdate(
          { id },
          {
            organization: inputData.organization,
            environment: inputData.environment,
            requirements: normalizedRequirements,
            status: "completed",
          },
          { upsert: true }
        );
      } catch (dbErr) {
        console.warn("MongoDB write failed during analyze:", (dbErr as Error).message);
      }
    }

    return NextResponse.json({
      success: true,
      assessmentId: id,
      reportId: baseReport.id,
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
