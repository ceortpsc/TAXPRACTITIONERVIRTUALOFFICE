import { createClerkClient } from "@clerk/backend";

const secretKey = process.env.CLERK_SECRET_KEY;
const emailAddress = process.env.CLERK_OWNER_EMAIL ?? "ceo@rosstaxsoftware.com";
const phoneNumber = process.env.CLERK_OWNER_PHONE ?? "+15124896749";
if (!secretKey) throw new Error("CLERK_SECRET_KEY is required; do not pass it as a command-line argument.");

const client = createClerkClient({ secretKey });
const existing = await client.users.getUserList({ emailAddress: [emailAddress], limit: 1 });
if (existing.data.length) {
  const user = existing.data[0];
  const roles = Array.isArray(user.publicMetadata.roles) ? user.publicMetadata.roles : [];
  if (!roles.includes("owner")) {
    await client.users.updateUserMetadata(user.id, { publicMetadata: { ...user.publicMetadata, roles: [...roles, "owner"], phoneNumber, phoneVerificationStatus: "pending" } });
  }
  console.log(JSON.stringify({ status: "existing_user_reconciled", userId: user.id, emailAddress, roles: [...new Set([...roles, "owner"])] }));
} else {
  const invitation = await client.invitations.createInvitation({
    emailAddress,
    publicMetadata: { roles: ["owner"], username: "CONDREROS", phoneNumber, phoneVerificationStatus: "pending", mfaRequired: true },
    redirectUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/office`,
    ignoreExisting: true,
  });
  console.log(JSON.stringify({ status: "invitation_created", invitationId: invitation.id, emailAddress, roles: ["owner"] }));
}
