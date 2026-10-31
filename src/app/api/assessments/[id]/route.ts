import { NextRequest, NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db/in-memory-store";
import { connectToDatabase, getDatabaseMode } from "@/lib/db/connection";
import { AssessmentModel } from "@/models/Assessment";
import { ReportModel } from "@/models/Report";
import { getUserFromRequest } from "@/lib/auth/jwt";
import { getSampleScenario, isSampleScenario } from "@/lib/evidence/scenarios";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // 1. Check in-memory store
  let assessment = inMemoryStore.getAssessment(id);
  let report = inMemoryStore.getReportByAssessmentId(id);

  // 2. If not found and MongoDB is configured, check database
  if (!assessment) {
    const dbStatus = await connectToDatabase();
    if (dbStatus.isConnected) {
      try {
        const doc = await AssessmentModel.findOne({ id }).lean();
        if (doc) {
          assessment = doc as any;
          const reportDoc = await ReportModel.findOne({ assessmentId: id }).lean();
          if (reportDoc) {
            report = reportDoc as any;
          }
        }
      } catch (err) {
        console.warn("MongoDB read failed in GET /api/assessments/:id:", (err as Error).message);
      }
    }
  }

  // 3. Check if it's one of the sample scenarios
  if (!assessment) {
    const sample = getSampleScenario(id);
    if (sample) {
      assessment = {
        id: sample.id,
        ownerId: null,
        organization: sample.input.organization,
        environment: sample.input.environment,
        requirements: sample.input.selectedChallenges.map((c, idx) => ({
          id: `req-${idx + 1}`,
          category: "general",
          description: c,
          priority: "high",
          source: "structured_input",
          rawInput: c,
        })),
        status: "completed",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  if (!assessment) {
    return NextResponse.json(
      {
        success: false,
        error: "Assessment not found",
        id,
      },
      { status: 404 }
    );
  }

  // 4. Authorization / Ownership check
  // Public sample scenarios have ownerId: null and are accessible to anyone
  const isSample = isSampleScenario(id);
  if (assessment.ownerId && !isSample) {
    const tokenUser = await getUserFromRequest(req);
    if (!tokenUser || tokenUser.userId !== assessment.ownerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied. You do not have permission to view this assessment.",
        },
        { status: 403 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    assessment,
    report,
    storageMode: getDatabaseMode(),
  });
}
