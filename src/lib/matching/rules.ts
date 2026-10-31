import { NormalizedRequirement } from "@/types/assessment";
import { AssessmentSubmissionInput } from "../validation/assessment-schema";

export interface NormalizationRule {
  id: string;
  category: string;
  matchChallenge?: string;
  detectFromText?: RegExp;
  generateRequirement: (input: AssessmentSubmissionInput) => NormalizedRequirement;
}

export const CHALLENGE_NORMALIZATION_MAP: Record<string, { category: string; description: string; tags: string[]; priority: "high" | "medium" | "low" }> = {
  "Infrastructure ownership requirements": {
    category: "deployment",
    description: "Customer-controlled infrastructure and data plane sovereignty (in-VPC or on-premises Kubernetes).",
    tags: ["customer-controlled-infrastructure", "kubernetes", "self-hosted", "data-sovereignty", "infrastructure-control"],
    priority: "high",
  },
  "Infrastructure ownership and sovereign data control requirements": {
    category: "deployment",
    description: "Customer-controlled infrastructure and data plane sovereignty (in-VPC or on-premises Kubernetes).",
    tags: ["customer-controlled-infrastructure", "kubernetes", "self-hosted", "data-sovereignty", "infrastructure-control"],
    priority: "high",
  },
  "Data distributed across multiple systems": {
    category: "storage",
    description: "Unified open lakehouse storage layer across disparate transactional, streaming, and object storage sources.",
    tags: ["lakehouse-storage", "apache-iceberg", "object-storage", "hybrid-cloud"],
    priority: "medium",
  },
  "Increasing analytical workload": {
    category: "compute",
    description: "Multi-tenant workload isolation and elastic query clusters to handle growing concurrent query demands without contention.",
    tags: ["virtual-lakehouses", "sql-analytics", "isolated-compute", "auto-suspend", "high-concurrency"],
    priority: "high",
  },
  "Increasing analytical workload and query concurrency contention": {
    category: "compute",
    description: "Multi-tenant workload isolation and elastic query clusters to handle growing concurrent query demands without contention.",
    tags: ["virtual-lakehouses", "sql-analytics", "isolated-compute", "auto-suspend", "high-concurrency"],
    priority: "high",
  },
  "Difficulty managing large data volumes": {
    category: "compute",
    description: "Distributed batch and streaming ETL processing with automated Iceberg table file compaction.",
    tags: ["spark-jobs", "table-maintenance", "file-compaction", "distributed-computing", "large-data-volumes"],
    priority: "high",
  },
  "Difficulty managing large data volumes and small-file storage bloat": {
    category: "maintenance",
    description: "Automated table maintenance and file compaction to prevent small-file degradation at high ingestion volumes.",
    tags: ["table-maintenance", "file-compaction", "performance-optimization", "small-file-problem"],
    priority: "high",
  },
  "Need for SQL-based analytics": {
    category: "analytics",
    description: "Interactive SQL analytics, web-based query interface, and standard BI client connectivity (JDBC/ODBC/Arrow Flight).",
    tags: ["sql-analytics", "bi-tools", "jdbc-odbc", "spark-connect", "arrow-flight"],
    priority: "high",
  },
  "Need for performant SQL-based analytics across multiple business teams": {
    category: "analytics",
    description: "Interactive SQL analytics, web-based query interface, and standard BI client connectivity (JDBC/ODBC/Arrow Flight).",
    tags: ["sql-analytics", "bi-tools", "jdbc-odbc", "spark-connect", "arrow-flight"],
    priority: "high",
  },
  "Data access and governance requirements": {
    category: "governance",
    description: "Fine-grained security authorization, column masking, row-level filters, and centralized access audit logging.",
    tags: ["access-control", "apache-ranger", "column-level-security", "row-level-filtering", "data-governance", "audit-logging"],
    priority: "high",
  },
  "Data access, column masking, and regulatory governance requirements": {
    category: "governance",
    description: "Fine-grained security authorization, column masking, row-level filters, and centralized access audit logging.",
    tags: ["access-control", "apache-ranger", "column-level-security", "row-level-filtering", "data-governance", "audit-logging"],
    priority: "high",
  },
  "Desire to evaluate open technologies": {
    category: "storage",
    description: "Open table format architecture (Apache Iceberg) to eliminate proprietary vendor format lock-in.",
    tags: ["apache-iceberg", "open-formats", "no-vendor-lockin"],
    priority: "medium",
  },
  "Desire to evaluate open technologies and Apache Iceberg": {
    category: "storage",
    description: "Open table format architecture (Apache Iceberg) to eliminate proprietary vendor format lock-in.",
    tags: ["apache-iceberg", "open-formats", "no-vendor-lockin"],
    priority: "medium",
  },
};

export interface ConflictWarning {
  field: string;
  message: string;
  recommendation: string;
}

export function detectRequirementConflicts(input: AssessmentSubmissionInput): ConflictWarning[] {
  const warnings: ConflictWarning[] = [];
  const text = ((input.freeTextChallenges || "") + " " + (input.technicalRequirements?.deploymentPreference || "")).toLowerCase();

  // Conflict: Air-gapped on-premise combined with zero server management SaaS
  if (
    (text.includes("air-gapped") || text.includes("air gap") || input.environment.deployment === "air_gapped_on_prem") &&
    (text.includes("zero server management") || text.includes("multi-tenant saas") || text.includes("never manage any servers"))
  ) {
    warnings.push({
      field: "deployment",
      message: "Architectural conflict: Complete air-gapped isolation requires running within a customer-controlled environment and cannot be simultaneously fulfilled by a multi-tenant public SaaS with zero infrastructure administration.",
      recommendation: "Clarify whether your team has Kubernetes administrators available for self-hosted Helm installation, or whether an isolated dedicated VPC managed service is permissible.",
    });
  }

  // Conflict: High query concurrency on small or zero-budget without sizing
  if (
    text.includes("high concurrency") &&
    input.technicalRequirements?.budgetConstraints &&
    input.technicalRequirements.budgetConstraints.toLowerCase().includes("zero")
  ) {
    warnings.push({
      field: "budgetConstraints",
      message: "Cost expectation mismatch: Serving hundreds of concurrent interactive analytical queries requires allocated compute pods during active hours.",
      recommendation: "Implement auto-suspend and scheduled virtual lakehouses to keep idle costs zero while provisioning required compute during business hours.",
    });
  }

  return warnings;
}

