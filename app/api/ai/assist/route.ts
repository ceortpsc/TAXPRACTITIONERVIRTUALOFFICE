import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generateGeminiAdvisory } from "@/lib/ai/gemini";

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) return NextResponse.json({ error: "Identity provider is not configured." }, { status: 503 });
  const identity = await auth();
  if (!identity.userId || !identity.orgId) return NextResponse.json({ error: "An authenticated organization session is required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { prompt?: unknown; agent?: unknown } | null;
  if (!body || typeof body.prompt !== "string" || body.prompt.length > 4000 || (body.agent !== undefined && typeof body.agent !== "string")) return NextResponse.json({ error: "Provide a prompt between 3 and 4,000 characters." }, { status: 400 });
  try {
    const result = await generateGeminiAdvisory({ prompt: body.prompt, agent: body.agent, userId: identity.userId });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "AI_GATEWAY_ERROR";
    const status = code === "AI_GATEWAY_NOT_CONFIGURED" ? 503 : code === "INVALID_PROMPT_LENGTH" ? 400 : 502;
    return NextResponse.json({ error: code, humanReviewRequired: true }, { status });
  }
}
