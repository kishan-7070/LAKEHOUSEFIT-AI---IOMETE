import { Capability, EvidenceStatus } from "@/types/capability";
import { NormalizedRequirement, AssessmentSubmissionInput, AssessmentOrganization, AssessmentEnvironment } from "@/types/assessment";
import { AssessmentFinding, RecommendedNextStep, Report } from "@/types/report";
import { CHALLENGE_NORMALIZATION_MAP, detectRequirementConflicts, ConflictWarning, hasWord, hasPhrase } from "./rules";
import capabilitiesData from "@/data/capabilities.json";

export class MatchingEngine {
  private capabilities: Capability[];

  constructor(customCapabilities?: Capability[]) {
    this.capabilities = customCapabilities || (capabilitiesData as Capability[]);
  }

  /**
   * Normalizes raw user input into structured requirement objects.
   * Preserves user intent, separates structured selections from free text,
   * and tags categories for deterministic matching.
   */
  public normalizeRequirements(input: AssessmentSubmissionInput): NormalizedRequirement[] {
    const requirements: NormalizedRequirement[] = [];
    let counter = 1;

    // 1. Map structured business challenges
    for (const challenge of input.selectedChallenges) {
      const mapped = CHALLENGE_NORMALIZATION_MAP[challenge];
      if (mapped) {
        requirements.push({
          id: `req-${counter++}`,
          category: mapped.category,
          description: mapped.description,
          priority: mapped.priority,
          source: "structured_input",
          rawInput: challenge,
        });
      } else {
        requirements.push({
          id: `req-${counter++}`,
          category: "general",
          description: challenge,
          priority: "medium",
          source: "structured_input",
          rawInput: challenge,
        });
      }
    }

    // 2. Map deployment environment constraints
    if (input.environment.deployment === "customer_cloud_vpc" || input.environment.deployment === "air_gapped_on_prem") {
      const alreadyHasDeployment = requirements.some(r => r.category === "deployment");
      if (!alreadyHasDeployment) {
        requirements.push({
          id: `req-${counter++}`,
          category: "deployment",
          description: "Requirement to host data plane inside customer-managed infrastructure / private VPC without data egress to public multi-tenant SaaS.",
          priority: "high",
          source: "structured_input",
          rawInput: `Deployment: ${input.environment.deployment}`,
        });
      }
    }

    // 3. Map technical requirements
    const tech = input.technicalRequirements;
    if (tech) {
      if (tech.accessControl && tech.accessControl.trim().length > 0) {
        const alreadyHasGovernance = requirements.some(r => r.category === "governance");
        if (!alreadyHasGovernance) {
          requirements.push({
            id: `req-${counter++}`,
            category: "governance",
            description: `Access control requirement: ${tech.accessControl}`,
            priority: "high",
            source: "structured_input",
            rawInput: tech.accessControl,
          });
        }
      }

      if (tech.integrationRequirements && tech.integrationRequirements.length > 0) {
        requirements.push({
          id: `req-${counter++}`,
          category: "analytics",
          description: `Integration with tooling ecosystem: ${tech.integrationRequirements.join(", ")}`,
          priority: "medium",
          source: "structured_input",
          rawInput: tech.integrationRequirements.join(", "),
        });
      }

      if (tech.performanceExpectations && tech.performanceExpectations.trim().length > 0) {
        requirements.push({
          id: `req-${counter++}`,
          category: "compute",
          description: `Performance target: ${tech.performanceExpectations}`,
          priority: "medium",
          source: "structured_input",
          rawInput: tech.performanceExpectations,
        });
      }
    }

    // 4. Parse free-text input for special requirements or unverified claims using word boundaries
    if (input.freeTextChallenges && input.freeTextChallenges.trim().length > 0) {
      const freeText = input.freeTextChallenges.toLowerCase();

      // Check for regulatory certification claims (e.g. FedRAMP, HIPAA BAA)
      if (
        hasWord(freeText, "fedramp") ||
        hasWord(freeText, "hipaa") ||
        hasWord(freeText, "soc2") ||
        hasWord(freeText, "baa")
      ) {
        requirements.push({
          id: `req-${counter++}`,
          category: "compliance",
          description: "Vendor-level regulatory certification verification (e.g., FedRAMP High, signed HIPAA BAA, or SOC 2 Type II audit report).",
          priority: "high",
          source: "user_text",
          rawInput: input.freeTextChallenges,
        });
      }

      // Check for proprietary migration or unsupported proprietary format claims
      if (
        hasPhrase(freeText, "zero-copy snowflake") ||
        hasPhrase(freeText, "oracle exadata native") ||
        hasWord(freeText, "mainframe") ||
        hasWord(freeText, "vsam")
      ) {
        requirements.push({
          id: `req-${counter++}`,
          category: "unsupported_integration",
          description: "Direct legacy proprietary connector or protocol emulation (e.g. mainframe VSAM or proprietary warehouse replication).",
          priority: "medium",
          source: "user_text",
          rawInput: input.freeTextChallenges,
        });
      }

      // Check for guaranteed ROI/savings claim with strict word boundaries to avoid false positives (e.g., "android" vs "roi")
      if (
        hasWord(freeText, "guarantee") &&
        (hasWord(freeText, "savings") ||
          hasWord(freeText, "cost") ||
          hasWord(freeText, "roi") ||
          hasWord(freeText, "cheaper"))
      ) {
        requirements.push({
          id: `req-${counter++}`,
          category: "pricing",
          description: "Contractual cost reduction or guaranteed financial ROI requirement.",
          priority: "high",
          source: "user_text",
          rawInput: input.freeTextChallenges,
        });
      }
    }

    return requirements;
  }

  /**
   * Evaluates normalized requirements against curated capability records.
   * Generates deterministic findings with Supported, Needs Validation, or Unknown status.
   */
  public evaluateRequirements(
    requirements: NormalizedRequirement[],
    input: AssessmentSubmissionInput
  ): AssessmentFinding[] {
    const findings: AssessmentFinding[] = [];
    const conflicts = detectRequirementConflicts(input);

    for (const req of requirements) {
      const matchedCapabilities = this.findMatchingCapabilities(req);

      if (req.category === "compliance") {
        // Regulatory compliance is partially documented: self-hosting enables compliance,
        // but formal vendor-level FedRAMP / HIPAA BAA guarantees are NOT verified in public docs.
        const compCap = this.capabilities.find(c => c.id === "compliance-hipaa-fedramp-status");
        findings.push({
          requirementId: req.id,
          category: "compliance",
          requirementDescription: req.description,
          priority: req.priority,
          status: "needs_validation",
          relevantCapabilityIds: compCap ? [compCap.id] : [],
          explanation: "IOMETE's customer-hosted architecture allows data to remain inside your own certified cloud perimeter (e.g., your own AWS/Azure HIPAA or FedRAMP-boundary VPC). However, vendor-level FedRAMP authorization or formal HIPAA BAA execution for hosted control plane components is not documented as a blanket out-of-the-box guarantee and requires direct vendor contract validation.",
          evidenceReferences: compCap ? [compCap.id] : [],
          unresolvedQuestions: [
            "Does your compliance framework require a vendor-signed HIPAA Business Associate Agreement (BAA) for the control plane, or is deploying a 100% self-hosted/air-gapped data plane sufficient?",
            "What specific FedRAMP baseline (Moderate vs High) is mandated for your cloud environment?",
          ],
          limitations: compCap ? compCap.limitations : ["Vendor certification scope requires contractual validation."],
        });
        continue;
      }

      if (req.category === "unsupported_integration") {
        // Unsupported legacy format or proprietary replication
        findings.push({
          requirementId: req.id,
          category: "unsupported_integration",
          requirementDescription: req.description,
          priority: req.priority,
          status: "unknown",
          relevantCapabilityIds: [],
          explanation: "No reviewed documentation in the IOMETE capability knowledge base supports direct out-of-the-box connectors for proprietary mainframe protocols or zero-copy cross-vendor replication. Data must typically be ingested into S3/object storage using standard Spark batch or Kafka streaming connectors.",
          evidenceReferences: [],
          unresolvedQuestions: [
            "Can data from legacy or proprietary systems be staged into standard S3/GCS object storage or streamed via Kafka/Debezium before ingestion into Iceberg?",
            "What intermediate ingestion tools (e.g., Airbyte, Fivetran, Kafka Connect) are currently available in your environment?",
          ],
          limitations: [
            "Official documentation does not claim proprietary legacy mainframe or zero-copy cross-warehouse emulation.",
          ],
        });
        continue;
      }

      if (req.category === "pricing") {
        const pricingCap = this.capabilities.find(c => c.id === "pricing-tco-guarantees");
        findings.push({
          requirementId: req.id,
          category: "pricing",
          requirementDescription: req.description,
          priority: req.priority,
          status: "needs_validation",
          relevantCapabilityIds: pricingCap ? [pricingCap.id] : [],
          explanation: "IOMETE's architectural model eliminates proprietary compute consumption markups by running directly on your own cloud provider instances. However, LakehouseFit AI adheres strictly to PRD accuracy rules and does not guarantee blanket percentage savings or financial ROI without a benchmark on your specific workload patterns.",
          evidenceReferences: pricingCap ? [pricingCap.id] : [],
          unresolvedQuestions: [
            "What is your current monthly cloud compute vs storage breakdown in your existing data platform?",
            "Can a 2-week Proof of Concept (PoC) be conducted with representative SQL workloads to measure actual cluster-hour consumption?",
          ],
          limitations: pricingCap ? pricingCap.limitations : ["No financial savings guarantee can be verified without workload testing."],
        });
        continue;
      }

      // Check if there are conflict warnings for this category or related budget constraints
      const conflictForCategory = conflicts.find(
        c =>
          c.field === req.category ||
          (c.field === "budgetConstraints" && (req.category === "pricing" || req.category === "compute"))
      );

      if (matchedCapabilities.length === 0) {
        // No match found -> Unknown
        findings.push({
          requirementId: req.id,
          category: req.category,
          requirementDescription: req.description,
          priority: req.priority,
          status: "unknown",
          relevantCapabilityIds: [],
          explanation: `The available curated IOMETE documentation does not provide conclusive verified evidence regarding '${req.description}'. In accordance with the accuracy guidelines of LakehouseFit AI, unverified features are marked as Unknown rather than assumed.`,
          evidenceReferences: [],
          unresolvedQuestions: [
            `Request technical verification from IOMETE solutions architects regarding documented support for: ${req.description}.`,
          ],
          limitations: [
            "Absence of evidence in the curated knowledge base does not prove the feature is missing, but it cannot be verified from reviewed official sources.",
          ],
        });
      } else {
        // Matched one or more capabilities
        const primaryCap = matchedCapabilities[0];
        const allCapIds = matchedCapabilities.map(c => c.id);
        const allLimitations = matchedCapabilities.flatMap(c => c.limitations);

        if (conflictForCategory) {
          // If there is an architectural conflict detected
          findings.push({
            requirementId: req.id,
            category: req.category,
            requirementDescription: req.description,
            priority: req.priority,
            status: "needs_validation",
            relevantCapabilityIds: allCapIds,
            explanation: `Architectural Conflict Detected: ${conflictForCategory.message} Documented capability '${primaryCap.name}' supports self-managed deployment, but requires administrative confirmation.`,
            evidenceReferences: allCapIds,
            unresolvedQuestions: [
              conflictForCategory.recommendation,
              "Confirm Kubernetes administration capacity within your technical operations team.",
            ],
            limitations: allLimitations,
          });
        } else if (primaryCap.evidenceStatus === "documented") {
          // Documented match -> Supported
          findings.push({
            requirementId: req.id,
            category: req.category,
            requirementDescription: req.description,
            priority: req.priority,
            status: "supported",
            relevantCapabilityIds: allCapIds,
            explanation: `Supported by documented capability '${primaryCap.name}'. ${primaryCap.description}`,
            evidenceReferences: allCapIds,
            unresolvedQuestions: this.generateUnresolvedQuestions(primaryCap, input),
            limitations: allLimitations,
          });
        } else {
          // Partially documented -> Needs Validation
          findings.push({
            requirementId: req.id,
            category: req.category,
            requirementDescription: req.description,
            priority: req.priority,
            status: "needs_validation",
            relevantCapabilityIds: allCapIds,
            explanation: `Relevant capability '${primaryCap.name}' is documented, but customer-specific configuration, version, or network topology requires explicit validation.`,
            evidenceReferences: allCapIds,
            unresolvedQuestions: this.generateUnresolvedQuestions(primaryCap, input),
            limitations: allLimitations,
          });
        }
      }
    }

    // Ensure any unattached architectural conflict warning reaches the report findings
    for (const conflict of conflicts) {
      const alreadyReported = findings.some(f => f.explanation.includes(conflict.message));
      if (!alreadyReported) {
        findings.push({
          requirementId: `conflict-${conflict.field}`,
          category: conflict.field === "budgetConstraints" ? "pricing" : conflict.field,
          requirementDescription: `Architectural Constraint Check (${conflict.field})`,
          priority: "high",
          status: "needs_validation",
          relevantCapabilityIds: ["pricing-tco-guarantees", "compute-virtual-lakehouses"],
          explanation: `Architectural Conflict Detected: ${conflict.message}`,
          evidenceReferences: ["pricing-tco-guarantees"],
          unresolvedQuestions: [
            conflict.recommendation,
            "Conduct capacity planning session to align performance SLAs with compute cluster budgets.",
          ],
          limitations: [
            "LakehouseFit AI flags conflicting constraints to prevent sizing shortfalls during procurement.",
          ],
        });
      }
    }

    return findings;
  }

  private findMatchingCapabilities(req: NormalizedRequirement): Capability[] {
    const categoryMatches = this.capabilities.filter(c => c.category === req.category);
    if (categoryMatches.length > 0) {
      return categoryMatches;
    }

    // Try tag matching
    const reqText = (req.description + " " + (req.rawInput || "")).toLowerCase();
    return this.capabilities.filter(c => {
      return c.relevantRequirementTags.some(tag => reqText.includes(tag.replace(/-/g, " ")));
    });
  }

  private generateUnresolvedQuestions(cap: Capability, input: AssessmentSubmissionInput): string[] {
    const questions: string[] = [];

    switch (cap.id) {
      case "deployment-kubernetes-helm":
        questions.push("What version of Kubernetes is currently running in your cluster (IOMETE requires v1.24+)?");
        questions.push("Do you have ingress controllers (e.g. Nginx, ALB) and TLS certificates configured for internal routing?");
        break;
      case "storage-apache-iceberg":
        questions.push("Are your existing tables stored as standard Parquet, or do you have legacy Hive / Delta tables that need migration scripts?");
        questions.push("What is your expected partition strategy and time-travel snapshot retention window?");
        break;
      case "compute-virtual-lakehouses":
        questions.push("What is your expected peak concurrent query volume across distinct departments during business hours?");
        questions.push("What auto-suspend idle timeout threshold (e.g., 10 minutes vs 30 minutes) aligns with your cost vs warm-query latency preferences?");
        break;
      case "compute-dynamic-spark-jobs":
        questions.push("Are any custom third-party Spark packages or native C-bindings required for your ETL pipelines?");
        break;
      case "governance-apache-ranger":
        questions.push("Which enterprise Identity Provider (e.g., Okta, Azure AD, Keycloak) will integrate via SAML/OIDC for user synchronization?");
        questions.push("Do you require specific column-level masking rules (e.g. hash, partial redact) for PII compliance?");
        break;
      case "analytics-bi-connectivity":
        questions.push("Which BI clients will be primary (e.g., Tableau Server vs desktop Power BI vs open-source Superset)?");
        break;
      case "orchestration-dbt-airflow":
        questions.push("Which version of dbt-spark or Apache Airflow is currently deployed in your data stack?");
        break;
      default:
        questions.push(`Confirm customer-specific environment constraints for ${cap.name}.`);
    }

    return questions;
  }

  /**
   * Generates actionable recommended next steps based on assessment findings.
   */
  public generateNextSteps(findings: AssessmentFinding[], conflicts: ConflictWarning[]): RecommendedNextStep[] {
    const steps: RecommendedNextStep[] = [];

    // Step 1: Technical Discovery & Architecture Review
    steps.push({
      title: "Conduct Infrastructure & Kubernetes Architecture Review",
      description: "Review IOMETE's Helm chart deployment requirements ('iomete-data-plane-enterprise') with your DevOps or Cloud Platform team to verify Kubernetes cluster compatibility, namespace isolation, and S3-compatible storage endpoints.",
      relatedRequirementIds: findings.filter(f => f.category === "deployment").map(f => f.requirementId),
      suggestedActionType: "architecture_review",
    });

    // Step 2: Apache Iceberg Schema & Ingestion Mapping
    const storageFindings = findings.filter(f => f.category === "storage");
    if (storageFindings.length > 0) {
      steps.push({
        title: "Catalog Existing Data Assets & Ingestion Pathways",
        description: "Audit current data storage formats (Parquet, Delta, CSV, or relational databases) to plan table ingestion and conversion into Apache Iceberg open format with automated compaction.",
        relatedRequirementIds: storageFindings.map(f => f.requirementId),
        suggestedActionType: "document_review",
      });
    }

    // Step 3: Security & Apache Ranger Policy Alignment
    const govFindings = findings.filter(f => f.category === "governance" || f.category === "compliance");
    if (govFindings.length > 0) {
      steps.push({
        title: "Define Granular Security & Compliance Matrix",
        description: "Document required role-based access control (RBAC), column-level masking rules, and audit logging needs to validate integration with IOMETE's Apache Ranger security service.",
        relatedRequirementIds: govFindings.map(f => f.requirementId),
        suggestedActionType: "vendor_question",
      });
    }

    // Step 4: Workload PoC on Isolated Virtual Lakehouses
    steps.push({
      title: "Execute a 2-Week Proof of Concept (PoC) on Representative Queries",
      description: "Deploy an isolated virtual lakehouse on a non-production Kubernetes cluster. Benchmark top 5 analytical query workloads, measure auto-suspend recovery latency, and evaluate BI tool responsiveness.",
      relatedRequirementIds: findings.filter(f => f.category === "compute" || f.category === "analytics").map(f => f.requirementId),
      suggestedActionType: "poc_test",
    });

    // Step 5: Address Unresolved Questions with IOMETE Solutions Team
    const unknownOrValidation = findings.filter(f => f.status === "needs_validation" || f.status === "unknown");
    if (unknownOrValidation.length > 0 || conflicts.length > 0) {
      steps.push({
        title: "Review Unresolved Questions with IOMETE Technical Sales",
        description: "Schedule a targeted vendor discovery call focusing on identified validation questions (such as compliance certification boundaries, custom network ingress, and high-concurrency BI sizing).",
        relatedRequirementIds: unknownOrValidation.map(f => f.requirementId),
        suggestedActionType: "vendor_question",
      });
    }

    return steps;
  }

  /**
   * Generates a complete buyer readiness report object.
   */
  public generateReport(
    assessmentId: string,
    organization: AssessmentOrganization,
    environment: AssessmentEnvironment,
    findings: AssessmentFinding[],
    nextSteps: RecommendedNextStep[],
    conflicts: ConflictWarning[],
    isAiEnhanced = false,
    ownerId?: string | null
  ): Report {
    const orgName = organization.companyName || "Prospective Enterprise Buyer";
    const supportedCount = findings.filter(f => f.status === "supported").length;
    const needsValidationCount = findings.filter(f => f.status === "needs_validation").length;
    const unknownCount = findings.filter(f => f.status === "unknown").length;

    const executiveSummary = [
      `This evidence-backed buyer readiness report provides an objective evaluation of whether IOMETE's documented data lakehouse capabilities align with ${orgName}'s stated business and technical requirements.`,
      `Out of ${findings.length} evaluated requirement criteria, ${supportedCount} are directly Supported by reviewed official IOMETE documentation, ${needsValidationCount} Require Technical Validation due to customer-specific configuration dependencies, and ${unknownCount} are classified as Unknown where public verified evidence is insufficient.`,
      conflicts.length > 0
        ? `Notice: ${conflicts.length} architectural conflict(s) were flagged during assessment normalization (see Findings section for details).`
        : "No contradictory architectural constraints were detected during input normalization.",
      "In accordance with LakehouseFit AI principles, all supported claims are grounded in reviewed official documentation from iomete.com. This assessment provides structured decision support and does not constitute a guaranteed commercial SLA or legal certification.",
    ].join("\n\n");

    const scopeSummary = `Evaluation Scope: Organization in ${organization.industry || "General Enterprise"} sector, targeting ${organization.assessmentGoal || "Data Lakehouse Evaluation"} across ${environment.dataSources.join(", ")} data sources with ${environment.deployment || "specified"} deployment topology.`;

    const limitations = [
      "Decision Support Only: This report is an analytical evaluation tool based on curated documentation and does not guarantee software performance, uptime, or compatibility in custom production environments.",
      "Workload Specificity: Exact query performance, cold-start latency from auto-suspended clusters, and network throughput depend on customer infrastructure sizing and cloud provider quotas.",
      "Pricing & Cost Savings: LakehouseFit AI does not make speculative ROI or blanket cost-reduction guarantees. True total-cost-of-ownership (TCO) requires measuring real cluster-hour usage during an active PoC.",
      "Vendor Certifications: Regulatory compliance claims (such as HIPAA BAA or FedRAMP authorization) reflect public architecture documentation and must be confirmed contractually with IOMETE.",
    ];

    const methodologyNotes = [
      "Curated Knowledge Base: Product capabilities are evaluated strictly against verified official documentation from iomete.com/docs.",
      "Deterministic Matching: Capability mapping is driven by deterministic rule tagging rather than probabilistic LLM hallucinations.",
      "Explicit Unknowns: Questions without verifiable source documentation are explicitly labelled Unknown rather than fabricated.",
      "Audit-Ready Evidence: Every supported finding includes direct references to official documentation titles and URLs.",
    ];

    return {
      id: `rep-${Date.now().toString(36)}`,
      assessmentId,
      ownerId: ownerId || null,
      title: `IOMETE Buyer Readiness & Technical Fit Report — ${orgName}`,
      organizationName: orgName,
      executiveSummary,
      scopeSummary,
      findings,
      recommendedNextSteps: nextSteps,
      limitations,
      methodologyNotes,
      isAiEnhanced,
      generatedAt: new Date().toISOString(),
      version: 1,
    };
  }
}
