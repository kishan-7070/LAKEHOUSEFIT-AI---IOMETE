import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export interface AuthTokenPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  company?: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret.length < 32) {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET environment variable is missing or shorter than 32 characters in production."
      );
    }
    return new TextEncoder().encode(secret);
  }
  // In development, warn if unset
  if (!secret) {
    console.warn("SECURITY WARNING: JWT_SECRET is not set in development. Using a local development fallback.");
  }
  return new TextEncoder().encode(secret || "lakehousefit-ai-dev-local-secret-32chars-min-length");
}

export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
  // Explicitly sanitize token payload so large fields like base64 avatars never enter cookies
  const safePayload: AuthTokenPayload = {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    company: payload.company || "",
  };

  const secret = getSecretKey();
  return await new SignJWT({ ...safePayload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AuthTokenPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<AuthTokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("lakehousefit_token")?.value;
  if (!token) return null;
  return await verifyAuthToken(token);
}

export async function getUserFromRequest(req: NextRequest): Promise<AuthTokenPayload | null> {
  const token = req.cookies.get("lakehousefit_token")?.value;
  if (token) return await verifyAuthToken(token);

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return await verifyAuthToken(authHeader.substring(7));
  }
  return null;
}
