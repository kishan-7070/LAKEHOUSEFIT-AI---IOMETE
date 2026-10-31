"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Download,
  Printer,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Building,
  Server,
  Layers,
} from "lucide-react";
import { Report } from "@/types/report";
import capabilitiesData from "@/data/capabilities.json";

export default function FullReportPage() {
  const params = useParams();
  const id = params?.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;

    async function fetchReport() {
      try {
        setLoading(true);
        const res = await fetch(`/api/assessments/${id}/report?format=json`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load report");
        }

        setReport(data.report);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError((err as Error).message);
      }
    }

    fetchReport();
  }, [id]);

  const downloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const res = await fetch(`/api/assessments/${id}/report`);
      if (!res.ok) throw new Error("PDF download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LakehouseFit_Report_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setIsDownloadingPdf(false);
    } catch (err) {
      setIsDownloadingPdf(false);
      alert(`Could not download PDF: ${(err as Error).message}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center text-slate-500">
        Loading Buyer Readiness Report...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Report Not Found</h2>
        <p className="text-sm text-slate-500">{error || "Please run an assessment first."}</p>
        <Link
          href="/assessment"
          className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold"
        >
          Start Assessment
        </Link>
      </div>
    );
  }

  const supportedCount = report.findings.filter(f => f.status === "supported").length;
  const validationCount = report.findings.filter(f => f.status === "needs_validation").length;
  const unknownCount = report.findings.filter(f => f.status === "unknown").length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 print:p-0 print:max-w-none">
      {/* Top Action Header (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden border-b border-slate-200 pb-5">
        <Link
          href={`/assessment/results/${id}`}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Back to Assessment Dashboard</span>
        </Link>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            <span>Print Document</span>
          </button>

          <button
            onClick={downloadPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>{isDownloadingPdf ? "Preparing PDF..." : "Download Official PDF"}</span>
          </button>
        </div>
      </div>

      {/* DOCUMENT SHEET */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-10 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-8 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-emerald-800">
              LAKEHOUSEFIT AI &middot; BUYER READINESS REPORT
            </span>
            <span>Generated: {new Date(report.generatedAt).toLocaleDateString()}</span>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {report.title}
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            {report.scopeSummary}
          </p>

          {/* Metric Badges */}
          <div className="pt-2 flex flex-wrap gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Supported: {supportedCount}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Needs Validation: {validationCount}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Unknown / Gaps: {unknownCount}
            </span>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
            1. Executive Evaluation Summary
          </h2>
          <div className="text-sm text-slate-700 leading-relaxed space-y-3 whitespace-pre-line bg-slate-50 p-6 rounded-2xl border border-slate-200">
            {report.executiveSummary}
          </div>
        </section>

        {/* Section 2: Detailed Requirement Findings */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
            2. Requirement-Level Findings &amp; Evidence Citations
          </h2>

          <div className="space-y-6">
            {report.findings.map((finding, idx) => (
              <div
                key={finding.requirementId}
                className="border border-slate-200 rounded-2xl p-6 space-y-3 bg-white"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {idx + 1}. [{finding.category}] {finding.requirementDescription}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      finding.status === "supported"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : finding.status === "needs_validation"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-slate-100 text-slate-700 border border-slate-300"
                    }`}
                  >
                    {finding.status === "supported"
                      ? "Supported"
                      : finding.status === "needs_validation"
                      ? "Needs Validation"
                      : "Unknown"}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong>Assessment:</strong> {finding.explanation}
                </p>

                {/* Evidence Links */}
                {finding.evidenceReferences.length > 0 && (
                  <div className="text-xs bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 space-y-1">
                    <span className="font-semibold text-emerald-900 block">
                      Supporting Official Documentation:
                    </span>
                    {finding.evidenceReferences.map(capId => {
                      const cap = capabilitiesData.find(c => c.id === capId);
                      if (!cap) return null;
                      return (
                        <div key={cap.id} className="text-slate-600">
                          &bull; <strong>{cap.name}:</strong> &ldquo;{cap.source.excerpt}&rdquo; &mdash;{" "}
                          <a
                            href={cap.source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-700 underline font-medium"
                          >
                            {cap.source.title}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Questions */}
                {finding.unresolvedQuestions.length > 0 && (
                  <div className="text-xs bg-amber-50/50 p-3 rounded-xl border border-amber-100 space-y-1">
                    <span className="font-semibold text-amber-900 block">
                      Discovery / Validation Questions:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                      {finding.unresolvedQuestions.map((q, qIdx) => (
                        <li key={qIdx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Next Steps */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
            3. Recommended Next Steps
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {report.recommendedNextSteps.map((step, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900">
                  Step {idx + 1}: {step.title}
                </div>
                <p className="text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Methodology & Disclaimers */}
        <section className="space-y-3 pt-4 border-t border-slate-200 text-xs text-slate-500">
          <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            4. Methodology &amp; Limitations Notice
          </h3>
          <ul className="list-disc list-inside space-y-1 text-slate-500">
            {report.limitations.map((lim, lIdx) => (
              <li key={lIdx}>{lim}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

