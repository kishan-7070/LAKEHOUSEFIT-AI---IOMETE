import { NextResponse } from "next/server";
import sampleScenarios from "@/data/sample-scenarios.json";

export async function GET() {
  return NextResponse.json({
    success: true,
    scenarios: sampleScenarios,
    notice: "These scenarios use clearly labelled fictional company data designed for automated evaluation and live demonstration.",
  });
}

