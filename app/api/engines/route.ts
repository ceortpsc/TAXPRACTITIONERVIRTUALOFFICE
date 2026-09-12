import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { engineReadiness, engineRegistry, runtimeStage } from "@/lib/runtime/engine-registry";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) return NextResponse.json({ error: "Identity provider is not configured." }, { status: 503 });
  const identity = await auth();
  if (!identity.userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  return NextResponse.json({
    stage: runtimeStage(),
    engines: engineReadiness(),
    topology: engineRegistry.map(({ code, name, kind, ownerGroup, purpose, responsibilities, dependencies, execution, scaling, criticality }) => ({ code, name, kind, ownerGroup, purpose, responsibilities, dependencies, execution, scaling, criticality })),
  }, { headers: { "Cache-Control": "no-store" } });
}
