export type Trigger="case.created"|"transcript.imported"|"tc.570.detected"|"tc.810.detected"|"refund.issued"|"trace.due"|"document.expiring"|"transmission.approved"|"webhook.failed";
export type Workflow={trigger:Trigger;tasks:readonly string[];gate:string;terminal:string};
export const workflows:readonly Workflow[]=[
 {trigger:"case.created",tasks:["verify authorization","verify identity and tax period","assign owner","set service deadline"],gate:"consent + permissible purpose","terminal":"research ready"},
 {trigger:"transcript.imported",tasks:["hash source","normalize events","reconcile module","detect freezes","record provenance"],gate:"authorized source + tenant match","terminal":"review queue"},
 {trigger:"tc.570.detected",tasks:["identify source","inventory notices","research pending activity","set follow-up"],gate:"human review","terminal":"monitor authoritative resolution"},
 {trigger:"tc.810.detected",tasks:["capture responsibility code","identify controlling function","assemble substantiation","route permitted response"],gate:"compliance approval","terminal":"monitor for TC 811 or controlling outcome"},
 {trigger:"refund.issued",tasks:["record TC 846/840","validate delivery method","calculate trace eligibility","notify case owner"],gate:"posted issue event","terminal":"delivered or trace eligible"},
 {trigger:"trace.due",tasks:["confirm non-receipt","evaluate Form 3911","prepare trace packet","schedule follow-up"],gate:"practitioner approval","terminal":"trace submitted"},
 {trigger:"document.expiring",tasks:["notify owner","request replacement","restrict dependent action"],gate:"retention policy","terminal":"renewed or expired"},
 {trigger:"transmission.approved",tasks:["revalidate entity","revalidate environment","sign payload","send idempotently","archive acknowledgment"],gate:"independent approval + active authority","terminal":"acknowledged or exception queue"},
 {trigger:"webhook.failed",tasks:["quarantine event","increment retry","notify integration owner","open incident at threshold"],gate:"signed webhook","terminal":"replayed or dead letter"}
];
export const transmissionStates=["draft","validated","awaiting_approval","approved","queued","sent","acknowledged","accepted","rejected","quarantined"] as const;
