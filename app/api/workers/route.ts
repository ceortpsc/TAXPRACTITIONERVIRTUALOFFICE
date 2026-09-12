import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { runtimeWorkerEvidence } from "@/lib/workers";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) return NextResponse.json({ error: "Identity provider is not configured." }, { status: 503 });
  const identity = await auth();
  if (!identity.userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  return NextResponse.json({
    controlPlane: runtimeWorkerEvidence(),
    note: "A registered worker is not evidence of a completed business action. Data-dependent workers remain adapter-gated until the durable worker adapter is configured and verified.",
  }, { headers: { "Cache-Control": "no-store" } });
}
