import { z } from "zod";

export const DeploymentEnum = z.enum([
  "customer_cloud_vpc",
  "public_cloud",
  "hybrid_cloud",
  "air_gapped_on_prem",
  "not_decided",
]);

export const OrganizationSchema = z.object({
  industry: z.string().min(1, "Please select or specify an industry").max(100, "Industry must be under 100 characters"),
  companySize: z.string().min(1, "Please select company size").max(50, "Company size must be under 50 characters"),
  userRole: z.string().min(1, "Please select your role").max(100, "Role must be under 100 characters"),
  companyName: z.string().max(200, "Company name must be under 200 characters").nullable().optional(),
  assessmentGoal: z.string().min(3, "Please specify an assessment goal").max(1000, "Goal must be under 1000 characters"),
});

export const EnvironmentSchema = z.object({
  deployment: DeploymentEnum,
  dataSources: z.array(z.string().max(100)).min(1, "Select at least one data source").max(30, "Maximum 30 data sources"),
  analyticsTools: z.array(z.string().max(100)).max(30, "Maximum 30 analytics tools").default([]),
  dataVolume: z.string().max(100).nullable().optional(),
  processingApproach: z.string().max(200).nullable().optional(),
});

export const TechnicalRequirementsSchema = z.object({
  deploymentPreference: z.string().max(500).optional(),
  dataResidency: z.string().max(500).optional(),
  accessControl: z.string().max(500).optional(),
  integrationRequirements: z.array(z.string().max(100)).max(30).optional().default([]),
  performanceExpectations: z.string().max(500).optional(),
  availabilityRequirements: z.string().max(500).optional(),
  budgetConstraints: z.string().max(500).optional(),
  freeTextConstraints: z.string().max(1000).optional(),
});

export const AssessmentSubmissionSchema = z.object({
  organization: OrganizationSchema,
  environment: EnvironmentSchema,
  selectedChallenges: z.array(z.string().max(300)).min(1, "Please select at least one primary challenge").max(50, "Maximum 50 challenges"),
  freeTextChallenges: z.string().max(3000, "Free-text context must be under 3000 characters").optional().default(""),
  technicalRequirements: TechnicalRequirementsSchema.optional().default({}),
});

export type AssessmentSubmissionInput = z.infer<typeof AssessmentSubmissionSchema>;
