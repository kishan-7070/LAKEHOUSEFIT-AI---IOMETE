import mongoose, { Schema, Document } from "mongoose";
import { Report as IReport } from "@/types/report";

export interface ReportDocument extends Omit<IReport, "id">, Document {
  id: string;
}

const ReportSchema = new Schema<ReportDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    assessmentId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    organizationName: { type: String, required: true },
    executiveSummary: { type: String, required: true },
    scopeSummary: { type: String, required: true },
    findings: [
      {
        requirementId: { type: String, required: true },
        category: { type: String, required: true },
        requirementDescription: { type: String, required: true },
        priority: { type: String, enum: ["high", "medium", "low"] },
        status: { type: String, enum: ["supported", "needs_validation", "unknown"], required: true },
        relevantCapabilityIds: [{ type: String }],
        explanation: { type: String, required: true },
        evidenceReferences: [{ type: String }],
        unresolvedQuestions: [{ type: String }],
        limitations: [{ type: String }],
      },
    ],
    recommendedNextSteps: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        relatedRequirementIds: [{ type: String }],
        suggestedActionType: {
          type: String,
          enum: ["document_review", "vendor_question", "poc_test", "architecture_review"],
          default: "document_review",
        },
      },
    ],
    limitations: [{ type: String }],
    methodologyNotes: [{ type: String }],
    isAiEnhanced: { type: Boolean, default: false },
    generatedAt: { type: String, required: true },
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

export const ReportModel =
  mongoose.models.Report || mongoose.model<ReportDocument>("Report", ReportSchema);

