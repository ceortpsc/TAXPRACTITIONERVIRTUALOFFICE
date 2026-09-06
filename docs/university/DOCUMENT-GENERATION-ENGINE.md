# Ross Tax Pro University Document Generation & Preparation Engine

## Purpose

The document engine prepares controlled university, regulatory, registrar, student-services, accounting, financial-aid, disciplinary, communication, governance, and internal-office documents from authoritative application data and bound evidence.

It is designed to prevent draft or synthetic information from being mistaken for an externally approved, accredited, government-issued, or legally conferred record.

## Core Flow

1. Select document template.
2. Resolve auto-fill fields from authoritative internal sources.
3. Bind evidence to externally verifiable fields.
4. Validate required fields.
5. Validate evidence status.
6. Apply classification and issuance rules.
7. Route for human review where required.
8. Capture authorized signature/attestation where required.
9. Generate review-ready record.
10. Export/render through the presentation layer.
11. Record version, approval, issuance, and audit events.

## Document Classifications

- `SAMPLE` — demonstration, exhibit, or non-issued document.
- `INTERNAL` — controlled internal university record.
- `OFFICIAL` — permitted only when the template supports official issuance and all required approval/evidence/signature gates pass.
- `REGULATORY` — application or evidence material prepared for regulatory review.

## Mandatory Downgrade Rule

A requested `OFFICIAL` output is automatically downgraded to `SAMPLE` when:

- the template is not eligible for official issuance;
- externally verifiable facts lack verified evidence;
- required human approval is missing; or
- required authorized signature is missing.

## Seeded Regulatory Master Record

The 26-section institutional application record is seeded in `lib/university/regulatory-application-seed.ts`.

The following facts are intentionally locked until verified evidence exists:

- Texas degree-granting authority;
- institutional accreditation;
- Title IV eligibility/participation;
- OPEID or Federal School Code;
- `.edu` eligibility/registration;
- official degree enrollment;
- degree-credit award;
- degree conferral;
- federal enrollment transmission;
- surety instrument amount/issuer;
- faculty credentials and transcripts;
- financial-capacity amounts;
- signatures and attestations.

## Initial Template Registry

- Texas Certificate of Authority Master Application Packet
- Sample Academic Transcript
- Sample Diploma
- Admission Decision Letter
- Student Disciplinary Notice
- Registrar Enrollment Verification

## Regulatory Packet Sections

1. Institution Identity
2. Legal Organization
3. Governing Board
4. Chief Executive Administration
5. Institutional Mission
6. Financial Capacity
7. Surety Instrument
8. Institutional Policies
9. Faculty
10. Academic Programs
11. General Education
12. Curriculum
13. Learning Resources
14. Library
15. Student Services
16. Admissions
17. Registrar
18. Academic Records
19. Student Complaints
20. Facilities / Technology
21. Distance Education
22. Institutional Effectiveness
23. Degree Program Exhibits
24. Supporting Evidence
25. Site Visit Preparation
26. Certification / Attestation

## API

`POST /api/university/documents/generate`

Request body:

```json
{
  "templateId": "thecb-certificate-authority-master",
  "values": {},
  "evidence": [],
  "requestedClassification": "REGULATORY"
}
```

The API returns a controlled generation record containing:

- document classification;
- document status;
- missing fields;
- unverified fields;
- warnings;
- generation timestamp;
- normalized field values.

## Next Integration Layer

The rendering/export layer should consume the controlled generation record rather than raw user input. PDF/DOCX/HTML rendering must preserve classification banners, document IDs, version numbers, page numbering, and issuance status. Official issuance should additionally write an immutable audit event and checksum/hash record.
