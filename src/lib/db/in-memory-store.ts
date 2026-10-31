import { Assessment } from "@/types/assessment";
import { Report } from "@/types/report";
import sampleScenarios from "@/data/sample-scenarios.json";

export interface InMemoryUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  company?: string;
  avatar?: string | null;
  createdAt: string;
}

class InMemoryStore {
  private assessments: Map<string, Assessment> = new Map();
  private reports: Map<string, Report> = new Map();
  private reportsByAssessmentId: Map<string, string> = new Map();
  private users: Map<string, InMemoryUser> = new Map();
  private usersByEmail: Map<string, string> = new Map();

  constructor() {
    this.seedSampleScenarios();
  }

  private seedSampleScenarios() {
    for (const scenario of sampleScenarios) {
      const assessment: Assessment = {
        id: scenario.id,
        ownerId: null, // Public sample scenarios have no owner restriction
        organization: scenario.input.organization,
        environment: scenario.input.environment,
        requirements: [
          ...scenario.input.selectedChallenges.map((c: string, idx: number) => ({
            id: `req-${idx + 1}`,
            category: "general",
            description: c,
            priority: "high" as const,
            source: "structured_input" as const,
            rawInput: c,
          })),
        ],
        status: "completed",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.assessments.set(scenario.id, assessment);
    }
  }

  // --- Assessments ---
  public saveAssessment(assessment: Assessment): Assessment {
    assessment.updatedAt = new Date().toISOString();
    this.assessments.set(assessment.id, assessment);
    return assessment;
  }

  public getAssessment(id: string): Assessment | null {
    return this.assessments.get(id) || null;
  }

  public listAssessments(ownerId?: string | null): Assessment[] {
    const all = Array.from(this.assessments.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (ownerId) {
      return all.filter(a => a.ownerId === ownerId);
    }
    return all;
  }

  public deleteAssessment(id: string): boolean {
    const reportId = this.reportsByAssessmentId.get(id);
    if (reportId) {
      this.reports.delete(reportId);
      this.reportsByAssessmentId.delete(id);
    }
    return this.assessments.delete(id);
  }

  // --- Reports ---
  public saveReport(report: Report): Report {
    this.reports.set(report.id, report);
    this.reportsByAssessmentId.set(report.assessmentId, report.id);
    return report;
  }

  public getReport(id: string): Report | null {
    return this.reports.get(id) || null;
  }

  public getReportByAssessmentId(assessmentId: string): Report | null {
    const reportId = this.reportsByAssessmentId.get(assessmentId);
    if (!reportId) return null;
    return this.reports.get(reportId) || null;
  }

  public listReports(): Report[] {
    return Array.from(this.reports.values()).sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  }

  // --- Users ---
  public saveUser(user: InMemoryUser): InMemoryUser {
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email.toLowerCase(), user.id);
    return user;
  }

  public getUserById(id: string): InMemoryUser | null {
    return this.users.get(id) || null;
  }

  public getUserByEmail(email: string): InMemoryUser | null {
    const id = this.usersByEmail.get(email.toLowerCase());
    if (!id) return null;
    return this.users.get(id) || null;
  }

  public updateUser(id: string, updates: Partial<InMemoryUser>): InMemoryUser | null {
    const user = this.users.get(id);
    if (!user) return null;
    const updated: InMemoryUser = { ...user, ...updates };
    this.users.set(id, updated);
    if (updates.email) {
      this.usersByEmail.set(updates.email.toLowerCase(), id);
    }
    return updated;
  }

  public clearAll() {
    this.assessments.clear();
    this.reports.clear();
    this.reportsByAssessmentId.clear();
    this.users.clear();
    this.usersByEmail.clear();
    this.seedSampleScenarios();
  }
}

// Global singleton for in-memory persistence in development and demo mode
declare global {
  // eslint-disable-next-line no-var
  var __lakehouseFitStore: InMemoryStore | undefined;
}

export const inMemoryStore: InMemoryStore =
  global.__lakehouseFitStore || (global.__lakehouseFitStore = new InMemoryStore());
