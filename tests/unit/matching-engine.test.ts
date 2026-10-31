import { describe, it, expect } from "vitest";
import { MatchingEngine } from "@/lib/matching/engine";
import { auditFindingsAccuracy } from "@/lib/evidence/verification";
import { detectRequirementConflicts } from "@/lib/matching/rules";
import { AssessmentSubmissionInput } from "@/lib/validation/assessment-schema";
import sampleScenarios from "@/data/sample-scenarios.json";
import { generateReportPdf } from "@/lib/pdf/generate-report";

describe("LakehouseFit AI Deterministic Matching Engine", () => {
  const engine = new MatchingEngine();

  it("normalizes structured challenges into categorized requirements", () => {
    const input: AssessmentSubmissionInput = {
      organization: {
        industry: "financial_services",
        companySize: "enterprise",
        userRole: "it_decision_maker",
        assessmentGoal: "Evaluate self-hosted lakehouse",
      },
      environment: {
        deployment: "customer_cloud_vpc",
        dataSources: ["AWS S3", "PostgreSQL"],
        analyticsTools: ["Tableau"],
      },
      selectedChallenges: [
        "Infrastructure ownership and sovereign data control requirements",
        "Data access, column masking, and regulatory governance requirements",
      ],
      freeTextChallenges: "",
      technicalRequirements: {
        integrationRequirements: [],
      },
    };

    const normalized = engine.normalizeRequirements(input);
    expect(normalized.length).toBeGreaterThanOrEqual(2);

    const categories = normalized.map(r => r.category);
    expect(categories).toContain("deployment");
    expect(categories).toContain("governance");
  });

  it("evaluates documented capabilities as 'supported' with real official source references", () => {
    const scenarioA = sampleScenarios.find(s => s.id === "scenario-a");
    expect(scenarioA).toBeDefined();

    const input = scenarioA!.input as any;
    const reqs = engine.normalizeRequirements(input);
    const findings = engine.evaluateRequirements(reqs, input);

    const supportedFindings = findings.filter(f => f.status === "supported");
    expect(supportedFindings.length).toBeGreaterThan(0);

    for (const f of supportedFindings) {
      expect(f.evidenceReferences.length).toBeGreaterThan(0);
      expect(f.explanation).toContain("Supported by documented capability");
    }
  });

  it("Scenario D: correctly identifies unverified compliance claims (FedRAMP High) as needs_validation/unknown, never supported", () => {
    const scenarioD = sampleScenarios.find(s => s.id === "scenario-d");
    expect(scenarioD).toBeDefined();

    const input = scenarioD!.input as any;
    const reqs = engine.normalizeRequirements(input);
    const findings = engine.evaluateRequirements(reqs, input);

    const complianceFinding = findings.find(f => f.category === "compliance");
    expect(complianceFinding).toBeDefined();
    // Must NOT be marked supported!
    expect(complianceFinding!.status).not.toBe("supported");
    expect(complianceFinding!.status).toBe("needs_validation");
    expect(complianceFinding!.explanation).toContain("requires direct vendor contract validation");
  });

  it("Scenario E: detects architectural conflicts between air-gapped on-premise and zero server administration SaaS", () => {
    const scenarioE = sampleScenarios.find(s => s.id === "scenario-e");
    expect(scenarioE).toBeDefined();

    const input = scenarioE!.input as any;
    const conflicts = detectRequirementConflicts(input);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].field).toBe("deployment");
    expect(conflicts[0].message).toContain("Architectural conflict");
  });

  it("strictly enforces that no finding marked 'supported' has zero evidence (PRD Accuracy Rule)", () => {
    for (const scenario of sampleScenarios) {
      const input = scenario.input as any;
      const reqs = engine.normalizeRequirements(input);
      const findings = engine.evaluateRequirements(reqs, input);

      const audit = auditFindingsAccuracy(findings);
      expect(audit.isValid).toBe(true);
      expect(audit.violations.length).toBe(0);
    }
  });

  it("generates a complete structured report with executive summary and actionable next steps", () => {
    const scenarioB = sampleScenarios.find(s => s.id === "scenario-b");
    const input = scenarioB!.input as any;

    const reqs = engine.normalizeRequirements(input);
    const findings = engine.evaluateRequirements(reqs, input);
    const conflicts = detectRequirementConflicts(input);
    const nextSteps = engine.generateNextSteps(findings, conflicts);

    const report = engine.generateReport(
      "test-scenario-b",
      input.organization,
      input.environment,
      findings,
      nextSteps,
      conflicts,
      false
    );

    expect(report.title).toContain("IOMETE Buyer Readiness & Technical Fit Report");
    expect(report.findings.length).toBe(findings.length);
    expect(report.recommendedNextSteps.length).toBeGreaterThan(0);
    expect(report.limitations.length).toBeGreaterThan(0);
  });

  it("generates a downloadable, well-paginated PDF report byte stream without errors", () => {
    const scenarioA = sampleScenarios.find(s => s.id === "scenario-a");
    const input = scenarioA!.input as any;

    const reqs = engine.normalizeRequirements(input);
    const findings = engine.evaluateRequirements(reqs, input);
    const nextSteps = engine.generateNextSteps(findings, []);

    const report = engine.generateReport(
      "test-scenario-a",
      input.organization,
      input.environment,
      findings,
      nextSteps,
      [],
      false
    );

    const pdfBytes = generateReportPdf(report);
    expect(pdfBytes).toBeDefined();
    expect(pdfBytes.byteLength).toBeGreaterThan(5000); // valid PDF has content
  });
});
