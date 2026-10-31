"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Building,
  Server,
  Target,
  Settings,
  ClipboardCheck,
  Sparkles,
  Info,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import sampleScenarios from "@/data/sample-scenarios.json";
import { AssessmentSubmissionInput } from "@/lib/validation/assessment-schema";

const CHALLENGE_OPTIONS = [
  "Infrastructure ownership and sovereign data control requirements",
  "Data distributed across multiple transactional and analytical systems",
  "Increasing analytical workload and query concurrency contention",
  "Difficulty managing large data volumes and small-file storage bloat",
  "Need for performant SQL-based analytics across multiple business teams",
  "Data access, column masking, and regulatory governance requirements",
  "Desire to evaluate open technologies and Apache Iceberg",
];

const DATA_SOURCES_OPTIONS = [
  "AWS S3",
  "PostgreSQL",
  "MySQL",
  "Apache Kafka Streams",
  "Google Cloud Storage",
  "Azure ADLS Gen2",
  "Snowflake / Legacy Warehouse",
  "Oracle / SQL Server",
  "Internal API / Webhooks",
];

const ANALYTICS_TOOLS_OPTIONS = [
  "Tableau",
  "Power BI",
  "Apache Superset",
  "Metabase",
  "dbt (dbt-spark)",
  "DBeaver / SQL Client",
  "Jupyter Notebooks",
];

function AssessmentWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      const search = searchParams.toString();
      const target = search ? `/assessment?${search}` : "/assessment";
      router.replace(`/auth/login?redirect=${encodeURIComponent(target)}`);
    }
  }, [authLoading, user, router, searchParams]);

  // Form state
  const [formData, setFormData] = useState<AssessmentSubmissionInput>({
    organization: {
      industry: "financial_services",
      companySize: "enterprise",
      userRole: "it_decision_maker",
      companyName: "Acme Corporation",
      assessmentGoal: "Evaluate self-hosted data lakehouse capabilities to meet sovereignty requirements.",
    },
    environment: {
      deployment: "customer_cloud_vpc",
      dataSources: ["AWS S3", "PostgreSQL"],
      analyticsTools: ["Tableau"],
      dataVolume: "50TB - 200TB",
      processingApproach: "Batch ETL with daily scheduled refreshes",
    },
    selectedChallenges: [
      "Infrastructure ownership and sovereign data control requirements",
      "Data access, column masking, and regulatory governance requirements",
    ],
    freeTextChallenges: "",
    technicalRequirements: {
      deploymentPreference: "Self-managed Kubernetes in customer private VPC",
      dataResidency: "Strict regional data residency; zero egress to external multi-tenant cloud",
      accessControl: "Granular column-level masking and role-based permissions",
      integrationRequirements: ["Apache Iceberg", "Apache Ranger", "Tableau"],
      performanceExpectations: "Interactive dashboard query latency under 10 seconds",
      availabilityRequirements: "High availability (99.9%) across multiple availability zones",
      budgetConstraints: "Reduce idle compute costs via auto-suspend when clusters are inactive",
    },
  });

  // Check URL query param to preload scenario
  useEffect(() => {
    const loadScenarioId = searchParams.get("loadScenario");
    if (loadScenarioId) {
      const scenario = sampleScenarios.find(s => s.id === loadScenarioId);
      if (scenario) {
        setFormData(scenario.input as any);
      }
    }
  }, [searchParams]);

  const loadScenarioData = (scenarioId: string) => {
    const scenario = sampleScenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setFormData(scenario.input as any);
      setErrorMessage(null);
    }
  };

  const validateStep = (step: number): boolean => {
    setErrorMessage(null);
    if (step === 1) {
      if (!formData.organization.industry || formData.organization.industry.trim() === "") {
        setErrorMessage("Please select or enter an industry.");
        return false;
      }
      if (!formData.organization.companySize) {
        setErrorMessage("Please select company size.");
        return false;
      }
      if (!formData.organization.userRole) {
        setErrorMessage("Please select your role.");
        return false;
      }
      if (!formData.organization.assessmentGoal || formData.organization.assessmentGoal.trim().length < 5) {
        setErrorMessage("Please describe your evaluation objective (at least 5 characters).");
        return false;
      }
    } else if (step === 2) {
      if (!formData.environment.deployment) {
        setErrorMessage("Please select your deployment environment.");
        return false;
      }
      if (!formData.environment.dataSources || formData.environment.dataSources.length === 0) {
        setErrorMessage("Please select at least one data source.");
        return false;
      }
    } else if (step === 3) {
      if (!formData.selectedChallenges || formData.selectedChallenges.length === 0) {
        setErrorMessage("Please select at least one business or technical challenge.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const toggleChallenge = (challenge: string) => {
    setFormData(prev => {
      const exists = prev.selectedChallenges.includes(challenge);
      const updated = exists
        ? prev.selectedChallenges.filter(c => c !== challenge)
        : [...prev.selectedChallenges, challenge];
      return { ...prev, selectedChallenges: updated };
    });
  };

  const toggleDataSource = (source: string) => {
    setFormData(prev => {
      const exists = prev.environment.dataSources.includes(source);
      const updated = exists
        ? prev.environment.dataSources.filter(s => s !== source)
        : [...prev.environment.dataSources, source];
      return {
        ...prev,
        environment: { ...prev.environment, dataSources: updated },
      };
    });
  };

  const toggleAnalyticsTool = (tool: string) => {
    setFormData(prev => {
      const exists = prev.environment.analyticsTools.includes(tool);
      const updated = exists
        ? prev.environment.analyticsTools.filter(t => t !== tool)
        : [...prev.environment.analyticsTools, tool];
      return {
        ...prev,
        environment: { ...prev.environment, analyticsTools: updated },
      };
    });
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create assessment");
      }

      // Navigate to results screen for this assessment
      router.push(`/assessment/results/${data.assessmentId}`);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage((err as Error).message);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 bg-white border border-slate-200 rounded-3xl text-center shadow-sm space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    const search = searchParams.toString();
    const target = search ? `/assessment?${search}` : "/assessment";
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-slate-200 rounded-3xl text-center shadow-lg space-y-4">
        <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign In Required</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          You must be logged in with your enterprise account to access the Interactive Assessment Wizard and generate evidence-backed evaluation reports.
        </p>
        <div className="pt-2">
          <Link
            href={`/auth/login?redirect=${encodeURIComponent(target)}`}
            className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-primary hover:bg-brand-900 shadow-md transition-colors"
          >
            <span>Sign In to Continue</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Wizard Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Interactive Assessment Wizard
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Evaluate IOMETE for Your Organization
            </h1>
          </div>

          {/* Quick Preload Scenario Bar */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">Preload:</span>
            <select
              aria-label="Preload Test Scenario"
              onChange={e => {
                if (e.target.value) loadScenarioData(e.target.value);
              }}
              defaultValue=""
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="" disabled>Select Test Scenario...</option>
              {sampleScenarios.map(s => (
                <option key={s.id} value={s.id}>
                  {s.id.toUpperCase()}: {s.name.split(":")[1]?.trim() || s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Step {currentStep} of 5: {
              currentStep === 1 ? "Organization Profile" :
              currentStep === 2 ? "Data Environment" :
              currentStep === 3 ? "Business Challenges" :
              currentStep === 4 ? "Technical Constraints" : "Review & Submit"
            }</span>
            <span>{currentStep * 20}% completed</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-300"
              style={{ width: `${currentStep * 20}%` }}
            />
          </div>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Validation Notice: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Step Content Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {/* STEP 1: ORGANIZATION PROFILE */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Building className="w-5 h-5 text-emerald-700" />
                <span>Step 1: Organization Context</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tell us about your organization and who is evaluating the platform.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Company or Team Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.organization.companyName || ""}
                  onChange={e => setFormData({
                    ...formData,
                    organization: { ...formData.organization, companyName: e.target.value }
                  })}
                  placeholder="e.g. Apex Financial Services"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Industry <span className="text-emerald-600">*</span>
                </label>
                <select
                  value={formData.organization.industry}
                  onChange={e => setFormData({
                    ...formData,
                    organization: { ...formData.organization, industry: e.target.value }
                  })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="financial_services">Financial Services &amp; Banking</option>
                  <option value="healthcare">Healthcare &amp; Life Sciences</option>
                  <option value="retail">Retail &amp; E-Commerce</option>
                  <option value="telecommunications">Telecommunications</option>
                  <option value="manufacturing">Manufacturing &amp; Logistics</option>
                  <option value="technology">SaaS &amp; Technology</option>
                  <option value="government">Public Sector &amp; Defense</option>
                  <option value="other">Other Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Company Size <span className="text-emerald-600">*</span>
                </label>
                <select
                  value={formData.organization.companySize}
                  onChange={e => setFormData({
                    ...formData,
                    organization: { ...formData.organization, companySize: e.target.value }
                  })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="startup">Startup (&lt; 50 employees)</option>
                  <option value="mid_market">Mid-Market (50 - 500 employees)</option>
                  <option value="large">Large Enterprise (500 - 5,000 employees)</option>
                  <option value="enterprise">Global Enterprise (5,000+ employees)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Your Role <span className="text-emerald-600">*</span>
                </label>
                <select
                  value={formData.organization.userRole}
                  onChange={e => setFormData({
                    ...formData,
                    organization: { ...formData.organization, userRole: e.target.value }
                  })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="it_decision_maker">IT Director / CIO / VP of Engineering</option>
                  <option value="data_engineering_lead">Data Engineering Lead / Platform Architect</option>
                  <option value="enterprise_buyer">Enterprise Technology Evaluator / Procurement</option>
                  <option value="security_officer">CISO / Compliance &amp; Security Officer</option>
                  <option value="sales_representative">Solutions Consultant / Sales Prep</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Primary Assessment Objective <span className="text-emerald-600">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.organization.assessmentGoal || ""}
                onChange={e => setFormData({
                  ...formData,
                  organization: { ...formData.organization, assessmentGoal: e.target.value }
                })}
                placeholder="e.g. Determine whether IOMETE can replace proprietary SaaS data warehouse to run compute inside our own AWS VPC."
                className="w-full text-sm rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {/* STEP 2: DATA ENVIRONMENT */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Server className="w-5 h-5 text-emerald-700" />
                <span>Step 2: Current Data Environment</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Describe your current infrastructure, cloud hosting, and storage platforms.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Target / Existing Deployment Model <span className="text-emerald-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: "customer_cloud_vpc", label: "Customer Cloud VPC (AWS EKS, GCP GKE, Azure AKS)", sub: "Self-managed in your cloud account" },
                  { id: "public_cloud", label: "Managed Multi-Cloud Kubernetes", sub: "Standard public cloud infrastructure" },
                  { id: "hybrid_cloud", label: "Hybrid Cloud (On-Premises + Public Object Store)", sub: "Mixed infrastructure" },
                  { id: "air_gapped_on_prem", label: "Air-Gapped / Private On-Premises Datacenter", sub: "Zero internet access perimeter" },
                  { id: "not_decided", label: "Not Decided / Exploring Architecture", sub: "Evaluating deployment options" },
                ].map(item => (
                  <label
                    key={item.id}
                    className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formData.environment.deployment === item.id
                        ? "bg-emerald-50/60 border-emerald-500 ring-1 ring-emerald-500"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="deployment"
                      value={item.id}
                      checked={formData.environment.deployment === item.id}
                      onChange={e => setFormData({
                        ...formData,
                        environment: { ...formData.environment, deployment: e.target.value }
                      })}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="ml-3 text-xs">
                      <span className="font-semibold text-slate-900 block">{item.label}</span>
                      <span className="text-slate-500">{item.sub}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Data Sources &amp; Formats <span className="text-emerald-600">*</span> (Select all that apply)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DATA_SOURCES_OPTIONS.map(src => {
                  const isChecked = formData.environment.dataSources.includes(src);
                  return (
                    <button
                      type="button"
                      key={src}
                      onClick={() => toggleDataSource(src)}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center justify-between ${
                        isChecked
                          ? "bg-emerald-100/80 text-emerald-900 border-emerald-400"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>{src}</span>
                      {isChecked && <CheckCircle className="w-3.5 h-3.5 text-emerald-700 ml-1 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Analytics &amp; BI Tooling (Optional)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ANALYTICS_TOOLS_OPTIONS.map(tool => {
                  const isChecked = formData.environment.analyticsTools.includes(tool);
                  return (
                    <button
                      type="button"
                      key={tool}
                      onClick={() => toggleAnalyticsTool(tool)}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center justify-between ${
                        isChecked
                          ? "bg-emerald-100/80 text-emerald-900 border-emerald-400"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>{tool}</span>
                      {isChecked && <CheckCircle className="w-3.5 h-3.5 text-emerald-700 ml-1 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Approximate Analytical Data Volume (Optional)
                </label>
                <select
                  value={formData.environment.dataVolume || ""}
                  onChange={e => setFormData({
                    ...formData,
                    environment: { ...formData.environment, dataVolume: e.target.value }
                  })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white"
                >
                  <option value="">Unspecified / Unknown</option>
                  <option value="< 10TB">&lt; 10 Terabytes</option>
                  <option value="10TB - 50TB">10TB - 50TB</option>
                  <option value="50TB - 200TB">50TB - 200TB</option>
                  <option value="200TB+">200+ Terabytes (Petabyte Scale)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Processing Approach (Optional)
                </label>
                <input
                  type="text"
                  value={formData.environment.processingApproach || ""}
                  onChange={e => setFormData({
                    ...formData,
                    environment: { ...formData.environment, processingApproach: e.target.value }
                  })}
                  placeholder="e.g. Daily batch ETL + continuous micro-batch streaming"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: BUSINESS & TECHNICAL CHALLENGES */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Target className="w-5 h-5 text-emerald-700" />
                <span>Step 3: Stated Challenges &amp; Goals</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select the core data challenges your organization is trying to solve.
              </p>
            </div>

            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Key Business Challenges <span className="text-emerald-600">*</span> (Select all that apply)
              </label>
              {CHALLENGE_OPTIONS.map(challenge => {
                const isChecked = formData.selectedChallenges.includes(challenge);
                return (
                  <div
                    key={challenge}
                    onClick={() => toggleChallenge(challenge)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                      isChecked
                        ? "bg-emerald-50/70 border-emerald-500 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent onClick
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-900 block">{challenge}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Free-Text Context, Mandates, or Specific Questions <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={4}
                value={formData.freeTextChallenges || ""}
                onChange={e => setFormData({ ...formData, freeTextChallenges: e.target.value })}
                placeholder="Describe any particular corporate constraints, regulatory compliance expectations (e.g. HIPAA BAA, FedRAMP), or architecture requirements in your own words..."
                className="w-full text-sm rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Note: LakehouseFit AI normalizes free text deterministically. Unverified claims will be accurately flagged as Unknown.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: TECHNICAL CONSTRAINTS */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-emerald-700" />
                <span>Step 4: Technical Requirements &amp; Constraints</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Provide technical parameters to refine the evaluation and generate validation questions.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Preferred Deployment Specification
                </label>
                <input
                  type="text"
                  value={formData.technicalRequirements?.deploymentPreference || ""}
                  onChange={e => setFormData({
                    ...formData,
                    technicalRequirements: {
                      ...formData.technicalRequirements,
                      deploymentPreference: e.target.value,
                    },
                  })}
                  placeholder="e.g. Self-managed Kubernetes (AWS EKS v1.28) in private VPC"
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Data Residency &amp; Sovereignty Mandate
                </label>
                <input
                  type="text"
                  value={formData.technicalRequirements?.dataResidency || ""}
                  onChange={e => setFormData({
                    ...formData,
                    technicalRequirements: {
                      ...formData.technicalRequirements,
                      dataResidency: e.target.value,
                    },
                  })}
                  placeholder="e.g. Must stay in Frankfurt region; zero data egress to public multi-tenant storage"
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Access Control &amp; Masking Requirements
                </label>
                <input
                  type="text"
                  value={formData.technicalRequirements?.accessControl || ""}
                  onChange={e => setFormData({
                    ...formData,
                    technicalRequirements: {
                      ...formData.technicalRequirements,
                      accessControl: e.target.value,
                    },
                  })}
                  placeholder="e.g. Apache Ranger row-level filtering and column-level PII masking"
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Performance Expectations
                  </label>
                  <input
                    type="text"
                    value={formData.technicalRequirements?.performanceExpectations || ""}
                    onChange={e => setFormData({
                      ...formData,
                      technicalRequirements: {
                        ...formData.technicalRequirements,
                        performanceExpectations: e.target.value,
                      },
                    })}
                    placeholder="e.g. Sub-5 second dashboard query response"
                    className="w-full text-sm rounded-lg border border-slate-300 p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cost &amp; Budget Constraints
                  </label>
                  <input
                    type="text"
                    value={formData.technicalRequirements?.budgetConstraints || ""}
                    onChange={e => setFormData({
                      ...formData,
                      technicalRequirements: {
                        ...formData.technicalRequirements,
                        budgetConstraints: e.target.value,
                      },
                    })}
                    placeholder="e.g. Cluster auto-suspend when idle to reduce cloud bill"
                    className="w-full text-sm rounded-lg border border-slate-300 p-2.5"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & CONFIRMATION */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-700" />
                <span>Step 5: Review Requirements Profile</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Inspect your inputs before running deterministic capability matching and report generation.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Organization Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between font-bold text-slate-900 mb-2">
                  <span>Organization Profile</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-emerald-700 hover:text-emerald-900 underline font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div><strong>Company:</strong> {formData.organization.companyName || "N/A"}</div>
                  <div><strong>Industry:</strong> {formData.organization.industry}</div>
                  <div><strong>Size:</strong> {formData.organization.companySize}</div>
                  <div><strong>Role:</strong> {formData.organization.userRole}</div>
                </div>
                <div className="mt-2 text-slate-700">
                  <strong>Objective:</strong> {formData.organization.assessmentGoal}
                </div>
              </div>

              {/* Environment Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between font-bold text-slate-900 mb-2">
                  <span>Data Environment</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-emerald-700 hover:text-emerald-900 underline font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1 text-slate-600">
                  <div><strong>Deployment:</strong> {formData.environment.deployment}</div>
                  <div><strong>Sources:</strong> {formData.environment.dataSources.join(", ")}</div>
                  {formData.environment.analyticsTools.length > 0 && (
                    <div><strong>Tools:</strong> {formData.environment.analyticsTools.join(", ")}</div>
                  )}
                  {formData.environment.dataVolume && (
                    <div><strong>Volume:</strong> {formData.environment.dataVolume}</div>
                  )}
                </div>
              </div>

              {/* Challenges Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between font-bold text-slate-900 mb-2">
                  <span>Stated Challenges ({formData.selectedChallenges.length})</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-emerald-700 hover:text-emerald-900 underline font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  {formData.selectedChallenges.map(c => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                {formData.freeTextChallenges && (
                  <div className="mt-2 text-slate-600 italic border-t border-slate-200 pt-2">
                    &ldquo;{formData.freeTextChallenges}&rdquo;
                  </div>
                )}
              </div>
            </div>

            {/* Methodology Note */}
            <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-200 text-xs text-emerald-900 flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <span>
                Submitting this assessment will normalize requirements, query the verified IOMETE capability knowledge base, attach supporting evidence, and generate an actionable buyer readiness report.
              </span>
            </div>
          </div>
        )}

        {/* Wizard Navigation Buttons */}
        <div className="mt-8 pt-5 border-t border-slate-200 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:bg-brand-900 transition-colors shadow-sm"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Evaluating Requirements...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2 text-emerald-200" />
                  <span>Generate Assessment &amp; Report</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AssessmentWizardPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-12 text-center text-slate-500">Loading Assessment Wizard...</div>}>
      <AssessmentWizardContent />
    </Suspense>
  );
}

