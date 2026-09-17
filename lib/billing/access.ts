import { NextResponse } from "next/server";
import { requireIdentity, type IdentityPrincipal } from "@/lib/identity";
import { authorize, type Permission } from "@/lib/rbac";

export function identityFailure(error: unknown) {
  const code = error instanceof Error ? error.message : "IDENTITY_VERIFICATION_FAILED";
  if (code === "UNAUTHENTICATED") {
    return NextResponse.json({ error: code }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  if (code === "ACCESS_NOT_ISSUED" || code === "MFA_REQUIRED") {
    return NextResponse.json({ error: code }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json(
    { error: "IDENTITY_VERIFICATION_FAILED" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

export async function requireBillingIdentity(): Promise<
  | { principal: IdentityPrincipal; organizationId: string }
  | { response: NextResponse }
> {
  try {
    const principal = await requireIdentity();
    if (!principal.organizationId) {
      return {
        response: NextResponse.json(
          { error: "ORGANIZATION_SESSION_REQUIRED" },
          { status: 403, headers: { "Cache-Control": "no-store" } },
        ),
      };
    }
    return { principal, organizationId: principal.organizationId };
  } catch (error) {
    return { response: identityFailure(error) };
  }
}

export async function requireBillingPermission(permission: Permission): Promise<
  | { principal: IdentityPrincipal; organizationId: string }
  | { response: NextResponse }
> {
  const access = await requireBillingIdentity();
  if ("response" in access) return access;

  const permitted = authorize(
    {
      id: access.principal.subject,
      tenantId: access.organizationId,
      roles: access.principal.roles,
      mfaVerified: access.principal.mfaVerified,
    },
    permission,
    { tenantId: access.organizationId },
  );
  if (!permitted) {
    return {
      response: NextResponse.json(
        { error: "FORBIDDEN", requiredPermission: permission },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      ),
    };
  }
  return access;
}
