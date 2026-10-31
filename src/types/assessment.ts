import { AssessmentSubmissionInput } from "@/lib/validation/assessment-schema";

export type { AssessmentSubmissionInput };

export type RequirementPriority = "high" | "medium" | "low";
export type RequirementSource = "structured_input" | "user_text";
export type AssessmentStatus = "draft" | "processing" | "completed" | "failed";

export interface AssessmentOrganization {
  industry?: string;
  companySize?: string;
  userRole?: string;
  companyName?: string | null;
  assessmentGoal?: string;
}

export interface AssessmentEnvironment {
  deployment?: string;
  dataSources: string[];
  analyticsTools: string[];
  dataVolume?: string | null;
  processingApproach?: string | null;
}

export interface NormalizedRequirement {
  id: string;
  category: string;
  description: string;
  priority?: RequirementPriority;
  source: RequirementSource;
  rawInput?: string;
}

export interface AssessmentInputData {
  organization: AssessmentOrganization;
  environment: AssessmentEnvironment;
  selectedChallenges: string[];
  freeTextChallenges?: string;
  technicalRequirements?: {
    deploymentPreference?: string;
    dataResidency?: string;
    accessControl?: string;
    integrationRequirements?: string[];
    performanceExpectations?: string;
    availabilityRequirements?: string;
    budgetConstraints?: string;
    freeTextConstraints?: string;
  };
}

export interface Assessment {
  id: string;
  organization: AssessmentOrganization;
  environment: AssessmentEnvironment;
  requirements: NormalizedRequirement[];
  status: AssessmentStatus;
  createdAt: string;
  updatedAt: string;
}
