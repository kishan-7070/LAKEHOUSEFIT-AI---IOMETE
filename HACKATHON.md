# hackCBS — IOMETE Track Evaluation & Judging Guide

**Project:** LakehouseFit AI  
**Track:** hackCBS — IOMETE Track  
**Tagline:** From Data Challenges to Evidence-Backed Decisions  
**Live Production URL:** [https://lakehousefit-ai-iomete.vercel.app](https://lakehousefit-ai-iomete.vercel.app)  
**GitHub Repository:** [https://github.com/kishan-7070/LAKEHOUSEFIT-AI---IOMETE.git](https://github.com/kishan-7070/LAKEHOUSEFIT-AI---IOMETE.git)  

---

## 1. Hackathon Track Objectives & Alignment

The hackCBS IOMETE track focuses on making complex enterprise technology easier to evaluate and buy. Enterprise data platforms involve complex architecture—lakehouse open table formats, distributed compute orchestration, infrastructure sovereignty, and fine-grained data governance.

Prospective buyers often face weeks of repetitive vendor meetings, incomplete requirement checklists, and marketing ambiguity. LakehouseFit AI solves this by converting unstructured discovery research into an **auditable, evidence-backed evaluation workflow**.

---

## 2. Judging Criteria Alignment Matrix

| Judging Criterion | Weight | LakehouseFit AI Strategy & Concrete Evidence |
|---|---:|---|
| **Practical Impact** | **35%** | **Replaces repetitive manual research with a structured assessment and shareable buyer readiness report.**<br>• Preloads 6 enterprise test scenarios with 1 click.<br>• Generates ready-to-share executive briefings and downloadable paginated PDFs.<br>• Produces tailored discovery questions for vendor technical and financial validation. |
| **Buyer Clarity** | **25%** | **Translates complex technical capabilities into plain-language business impact.**<br>• Plain-English summaries tailored to buyers who are unfamiliar with lakehouse internals.<br>• Role-aware context for IT directors, data platform leads, and procurement evaluators.<br>• Clean visual dashboard with transparent status definitions (`Supported`, `Needs Validation`, `Unknown`). |
| **Accuracy** | **25%** | **Every claim is traceable to official IOMETE documentation (`iomete.com/docs`).**<br>• Curated knowledge base of 31 reviewed IOMETE capabilities with real URLs and verified excerpts.<br>• Explicit identification of unknowns—unverified queries (e.g., FedRAMP High, proprietary SLAs) return `Unknown` instead of fabricated claims.<br>• Architectural conflict detection alerts buyers to incompatible requirements (e.g., air-gapped on-premise vs. zero-admin SaaS). |
| **Working Execution** | **15%** | **End-to-end working demonstration live on production.**<br>• Live Next.js 14 App Router application with zero broken routes.<br>• Multi-step guided assessment wizard with state preservation and validation.<br>• Instant client-side and server-side PDF generation via `jspdf`.<br>• Enterprise authentication with MongoDB persistence and resilient in-memory fallback. |

---

## 3. End-to-End Live Demonstration Workflow (5-Minute Review)

Judges and reviewers can verify the complete working execution following this step-by-step walkthrough:

```
[1. Landing Page] ──► [2. Test Scenarios] ──► [3. Wizard Evaluation] ──► [4. Evidence Audit] ──► [5. Executive PDF Export]
```

### Step 1: Explore Landing Page & 31 Curated Capabilities
1. Visit the live URL: [https://lakehousefit-ai-iomete.vercel.app](https://lakehousefit-ai-iomete.vercel.app)
2. Scroll to the **Curated IOMETE Knowledge Base** section to inspect all 31 source-backed capabilities (Sr. No. 1 to 31).
3. Click any documentation link to verify it opens the official documentation on `iomete.com/docs`.

### Step 2: Instant 1-Click Evaluation via Sample Scenarios
1. Scroll to the **Predefined Test Scenarios (PRD Section 13.1)** section on the homepage.
2. Click **"View Findings & Report"** on **Scenario A** (Regional Bank / Sovereign VPC).
3. Notice that all requirements are evaluated instantly without requiring login for public sample inspection.

### Step 3: Inspect Evidence & Unknowns
1. Review the requirement findings cards:
   - Green pills indicate **`Supported`** criteria.
   - Amber pills indicate **`Needs Validation`** criteria.
   - Slate pills indicate **`Unknown (No Evidence)`** criteria.
2. Click **"Inspect Evidence & Validation Questions"** on any finding:
   - Verify the exact cited documentation source (`Sr. No. X`), excerpt, and verified URL.
   - Inspect the targeted validation questions generated for discovery calls.

### Step 4: Verify Truthful Handling of Unknowns (Scenario D)
1. Navigate back or open **Scenario D** (Healthcare FedRAMP / HIPAA Evaluation).
2. Observe how the engine truthfully reports that while customer-managed deployment enables data residency, formal vendor FedRAMP High certification is **not documented in public IOMETE docs** and is explicitly flagged as `Needs Validation` / `Unknown`.

### Step 5: Test Conflict Recovery (Scenario E)
1. Open **Scenario E** (Air-gapped on-premises with zero server management).
2. Notice the yellow **Architectural Conflict Warning banner** identifying contradictory requirements before proceeding.

### Step 6: Download the Executive Readiness Report
1. On any results page, click **"Download Readiness Report (PDF)"**.
2. Inspect the generated multi-page, formatted PDF complete with executive summary, status distribution breakdown, and full documentation citations.

---

## 4. Predefined Test Scenarios Reference

The application implements all 6 predefined scenarios specified in PRD Section 13.1:

| Scenario | Title / Persona | Primary Challenge | Expected Behavior |
|---|---|---|---|
| **Scenario A** | Sovereign Infrastructure & Fine-Grained Security | Data residency in private AWS VPC with Apache Ranger | High match: customer-managed Kubernetes, Ranger governance, Iceberg tables. |
| **Scenario B** | Scaling SQL Analytics & Open Lakehouse | High-concurrency BI and multi-engine Iceberg integration | Matched: isolated virtual lakehouses, Iceberg compaction, dbt/BI integration. |
| **Scenario C** | Incomplete Requirements & Early Discovery | Minimal specifications without deployment or volume | Flags missing parameters without making assumptions; asks discovery questions. |
| **Scenario D** | Unsupported Compliance & Verification Gaps | FedRAMP High and out-of-the-box HIPAA BAA | Explicit Unknown / Needs Validation; avoids hallucinating compliance. |
| **Scenario E** | Architectural Conflict Recovery | Air-gapped on-premise with zero server administration SaaS | Conflict detector flags incompatible infrastructure preferences. |
| **Scenario F** | Deterministic Fallback & Zero-AI Reliability | Telecommunications billing analytics with zero API dependencies | 100% deterministic matching logic runs without third-party LLM API calls. |

---

## 5. Supporting Documentation Links

- [README.md](README.md) — Comprehensive technical architecture, setup instructions, and deployment guide.
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) — Feature-by-feature verification against PRD specifications.
- [LakehouseFit_AI_Complete_Implementation_PRD.pdf](LakehouseFit_AI_Complete_Implementation_PRD.pdf) — Complete hackCBS IOMETE Track Product Requirements Document (PRD v1.0).

