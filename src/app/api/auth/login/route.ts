import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connection";
import { UserModel } from "@/models/User";
import { signAuthToken } from "@/lib/auth/jwt";
import { inMemoryStore } from "@/lib/db/in-memory-store";

const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address").max(100),
  password: z.string().min(1, "Please enter your password").max(72),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = LoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email and password." },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const dbStatus = await connectToDatabase();
    let userRecord: {
      id: string;
      email: string;
      name: string;
      passwordHash: string;
      role: string;
      company?: string;
      avatar?: string | null;
    } | null = null;

    if (dbStatus.isConnected) {
      try {
        const doc = await UserModel.findOne({ email: normalizedEmail }).lean();
        if (doc) {
          userRecord = doc as any;
        }
      } catch (err) {
        console.warn("MongoDB read failed in login:", (err as Error).message);
      }
    }

    // Fallback to in-memory store if DB is offline or user was registered in-memory
    if (!userRecord) {
      userRecord = inMemoryStore.getUserByEmail(normalizedEmail);
    }

    if (!userRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, userRecord.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Sign safe token (avatar is NOT stored in token cookie to keep size under 4KB)
    const token = await signAuthToken({
      userId: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role,
      company: userRecord.company,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: userRecord.id,
        userId: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        role: userRecord.role,
        company: userRecord.company,
        avatar: userRecord.avatar || null,
      },
      message: "Signed in successfully.",
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
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to complete sign in. Please try again." },
      { status: 500 }
    );
  }
}
