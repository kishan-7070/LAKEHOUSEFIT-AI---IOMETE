import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "lakehousefit-ai-production-jwt-secret-key-32chars";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export interface AuthTokenPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  company?: string;
  avatar?: string | null;
}

export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
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
