import { NextRequest, NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db/in-memory-store";
import { connectToDatabase } from "@/lib/db/connection";
import { ReportModel } from "@/models/Report";
import { generateReportPdf } from "@/lib/pdf/generate-report";
import sampleScenarios from "@/data/sample-scenarios.json";
import { MatchingEngine } from "@/lib/matching/engine";
import { detectRequirementConflicts } from "@/lib/matching/rules";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");

    let report = inMemoryStore.getReportByAssessmentId(id) || inMemoryStore.getReport(id);

    // If not in memory and MongoDB is active, check database
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

    // If report is still null, generate on-the-fly for sample scenario
    if (!report) {
      const sample = sampleScenarios.find(s => s.id === id);
      if (sample) {
        const engine = new MatchingEngine();
        const reqs = engine.normalizeRequirements(sample.input as any);
        const findings = engine.evaluateRequirements(reqs, sample.input as any);
        const conflicts = detectRequirementConflicts(sample.input as any);
        const nextSteps = engine.generateNextSteps(findings, conflicts);
        report = engine.generateReport(
          sample.id,
          sample.input.organization as any,
          sample.input.environment as any,
          findings,
          nextSteps,
          conflicts,
          false
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

    // Generate PDF Uint8Array
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
        error: "Failed to generate PDF report",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
