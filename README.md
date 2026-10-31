LakehouseFit AI
> **Evidence-backed buyer-readiness assessment for evaluating IOMETE against business and technical requirements.**
LakehouseFit AI helps technology buyers turn their data-platform requirements into a structured assessment: potentially relevant documented capabilities, evidence links, unknowns, validation questions, and recommended next steps.
> **Project status:** Implementation/demo project. Verify all IOMETE capability claims against current official documentation before relying on them for a real purchasing decision. This README describes the intended product and setup; only claim features are complete after they have been implemented and tested in your repository.
Table of contents
The problem
The solution
Key features
How it works
Technology stack
Getting started
Environment variables
Available scripts
Testing and quality checks
Project structure
Evidence and assessment methodology
Security and privacy
Deployment
Limitations
Roadmap
Contributing
License
The problem
Evaluating a data platform can involve scattered documentation, unclear technical requirements, and repeated discovery calls. Buyers need a clearer way to connect their needs to documented capabilities while identifying what still requires confirmation.
The solution
LakehouseFit AI provides a guided assessment workflow that organizes requirements and maps them to a curated capability knowledge base. The result is designed to help a buyer understand:
Which documented capabilities may be relevant to their requirements.
What evidence supports each finding.
Which requirements need further validation.
What information is still unknown.
What questions and next steps can help move the evaluation forward.
LakehouseFit AI is an assessment aid, not a guarantee of product compatibility or a replacement for technical due diligence.
Key features
The project specification covers the following functionality. Update this list to reflect what is actually implemented in your current repository.
Guided assessment: Capture the user's role, organization context, data environment, challenges, and technical requirements.
Requirement matching: Use deterministic, explainable rules to relate requirements to curated capability records.
Evidence-backed findings: Display source information, evidence status, limitations, and follow-up questions.
Clear assessment statuses: Distinguish `Supported`, `Needs validation`, and `Unknown`.
Results dashboard: Summarize findings, unresolved questions, risks, and suggested next steps.
PDF report: Generate a shareable report of the assessment and its evidence.
Optional AI explanations: Improve the readability of findings using a server-side AI provider, without allowing the model to invent evidence or determine verification status.
Sample scenarios: Use clearly labelled fictional scenarios for demonstrations and testing.
Graceful fallback: Keep the core assessment workflow usable when an optional AI provider is unavailable.
Responsive interface: Support desktop and mobile layouts with accessible form controls and error states.
How it works
The user completes the assessment wizard.
The application validates the submitted information.
Requirements are normalized into structured records.
The matching engine compares requirements with the curated capability knowledge base.
The application produces findings with evidence references, limitations, and unresolved questions.
The results page presents the assessment.
The user can generate a PDF report for review and follow-up.
A finding labelled `Supported` means that a reviewed source appears relevant to the stated requirement. It does not guarantee that IOMETE will satisfy every customer-specific constraint. Missing or inconclusive evidence should remain `Unknown` or `Needs validation`.
Technology stack
The planned stack is:
Framework: Next.js App Router
UI: React, TypeScript, Tailwind CSS
Server APIs: Next.js Route Handlers
Validation: Zod
Database: MongoDB with Mongoose or the official MongoDB driver
AI: Optional server-side provider integration
PDF: Server-side PDF generation library
Testing: Vitest and Playwright, or compatible alternatives
The actual versions and dependencies are defined by `package.json` and the lockfile in the repository.
Getting started
Prerequisites
Install the following before running the application:
Node.js version supported by the installed Next.js version.
npm (or the package manager indicated by the repository's lockfile).
MongoDB connection string if persistent database functionality is enabled.
An AI provider API key only if optional AI explanations have been implemented and you want to use them.
1. Clone the repository
Replace `<your-github-username>` with your GitHub username and `<repository-name>` with your repository name.
```bash
git clone https://github.com/<your-github-username>/<repository-name>.git
cd <repository-name>
```
2. Install dependencies
For npm projects:
```bash
npm install
```
If the repository contains `pnpm-lock.yaml`, `yarn.lock`, or `bun.lockb`/`bun.lock`, use the corresponding package manager instead of mixing package managers.
3. Configure environment variables
Create a local environment file:
```bash
cp .env.example .env.local
```
If `.env.example` does not exist yet, create it using the variable names documented below. Add real credentials only to `.env.local`, and never commit that file.
4. Start the development server
```bash
npm run dev
```
Open the local address printed in the terminal (commonly `http://localhost:3000`).
Environment variables
Only configure variables that are actually used by the implementation. Keep secrets on the server; never prefix secrets with `NEXT_PUBLIC_`.
Variable	Required?	Purpose
`MONGODB_URI`	Only if database persistence is enabled	MongoDB connection string
`AI_PROVIDER`	Optional	Identifier for the implemented AI provider
`AI_API_KEY`	Optional	Server-side API key for the selected AI provider
`AI_MODEL`	Optional	Model identifier supported by the selected provider
`NEXT_PUBLIC_APP_URL`	Deployment-dependent	Public application origin, if required
Example `.env.example`:
```dotenv
# Configure only if MongoDB persistence is implemented.
MONGODB_URI=

# Optional AI integration; keep secrets server-side.
AI_PROVIDER=
AI_API_KEY=
AI_MODEL=

# Optional public origin.
NEXT_PUBLIC_APP_URL=
```
Do not commit real credentials, tokens, private keys, or production connection strings. If a required variable is missing, the application should show a clear configuration error rather than pretending the integration succeeded.
Available scripts
Check the `scripts` section in `package.json` before running these commands. The exact scripts depend on the current implementation.
Common commands may include:
```bash
npm run dev       # Start development server
npm run lint      # Run lint checks, if configured
npm test          # Run tests, if configured
npm run build     # Create a production build
npm start         # Run the production server after building
```
For TypeScript projects, you can also run:
```bash
npx tsc --noEmit
```
Run Playwright tests only if Playwright and the required browsers are configured:
```bash
npx playwright test
```
Do not report a test or build as passing unless you have actually run it and confirmed the result.
Testing and quality checks
Before presenting a demo or deploying, verify the following:
[ ] The production build completes successfully.
[ ] Lint and TypeScript checks pass, if configured.
[ ] Matching rules have unit tests for all three assessment statuses.
[ ] Missing or inconclusive evidence cannot be marked `Supported`.
[ ] Invalid assessment inputs return helpful validation errors.
[ ] The assessment flow works from start to results.
[ ] Evidence links point to real, reviewed sources.
[ ] PDF generation works and long text does not get clipped.
[ ] The application handles missing database configuration clearly.
[ ] The main flow remains usable when optional AI is unavailable.
[ ] Mobile layout and keyboard navigation have been checked.
[ ] No credentials or `.env.local` file are committed.
Project structure
The structure below is a suggested layout. Your repository may differ depending on the implementation.
```text
src/
  app/
    page.tsx
    assessment/
      page.tsx
      results/[id]/
        page.tsx
    reports/[id]/
      page.tsx
    api/
      assessments/
      capabilities/
  components/
    assessment/
    results/
    evidence/
    reports/
    ui/
  lib/
    db/
    validation/
    matching/
    evidence/
    ai/
    pdf/
  models/
  data/
    capabilities.json
    sample-scenarios.json
  types/
tests/
  unit/
  integration/
  e2e/
```
Evidence and assessment methodology
LakehouseFit AI should prioritize accuracy over confident-sounding answers.
Supported: A reviewed source documents a capability relevant to the requirement. Customer-specific compatibility may still need confirmation.
Needs validation: Related evidence exists, but the exact configuration, integration, or requirement has not been established.
Unknown: Available reviewed evidence is insufficient to make a reliable claim. This does not prove that the product lacks the capability.
Every capability record should include a source title, actual source URL, review date, evidence status, and limitations. Verify all URLs and claims against official IOMETE documentation before using them in a real assessment. Do not invent citations, compliance claims, benchmarks, pricing, ROI, or compatibility guarantees.
Security and privacy
Keep database credentials and AI provider keys in server-only environment variables.
Validate API input on the server.
Avoid logging secrets or unnecessary personal/company data.
Treat user-entered free text as untrusted input.
Do not send confidential information to an AI provider unless it is necessary and authorized.
Apply access controls to stored assessments and reports.
Document data retention and deletion behavior based on the actual implementation.
Never claim that data is encrypted, private, or deleted unless those guarantees are implemented and verified.
Deployment
LakehouseFit AI is intended to be deployable on a platform that supports the chosen Next.js runtime. Vercel is one option, with MongoDB Atlas or another supported MongoDB deployment if persistence is enabled.
General deployment checklist:
Push the project to GitHub.
Import the repository into your chosen hosting provider.
Configure the environment variables required by the implementation.
Configure the production MongoDB database and network access, if used.
Run the production build.
Deploy and open the public URL.
Test the full assessment-to-PDF workflow in production.
Confirm that no secrets are exposed in client bundles or repository history.
Consult the official Next.js documentation and Vercel documentation for current deployment instructions.
Limitations
Assessment results depend on the quality and freshness of the curated evidence.
A relevant documented capability does not prove fit for every environment.
Unknown means evidence is insufficient; it does not mean a feature is absent.
AI-generated wording, if enabled, must not replace evidence verification.
Demo scenarios are fictional and must be labelled as such.
Actual availability of database persistence, PDF export, AI integration, and tests depends on the code implemented in the repository.
Roadmap
[ ] Complete the guided assessment workflow.
[ ] Curate and review official IOMETE capability sources.
[ ] Implement deterministic requirement matching and evidence statuses.
[ ] Complete results dashboard and PDF report generation.
[ ] Add unit, integration, and end-to-end tests.
[ ] Verify responsive UI and accessibility.
[ ] Configure production persistence and deployment.
[ ] Add optional grounded AI explanations after the core workflow is stable.
Contributing
Contributions are welcome.
Fork the repository.
Create a feature branch.
Make a focused change.
Run the relevant tests and checks.
Open a pull request describing the change and verification performed.
Please do not include credentials, private assessment data, or unverified product claims in pull requests.
License
No license has been selected yet. Unless a license is added to this repository, standard copyright restrictions apply. Add a `LICENSE` file before presenting the project as open source.
