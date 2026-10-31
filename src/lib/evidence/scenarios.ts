import sampleScenariosRaw from "@/data/sample-scenarios.json";
import { AssessmentSubmissionInput } from "@/lib/validation/assessment-schema";

export interface SampleScenario {
  id: string;
  name: string;
  subtitle: string;
  isFictionalSample: boolean;
  description: string;
  input: AssessmentSubmissionInput;
  expectedBehavior?: {
    keyFindings: string[];
    expectedStatusDistribution: string;
  };
}

export const sampleScenarios = sampleScenariosRaw as SampleScenario[];

export function getSampleScenario(id: string): SampleScenario | undefined {
  return sampleScenarios.find(s => s.id === id);
}

export function isSampleScenario(id: string): boolean {
  return sampleScenarios.some(s => s.id === id);
}

export function getAllSampleScenarios(): SampleScenario[] {
  return sampleScenarios;
}

