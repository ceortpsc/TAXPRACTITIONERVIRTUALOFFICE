import { NextResponse } from "next/server";

import {
  generateControlledDocument,
  type DocumentGenerationRequest,
} from "@/lib/university/document-engine";
import { getUniversityDocumentTemplate } from "@/lib/university/document-templates";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<DocumentGenerationRequest> & {
    templateId?: string;
  };

  if (!body.templateId) {
    return NextResponse.json(
      { error: "templateId is required" },
      { status: 400 },
    );
  }

  const template = getUniversityDocumentTemplate(body.templateId);

  if (!template) {
    return NextResponse.json(
      { error: "Unknown document template" },
      { status: 404 },
    );
  }

  const result = generateControlledDocument({
    template,
    values: body.values ?? {},
    evidence: body.evidence ?? [],
    requestedClassification: body.requestedClassification,
    humanApproval: body.humanApproval,
    signature: body.signature,
  });

  return NextResponse.json({ result });
}
