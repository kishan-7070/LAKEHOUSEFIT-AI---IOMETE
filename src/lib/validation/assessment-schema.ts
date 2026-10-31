import { z } from "zod";

export const OrganizationSchema = z.object({
  industry: z.string().min(1, "Please select or specify an industry"),
  companySize: z.string().min(1, "Please select company size"),
  userRole: z.string().min(1, "Please select your role"),
  companyName: z.string().nullable().optional(),
  assessmentGoal: z.string().min(3, "Please specify an assessment goal or objective"),
});

export const EnvironmentSchema = z.object({
  deployment: z.string().min(1, "Please select your primary deployment environment"),
  dataSources: z.array(z.string()).min(1, "Select at least one data source"),
  analyticsTools: z.array(z.string()).default([]),
  dataVolume: z.string().nullable().optional(),
  processingApproach: z.string().nullable().optional(),
});

export const TechnicalRequirementsSchema = z.object({
  deploymentPreference: z.string().optional(),
  dataResidency: z.string().optional(),
  accessControl: z.string().optional(),
  integrationRequirements: z.array(z.string()).optional().default([]),
  performanceExpectations: z.string().optional(),
  availabilityRequirements: z.string().optional(),
  budgetConstraints: z.string().optional(),
  freeTextConstraints: z.string().optional(),
});

export const AssessmentSubmissionSchema = z.object({
  organization: OrganizationSchema,
  environment: EnvironmentSchema,
  selectedChallenges: z.array(z.string()).min(1, "Please select at least one primary business or data challenge"),
  freeTextChallenges: z.string().max(3000).optional().default(""),
  technicalRequirements: TechnicalRequirementsSchema.optional().default({}),
});

export type AssessmentSubmissionInput = z.infer<typeof AssessmentSubmissionSchema>;

