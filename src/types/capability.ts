export type EvidenceStatus = "documented" | "partially_documented" | "unknown";
export type FindingStatus = "supported" | "needs_validation" | "unknown";

export interface CapabilitySource {
  title: string;
  url: string;
  excerpt?: string;
  verifiedAt?: string; // ISO-8601 string
}

export interface Capability {
  srNo?: number;
  id: string;
  name: string;
  category: string; // e.g. "deployment", "storage", "compute", "governance", "analytics", "orchestration"
  description: string;
  technicalDetails?: string;
  relevantRequirementTags: string[];
  source: CapabilitySource;
  evidenceStatus: EvidenceStatus;
  limitations: string[];
}
