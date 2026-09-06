export const applicationStates=["draft","submitted","identity_review","document_review","academic_review","financial_review","decision_pending","admitted","denied","waitlisted","withdrawn"] as const;
export const enrollmentStates=["eligible","offer_accepted","registration_pending","registered","active","leave","withdrawn","completed","conferment_review","conferred"] as const;
export const integrationGates=[
 {code:"thecb_authority",name:"Texas degree authority",requiredFor:["proposed_degree"],configured:false,blocking:true},
 {code:"institutional_accreditation",name:"Recognized institutional accreditation",requiredFor:["accreditation_claim","title_iv","clearinghouse_reporting"],configured:false,blocking:true},
 {code:"twc_career_school",name:"Texas Workforce Commission career-school determination",requiredFor:["vocational_enrollment"],configured:false,blocking:true},
 {code:"title_iv_eligibility",name:"Federal Student Aid institutional eligibility and certification",requiredFor:["fafsa_packaging","federal_aid"],configured:false,blocking:true},
 {code:"nsc_contract",name:"National Student Clearinghouse participation",requiredFor:["enrollment_reporting","degreeverify","diplomaverify"],configured:false,blocking:true},
 {code:"proctor_vendor",name:"Approved proctoring processor and privacy review",requiredFor:["remote_high_stakes_exam"],configured:false,blocking:true},
] as const;
export function releaseReadiness(){const configured=Boolean(process.env.DATABASE_URL&&process.env.CLERK_SECRET_KEY);return {applicationIntake:configured?"configured_not_authorized":"disabled",degreeEnrollment:"blocked",federalAid:"blocked",clearinghouse:"blocked",remoteHighStakesProctoring:"blocked",gates:integrationGates};}
