# LakehouseFit AI

> **From Data Challenges to Evidence-Backed Decisions.**  
> An evidence-backed buyer-readiness platform that helps enterprise data leaders, evaluators, and sales engineers evaluate whether IOMETE's data lakehouse architecture matches their business and technical requirements.

[![Live Production Demo](https://img.shields.io/badge/Live%20Demo-lakehousefit--ai--iomete.vercel.app-10b981?style=for-the-badge&logo=vercel)](https://lakehousefit-ai-iomete.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/kishan-7070/LAKEHOUSEFIT-AI---IOMETE)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![hackCBS IOMETE Track](https://img.shields.io/badge/hackCBS-IOMETE%20Track-047857?style=for-the-badge)](HACKATHON.md)

**Live Demo URL:** [https://lakehousefit-ai-iomete.vercel.app](https://lakehousefit-ai-iomete.vercel.app)  
**Repository:** [https://github.com/kishan-7070/LAKEHOUSEFIT-AI---IOMETE.git](https://github.com/kishan-7070/LAKEHOUSEFIT-AI---IOMETE.git)  
**Supporting Documentation:** [HACKATHON.md](HACKATHON.md) &middot; [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) &middot; [PRD Specification (PDF)](LakehouseFit_AI_Complete_Implementation_PRD.pdf)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              LakehouseFit AI Overview                                  │
│                                                                                        │
│  [ Organization Profile ]   [ Data Environment ]   [ Business & Technical Needs ]     │
│             │                        │                           │                     │
│             ▼                        ▼                           ▼                     │
│   ┌──────────────────────────────────────────────────────────────────────────────┐     │
│   │                 Deterministic Capability Matching Engine                     │     │
│   │           Evaluates against 31 Curated Official IOMETE Capabilities          │     │
│   └──────────────────────────────────────────────────────────────────────────────┘     │
│             │                                    │                        │            │
│             ▼                                    ▼                        ▼            │
│     ✓ Supported Criteria                ! Needs Validation        ? Unknown Gaps       │
│  (Source-backed citations)            (Targeted questions)     (No ungrounded claims)  │
│             │                                    │                        │            │
│             └────────────────────────────────────┴────────────────────────┘            │
│                                                  │                                     │
│                                                  ▼                                     │
│                     [ Audit-Ready Paginated PDF & Buyer Dashboard ]                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Executive Summary

Enterprise data platforms involve complex architectural concepts: open table formats (Apache Iceberg), decoupled query engines, distributed catalog synchronization, role-based access control, and sovereign cloud deployments. 

Prospective buyers often face weeks of repetitive discovery meetings, ambiguous vendor claims, and research fatigue. **LakehouseFit AI** converts this unstructured research into an **auditable, repeatable evaluation workflow**:

1. **Guided Requirement Collection:** Captures organization profile, current data infrastructure, business challenges, and operational constraints.
2. **Deterministic Matching Engine:** Evaluates requirements against a curated knowledge base of **31 reviewed IOMETE capabilities** (Sr. No. 1 to 31) derived from official `iomete.com/docs`.
3. **Evidence-Backed Findings:** Assigns standardized requirement-level statuses:
   - **`Supported`**: Backed by reviewed official documentation, with verified excerpts and clickable source links.
   - **`Needs Validation`**: Partially documented or environment-dependent; generates targeted discovery questions.
   - **`Unknown`**: Explicitly flags capabilities not documented in official sources (e.g., specific vendor certifications or SLAs) to avoid ungrounded marketing claims.
4. **Actionable Buyer Report:** Produces an executive readiness report with a technical validation checklist, conflict alerts, and a downloadable, paginated PDF report.

> **Hackathon Alignment:** Built for the **hackCBS — IOMETE Track**. For detailed scoring alignment across Practical Impact (35%), Buyer Clarity (25%), Accuracy (25%), and Working Execution (15%), please refer to [HACKATHON.md](HACKATHON.md).

---

## 2. Key Capabilities & Architecture

- **31 Curated IOMETE Capabilities (Sr. No. 1 to 31):** Every capability in the knowledge base is verified against official documentation at `iomete.com/docs`, including Kubernetes Helm charts, Apache Iceberg REST catalog, isolated virtual lakehouses, Apache Ranger security, and dbt/BI integrations.
- **Deterministic-First Processing:** The core matching algorithm operates deterministically without relying on probabilistic third-party LLMs. Unverified inputs are explicitly flagged as `Unknown`.
- **Architectural Conflict Recovery:** Detects contradictory requirements (e.g., air-gapped on-premises combined with zero server administration SaaS) and presents actionable resolution guidance.
- **Enterprise Authentication:** Secure authentication built with `jose` (JWT) and `bcryptjs` password hashing. Users manage their personal workspace, save assessments, update their profile, and upload custom avatars. *(Note: One-click demo login is disabled in production).*
- **Public Scenario Access:** All 6 predefined evaluation scenarios (A through F) are accessible to public reviewers and judges from the landing page without requiring account registration.
- **Audit-Ready PDF Export:** Client and server-side multi-page PDF generation via `jspdf`, including executive summary, status distribution breakdown, and hyperlinked documentation citations.

---

## 3. Technology Stack

- **Framework:** Next.js 14 App Router (React 18, TypeScript with strict type checking)
- **Styling:** Tailwind CSS with enterprise color palette and mobile-responsive layout
- **Validation:** Zod schemas shared across client and server
- **Database:** MongoDB Atlas via Mongoose (with thread-safe in-memory storage fallback)
- **Authentication:** HS256 JWT cookies via `jose` and password hashing via `bcryptjs`
- **PDF Generation:** `jspdf` multi-page paginated reports
- **Testing:** Vitest for unit and integration testing
- **AI Enhancement (Optional):** Provider abstraction (Google Gemini / OpenAI) for phrasing enhancements, strictly bounded by retrieved evidence

---

## 4. Repository Structure

```text
LAKEHOUSEFIT-AI---IOMETE/
├── src/
│   ├── app/
│   │   ├── page.tsx                           # Landing page with workflow & 31 capabilities
│   │   ├── layout.tsx                         # Root layout with responsive Navbar and Footer
│   │   ├── globals.css                        # Tailwind global design tokens
│   │   ├── assessment/
│   │   │   ├── page.tsx                       # 5-step guided assessment wizard (auth-protected)
│   │   │   └── results/[id]/page.tsx          # Evidence findings & readiness dashboard
│   │   ├── auth/
│   │   │   ├── login/page.tsx                 # Clean email/password sign-in
│   │   │   └── register/page.tsx              # Account registration with role selection
│   │   ├── dashboard/page.tsx                 # User workspace for saved evaluations & reports
│   │   ├── profile/page.tsx                   # User profile management with image upload
│   │   └── api/
│   │       ├── assessments/route.ts           # POST /api/assessments & GET /api/assessments
│   │       ├── assessments/[id]/analyze/      # Deterministic evaluation & report generation
│   │       ├── assessments/[id]/report/       # Paginated PDF generation endpoint
│   │       ├── auth/                          # Authentication routes (login, register, me, profile)
│   │       ├── capabilities/route.ts          # 31 curated official capabilities endpoint
│   │       └── scenarios/route.ts             # 6 predefined test scenarios endpoint
│   ├── components/layout/
│   │   ├── Navbar.tsx                         # Top header with profile dropdown & auth triggers
│   │   └── Footer.tsx                         # Links to official documentation and methodology
│   ├── data/
│   │   ├── capabilities.json                  # 31 reviewed IOMETE capabilities (Sr. No. 1 to 31)
│   │   └── sample-scenarios.json              # 6 pre-configured evaluation test scenarios
│   ├── lib/
│   │   ├── auth/jwt.ts                        # JWT signing and session verification
│   │   ├── db/connection.ts                   # MongoDB connection with DNS server resilience
│   │   ├── db/in-memory-store.ts              # In-memory storage fallback
│   │   ├── matching/engine.ts                 # Deterministic capability matching engine
│   │   ├── matching/rules.ts                  # Requirement normalization & conflict detector
│   │   └── pdf/generate-report.ts             # Server-side PDF generation
│   ├── models/                                # Mongoose models (User, Assessment, Report)
│   └── types/                                 # Shared TypeScript interfaces & contracts
├── tests/
│   ├── unit/matching-engine.test.ts           # Engine matching, normalization, and scoring tests
│   ├── unit/auth.test.ts                      # JWT session signing & verification tests
│   └── integration/api-workflow.test.ts       # End-to-end API evaluation flow tests
├── .env.example                               # Environment template with documented variables
├── HACKATHON.md                               # hackCBS judging criteria & demo script
├── IMPLEMENTATION_STATUS.md                   # Formal implementation verification report
├── LakehouseFit_AI_Complete_Implementation_PRD.pdf # Official PRD specification document
├── LICENSE                                    # MIT License
└── package.json                               # Dependencies and npm scripts
```

---

## 5. Getting Started

### Prerequisites

- **Node.js:** v18.17+ or v20+ (tested on Node.js v20 and v24)
- **npm:** v9+
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/kishan-7070/LAKEHOUSEFIT-AI---IOMETE.git
cd LAKEHOUSEFIT-AI---IOMETE
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the template file to `.env.local`:

```bash
cp .env.example .env.local
```

Configure your environment variables as described below:

| Variable | Required? | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | Recommended | *(none)* | MongoDB Atlas connection string. Required for persistent storage across restarts. |
| `JWT_SECRET` | **Required in Prod** | `lakehousefit-ai-...` | 32+ character secret key used by `jose` to sign HS256 auth session tokens. |
| `AI_PROVIDER` | Optional | *(none)* | Set to `gemini` or `openai` for optional AI phrasing enhancements. |
| `AI_API_KEY` | Optional | *(none)* | API key for the chosen AI provider. |
| `AI_MODEL` | Optional | `gemini-1.5-flash` | Model identifier for AI phrasing. |
| `NEXT_PUBLIC_APP_URL` | Optional | `http://localhost:3000` | Application base URL for metadata. |

> [!IMPORTANT]
> **In-Memory Fallback Notice:** If `MONGODB_URI` is omitted, the application will run in Demo Mode using an in-memory storage fallback. In this mode, newly created assessments, custom reports, and registered user accounts are kept in server memory and will reset when the server restarts or re-deploys. For production deployments with persistent data, configure a MongoDB Atlas connection string.

> [!NOTE]
> **Production Authentication:** One-click demo login is disabled in production. Users sign up via `/auth/register` with secure password hashing (`bcryptjs`) and maintain sessions via HTTP-only JWT cookies.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Verification and Testing

The codebase includes automated unit, integration, and linting tests:

### Automated Test Suite (Vitest)

```bash
npm test
```

Executes all 11 unit and integration tests verifying requirement normalization, deterministic matching, conflict detection, unknown query handling, JWT authentication, and PDF generation.

### Strict TypeScript Checking

```bash
npm run typecheck
```

Runs `tsc --noEmit` to verify type safety across all components, API routes, and database models.

### ESLint Code Quality

```bash
npm run lint
```

Validates code formatting and Next.js best practices.

### Production Build

```bash
npm run build
npm start
```

Compiles an optimized production build across all static and dynamic routes.

---

## 7. Pre-Configured Test Scenarios (PRD Section 13.1)

LakehouseFit AI implements 6 pre-configured evaluation scenarios accessible directly from the landing page:

1. **Scenario A (Sovereign Infrastructure):** Regional banking evaluator requiring customer-managed Kubernetes deployment in a private AWS VPC with Apache Ranger governance.
2. **Scenario B (Scaling SQL Analytics):** Omnichannel retailer migrating from a legacy data warehouse to isolated virtual lakehouses and automated Apache Iceberg compaction.
3. **Scenario C (Incomplete Requirements):** Early-stage logistics company with minimal specifications; demonstrates how the engine flags missing parameters without making assumptions.
4. **Scenario D (Unsupported Compliance / FedRAMP Unknown Test):** Healthcare entity probing formal FedRAMP High certification and out-of-the-box vendor HIPAA BAA; demonstrates that unverified claims correctly return `Needs Validation` / `Unknown`.
5. **Scenario E (Conflict Recovery):** Contradictory inputs (air-gapped on-premises combined with zero server administration SaaS); triggers architectural conflict detection.
6. **Scenario F (Deterministic Core):** Telecommunications evaluation verifying complete deterministic execution under zero external AI/API dependencies.

---

## 8. Public Deployment & Reviewer Access

- **Production URL:** [https://lakehousefit-ai-iomete.vercel.app](https://lakehousefit-ai-iomete.vercel.app)
- **Public Accessibility:**
  - The landing page (`/`) and all 6 sample scenario reports (`/assessment/results/scenario-a` through `scenario-f`) are **100% publicly accessible** without requiring any account login. Reviewers and judges can inspect findings, view citations, and download PDF reports immediately.
  - Creating a custom evaluation wizard flow (`/assessment`) or accessing the saved dashboard (`/dashboard`) requires creating a free evaluator account via `/auth/register` or logging in.
- **Vercel Deployment Protection Note:** If deploying preview branches on Vercel team plans, ensure that **Vercel Authentication** is toggled off in *Project Settings &rarr; Deployment Protection* so external judges can access preview URLs without being blocked by Vercel team login screens.

---

## 9. Product Boundaries & Methodology Disclaimers

- **Objective Decision Support:** LakehouseFit AI provides structured decision support based on reviewed official documentation. It is not an automated procurement decision or contractual warranty.
- **Target Environment Validation:** Specific performance metrics, query latency, and cold-start times depend on customer cloud infrastructure, node instance types, and data distribution.
- **Proof of Concept Recommended:** Requirements marked `Needs Validation` or `Unknown` should be reviewed during a guided Proof of Concept (PoC) with the IOMETE solutions team.

---

## 10. License & Documentation References

This project is open-source software licensed under the **[MIT License](LICENSE)**.

All documentation excerpts and citations reference official public documentation from [iomete.com](https://iomete.com):
- [IOMETE Deployment and Helm Architecture](https://iomete.com/docs/deployment)
- [IOMETE Virtual Lakehouses & Apache Iceberg](https://iomete.com/docs/user-guide/virtual-lakehouses)
- [IOMETE Apache Ranger Security & Governance](https://iomete.com/docs/data-security/overview)
- [IOMETE Spark Job Orchestration](https://iomete.com/docs/user-guide/spark-jobs)
