import { NextResponse } from "next/server";

const scopes = ["mcp:connect", "tools:read", "tools:execute", "resources:read"];

export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const issuer = process.env.CLERK_OAUTH_ISSUER;

  return NextResponse.json(
    {
      resource: process.env.MCP_RESOURCE_URL ?? `${origin}/api/mcp`,
      ...(issuer ? { authorization_servers: [issuer] } : {}),
      scopes_supported: scopes,
      bearer_methods_supported: ["header"],
      resource_documentation: `${origin}/docs/mcp`,
    },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
