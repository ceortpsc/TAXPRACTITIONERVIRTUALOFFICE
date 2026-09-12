"use client";

import { useState, type FormEvent } from "react";

type CreatedRecord = {
  record?: {
    recordId: string;
    client: { displayName: string; clientType: string; tinLast4: string };
    module: { taxPeriod: string; mft: string | null };
    integrity: { algorithm: string; digest: string; sealedAt: string };
  };
  persistence?: { durable: boolean; mode: string; nextGate?: string };
  error?: string;
};

const initial = {
  displayName: "",
  clientType: "individual",
  tinLast4: "",
  taxPeriod: "",
  mft: "",
  sourceType: "account_transcript",
  sourceReference: "",
  authorizationKind: "Form 2848 / authorized representation",
  authorizationExpiresAt: "",
};

export default function MasterFileWorkspace() {
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState<CreatedRecord | null>(null);
  const [working, setWorking] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setResult(null);
    try {
      const response = await fetch("/api/master-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json() as CreatedRecord;
      setResult(payload);
    } catch {
      setResult({ error: "MASTER_FILE_REQUEST_FAILED" });
    } finally {
      setWorking(false);
    }
  }

  function field(name: keyof typeof initial, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  return (
    <div className="masterFileWorkspace">
      <form onSubmit={submit} className="masterFileForm">
        <div className="masterFileGrid">
          <label>Client / entity name<input required minLength={2} maxLength={120} value={form.displayName} onChange={(e) => field("displayName", e.target.value)} /></label>
          <label>Client type<select value={form.clientType} onChange={(e) => field("clientType", e.target.value)}><option value="individual">Individual</option><option value="business">Business</option><option value="estate">Estate</option><option value="trust">Trust</option><option value="exempt">Exempt organization</option></select></label>
          <label>TIN last 4 only<input required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={form.tinLast4} onChange={(e) => field("tinLast4", e.target.value.replace(/\D/g, "").slice(0, 4))} /></label>
          <label>Tax period (YYYYMM)<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="202512" value={form.taxPeriod} onChange={(e) => field("taxPeriod", e.target.value.replace(/\D/g, "").slice(0, 6))} /></label>
          <label>MFT / module code<input maxLength={12} placeholder="Optional" value={form.mft} onChange={(e) => field("mft", e.target.value)} /></label>
          <label>Source<select value={form.sourceType} onChange={(e) => field("sourceType", e.target.value)}><option value="account_transcript">Account transcript</option><option value="return_transcript">Return transcript</option><option value="record_of_account">Record of account</option><option value="wage_income">Wage & income</option><option value="authorized_document">Authorized document</option><option value="manual_verified">Manual verified source</option></select></label>
          <label>Source reference<input maxLength={120} placeholder="Masked reference or internal document ID" value={form.sourceReference} onChange={(e) => field("sourceReference", e.target.value)} /></label>
          <label>Authorization<input required maxLength={80} value={form.authorizationKind} onChange={(e) => field("authorizationKind", e.target.value)} /></label>
          <label>Authorization expiration<input type="date" value={form.authorizationExpiresAt} onChange={(e) => field("authorizationExpiresAt", e.target.value)} /></label>
        </div>
        <p className="masterFilePrivacy">Do not enter a full SSN, EIN, payment credential, password, or identity-document number. This workflow accepts only the final four TIN digits.</p>
        <button className="button primary" disabled={working} type="submit">{working ? "Sealing record…" : "Create sealed master file"}</button>
      </form>

      {result?.error && <div className="masterFileResult error" role="alert"><b>Creation blocked</b><span>{result.error}</span></div>}
      {result?.record && (
        <div className="masterFileResult" role="status">
          <div><span>Record ID</span><b>{result.record.recordId}</b></div>
          <div><span>Client</span><b>{result.record.client.displayName} · ***{result.record.client.tinLast4}</b></div>
          <div><span>Tax module</span><b>{result.record.module.taxPeriod}{result.record.module.mft ? ` · ${result.record.module.mft}` : ""}</b></div>
          <div><span>Integrity seal</span><code>{result.record.integrity.digest}</code></div>
          <div><span>Persistence</span><b>{result.persistence?.durable ? "Durable database record" : "Portable sealed record — database adapter pending"}</b></div>
        </div>
      )}
    </div>
  );
}
