"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Download,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  Clock,
  Layers,
  Building,
} from "lucide-react";
import { AssessmentFinding, RecommendedNextStep, Report } from "@/types/report";
import { Assessment } from "@/types/assessment";
import { Capability } from "@/types/capability";
import capabilitiesData from "@/data/capabilities.json";

export default function AssessmentResultsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [processingStage, setProcessingStage] = useState<string>("Validating requirements profile...");
  const [error, setError] = useState<string | null>(null);

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [findings, setFindings] = useState<AssessmentFinding[]>([]);
  const [nextSteps, setNextSteps] = useState<RecommendedNextStep[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedFindings, setExpandedFindings] = useState<Record<string, boolean>>({});
  const [isAiEnhanced, setIsAiEnhanced] = useState<boolean>(false);
  const [aiProvider, setAiProvider] = useState<string>("deterministic_engine");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    async function loadAndAnalyze() {
      try {
        setLoading(true);
        setError(null);
        setProcessingStage("Checking assessment records...");

        // 1. First, check if assessment and report already exist
        const getRes = await fetch(`/api/assessments/${id}`);
        const getData = await getRes.json();

        if (getRes.ok && getData.success && getData.report) {
          // Report already computed! Render cached results without re-analyzing
          setAssessment(getData.assessment);
          setReport(getData.report);
          setFindings(getData.report.findings || []);
          setNextSteps(getData.report.recommendedNextSteps || []);
          setIsAiEnhanced(getData.report.isAiEnhanced || false);
          setAiProvider(
            getData.report.isAiEnhanced
              ? "IOMETE Grounded AI / Google Gemini"
              : "Deterministic Rules Engine"
          );
          setLoading(false);
          return;
        }

        // 2. If no report exists yet, run analysis
        setProcessingStage("Evaluating requirements against verified IOMETE capabilities...");
        const analyzeRes = await fetch(`/api/assessments/${id}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const analyzeData = await analyzeRes.json();

        if (!analyzeRes.ok || !analyzeData.success) {
          throw new Error(analyzeData.error || "Failed to analyze assessment");
        }

        setFindings(analyzeData.findings || []);
        setNextSteps(analyzeData.nextSteps || []);
        setConflicts(analyzeData.conflicts || []);
        setIsAiEnhanced(analyzeData.isAiEnhanced || false);
        setAiProvider(analyzeData.aiProvider || "deterministic_engine");

        // Fetch refreshed assessment and report
        const refreshRes = await fetch(`/api/assessments/${id}`);
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setAssessment(refreshData.assessment);
          setReport(refreshData.report);
        }

        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError((err as Error).message);
      }
    }

    loadAndAnalyze();
  }, [id]);

  const toggleExpand = (reqId: string) => {
    setExpandedFindings(prev => ({
      ...prev,
      [reqId]: !prev[reqId],
    }));
  };

  const downloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const res = await fetch(`/api/assessments/${id}/report`);
      if (!res.ok) throw new Error("PDF generation failed");
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

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            Evaluating Assessment Requirements
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            {processingStage}
          </p>
        </div>
        <div className="max-w-md mx-auto text-xs text-slate-400 bg-slate-50 p-4 rounded-xl border border-slate-200">
          LakehouseFit AI uses deterministic capability matching against verified official documentation from <code>iomete.com/docs</code>.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-rose-900">Assessment Evaluation Error</h2>
          <p className="text-sm text-rose-700 max-w-md mx-auto">{error}</p>
          <div className="pt-2 flex justify-center space-x-4">
            <Link
              href="/assessment"
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900"
            >
              Start New Assessment
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const supportedCount = findings.filter(f => f.status === "supported").length;
  const validationCount = findings.filter(f => f.status === "needs_validation").length;
  const unknownCount = findings.filter(f => f.status === "unknown").length;

  const filteredFindings = findings.filter(f => {
    if (filterStatus === "supported") return f.status === "supported";
    if (filterStatus === "needs_validation") return f.status === "needs_validation";
    if (filterStatus === "unknown") return f.status === "unknown";
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner / Breadcrumb & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:text-slate-800">Home</Link>
            <span>/</span>
            <Link href="/assessment" className="hover:text-slate-800">Assessment</Link>
            <span>/</span>
            <span className="text-slate-700 font-semibold">{id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            IOMETE Buyer Readiness Assessment
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organization: <strong>{assessment?.organization?.companyName || "Prospective Buyer"}</strong> &middot; Evaluated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={downloadPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-1.5" />
            <span>{isDownloadingPdf ? "Generating PDF..." : "Download PDF Report"}</span>
          </button>

          <Link
            href={`/reports/${id}`}
            className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm transition-all"
          >
            <FileText className="w-4 h-4 mr-1.5 text-slate-500" />
            <span>Full Web Report</span>
          </Link>
        </div>
      </div>

      {/* SYSTEM ARCHITECTURE & ENGINE BADGES */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/80 rounded-xl px-4 py-2.5 border border-slate-200 text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-slate-700">Evaluation Engine:</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Deterministic Rule-Based Matching
          </span>
          {isAiEnhanced ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
              <Sparkles className="w-3 h-3 mr-1 text-purple-600" />
              AI Enhanced ({aiProvider})
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-200 text-slate-700">
              Deterministic Fallback (No AI Dependency)
            </span>
          )}
        </div>

        <div className="text-slate-500 text-[11px]">
          Official sources audited: 100% verified &middot; No speculative ROI
        </div>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Evaluated */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Criteria
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">
            {findings.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Normalized requirement criteria
          </div>
        </div>

        {/* Supported */}
        <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-200 shadow-xs">
          <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
            <span>Supported</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-800 mt-1">
            {supportedCount}
          </div>
          <div className="text-xs text-emerald-700 mt-1">
            Verified in official documentation
          </div>
        </div>

        {/* Needs Validation */}
        <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-200 shadow-xs">
          <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center justify-between">
            <span>Needs Validation</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-800 mt-1">
            {validationCount}
          </div>
          <div className="text-xs text-amber-700 mt-1">
            Requires customer config confirmation
          </div>
        </div>

        {/* Unknown / Gaps */}
        <div className="bg-slate-100/70 rounded-xl p-5 border border-slate-300 shadow-xs">
          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>Unknown / Gaps</span>
            <HelpCircle className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-700 mt-1">
            {unknownCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Unverified public evidence
          </div>
        </div>
      </div>

      {/* CONFLICT ALERT (IF ANY) */}
      {conflicts.length > 0 && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-rose-900 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>Architectural Conflict Alert Detected</span>
          </div>
          {conflicts.map((c, i) => (
            <div key={i} className="text-xs text-rose-800 space-y-1 pl-7">
              <p className="font-semibold">{c.message}</p>
              <p className="text-rose-700">{c.recommendation}</p>
            </div>
          ))}
        </div>
      )}

      {/* EXECUTIVE SUMMARY ACCORDION / BANNER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">
              Executive Evaluation Summary
            </h2>
          </div>
          {isAiEnhanced && (
            <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Grounded AI Phrasing
            </span>
          )}
        </div>

        <div className="text-sm text-slate-700 leading-relaxed space-y-3 whitespace-pre-line bg-slate-50/80 rounded-xl p-5 border border-slate-200">
          {report?.executiveSummary || (
            `This assessment evaluated ${findings.length} requirement criteria for ${assessment?.organization?.companyName || "your organization"}. ${supportedCount} criteria are supported by documented capabilities, ${validationCount} need environment validation, and ${unknownCount} lack public evidence.`
          )}
        </div>
      </div>

      {/* FINDINGS SECTION WITH FILTER TABS */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Requirement-Level Findings &amp; Evidence
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspecting why each criterion was categorized and reviewing supporting official documentation.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterStatus === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({findings.length})
            </button>
            <button
              onClick={() => setFilterStatus("supported")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterStatus === "supported" ? "bg-emerald-600 text-white shadow-xs" : "text-emerald-800 hover:text-emerald-950"
              }`}
            >
              Supported ({supportedCount})
            </button>
            <button
              onClick={() => setFilterStatus("needs_validation")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterStatus === "needs_validation" ? "bg-amber-600 text-white shadow-xs" : "text-amber-800 hover:text-amber-950"
              }`}
            >
              Needs Validation ({validationCount})
            </button>
            <button
              onClick={() => setFilterStatus("unknown")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterStatus === "unknown" ? "bg-slate-700 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Unknown ({unknownCount})
            </button>
          </div>
        </div>

        {/* Finding Cards */}
        <div className="space-y-4">
          {filteredFindings.map((finding, idx) => {
            const isExpanded = expandedFindings[finding.requirementId] ?? false;

            const statusBadge =
              finding.status === "supported" ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Supported
                </span>
              ) : finding.status === "needs_validation" ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  Needs Validation
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
                  <HelpCircle className="w-3.5 h-3.5 mr-1" />
                  Unknown (No Evidence)
                </span>
              );

            return (
              <div
                key={finding.requirementId}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top row: tags and status */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                        {finding.category}
                      </span>
                      {finding.priority && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-500 bg-slate-50">
                          Priority: {finding.priority}
                        </span>
                      )}
                    </div>
                    {statusBadge}
                  </div>

                  {/* Requirement Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {finding.requirementDescription}
                    </h3>
                  </div>

                  {/* Plain-English Explanation */}
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    {finding.explanation}
                  </p>

                  {/* Expand / Collapse Evidence Button */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => toggleExpand(finding.requirementId)}
                      className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center space-x-1"
                    >
                      <span>
                        {isExpanded
                          ? "Hide Official Documentation & Questions"
                          : `Inspect Evidence & Validation Questions (${finding.evidenceReferences.length} sources, ${finding.unresolvedQuestions.length} questions)`}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Expandable Evidence & Questions Drawer */}
                  {isExpanded && (
                    <div className="pt-4 mt-2 border-t border-slate-100 space-y-4 text-xs">
                      {/* Evidence Section */}
                      {finding.evidenceReferences.length > 0 ? (
                        <div className="space-y-2">
                          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                            Reviewed Documentation Sources:
                          </span>
                          <div className="grid grid-cols-1 gap-2">
                            {finding.evidenceReferences.map(capId => {
                              const cap = capabilitiesData.find(c => c.id === capId);
                              if (!cap) return null;
                              return (
                                <div
                                  key={cap.id}
                                  className="bg-emerald-50/40 rounded-xl p-3 border border-emerald-200/80 space-y-1.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        Sr. No. {cap.srNo}
                                      </span>
                                      <span className="font-bold text-slate-900">{cap.name}</span>
                                    </div>
                                    <a
                                      href={cap.source.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-emerald-800 hover:text-emerald-950 font-semibold flex items-center"
                                    >
                                      <span>{cap.source.title}</span>
                                      <ExternalLink className="w-3 h-3 ml-1" />
                                    </a>
                                  </div>
                                  <p className="text-slate-600 italic">
                                    &ldquo;{cap.source.excerpt}&rdquo;
                                  </p>
                                  <div className="text-[10px] text-slate-400">
                                    Source verified on: {cap.source.verifiedAt}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                          No reviewed documentation in the IOMETE capability knowledge base verified this criterion.
                        </div>
                      )}

                      {/* Unresolved Questions */}
                      {finding.unresolvedQuestions.length > 0 && (
                        <div className="space-y-2">
                          <span className="font-bold text-amber-900 uppercase tracking-wider text-[11px] block">
                            Questions to Ask IOMETE Solutions Team:
                          </span>
                          <ul className="space-y-1.5 pl-2">
                            {finding.unresolvedQuestions.map((q, qIdx) => (
                              <li key={qIdx} className="text-slate-700 flex items-start space-x-2">
                                <span className="text-amber-600 font-bold">&bull;</span>
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Operational Limitations */}
                      {finding.limitations.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                            Operational Prerequisites &amp; Limitations:
                          </span>
                          <ul className="space-y-1 pl-2 text-slate-600">
                            {finding.limitations.map((l, lIdx) => (
                              <li key={lIdx} className="flex items-start space-x-2">
                                <span className="text-slate-400">&minus;</span>
                                <span>{l}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RECOMMENDED NEXT STEPS */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Action Plan
          </span>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            Recommended Evaluation Next Steps
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Concrete milestones to move from assessment to technical proof of concept.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nextSteps.map((step, i) => (
            <div
              key={i}
              className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 space-y-2"
            >
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                <span>0{i + 1}</span>
                <span>&middot;</span>
                <span className="uppercase">{step.suggestedActionType.replace("_", " ")}</span>
              </div>
              <h4 className="text-sm font-bold text-white">{step.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/assessment"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
        >
          <span>&larr; Start Another Assessment</span>
        </Link>

        <div className="flex items-center space-x-3">
          <button
            onClick={downloadPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm"
          >
            <Download className="w-4 h-4 mr-1.5" />
            <span>Download Buyer Readiness Report (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

