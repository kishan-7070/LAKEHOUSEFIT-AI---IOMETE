import mongoose, { Schema, Document } from "mongoose";

export interface IUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: "it_decision_maker" | "data_engineering_lead" | "enterprise_buyer" | "security_officer" | "sales_representative";
  company?: string;
  avatar?: string | null;
  createdAt: string;
}

export interface UserDocument extends Omit<IUser, "id">, Document {
  id: string;
}

const UserSchema = new Schema<UserDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["it_decision_maker", "data_engineering_lead", "enterprise_buyer", "security_officer", "sales_representative"],
      default: "it_decision_maker",
    },
    company: { type: String, default: "" },
    avatar: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);
