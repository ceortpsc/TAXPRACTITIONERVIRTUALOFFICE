import { auth, clerkClient } from "@clerk/nextjs/server";
import { roles, type Role } from "@/lib/rbac";

const allowed = new Set<string>(roles);

export type IdentityPrincipal = {
  subject: string;
  email: string | null;
  roles: Role[];
};

export async function requireIdentity(): Promise<IdentityPrincipal> {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHENTICATED");
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const claimed = Array.isArray(user.publicMetadata.roles) ? user.publicMetadata.roles : [];
  const assignedRoles = claimed.filter((value): value is Role => typeof value === "string" && allowed.has(value));
  return {
    subject: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    roles: assignedRoles,
  };
}
