import { NextRequest, NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db/in-memory-store";
import { connectToDatabase } from "@/lib/db/connection";
import { ReportModel } from "@/models/Report";
import { AssessmentModel } from "@/models/Assessment";
import { generateReportPdf } from "@/lib/pdf/generate-report";
import { getSampleScenario, isSampleScenario } from "@/lib/evidence/scenarios";
import { MatchingEngine } from "@/lib/matching/engine";
import { detectRequirementConflicts } from "@/lib/matching/rules";
import { getUserFromRequest } from "@/lib/auth/jwt";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");
    const isSample = isSampleScenario(id);

    // 1. Authorization check for non-sample assessments
    if (!isSample) {
      const tokenUser = await getUserFromRequest(req);
      if (!tokenUser) {
        return NextResponse.json(
          {
            success: false,
            error: "Authentication required to view this report.",
          },
          { status: 401 }
        );
      }

      // Check assessment ownership
      let assessment = inMemoryStore.getAssessment(id);
      if (!assessment) {
        const dbStatus = await connectToDatabase();
        if (dbStatus.isConnected) {
          try {
            const doc = await AssessmentModel.findOne({ id }).lean();
            if (doc) assessment = doc as any;
          } catch (dbErr) {
            console.warn("MongoDB assessment lookup failed:", (dbErr as Error).message);
          }
        }
      }

      if (assessment && assessment.ownerId && assessment.ownerId !== tokenUser.userId) {
        return NextResponse.json(
          {
            success: false,
            error: "Access denied. You do not have permission to view this report.",
          },
          { status: 403 }
        );
      }
    }

    let report = inMemoryStore.getReportByAssessmentId(id) || inMemoryStore.getReport(id);

    // 2. If not in memory and MongoDB is active, check database
    if (!report) {
      const dbStatus = await connectToDatabase();
      if (dbStatus.isConnected) {
        try {
          const doc = await ReportModel.findOne({
            $or: [{ assessmentId: id }, { id }],
          }).lean();
          if (doc) {
            report = doc as any;
          }
        } catch (dbErr) {
          console.warn("MongoDB report fetch failed:", (dbErr as Error).message);
        }
      }
    }

    // 3. If report is still null, generate on-the-fly for sample scenario
    if (!report && isSample) {
      const sample = getSampleScenario(id);
      if (sample) {
        const engine = new MatchingEngine();
        const reqs = engine.normalizeRequirements(sample.input);
        const conflicts = detectRequirementConflicts(sample.input);
        const findings = engine.evaluateRequirements(reqs, sample.input);
        const nextSteps = engine.generateNextSteps(findings, conflicts);
        report = engine.generateReport(
          sample.id,
          sample.input.organization,
          sample.input.environment,
          findings,
          nextSteps,
          conflicts,
          false,
          null
        );
        inMemoryStore.saveReport(report);
      }
    }

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: "Report not found for this assessment. Run analysis first.",
        },
        { status: 404 }
      );
    }

    if (format === "json") {
      return NextResponse.json({
        success: true,
        report,
      });
    }

    // 4. Generate PDF Uint8Array
    const pdfBytes = generateReportPdf(report);

    const safeFilename = `LakehouseFit_Report_${(report.organizationName || "Assessment").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Content-Length": pdfBytes.byteLength.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate report",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
