import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const protocolVersion = "2025-06-18";
const requiredConnectScope = "mcp:connect";

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

function rpc(id: JsonRpcRequest["id"], result: unknown, status = 200) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result }, { status });
}

function rpcError(id: JsonRpcRequest["id"], code: number, message: string, status = 400) {
  return NextResponse.json(
    { jsonrpc: "2.0", id: id ?? null, error: { code, message } },
    { status },
  );
}

function resourceMetadata(request: Request) {
  return `${new URL(request.url).origin}/.well-known/oauth-protected-resource`;
}

function unauthorized(request: Request, description: string, status = 401) {
  return NextResponse.json(
    { error: "unauthorized", error_description: description },
    {
      status,
      headers: {
        "WWW-Authenticate": `Bearer resource_metadata="${resourceMetadata(request)}"`,
        "Cache-Control": "no-store",
      },
    },
  );
}

const tools = [
  {
    name: "platform_readiness",
    description: "Read non-secret application and integration readiness signals.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "authorization_registry",
    description: "Read the masked authorization and platform-gate registry.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
] as const;

async function fetchInternal(request: Request, path: string) {
  const response = await fetch(new URL(path, request.url), {
    headers: { "x-mcp-internal": "read-only" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Internal resource returned ${response.status}`);
  return response.json();
}

export function GET(request: Request) {
  return NextResponse.json({
    name: "Ross Tax Pro Virtual Office MCP",
    endpoint: "/api/mcp",
    protocolVersion,
    transport: "Streamable HTTP",
    oauthProtectedResource: resourceMetadata(request),
    authentication: "Clerk OAuth access token",
  });
}

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    return NextResponse.json(
      { error: "service_unavailable", error_description: "Clerk server credentials are not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const identity = await auth({ acceptsToken: "oauth_token" });
  if (!identity.isAuthenticated || identity.tokenType !== "oauth_token") {
    return unauthorized(request, "A valid Clerk OAuth access token is required.");
  }

  const scopes = identity.scopes ?? [];
  if (!scopes.includes(requiredConnectScope)) {
    return unauthorized(request, `Missing required scope: ${requiredConnectScope}`, 403);
  }

  let body: JsonRpcRequest;
  try {
    body = await request.json();
  } catch {
    return rpcError(null, -32700, "Parse error");
  }

  if (body.jsonrpc !== "2.0" || !body.method) return rpcError(body.id, -32600, "Invalid Request");
  if (body.method.startsWith("notifications/")) return new NextResponse(null, { status: 202 });

  switch (body.method) {
    case "initialize":
      return rpc(body.id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false }, resources: { subscribe: false, listChanged: false } },
        serverInfo: { name: "ross-tax-pro-virtual-office", version: "1.0.0" },
      });
    case "ping":
      return rpc(body.id, {});
    case "tools/list":
      if (!scopes.includes("tools:read")) return unauthorized(request, "Missing required scope: tools:read", 403);
      return rpc(body.id, { tools });
    case "tools/call": {
      if (!scopes.includes("tools:execute")) return unauthorized(request, "Missing required scope: tools:execute", 403);
      const name = typeof body.params?.name === "string" ? body.params.name : "";
      try {
        const value = name === "platform_readiness"
          ? await fetchInternal(request, "/api/health")
          : name === "authorization_registry"
            ? await fetchInternal(request, "/api/authorizations")
            : null;
        if (!value) return rpcError(body.id, -32602, "Unknown tool");
        return rpc(body.id, { content: [{ type: "text", text: JSON.stringify(value) }] });
      } catch {
        return rpc(body.id, { content: [{ type: "text", text: "The requested readiness source is unavailable." }], isError: true });
      }
    }
    case "resources/list":
      if (!scopes.includes("resources:read")) return unauthorized(request, "Missing required scope: resources:read", 403);
      return rpc(body.id, {
        resources: [
          { uri: "ross://readiness", name: "Platform readiness", mimeType: "application/json" },
          { uri: "ross://authorizations", name: "Masked authorization registry", mimeType: "application/json" },
        ],
      });
    case "resources/read": {
      if (!scopes.includes("resources:read")) return unauthorized(request, "Missing required scope: resources:read", 403);
      const uri = body.params?.uri;
      try {
        const value = uri === "ross://readiness"
          ? await fetchInternal(request, "/api/health")
          : uri === "ross://authorizations"
            ? await fetchInternal(request, "/api/authorizations")
            : null;
        if (!value) return rpcError(body.id, -32602, "Unknown resource");
        return rpc(body.id, { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(value) }] });
      } catch {
        return rpcError(body.id, -32603, "Resource unavailable", 503);
      }
    }
    default:
      return rpcError(body.id, -32601, "Method not found");
  }
}
