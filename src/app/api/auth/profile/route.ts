import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, signAuthToken } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/connection";
import { UserModel } from "@/models/User";

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
    if (typeof name === "string" && name.trim()) updateFields.name = name.trim();
    if (typeof company === "string") updateFields.company = company.trim();
    if (typeof role === "string") updateFields.role = role.trim();
    if (avatar !== undefined) updateFields.avatar = avatar; // string data URI or null

    await connectToDatabase();

    const updatedUser = (await UserModel.findOneAndUpdate(
      { id: tokenUser.userId },
      { $set: updateFields },
      { new: true }
    ).lean()) as any;

    const finalName = updatedUser?.name || updateFields.name || tokenUser.name;
    const finalRole = updatedUser?.role || updateFields.role || tokenUser.role;
    const finalCompany = updatedUser?.company ?? updateFields.company ?? tokenUser.company;
    const finalAvatar = updatedUser?.avatar ?? updateFields.avatar ?? tokenUser.avatar ?? null;

    // Sign fresh token with updated info
    const newToken = await signAuthToken({
      userId: tokenUser.userId,
      email: tokenUser.email,
      name: finalName,
      role: finalRole,
      company: finalCompany,
      avatar: finalAvatar,
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
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
