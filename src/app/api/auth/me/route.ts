import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/connection";
import { UserModel } from "@/models/User";
import { inMemoryStore } from "@/lib/db/in-memory-store";

export async function GET(req: NextRequest) {
  const tokenUser = await getUserFromRequest(req);
  if (!tokenUser) {
    return NextResponse.json({
      success: false,
      user: null,
    });
  }

  try {
    const dbStatus = await connectToDatabase();
    if (dbStatus.isConnected) {
      const dbUser = (await UserModel.findOne({ id: tokenUser.userId }).lean()) as any;
      if (dbUser) {
        return NextResponse.json({
          success: true,
          user: {
            userId: dbUser.id,
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
            company: dbUser.company,
            avatar: dbUser.avatar || null,
          },
        });
      }
    }

    // Fallback to in-memory store
    const inMemUser = inMemoryStore.getUserById(tokenUser.userId);
    if (inMemUser) {
      return NextResponse.json({
        success: true,
        user: {
          userId: inMemUser.id,
          id: inMemUser.id,
          email: inMemUser.email,
          name: inMemUser.name,
          role: inMemUser.role,
          company: inMemUser.company,
          avatar: inMemUser.avatar || null,
        },
      });
    }
  } catch (err) {
    console.warn("Could not fetch user in /api/auth/me:", (err as Error).message);
  }

  return NextResponse.json({
    success: true,
    user: {
      ...tokenUser,
      id: tokenUser.userId,
      avatar: null,
    },
  });
}
