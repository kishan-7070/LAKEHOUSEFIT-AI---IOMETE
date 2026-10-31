import { describe, it, expect, beforeEach } from "vitest";
import { inMemoryStore } from "@/lib/db/in-memory-store";
import { MatchingEngine } from "@/lib/matching/engine";
import { detectRequirementConflicts, hasWord, hasPhrase } from "@/lib/matching/rules";
import { auditFindingsAccuracy } from "@/lib/evidence/verification";
import { signAuthToken, verifyAuthToken } from "@/lib/auth/jwt";
import { NextRequest } from "next/server";
import { GET as getAssessmentById } from "@/app/api/assessments/[id]/route";
import { POST as analyzeAssessment } from "@/app/api/assessments/[id]/analyze/route";
import { GET as getReportById } from "@/app/api/assessments/[id]/report/route";
import { AssessmentFinding } from "@/types/report";

describe("LakehouseFit AI Security & Audit Verification Tests", () => {
  beforeEach(() => {
    inMemoryStore.clearAll();
  });

  it("prevents false keyword positive matches (e.g., 'android' must NOT match 'roi')", () => {
    const androidText = "We build our executive mobile dashboards using native Android and Kotlin.";
    expect(hasWord(androidText, "roi")).toBe(false);

    const actualRoiText = "We require contractually guaranteed ROI on our cloud spend.";
    expect(hasWord(actualRoiText, "roi")).toBe(true);

    const mainframeText = "We have an IBM mainframe running z/OS.";
    expect(hasWord(mainframeText, "mainframe")).toBe(true);
    expect(hasWord("our domain framework is scalable", "mainframe")).toBe(false);
  });

  it("surfaces budget conflicts in findings when zero budget meets high concurrency", () => {
    const input: any = {
      organization: {
        industry: "technology",
        companySize: "enterprise",
        userRole: "it_decision_maker",
        companyName: "Zero Cost High Concurrency Corp",
        assessmentGoal: "Cost vs Concurrency evaluation",
      },
      environment: {
        deployment: "customer_cloud_vpc",
        dataSources: ["Postgres"],
        analyticsTools: ["Superset"],
      },
      selectedChallenges: ["Increasing analytical workload and query concurrency contention"],
      freeTextChallenges: "We expect sub-second queries under high concurrency.",
      technicalRequirements: {
        budgetConstraints: "zero budget available for additional compute",
      },
    };

    const conflicts = detectRequirementConflicts(input);
    expect(conflicts.length).toBeGreaterThan(0);
    const budgetConflict = conflicts.find(c => c.field === "budgetConstraints");
    expect(budgetConflict).toBeDefined();

    const engine = new MatchingEngine();
    const reqs = engine.normalizeRequirements(input);
    const findings = engine.evaluateRequirements(reqs, input);

    // Verify that the conflict reaches findings
    const conflictFinding = findings.find(f =>
      f.explanation.includes("Cost expectation mismatch") ||
      f.category === "pricing" ||
      f.requirementDescription.includes("budgetConstraints")
    );
    expect(conflictFinding).toBeDefined();
    expect(conflictFinding?.status).toBe("needs_validation");
  });

  it("calculates 100% audit coverage when 0 findings are supported (none requiring evidence)", () => {
    const findings: AssessmentFinding[] = [
      {
        requirementId: "req-1",
        category: "compliance",
        requirementDescription: "FedRAMP High authorization",
        priority: "high",
        status: "unknown",
        relevantCapabilityIds: [],
        explanation: "Unverified in public documentation",
        evidenceReferences: [],
        unresolvedQuestions: ["Ask vendor for compliance cert"],
        limitations: ["Unverified claim"],
      },
      {
        requirementId: "req-2",
        category: "pricing",
        requirementDescription: "Guaranteed ROI",
        priority: "high",
        status: "needs_validation",
        relevantCapabilityIds: [],
        explanation: "Requires workload benchmark",
        evidenceReferences: [],
        unresolvedQuestions: ["Benchmark queries"],
        limitations: ["No guarantee without test"],
      },
    ];

    const audit = auditFindingsAccuracy(findings);
    expect(audit.isValid).toBe(true);
    expect(audit.supportedFindingsCount).toBe(0);
    // Coverage must not be misleadingly 0% when no supported findings exist
    expect(audit.evidenceCoveragePercentage).toBe(100);
  });

  it("rejects unauthorized access when user tries to access another user's assessment (403)", async () => {
    const victimUserId = "usr-victim-999";
    const attackerUserId = "usr-attacker-666";

    const assessmentId = "assessment-private-abc";
    inMemoryStore.saveAssessment({
      id: assessmentId,
      ownerId: victimUserId,
      organization: {
        companyName: "Victim Financial Inc",
        industry: "financial_services",
        companySize: "enterprise",
        userRole: "it_decision_maker",
        assessmentGoal: "Private M&A lakehouse evaluation",
      },
      environment: {
        deployment: "customer_cloud_vpc",
        dataSources: ["Internal S3"],
        analyticsTools: ["Tableau"],
      },
      requirements: [],
      status: "completed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Attacker sends request with attacker's token
    const attackerToken = await signAuthToken({
      userId: attackerUserId,
      email: "attacker@rival.com",
      name: "Rival Corp",
      role: "it_decision_maker",
    });

    const req = new NextRequest(`http://localhost:3000/api/assessments/${assessmentId}`, {
      headers: {
        Authorization: `Bearer ${attackerToken}`,
      },
    });

    const res = await getAssessmentById(req, { params: { id: assessmentId } });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("Access denied");
  });

  it("rejects unauthorized report access when attacker tries to download victim's report (403)", async () => {
    const victimUserId = "usr-victim-999";
    const attackerUserId = "usr-attacker-666";
    const assessmentId = "assessment-private-xyz";

    inMemoryStore.saveAssessment({
      id: assessmentId,
      ownerId: victimUserId,
      organization: {
        companyName: "Victim Inc",
        industry: "technology",
        companySize: "enterprise",
        userRole: "it_decision_maker",
        assessmentGoal: "Private evaluation",
      },
      environment: {
        deployment: "customer_cloud_vpc",
        dataSources: ["S3"],
        analyticsTools: [],
      },
      requirements: [],
      status: "completed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    inMemoryStore.saveReport({
      id: "report-victim-xyz",
      assessmentId,
      ownerId: victimUserId,
      title: "Confidential Victim Lakehouse Report",
      organizationName: "Victim Inc",
      executiveSummary: "Confidential notes",
      scopeSummary: "Confidential",
      findings: [],
      recommendedNextSteps: [],
      limitations: [],
      methodologyNotes: [],
      isAiEnhanced: false,
      generatedAt: new Date().toISOString(),
      version: 1,
    });

    const attackerToken = await signAuthToken({
      userId: attackerUserId,
      email: "attacker@rival.com",
      name: "Rival Corp",
      role: "it_decision_maker",
    });

    const req = new NextRequest(`http://localhost:3000/api/assessments/${assessmentId}/report`, {
      headers: {
        Authorization: `Bearer ${attackerToken}`,
      },
    });

    const res = await getReportById(req, { params: { id: assessmentId } });
    expect(res.status).toBe(403);
  });

  it("rejects invalid input body in POST /analyze with 400 Bad Request", async () => {
    const invalidBody = {
      organization: {
        // Missing required fields like industry, companySize, userRole
        assessmentGoal: "test",
      },
      environment: {
        // Missing deployment
        dataSources: [],
      },
    };

    const req = new NextRequest("http://localhost:3000/api/assessments/test-id/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidBody),
    });

    const res = await analyzeAssessment(req, { params: { id: "test-id" } });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("Invalid assessment submission input");
  });
});
