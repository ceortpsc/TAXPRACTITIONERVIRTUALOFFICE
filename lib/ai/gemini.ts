import { redact } from "@/lib/security/redaction";

const gatewayEndpoint = "https://ai-gateway.vercel.sh/v1/chat/completions";
const defaultModel = "google/gemini-3-pro-preview";

export type AdvisoryRequest = { prompt: string; userId: string; agent?: string };

export async function generateGeminiAdvisory(input: AdvisoryRequest) {
  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (!token) throw new Error("AI_GATEWAY_NOT_CONFIGURED");
  const sanitized = redact(input.prompt).trim();
  if (sanitized.length < 3 || sanitized.length > 4000) throw new Error("INVALID_PROMPT_LENGTH");
  const response = await fetch(gatewayEndpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.AI_GATEWAY_GEMINI_MODEL || defaultModel,
      messages: [
        { role: "system", content: "You are a Ross Tax Pro advisory assistant. Never guarantee tax, legal, refund, payroll, or financial outcomes. Do not request credentials or taxpayer identifiers. Label uncertainty and require qualified human review before consequential action." },
        { role: "user", content: sanitized },
      ],
      max_tokens: 800,
      temperature: 0.2,
      user: input.userId,
      metadata: { application: "tax-practitioner-virtual-office", agent: input.agent || "andreaa", environment: "production" },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`AI_GATEWAY_${response.status}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: unknown; model?: string };
  const text = payload.choices?.[0]?.message?.content;
  if (!text) throw new Error("AI_GATEWAY_EMPTY_RESPONSE");
  return { text, model: payload.model || process.env.AI_GATEWAY_GEMINI_MODEL || defaultModel, usage: payload.usage, humanReviewRequired: true };
}
