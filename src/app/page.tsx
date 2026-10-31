import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  FileText,
  ExternalLink,
  Layers,
  Database,
  Lock,
  Cpu,
  BarChart3,
  Server,
  Zap,
} from "lucide-react";
import sampleScenarios from "@/data/sample-scenarios.json";
import capabilitiesData from "@/data/capabilities.json";

export default function HomePage() {
  return (
    <div className="space-y-20 pb-20">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-slate-50 to-white pt-16 pb-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>hackCBS — IOMETE Track · Evidence-Backed Evaluation</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Evaluate IOMETE with <span className="text-emerald-700 underline decoration-emerald-300 underline-offset-4">evidence</span>, not guesswork.
            </h1>

            <p className="text-lg sm:text-xl text-slate-700 leading-relaxed max-w-2xl mx-auto">
              Replace weeks of repetitive vendor discovery calls with a structured, evidence-backed assessment. Connect your data platform challenges to documented capabilities, inspect real sources, identify gaps, and download an executive-ready readiness report.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/assessment"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-brand-primary hover:bg-brand-900 shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600"
              >
                <span>Start Assessment</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>

              <Link
                href="/assessment/results/scenario-a"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm hover:shadow transition-all"
              >
                <FileText className="w-4 h-4 mr-2 text-slate-500" />
                <span>Explore Sample Report</span>
              </Link>
            </div>

            {/* Micro value props */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-600 font-medium">
              <span className="flex items-center">
                <CheckCircle className="w-4 h-4 text-emerald-600 mr-1.5" />
                Deterministic matching logic
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-4 h-4 text-emerald-600 mr-1.5" />
                Official docs verified (iomete.com)
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-4 h-4 text-emerald-600 mr-1.5" />
                Instant PDF download
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-4 h-4 text-emerald-600 mr-1.5" />
                Zero ungrounded AI claims
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* THREE-STEP WORKFLOW */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs uppercase font-bold tracking-widest text-emerald-800">
            Guided Assessment Journey
          </h2>
          <p className="mt-2 text-3xl font-bold text-slate-900 tracking-tight">
            How LakehouseFit AI Works
          </p>
          <p className="mt-3 text-slate-700 text-sm">
            Translating complex enterprise data architecture into a repeatable, auditable evaluation plan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative hover:border-emerald-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base mb-4 border border-emerald-200">
              01
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Define Requirements
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed">
              Capture your organization context, existing data lake / database infrastructure, query workloads, security mandates, and architectural constraints.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              Input validation &middot; Saved across navigation &middot; No mandatory AI API
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative hover:border-emerald-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base mb-4 border border-emerald-200">
              02
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Deterministic Matching
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed">
              The engine matches requirements against a curated knowledge base of reviewed IOMETE capabilities, assigning clear statuses: <strong>Supported</strong>, <strong>Needs validation</strong>, or <strong>Unknown</strong>.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              Source verified &middot; Explicit unknown detection &middot; Conflict alerts
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative hover:border-emerald-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base mb-4 border border-emerald-200">
              03
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Actionable Buyer Report
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed">
              Receive a comprehensive readiness report with executive summary, technical citations, vendor discovery questions, and a downloadable, paginated PDF report.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              Downloadable PDF &middot; Discovery checklist &middot; Transparent limitations
            </div>
          </div>
        </div>
      </section>

      {/* SAMPLE FINDING TEASER (ACCURACY IN ACTION) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <span>Transparent Evidence Model</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Every finding is backed by official sources. No hallucinations.
            </h2>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              See how LakehouseFit AI structures a product claim: distinguishing documented facts from customer-specific assumptions, providing direct documentation links, and flagging unanswered questions.
            </p>
          </div>

          <div className="mt-8 bg-slate-800/90 rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-4">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Requirement: Deployment &amp; Sovereign Control
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">
                  &ldquo;We need to run compute and data entirely inside our own AWS VPC.&rdquo;
                </h4>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                Supported by Documentation
              </span>
            </div>

            <p className="text-slate-300 text-sm">
              <strong className="text-white">Assessment:</strong> IOMETE is packaged into a unified enterprise Helm chart (<code>iomete-data-plane-enterprise</code>) deployed natively into customer-managed Kubernetes (EKS, AKS, GKE, or on-premises). All analytical compute and data remain inside your perimeter.
            </p>

            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Verified Source:</span>
                <a
                  href="https://iomete.com/docs/deployment"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 flex items-center font-semibold"
                >
                  <span>IOMETE Deployment and Helm Architecture</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </div>
              <div className="text-slate-400 italic">
                &ldquo;IOMETE is packaged into a single enterprise Helm chart that deploys all platform services into a designated Kubernetes namespace.&rdquo;
              </div>
              <div className="text-amber-400 font-medium pt-1">
                Validation Question: Confirm your cluster version (v1.24+ required) and internal ingress controller configuration.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TEST SCENARIOS SHOWCASE (AS REQUIRED BY PRD SECTION 13.1) */}
      <section id="sample-scenarios" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <h2 className="text-xs uppercase font-bold tracking-widest text-emerald-800">
              Automated Evaluation Test Suite
            </h2>
            <p className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Predefined Test Scenarios (PRD Section 13.1)
            </p>
            <p className="mt-1 text-slate-700 text-sm">
              Test each scenario with 1 click to verify deterministic matching, unknown detection, conflict recovery, and report generation.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Fictional data for automated testing
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleScenarios.map(scenario => (
            <div
              key={scenario.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    {scenario.id.toUpperCase()}
                  </span>
                  {scenario.id === "scenario-d" ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Unknown / Gaps Test
                    </span>
                  ) : scenario.id === "scenario-e" ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      Conflict Recovery
                    </span>
                  ) : scenario.id === "scenario-f" ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      Deterministic Core
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Enterprise Case
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {scenario.name}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {scenario.description}
                </p>

                <div className="bg-slate-50 rounded-lg p-3 text-[11px] text-slate-600 space-y-1">
                  <div><strong>Company:</strong> {scenario.input.organization.companyName}</div>
                  <div><strong>Industry:</strong> {scenario.input.organization.industry}</div>
                  <div><strong>Deployment:</strong> {scenario.input.environment.deployment}</div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/assessment/results/${scenario.id}`}
                  className="inline-flex items-center text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
                >
                  <span>View Findings &amp; Report</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>

                <Link
                  href={`/assessment?loadScenario=${scenario.id}`}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 underline underline-offset-2"
                >
                  Load into Wizard
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CURATED KNOWLEDGE BASE BROWSER */}
      <section id="knowledge-base" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-xs uppercase font-bold tracking-widest text-emerald-800">
            Source-Backed Reference
          </h2>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Curated IOMETE Knowledge Base (31 Capabilities)
          </p>
          <p className="mt-2 text-slate-700 text-sm">
            {capabilitiesData.length} reviewed capabilities with real official documentation URLs from <code>iomete.com/docs</code> (Sr. No. 1 to 31).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilitiesData.map(cap => (
            <div
              key={cap.id}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      Sr. No. {cap.srNo}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {cap.category}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      cap.evidenceStatus === "documented"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {cap.evidenceStatus === "documented" ? "Documented" : "Partially Documented"}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">
                  <span className="text-emerald-700 mr-1.5 font-mono">#{cap.srNo}.</span>
                  {cap.name}
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">{cap.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <a
                  href={cap.source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-800 hover:text-emerald-950 font-semibold flex items-center"
                >
                  <span>{cap.source.title}</span>
                  <ExternalLink className="w-3 h-3 ml-1 text-slate-400" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LIMITATIONS & DISCLAIMER BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 sm:p-8 flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-xs sm:text-sm text-amber-900">
            <h4 className="font-bold text-sm sm:text-base text-amber-950">
              Evaluation Methodology &amp; Product Boundaries
            </h4>
            <p className="leading-relaxed">
              LakehouseFit AI provides structured decision support to accelerate data platform evaluations. It does <strong>not</strong> promise guaranteed software performance, SLA uptime, or financial return on investment (ROI). All findings marked <em>Supported</em> reflect reviewed public documentation and require technical verification in your target environment.
            </p>
            <p className="text-amber-800/90 text-xs">
              Core evaluation operates via deterministic logic and does not depend on third-party AI APIs. Unverified queries are explicitly reported as <strong>Unknown</strong>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

