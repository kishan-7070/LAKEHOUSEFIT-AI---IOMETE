import { NextResponse } from "next/server";
import { getAllCapabilities } from "@/lib/evidence/verification";

export async function GET() {
  try {
    const capabilities = getAllCapabilities();
    return NextResponse.json({
      success: true,
      count: capabilities.length,
      capabilities,
      sourceDomain: "iomete.com/docs",
      reviewedDate: "2024-10-31",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

