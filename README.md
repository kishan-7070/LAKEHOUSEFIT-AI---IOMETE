# LakehouseFit AI
> **Evidence-backed buyer-readiness assessment platform for evaluating IOMETE against business and technical requirements.**

**Hackathon Track:** hackCBS — IOMETE Track  
**Tagline:** From Data Challenges to Evidence-Backed Decisions.  
**Version:** 1.0 (Implementation Complete)  

---

## 1. Overview

**LakehouseFit AI** is an evidence-backed buyer-readiness assessment platform built for enterprise technology buyers, data leaders, and sales representatives evaluating IOMETE's data lakehouse architecture.

Instead of navigating unstructured vendor documentation, sitting through repeated discovery calls, or relying on probabilistic AI chatbots that hallucinate product claims, LakehouseFit AI provides a **deterministic, auditable assessment workflow**:

1. **Guided Requirement Collection:** Captures organization profile, existing data environment, business challenges, and technical constraints.
2. **Deterministic Matching Engine:** Evaluates requirements against a curated knowledge base derived from reviewed official IOMETE documentation.
3. **Evidence-Backed Findings:** Assigns clear requirement-level statuses (`Supported`, `Needs validation`, `Unknown`), complete with official documentation URLs, verified citations, operational limitations, and follow-up discovery questions.
4. **Actionable Buyer Report:** Generates an executive readiness report and instant downloadable PDF report with next steps and methodology disclaimers.

---

## 2. Judging Strategy & Proof (hackCBS IOMETE Track)

| Criterion | Weight | How LakehouseFit AI Delivers |
|---|---:|---|
| **Practical Impact** | **35%** | Replaces unstructured vendor discovery with a structured assessment and reusable buyer-readiness report; provides pre-loaded evaluation scenarios and discovery checklists. |
| **Buyer Clarity** | **25%** | Plain-language executive summaries, role-aware recommendations, transparent status definitions, and concrete next steps for technical and financial stakeholders. |
| **Accuracy** | **25%** | Grounded 100% in official documentation (`iomete.com/docs`). No fabricated certifications, pricing, or benchmarks. Unsupported claims explicitly return `Unknown`. |
| **Working Execution** | **15%** | Complete end-to-end workflow: Landing Page &rarr; Assessment Wizard &rarr; Deterministic Engine &rarr; Results Dashboard &rarr; PDF Export. |

---

## 3. Technology Stack

- **Framework:** Next.js 14 App Router (React 18, TypeScript)
- **Styling:** Tailwind CSS, responsive mobile/desktop design, enterprise SaaS palette (deep green accent, accessible contrast)
- **Validation:** Zod schemas shared across client and server
- **Database:** MongoDB with Mongoose (with thread-safe in-memory demo store fallback when database is not configured)
- **Authentication:** Enterprise JWT sessions with `bcryptjs` and `jose`, featuring dedicated sign-in/sign-up and a **1-Click Demo Login** for hackathon judges
- **User Dashboard:** `/dashboard` for managing saved assessments and reports linked to user accounts in MongoDB
- **Report Generation:** Server-side PDF generation using `jspdf` with multi-page pagination and clickable source links
- **Testing:** Vitest for unit and integration testing
- **AI Layer (Optional):** Server-side provider abstraction (Google Gemini / OpenAI) strictly grounded in retrieved evidence with complete deterministic fallback

---

## 4. Project Structure

```text
lakehousefit-ai/
├── src/
│   ├── app/
│   │   ├── page.tsx                           # S1: Landing page with value prop, workflow, knowledge base
│   │   ├── layout.tsx                         # Root layout with responsive Navbar and Footer
│   │   ├── globals.css                        # Tailwind global styles
│   │   ├── assessment/
│   │   │   ├── page.tsx                       # S2: Multi-step assessment wizard (Steps 1-5 + preload)
│   │   │   └── results/[id]/page.tsx          # S3/S4: Truthful processing & Results dashboard
│   │   ├── reports/[id]/page.tsx              # S5/S6: Full web report preview & print view
│   │   └── api/
│   │       ├── assessments/route.ts           # POST /api/assessments (create assessment)
│   │       ├── assessments/[id]/route.ts      # GET /api/assessments/:id (fetch assessment)
│   │       ├── assessments/[id]/analyze/route.ts # POST /api/assessments/:id/analyze (matching & report)
│   │       ├── assessments/[id]/report/route.ts  # GET /api/assessments/:id/report (PDF download)
│   │       ├── capabilities/route.ts          # GET /api/capabilities (reviewed knowledge base)
│   │       └── scenarios/route.ts             # GET /api/scenarios (predefined test scenarios)
│   ├── components/
│   │   └── layout/
│   │       ├── Navbar.tsx                     # Top navigation with status badge
│   │       └── Footer.tsx                     # Links to official documentation and methodology
│   ├── data/
│   │   ├── capabilities.json                  # 12 reviewed official IOMETE capabilities with URLs
│   │   └── sample-scenarios.json              # 6 predefined test scenarios (A through F)
│   ├── lib/
│   │   ├── ai/provider.ts                     # Server AI adapter with deterministic fallback
│   │   ├── db/connection.ts                   # MongoDB connection with in-memory fallback
│   │   ├── db/in-memory-store.ts              # Demo store singleton
│   │   ├── evidence/verification.ts           # Evidence auditing and accuracy rules
│   │   ├── matching/engine.ts                 # Deterministic MatchingEngine class
│   │   ├── matching/rules.ts                  # Normalization rules and conflict detector
│   │   ├── pdf/generate-report.ts             # Server-side PDF generation
│   │   └── validation/assessment-schema.ts    # Zod schemas for request validation
│   ├── models/
│   │   ├── Assessment.ts                      # Mongoose Assessment model
│   │   └── Report.ts                          # Mongoose Report model
│   └── types/
│       ├── assessment.ts                      # TypeScript assessment contracts
│       ├── capability.ts                      # TypeScript capability contracts
│       └── report.ts                          # TypeScript report contracts
├── tests/
│   ├── unit/matching-engine.test.ts           # Unit tests for matching, normalization, and PDF
│   └── integration/api-workflow.test.ts       # Integration tests for end-to-end evaluation
├── IMPLEMENTATION_STATUS.md                   # Formal implementation verification report
├── .env.example                               # Environment template with placeholders
├── package.json                               # Dependencies and scripts
└── tsconfig.json                              # TypeScript configuration
```

---

## 5. Getting Started

### Prerequisites

- Node.js (v18+ or v20+, tested on Node v24)
- npm (v9+)

### 1. Installation

```bash
git clone <repository-url>
cd LAKEHOUSEFIT-AI---IOMETE
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Required? | Purpose |
|---|---|---|
| `MONGODB_URI` | Optional | MongoDB connection string. If unset, runs in Demo Mode with in-memory store. |
| `AI_PROVIDER` | Optional | Set to `gemini` or `openai` for AI phrasing enhancements. |
| `AI_API_KEY` | Optional | Server-side API key for the chosen AI provider. |
| `AI_MODEL` | Optional | Model identifier (defaults to `gemini-1.5-flash` or `gpt-4o-mini`). |
| `NEXT_PUBLIC_APP_URL` | Optional | Application origin (defaults to `http://localhost:3000`). |

> **Resilience Note:** The core workflow, deterministic matching engine, and PDF export operate with 100% functionality **without any database or AI keys configured**.

### 3. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Verification and Testing

### Run Automated Tests

```bash
npm test
```
Executes all unit and integration tests using Vitest (verifies requirement normalization, capability matching, evidence auditing, conflict detection, unknown question handling, and PDF generation).

### Run Type Checking

```bash
npm run typecheck
```
Executes `tsc --noEmit` to verify 100% TypeScript type safety.

### Run Linting

```bash
npm run lint
```
Executes Next.js ESLint to verify code quality.

### Build for Production

```bash
npm run build
```
Creates an optimized production bundle verifying all 8 static and dynamic routes.

---

## 7. Pre-Configured Test Scenarios (PRD Section 13.1)

LakehouseFit AI includes 6 pre-configured scenarios accessible from the landing page and assessment wizard:

1. **Scenario A (Sovereign Infrastructure):** Fictional regional bank evaluating customer-controlled Kubernetes deployment in a private AWS VPC with Apache Ranger row/column security.
2. **Scenario B (Scaling SQL Analytics):** Omnichannel retailer migrating to isolated virtual lakehouses and automated Iceberg table compaction.
3. **Scenario C (Incomplete Requirements):** Early-stage logistics company with vague specifications; demonstrates how the engine identifies missing parameters without making assumptions.
4. **Scenario D (Unsupported Compliance / FedRAMP Unknown Test):** Healthcare entity probing formal FedRAMP High certification and out-of-the-box vendor HIPAA BAA; demonstrates that unverified claims correctly return `Needs Validation` / `Unknown`.
5. **Scenario E (Conflict Recovery):** Contradictory inputs (air-gapped on-premise with zero server administration SaaS); triggers architectural conflict detection.
6. **Scenario F (Deterministic Fallback):** Telecom evaluation verifying 100% operation under zero external AI/API dependencies.

---

## 8. Limitations & Product Boundaries

- **Decision Support Only:** LakehouseFit AI provides objective guidance based on curated official documentation; it is not a formal certification of software compatibility or contractual SLA.
- **Environment Dependencies:** Performance benchmarks, cluster cold-start latency, and network throughput depend on customer Kubernetes cluster sizing and cloud infrastructure.
- **Total Cost of Ownership (TCO):** Speculative dollar ROI or blanket cost savings are not promised. True cost reduction must be validated during a technical Proof of Concept (PoC).

---

## 9. License

This project was built for the **hackCBS — IOMETE Track**. All documentation references and links cite official public documentation from [iomete.com](https://iomete.com).
