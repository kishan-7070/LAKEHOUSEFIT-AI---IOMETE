import { FindingStatus } from "./capability";

export type { FindingStatus } from "./capability";

export interface AssessmentFinding {
  requirementId: string;
  category: string;
  requirementDescription: string;
  priority?: "high" | "medium" | "low";
  status: "supported" | "needs_validation" | "unknown";
  relevantCapabilityIds: string[];
  explanation: string;
  evidenceReferences: string[];
  unresolvedQuestions: string[];
  limitations: string[];
}

export interface RecommendedNextStep {
  title: string;
  description: string;
  relatedRequirementIds: string[];
  suggestedActionType: "document_review" | "vendor_question" | "poc_test" | "architecture_review";
}

export interface Report {
  id: string;
  assessmentId: string;
  title: string;
  organizationName: string;
  executiveSummary: string;
  scopeSummary: string;
  findings: AssessmentFinding[];
  recommendedNextSteps: RecommendedNextStep[];
  limitations: string[];
  methodologyNotes: string[];
  isAiEnhanced: boolean;
  generatedAt: string;
  version: number;
}

