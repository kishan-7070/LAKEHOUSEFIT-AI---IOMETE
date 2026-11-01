import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { AssessmentSubmissionSchema } from "@/lib/validation/assessment-schema";
import { MatchingEngine } from "@/lib/matching/engine";
import { inMemoryStore } from "@/lib/db/in-memory-store";
import { connectToDatabase, getDatabaseMode } from "@/lib/db/connection";
import { AssessmentModel } from "@/models/Assessment";
import { Assessment } from "@/types/assessment";
import { getUserFromRequest } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = AssessmentSubmissionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed. Please verify your inputs.",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const tokenUser = await getUserFromRequest(req);
    const ownerId = tokenUser?.userId || null;

    const inputData = validationResult.data;
    const engine = new MatchingEngine();
    const normalizedRequirements = engine.normalizeRequirements(inputData);

    // Cryptographically secure UUID
    const assessmentId = `asm-${crypto.randomUUID()}`;

    const assessment: Assessment = {
      id: assessmentId,
      ownerId,
      organization: inputData.organization,
      environment: inputData.environment,
      requirements: normalizedRequirements,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save in memory store
    inMemoryStore.saveAssessment(assessment);

    // If MongoDB is configured, persist to database asynchronously (non-blocking for instant wizard UI response)
    const dbStatus = await connectToDatabase();
    if (dbStatus.isConnected) {
      AssessmentModel.create(assessment).catch(dbErr => {
        console.warn("MongoDB write error, persisted in memory:", (dbErr as Error).message);
      });
    }

    return NextResponse.json(
      {
        success: true,
        assessmentId,
        storageMode: getDatabaseMode(),
        requirementsCount: normalizedRequirements.length,
        normalizedRequirements,
        message: "Assessment created and requirements normalized successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/assessments error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to create assessment. Please check your network and request format.",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const tokenUser = await getUserFromRequest(req);
    if (!tokenUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required to access workspace assessments.",
        },
        { status: 401 }
      );
    }

    const dbStatus = await connectToDatabase();
    let assessments: any[] = [];

    if (dbStatus.isConnected) {
      try {
        const docs = await AssessmentModel.find({ ownerId: tokenUser.userId })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();

        if (docs && docs.length > 0) {
          assessments = docs.map((d: any) => ({
            id: d.id,
            organization: d.organization,
            requirementsCount: d.requirements?.length || 0,
            status: d.status,
            createdAt: d.createdAt || new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn("MongoDB fetch in GET /api/assessments error:", (err as Error).message);
      }
    }

    if (assessments.length === 0) {
      const memoryAssessments = inMemoryStore.listAssessments(tokenUser.userId);
      assessments = memoryAssessments.map(a => ({
        id: a.id,
        organization: a.organization,
        requirementsCount: a.requirements.length,
        status: a.status,
        createdAt: a.createdAt,
      }));
    }

    return NextResponse.json({
      success: true,
      storageMode: getDatabaseMode(),
      count: assessments.length,
      assessments,
    });
  } catch (error) {
    console.error("GET /api/assessments error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve assessments.",
      },
      { status: 500 }
    );
  }
}
