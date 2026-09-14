import { createHash, randomUUID } from "node:crypto";
import { createClerkClient } from "@clerk/backend";

const secretKey = process.env.CLERK_SECRET_KEY;
const action = process.env.ACCESS_ISSUANCE_ACTION;
const emailAddress = process.env.CLERK_OWNER_EMAIL;
const username = (process.env.CLERK_OWNER_USERNAME ?? "").toLowerCase();
const approver = process.env.ACCESS_ISSUANCE_APPROVER;
const ticket = process.env.ACCESS_ISSUANCE_TICKET;
const approved = process.env.ACCESS_ISSUANCE_APPROVED === "true";
const ptin = (process.env.CLERK_OWNER_PTIN ?? "").toUpperCase();
const caf = (process.env.CLERK_OWNER_CAF ?? "").toUpperCase();
const efin = process.env.CLERK_OWNER_EFIN ?? "";
const appUrl = process.env.APP_URL;

function required(name, value) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function fingerprint(value) {
  return createHash("sha256").update(value).digest("hex");
}

function validateIssuedIdentifiers() {
  if (!/^P\d{8}$/.test(ptin)) throw new Error("CLERK_OWNER_PTIN must be an IRS-issued PTIN");
  if (!/^\d{9}[A-Z]?$/.test(caf)) throw new Error("CLERK_OWNER_CAF must be an IRS-issued CAF number");
  if (!/^\d{6}$/.test(efin)) throw new Error("CLERK_OWNER_EFIN must be an IRS-issued six-digit EFIN");
}

required("CLERK_SECRET_KEY", secretKey);
required("ACCESS_ISSUANCE_ACTION", action);
required("CLERK_OWNER_EMAIL", emailAddress);
required("CLERK_OWNER_USERNAME", username);
required("ACCESS_ISSUANCE_APPROVER", approver);
required("ACCESS_ISSUANCE_TICKET", ticket);
required("APP_URL", appUrl);
if (!approved) throw new Error("ACCESS_ISSUANCE_APPROVED=true is required");
if (!["invite", "issue"].includes(action)) throw new Error("ACCESS_ISSUANCE_ACTION must be invite or issue");

validateIssuedIdentifiers();

const client = createClerkClient({ secretKey });
const matches = await client.users.getUserList({ emailAddress: [emailAddress], limit: 2 });
if (matches.data.length > 1) throw new Error("Duplicate production identities detected; access issuance stopped");

const issuedAt = new Date().toISOString();
const issuanceId = randomUUID();

if (action === "invite") {
  if (matches.data.length) throw new Error("Verified identity already exists; use ACCESS_ISSUANCE_ACTION=issue");
  const invitation = await client.invitations.createInvitation({
    emailAddress,
    publicMetadata: {
      requestedRole: "owner",
      accessStatus: "pending_enrollment",
      mfaRequired: true,
      issuanceId,
      issuanceTicket: ticket,
    },
    redirectUrl: `${appUrl}/office`,
    ignoreExisting: false,
  });
  console.log(JSON.stringify({
    status: "access_invitation_issued",
    invitationId: invitation.id,
    emailAddress,
    requestedRole: "owner",
    issuanceId,
    issuedAt,
  }));
  process.exit(0);
}

if (!matches.data.length) throw new Error("No existing verified identity; issue an invitation before assigning access");

const user = matches.data[0];
const primaryEmail = user.primaryEmailAddress;
if (!primaryEmail || primaryEmail.emailAddress.toLowerCase() !== emailAddress.toLowerCase()) {
  throw new Error("Primary email does not match the approved identity");
}
if (primaryEmail.verification?.status !== "verified") {
  throw new Error("Primary email is not verified; access issuance stopped");
}
if (!user.twoFactorEnabled) {
  throw new Error("MFA is not enabled; owner access issuance stopped");
}
if (user.username && user.username.toLowerCase() !== username) {
  throw new Error("Username does not match the approved identity");
}

await client.users.updateUser(user.id, { username });
await client.users.updateUserMetadata(user.id, {
  publicMetadata: {
    ...user.publicMetadata,
    roles: ["owner"],
    accessStatus: "issued",
    mfaRequired: true,
    issuanceId,
    issuanceTicket: ticket,
  },
  privateMetadata: {
    ...user.privateMetadata,
    professionalIdentifiers: {
      ptin,
      caf,
      efin,
      classification: "restricted",
      source: "IRS-issued",
    },
    accessIssuance: {
      issuanceId,
      ticket,
      approvedBy: approver,
      issuedAt,
      environment: "production",
      role: "owner",
    },
  },
});

console.log(JSON.stringify({
  status: "owner_access_issued",
  userId: user.id,
  emailAddress,
  username,
  roles: ["owner"],
  mfaVerified: true,
  issuanceId,
  issuedAt,
  identifierFingerprints: {
    ptin: fingerprint(ptin),
    caf: fingerprint(caf),
    efin: fingerprint(efin),
  },
}));
