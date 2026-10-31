import { describe, it, expect } from "vitest";
import { inMemoryStore } from "@/lib/db/in-memory-store";
import { MatchingEngine } from "@/lib/matching/engine";
import { generateReportPdf } from "@/lib/pdf/generate-report";
import sampleScenarios from "@/data/sample-scenarios.json";

describe("LakehouseFit AI Integration Workflow", () => {
  it("executes the full end-to-end evaluation flow from input to report to PDF", () => {
    // 1. Prepare input
    const scenarioB = sampleScenarios.find(s => s.id === "scenario-b")!;
    const input = scenarioB.input as any;

    // 2. Normalize requirements
    const engine = new MatchingEngine();
    const reqs = engine.normalizeRequirements(input);
    expect(reqs.length).toBeGreaterThan(0);

    // 3. Evaluate requirements
    const findings = engine.evaluateRequirements(reqs, input);
    expect(findings.length).toBe(reqs.length);

    // 4. Generate next steps and report
    const nextSteps = engine.generateNextSteps(findings, []);
    const report = engine.generateReport(
      "integration-test-b",
      input.organization,
      input.environment,
      findings,
      nextSteps,
      [],
      false
    );

    // 5. Save to store
    inMemoryStore.saveReport(report);
    const retrievedReport = inMemoryStore.getReportByAssessmentId("integration-test-b");
    expect(retrievedReport).toBeDefined();
    expect(retrievedReport?.title).toBe(report.title);

    // 6. Generate PDF bytes
    const pdfBytes = generateReportPdf(report);
    expect(pdfBytes.byteLength).toBeGreaterThan(1000);

    // Check PDF magic header '%PDF-'
    const headerStr = Buffer.from(pdfBytes.slice(0, 5)).toString("utf-8");
    expect(headerStr).toBe("%PDF-");
  });

  it("handles unknown questions and empty free-text without crashing", () => {
    const emptyInput: any = {
      organization: {
        industry: "technology",
        companySize: "small",
        userRole: "it_decision_maker",
        assessmentGoal: "Vague early test",
      },
      environment: {
        deployment: "not_decided",
        dataSources: ["Internal DB"],
        analyticsTools: [],
      },
      selectedChallenges: ["Data distributed across multiple systems"],
      freeTextChallenges: "Does IOMETE have an out-of-the-box native driver for 1970s IBM VSAM datasets?",
      technicalRequirements: {},
    };

    const engine = new MatchingEngine();
    const reqs = engine.normalizeRequirements(emptyInput);
    const findings = engine.evaluateRequirements(reqs, emptyInput);

    const unknownFinding = findings.find(f => f.category === "unsupported_integration");
    expect(unknownFinding).toBeDefined();
    expect(unknownFinding!.status).toBe("unknown");
    expect(unknownFinding!.evidenceReferences.length).toBe(0);
    expect(unknownFinding!.explanation).toContain("No reviewed documentation");
  });
});
