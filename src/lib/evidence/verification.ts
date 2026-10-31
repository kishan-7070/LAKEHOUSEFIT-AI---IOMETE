import capabilitiesData from "@/data/capabilities.json";
import { Capability, EvidenceStatus } from "@/types/capability";
import { AssessmentFinding } from "@/types/report";

export const CAPABILITIES_MAP: Map<string, Capability> = new Map(
  (capabilitiesData as Capability[]).map(c => [c.id, c])
);

export interface EvidenceAuditResult {
  isValid: boolean;
  violations: string[];
  supportedFindingsCount: number;
  needsValidationCount: number;
  unknownCount: number;
  evidenceCoveragePercentage: number;
}

/**
 * Validates that an assessment's findings adhere strictly to LakehouseFit AI accuracy rules:
 * 1. Every finding marked 'supported' MUST have at least one verified capability reference with evidenceStatus === 'documented'.
 * 2. If a referenced capability has evidenceStatus === 'partially_documented', the finding MUST NOT be marked 'supported'.
 * 3. Findings with zero evidence references MUST be marked 'unknown'.
 */
export function auditFindingsAccuracy(findings: AssessmentFinding[]): EvidenceAuditResult {
  const violations: string[] = [];
  let supportedCount = 0;
  let needsValidationCount = 0;
  let unknownCount = 0;
  let supportedWithEvidenceCount = 0;

  for (const finding of findings) {
    if (finding.status === "supported") {
      supportedCount++;
      if (finding.evidenceReferences.length === 0) {
        violations.push(
          `Violation in ${finding.requirementId}: Marked as 'supported' but has 0 evidence references.`
        );
      } else {
        const caps = finding.evidenceReferences.map(id => CAPABILITIES_MAP.get(id)).filter(Boolean);
        const hasDocumentedSource = caps.some(c => c?.evidenceStatus === "documented");

        if (!hasDocumentedSource) {
          violations.push(
            `Violation in ${finding.requirementId}: Marked as 'supported' but none of its referenced capabilities are verified as 'documented'.`
          );
        } else {
          supportedWithEvidenceCount++;
        }
      }
    } else if (finding.status === "needs_validation") {
      needsValidationCount++;
    } else if (finding.status === "unknown") {
      unknownCount++;
    }
  }

  const coverage = supportedCount > 0
    ? Math.round((supportedWithEvidenceCount / supportedCount) * 100)
    : 100;

  return {
    isValid: violations.length === 0,
    violations,
    supportedFindingsCount: supportedCount,
    needsValidationCount,
    unknownCount,
    evidenceCoveragePercentage: coverage,
  };
}

export function getCapabilityById(id: string): Capability | undefined {
  return CAPABILITIES_MAP.get(id);
}

export function getAllCapabilities(): Capability[] {
  return Array.from(CAPABILITIES_MAP.values());
}

