import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, signAuthToken } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/connection";
import { UserModel } from "@/models/User";
import { inMemoryStore } from "@/lib/db/in-memory-store";

export async function PATCH(req: NextRequest) {
  try {
    const tokenUser = await getUserFromRequest(req);
    if (!tokenUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, company, role, avatar } = body;

    const updateFields: Record<string, any> = {};
    if (typeof name === "string" && name.trim()) {
      updateFields.name = name.trim().slice(0, 100);
    }
    if (typeof company === "string") {
      updateFields.company = company.trim().slice(0, 100);
    }
    if (typeof role === "string") {
      updateFields.role = role.trim().slice(0, 100);
    }

    // Avatar validation & size cap to prevent cookie or storage exhaustion
    if (avatar !== undefined) {
      if (avatar === null || avatar === "") {
        updateFields.avatar = null;
      } else if (typeof avatar === "string") {
        if (avatar.length > 2 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, error: "Profile image is too large. Maximum size is 1.5MB." },
            { status: 400 }
          );
        }
        if (!avatar.startsWith("data:image/") && !avatar.startsWith("https://")) {
          return NextResponse.json(
            { success: false, error: "Invalid image format. Must be an image data URI or URL." },
            { status: 400 }
          );
        }
        updateFields.avatar = avatar;
      }
    }

    const dbStatus = await connectToDatabase();
    let finalUser: any = null;

    if (dbStatus.isConnected) {
      try {
        finalUser = (await UserModel.findOneAndUpdate(
          { id: tokenUser.userId },
          { $set: updateFields },
          { new: true }
        ).lean()) as any;
      } catch (dbErr) {
        console.warn("MongoDB update error in profile:", (dbErr as Error).message);
      }
    }

    // Fallback or sync in-memory store
    const inMemUpdated = inMemoryStore.updateUser(tokenUser.userId, updateFields);
    if (!finalUser) {
      finalUser = inMemUpdated;
    }

    const finalName = finalUser?.name || updateFields.name || tokenUser.name;
    const finalRole = finalUser?.role || updateFields.role || tokenUser.role;
    const finalCompany = finalUser?.company ?? updateFields.company ?? tokenUser.company ?? "";
    const finalAvatar = finalUser?.avatar ?? updateFields.avatar ?? null;

    // Sign safe token (avatar is omitted from the JWT cookie to prevent exceeding 4KB browser cookie limit)
    const newToken = await signAuthToken({
      userId: tokenUser.userId,
      email: tokenUser.email,
      name: finalName,
      role: finalRole,
      company: finalCompany,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        userId: tokenUser.userId,
        id: tokenUser.userId,
        email: tokenUser.email,
        name: finalName,
        role: finalRole,
        company: finalCompany,
        avatar: finalAvatar,
      },
      message: "Profile updated successfully.",
    });

    response.cookies.set("lakehousefit_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("PATCH /api/auth/profile error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update profile. Please try again." },
      { status: 500 }
    );
  }
}
