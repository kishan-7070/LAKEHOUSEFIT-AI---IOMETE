import mongoose, { Schema, Document } from "mongoose";
import { Assessment as IAssessment } from "@/types/assessment";

export interface AssessmentDocument extends Omit<IAssessment, "id">, Document {
  id: string;
}

const AssessmentSchema = new Schema<AssessmentDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    organization: {
      industry: { type: String },
      companySize: { type: String },
      userRole: { type: String },
      companyName: { type: String, default: null },
      assessmentGoal: { type: String },
    },
    environment: {
      deployment: { type: String },
      dataSources: [{ type: String }],
      analyticsTools: [{ type: String }],
      dataVolume: { type: String, default: null },
      processingApproach: { type: String, default: null },
    },
    requirements: [
      {
        id: { type: String, required: true },
        category: { type: String, required: true },
        description: { type: String, required: true },
        priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
        source: { type: String, enum: ["structured_input", "user_text"], default: "structured_input" },
        rawInput: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ["draft", "processing", "completed", "failed"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

export const AssessmentModel =
  mongoose.models.Assessment ||
  mongoose.model<AssessmentDocument>("Assessment", AssessmentSchema);

