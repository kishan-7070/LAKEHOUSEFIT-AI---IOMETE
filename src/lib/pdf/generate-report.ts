import { jsPDF } from "jspdf";
import { Report } from "@/types/report";
import { getCapabilityById } from "../evidence/verification";

export function generateReportPdf(report: Report): Uint8Array {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function checkPageBreak(requiredSpace: number) {
    if (y + requiredSpace > pageHeight - margin - 30) {
      doc.addPage();
      y = margin;
      drawHeader();
    }
  }

  function drawHeader() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("LAKEHOUSEFIT AI — IOMETE BUYER READINESS REPORT", margin, y);
    doc.text(`Generated: ${new Date(report.generatedAt).toLocaleDateString()}`, pageWidth - margin, y, {
      align: "right",
    });
    y += 12;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.75);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
  }

  function drawSectionTitle(title: string) {
    checkPageBreak(35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(14, 62, 43); // brand primary deep green
    doc.text(title, margin, y);
    y += 6;
    doc.setDrawColor(16, 185, 129); // brand accent green
    doc.setLineWidth(1.5);
    doc.line(margin, y, margin + 40, y);
    y += 14;
  }

  // --- Initial Page Header ---
  drawHeader();

  // Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // dark slate
  const titleLines = doc.splitTextToSize(report.title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 20 + 4;

  // Subtitle / Scope
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const scopeLines = doc.splitTextToSize(report.scopeSummary, contentWidth);
  doc.text(scopeLines, margin, y);
  y += scopeLines.length * 13 + 14;

  // Key Status Metric Summary Box
  checkPageBreak(50);
  const supportedCount = report.findings.filter(f => f.status === "supported").length;
  const validationCount = report.findings.filter(f => f.status === "needs_validation").length;
  const unknownCount = report.findings.filter(f => f.status === "unknown").length;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 42, 4, 4, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(21, 128, 61); // green
  doc.text(`Supported Criteria: ${supportedCount}`, margin + 14, y + 25);

  doc.setTextColor(180, 83, 9); // amber
  doc.text(`Needs Validation: ${validationCount}`, margin + 180, y + 25);

  doc.setTextColor(100, 116, 139); // gray
  doc.text(`Unknown / Gaps: ${unknownCount}`, margin + 350, y + 25);
  y += 56;

  // --- SECTION 1: EXECUTIVE SUMMARY ---
  drawSectionTitle("1. Executive Summary");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);

  const summaryParagraphs = report.executiveSummary.split("\n\n");
  for (const para of summaryParagraphs) {
    const lines = doc.splitTextToSize(para, contentWidth);
    checkPageBreak(lines.length * 13 + 8);
    doc.text(lines, margin, y);
    y += lines.length * 13 + 8;
  }
  y += 10;

  // --- SECTION 2: REQUIREMENT-LEVEL EVALUATION FINDINGS ---
  drawSectionTitle("2. Detailed Requirement Evaluation Findings");

  for (let i = 0; i < report.findings.length; i++) {
    const finding = report.findings[i];
    checkPageBreak(85);

    // Card background
    const statusBg =
      finding.status === "supported"
        ? [240, 253, 244] // light green
        : finding.status === "needs_validation"
        ? [254, 252, 232] // light amber
        : [248, 250, 252]; // light slate

    const statusBorder =
      finding.status === "supported"
        ? [187, 247, 208]
        : finding.status === "needs_validation"
        ? [254, 240, 138]
        : [226, 232, 240];

    const statusLabel =
      finding.status === "supported"
        ? "STATUS: SUPPORTED"
        : finding.status === "needs_validation"
        ? "STATUS: NEEDS VALIDATION"
        : "STATUS: UNKNOWN (NO EVIDENCE)";

    const statusColor =
      finding.status === "supported"
        ? [21, 128, 61]
        : finding.status === "needs_validation"
        ? [180, 83, 9]
        : [100, 116, 139];

    // Finding Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`${i + 1}. [${finding.category.toUpperCase()}] ${finding.requirementDescription}`, margin, y);
    y += 13;

    // Status Pill
    doc.setFontSize(8);
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(statusLabel, margin, y);
    y += 12;

    // Explanation
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const explanationLines = doc.splitTextToSize(`Assessment: ${finding.explanation}`, contentWidth - 10);
    checkPageBreak(explanationLines.length * 12 + 20);
    doc.text(explanationLines, margin + 5, y);
    y += explanationLines.length * 12 + 6;

    // Evidence References & Links
    if (finding.evidenceReferences.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(14, 62, 43);
      doc.text("Supporting Evidence & Official Documentation:", margin + 5, y);
      y += 11;

      for (const capId of finding.evidenceReferences) {
        const cap = getCapabilityById(capId);
        if (cap) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(3, 105, 161); // link blue
          const srPrefix = cap.srNo ? `[Sr. No. ${cap.srNo}] ` : "";
          const linkText = `• ${srPrefix}${cap.name} — Source: ${cap.source.title} (${cap.source.url})`;
          const linkLines = doc.splitTextToSize(linkText, contentWidth - 15);
          checkPageBreak(linkLines.length * 11);
          doc.text(linkLines, margin + 10, y);
          y += linkLines.length * 11;
        }
      }
    }

    // Unresolved questions
    if (finding.unresolvedQuestions.length > 0) {
      y += 3;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(180, 83, 9);
      doc.text("Questions for Vendor Discovery / Technical Validation:", margin + 5, y);
      y += 11;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      for (const q of finding.unresolvedQuestions) {
        const qLines = doc.splitTextToSize(`? ${q}`, contentWidth - 15);
        checkPageBreak(qLines.length * 11);
        doc.text(qLines, margin + 10, y);
        y += qLines.length * 11;
      }
    }

    y += 12;
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
  }

  // --- SECTION 3: RECOMMENDED NEXT STEPS ---
  drawSectionTitle("3. Recommended Evaluation Next Steps");
  for (let i = 0; i < report.recommendedNextSteps.length; i++) {
    const step = report.recommendedNextSteps[i];
    checkPageBreak(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Step ${i + 1}: ${step.title}`, margin, y);
    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const descLines = doc.splitTextToSize(step.description, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 12 + 10;
  }

  // --- SECTION 4: METHODOLOGY & LIMITATIONS DISCLAIMER ---
  drawSectionTitle("4. Assessment Methodology & Disclaimers");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);

  for (const limitation of report.limitations) {
    const lLines = doc.splitTextToSize(`• ${limitation}`, contentWidth);
    checkPageBreak(lLines.length * 11);
    doc.text(lLines, margin, y);
    y += lLines.length * 11 + 3;
  }

  // --- Add Page Numbers in Footer for all pages ---
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${p} of ${totalPages} — LakehouseFit AI (Evidence-backed decision support, not a guaranteed commercial SLA)`,
      pageWidth / 2,
      pageHeight - 20,
      { align: "center" }
    );
  }

  // Return as Uint8Array
  const arrayBuffer = doc.output("arraybuffer");
  return new Uint8Array(arrayBuffer);
}

