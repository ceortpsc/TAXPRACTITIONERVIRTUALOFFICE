export type DocumentStatus =
  | "DRAFT"
  | "READY_FOR_REVIEW"
  | "APPROVED"
  | "ISSUED"
  | "VOID";

export type EvidenceStatus =
  | "MISSING"
  | "ATTACHED"
  | "VERIFIED"
  | "REJECTED";

export type DocumentClassification =
  | "SAMPLE"
  | "INTERNAL"
  | "OFFICIAL"
  | "REGULATORY";

export type FieldSource =
  | "INSTITUTION_PROFILE"
  | "LEGAL_ENTITY"
  | "GOVERNANCE"
  | "ACADEMIC_PROGRAM"
  | "FACULTY"
  | "STUDENT_RECORD"
  | "FINANCE"
  | "EVIDENCE"
  | "MANUAL_VERIFIED";

export interface DocumentFieldDefinition {
  key: string;
  label: string;
  source: FieldSource;
  required: boolean;
  externallyVerified?: boolean;
  sensitive?: boolean;
}

export interface DocumentTemplateDefinition {
  id: string;
  name: string;
  category:
    | "REGULATORY_APPLICATION"
    | "GOVERNANCE"
    | "REGISTRAR"
    | "ACADEMIC"
    | "FINANCIAL_AID"
    | "ACCOUNTING"
    | "STUDENT_SERVICES"
    | "DISCIPLINARY"
    | "COMMUNICATION"
    | "INTERNAL_OFFICE";
  classification: DocumentClassification;
  fields: DocumentFieldDefinition[];
  requiresHumanApproval: boolean;
  requiresSignature: boolean;
  requiresEvidence: boolean;
  canBeOfficial: boolean;
}

export interface EvidenceBinding {
  evidenceId: string;
  fieldKey: string;
  status: EvidenceStatus;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface DocumentGenerationRequest {
  template: DocumentTemplateDefinition;
  values: Record<string, unknown>;
  evidence: EvidenceBinding[];
  requestedClassification?: DocumentClassification;
  humanApproval?: {
    approved: boolean;
    approvedBy?: string;
    approvedAt?: string;
  };
  signature?: {
    signed: boolean;
    signedBy?: string;
    signedAt?: string;
  };
}

export interface GeneratedDocumentRecord {
  templateId: string;
  status: DocumentStatus;
  classification: DocumentClassification;
  warnings: string[];
  missingFields: string[];
  unverifiedFields: string[];
  generatedAt: string;
  values: Record<string, unknown>;
}

const isBlank = (value: unknown) =>
  value === undefined || value === null || value === "";

export function generateControlledDocument(
  request: DocumentGenerationRequest,
): GeneratedDocumentRecord {
  const { template, values, evidence } = request;
  const missingFields: string[] = [];
  const unverifiedFields: string[] = [];
  const warnings: string[] = [];

  for (const field of template.fields) {
    if (field.required && isBlank(values[field.key])) {
      missingFields.push(field.key);
    }

    if (field.externallyVerified && !isBlank(values[field.key])) {
      const verified = evidence.some(
        (binding) =>
          binding.fieldKey === field.key && binding.status === "VERIFIED",
      );
      if (!verified) unverifiedFields.push(field.key);
    }
  }

  let classification =
    request.requestedClassification ?? template.classification;

  if (classification === "OFFICIAL" && !template.canBeOfficial) {
    classification = "SAMPLE";
    warnings.push(
      "Template is not permitted to generate an official document; output downgraded to SAMPLE.",
    );
  }

  if (unverifiedFields.length > 0 && classification === "OFFICIAL") {
    classification = "SAMPLE";
    warnings.push(
      "Externally verifiable facts lack verified evidence; output downgraded to SAMPLE.",
    );
  }

  if (
    template.requiresHumanApproval &&
    classification === "OFFICIAL" &&
    request.humanApproval?.approved !== true
  ) {
    classification = "SAMPLE";
    warnings.push(
      "Human approval is required before official issuance; output downgraded to SAMPLE.",
    );
  }

  if (
    template.requiresSignature &&
    classification === "OFFICIAL" &&
    request.signature?.signed !== true
  ) {
    classification = "SAMPLE";
    warnings.push(
      "Authorized signature is required before official issuance; output downgraded to SAMPLE.",
    );
  }

  const ready = missingFields.length === 0 && unverifiedFields.length === 0;

  return {
    templateId: template.id,
    status: ready ? "READY_FOR_REVIEW" : "DRAFT",
    classification,
    warnings,
    missingFields,
    unverifiedFields,
    generatedAt: new Date().toISOString(),
    values,
  };
}
