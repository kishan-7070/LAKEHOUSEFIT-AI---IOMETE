import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connection";
import { UserModel } from "@/models/User";
import { signAuthToken } from "@/lib/auth/jwt";
import { inMemoryStore } from "@/lib/db/in-memory-store";

const RegisterSchema = z.object({
  email: z.string().email("Invalid email address").max(100, "Email must be under 100 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password must be at most 72 characters (bcrypt limit)"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be under 100 characters"),
  role: z
    .enum(["it_decision_maker", "data_engineering_lead", "enterprise_buyer", "security_officer", "sales_representative"])
    .default("it_decision_maker"),
  company: z.string().max(100, "Company must be under 100 characters").optional().default(""),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = RegisterSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message || "Validation error. Please verify your details.";
      return NextResponse.json(
        { success: false, error: firstError, details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, name, role, company } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const dbStatus = await connectToDatabase();
    let userExists = false;

    if (dbStatus.isConnected) {
      try {
        const existing = await UserModel.findOne({ email: normalizedEmail });
        if (existing) userExists = true;
      } catch (err) {
        console.warn("MongoDB check failed in register:", (err as Error).message);
      }
    } else {
      const existingInMem = inMemoryStore.getUserByEmail(normalizedEmail);
      if (existingInMem) userExists = true;
    }

    if (userExists) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `usr-${crypto.randomUUID()}`;

    const newUser = {
      id: userId,
      email: normalizedEmail,
      name,
      passwordHash,
      role,
      company: company || "",
      avatar: null,
      createdAt: new Date().toISOString(),
    };

    // Save in memory store
    inMemoryStore.saveUser(newUser);

    // Save in MongoDB if connected (non-blocking for instant registration response)
    if (dbStatus.isConnected) {
      UserModel.create(newUser).catch(dbErr => {
        console.warn("MongoDB write error during register; persisted in-memory:", (dbErr as Error).message);
      });
    }

    // Sign safe token (avatar is NOT stored in the token cookie to prevent exceeding 4KB cookie limit)
    const token = await signAuthToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      company: newUser.company,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        company: newUser.company,
        avatar: null,
      },
      message: "Account created successfully.",
    });

    response.cookies.set("lakehousefit_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || "An unexpected error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}
