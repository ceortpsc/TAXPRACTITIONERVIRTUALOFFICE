export type TranscriptEvent={code:number;date:string;amount?:number;cycle?:string;responsibilityCode?:number};
export type CaseState="intake"|"research"|"waiting"|"trace"|"escalation"|"resolved";
export function reconcileTranscript(events:TranscriptEvent[]){
 const sorted=[...events].sort((a,b)=>a.date.localeCompare(b.date));
 const latest=(code:number)=>sorted.findLast(e=>e.code===code);
 const refund=latest(846)??latest(840); const freeze810=latest(810); const release811=latest(811); const hold570=latest(570); const release571=latest(571);
 const active810=Boolean(freeze810&&(!release811||release811.date<freeze810.date));
 const active570=Boolean(hold570&&(!release571||release571.date<hold570.date));
 return {sorted,refund,active810,active570,hasPostedRefund:Boolean(refund),traceEligible:Boolean(refund)&&!active810&& !active570,flags:[active810?"TC 810 freeze requires authorized IRS resolution":"",active570?"TC 570 hold remains unresolved":"",refund?`Refund posted under TC ${refund.code}`:"No posted refund transaction found"].filter(Boolean)};
}
export function nextAction(result:ReturnType<typeof reconcileTranscript>){
 if(result.active810)return {state:"research" as CaseState,action:"Identify the responsible IRS function and reason code; assemble substantiation and route under the applicable IRM procedure."};
 if(result.active570)return {state:"waiting" as CaseState,action:"Research the source of the additional-liability hold, related notices, pending transactions, and controlling function."};
 if(result.traceEligible)return {state:"trace" as CaseState,action:"Confirm non-receipt and payment method, then evaluate the IRM 21.4.2 refund-trace pathway and Form 3911 requirements."};
 return {state:"intake" as CaseState,action:"Verify return receipt, processing status, authorization, tax period, and account identifiers before escalation."};
}
