import { AssessmentFinding } from "@/types/report";
import { AssessmentOrganization, AssessmentEnvironment } from "@/types/assessment";

export interface AiEnhancementResult {
  isAiEnhanced: boolean;
  executiveSummary: string;
  enhancedExplanations: Record<string, string>;
  providerName?: string;
  error?: string;
}

/**
 * Server-side AI provider adapter.
 * Uses structured prompts strictly grounded in retrieved evidence.
 * If credentials are missing, or if any network/timeout error occurs,
 * it returns a clean deterministic fallback result without throwing or breaking the workflow.
 */
export async function enhanceAssessmentWithAi(
  organization: AssessmentOrganization,
  environment: AssessmentEnvironment,
  findings: AssessmentFinding[],
  deterministicSummary: string
): Promise<AiEnhancementResult> {
  const provider = process.env.AI_PROVIDER?.toLowerCase().trim();
  const apiKey = process.env.AI_API_KEY?.trim();

  // If no AI key or provider is configured, return deterministic output immediately
  if (!apiKey || !provider) {
    return {
      isAiEnhanced: false,
      executiveSummary: deterministicSummary,
      enhancedExplanations: {},
      providerName: "deterministic_engine",
    };
  }

  // Provider-specific default models
  const rawModel = process.env.AI_MODEL?.trim();
  const geminiModel = provider === "gemini" 
    ? (rawModel && !rawModel.startsWith("gpt") ? rawModel : "gemini-3.5-flash-lite")
    : "";
  const openAiModel = provider === "openai"
    ? (rawModel && !rawModel.startsWith("gemini") ? rawModel : "gpt-4o-mini")
    : "";

  try {
    const orgName = organization.companyName || "Prospective Enterprise Buyer";
    const supportedList = findings
      .filter(f => f.status === "supported")
      .map(f => `- ${f.requirementDescription} (Supported by: ${f.evidenceReferences.join(", ")})`)
      .join("\n");
    const validationList = findings
      .filter(f => f.status === "needs_validation")
      .map(f => `- ${f.requirementDescription} (Requires validation; Questions: ${f.unresolvedQuestions.join("; ")})`)
      .join("\n");
    const unknownList = findings
      .filter(f => f.status === "unknown")
      .map(f => `- ${f.requirementDescription} (Unknown: no verified public evidence)`)
      .join("\n");

    const prompt = `
You are the LakehouseFit AI Executive Report Assistant.
Your task is to refine the executive summary for ${orgName}.

STRICT ACCURACY RULES:
1. You MUST NOT invent any IOMETE features, certifications, benchmarks, or cost savings.
2. Ground all statements ONLY in the provided findings:
Supported:
${supportedList || "None"}

Needs Validation:
${validationList || "None"}

Unknown (No evidence):
${unknownList || "None"}

Write a 2-3 paragraph plain-English executive summary for an IT decision-maker explaining what capabilities appear relevant, what requires technical validation, and what remains unknown.
Keep the tone objective, consultative, and evidence-focused.
`;

    // 1. Google Gemini via secure header authentication (no key in URL)
    if (provider === "gemini") {
      const activeModel = geminiModel || "gemini-3.5-flash-lite";

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 600, temperature: 0.2 },
            }),
            signal: AbortSignal.timeout(3500),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim().length > 50) {
            return {
              isAiEnhanced: true,
              executiveSummary: text.trim(),
              enhancedExplanations: {},
              providerName: `Google Gemini (${activeModel})`,
            };
          }
        }
      } catch (err) {
        console.warn("Gemini AI skipped for speed; using instant deterministic report:", (err as Error).message);
      }
    }

    // 2. OpenAI with provider-specific model default
    if (provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: openAiModel,
          messages: [
            {
              role: "system",
              content:
                "You are an evidence-grounded data platform assessment assistant. Never invent product claims.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 600,
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text && text.trim().length > 50) {
          return {
            isAiEnhanced: true,
            executiveSummary: text.trim(),
            enhancedExplanations: {},
            providerName: `OpenAI (${openAiModel})`,
          };
        }
      }
    }

    // Default fallback to deterministic summary
    return {
      isAiEnhanced: false,
      executiveSummary: deterministicSummary,
      enhancedExplanations: {},
      providerName: "deterministic_engine",
    };
  } catch (error) {
    console.warn("AI enhancement failed or timed out; falling back to deterministic explanation:", (error as Error).message);
    return {
      isAiEnhanced: false,
      executiveSummary: deterministicSummary,
      enhancedExplanations: {},
      providerName: "deterministic_engine",
      error: (error as Error).message,
    };
  }
}
