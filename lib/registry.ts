export const authorizations = [
  ["IRS e-file","EFIN","Masked","Production / Test","active"],
  ["IRS e-file","ETIN","4 registered","Role-specific","active"],
  ["ACA AIR","TCC","3 active","Production / Test","active"],
  ["IRIS","TCC","3 active","Portal / A2A","active"],
  ["IRS APIs","OAuth clients","2 active","ISP","review"],
] as const;
export const conflicts = [
  ["Critical","Legal entity and EIN differ between e-file and ACA/API/IRIS records.","Keep entities isolated; confirm ownership and submit the correct IRS update before production use.","blocked"],
  ["High","Address appears as both Cody Poe Road and Coy Poe Road.","Validate against IRS entity records and USPS, then standardize every application.","review"],
  ["High","Multiple business names appear across authorizations.","Approve a DBA-to-legal-entity matrix as the single source for forms and transmission metadata.","review"],
  ["High","ACA software IDs remain in test status.","Complete applicable assurance testing before enabling production ACA transmission.","test"],
  ["Critical","A secret-bearing file was supplied outside a secrets manager.","Rotate it, purge exposed copies, and store replacements only as encrypted environment variables.","blocked"],
] as const;
export const modules = [
  ["Client Intake","Identity, consent, organizer, and engagement gates"],
  ["Case Management","Notices, deadlines, evidence, and accountable ownership"],
  ["Transcript Review","Authorized analysis with auditable findings"],
  ["Document Vault","Encrypted storage, retention, and access logs"],
  ["Transmission Center","Environment-aware e-file, ACA, and IRIS controls"],
  ["Training","Role-based procedures, simulations, and competency records"],
] as const;
