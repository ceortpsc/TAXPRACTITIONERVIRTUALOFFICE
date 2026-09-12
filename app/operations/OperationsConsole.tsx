"use client";

import { useMemo, useState } from "react";
import type { OperationsSection, OperationsSectionId, OperationalStatus } from "@/lib/operations-center";

type Snapshot = {
  generatedAt: string;
  environment: string;
  evidenceRule: string;
  sections: OperationsSection[];
};

type Props = {
  initialSnapshot: Snapshot;
  principal: { email: string | null; roles: string[] };
};

const nav: Array<{ id: OperationsSectionId; label: string; icon: string; preview?: boolean }> = [
  { id: "deployments", label: "Deployments", icon: "▦" },
  { id: "health", label: "Health & troubleshooting", icon: "◉" },
  { id: "security", label: "Security & compliance", icon: "⬡" },
  { id: "optimization", label: "Optimization", icon: "↗" },
  { id: "quotas", label: "Quotas & reservations", icon: "▤" },
  { id: "maintenance", label: "Maintenance", icon: "◌" },
  { id: "support", label: "Support", icon: "?" },
  { id: "topology", label: "App Topology", icon: "⌘", preview: true },
];

const statusClass: Record<OperationalStatus, string> = {
  READY: "opsStatusReady",
  VERIFIED: "opsStatusReady",
  SCHEDULED: "opsStatusScheduled",
  CONFIGURATION_REQUIRED: "opsStatusGated",
  DEGRADED: "opsStatusGated",
  UNKNOWN: "opsStatusUnknown",
};

export default function OperationsConsole({ initialSnapshot, principal }: Props) {
  const [active, setActive] = useState<OperationsSectionId>("deployments");
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const section = useMemo(
    () => snapshot.sections.find((entry) => entry.id === active) ?? snapshot.sections[0],
    [active, snapshot],
  );

  const counts = useMemo(() => {
    const items = snapshot.sections.flatMap((entry) => entry.items);
    return {
      verified: items.filter((item) => item.status === "VERIFIED" || item.status === "READY").length,
      gated: items.filter((item) => item.status === "CONFIGURATION_REQUIRED" || item.status === "DEGRADED").length,
      unknown: items.filter((item) => item.status === "UNKNOWN").length,
    };
  }, [snapshot]);

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetch(`/api/operations/${active}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Refresh failed (${response.status}).`);
      const nextSection = (await response.json()) as OperationsSection;
      setSnapshot((current) => ({
        ...current,
        generatedAt: new Date().toISOString(),
        sections: current.sections.map((entry) => (entry.id === nextSection.id ? nextSection : entry)),
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="opsFrame">
      <aside className="opsSidebar" aria-label="Operations navigation">
        <a className="opsHome" href="/office"><span className="opsIcon">⌂</span><span>Home</span></a>
        {nav.map((entry) => (
          <button key={entry.id} type="button" className={active === entry.id ? "opsNavItem active" : "opsNavItem"} onClick={() => setActive(entry.id)}>
            <span className="opsIcon" aria-hidden="true">{entry.icon}</span>
            <span>{entry.label}</span>
            {entry.preview ? <span className="opsPreview">Preview</span> : null}
            <span className="opsDots" aria-hidden="true">⋮</span>
          </button>
        ))}
      </aside>

      <section className="opsWorkspace">
        <header className="opsHeader">
          <div>
            <p className="opsKicker">RTPSC OPERATIONS CONTROL CENTER</p>
            <h1>{section.title}</h1>
            <p>{section.description}</p>
          </div>
          <div className="opsHeaderActions">
            <button type="button" onClick={refresh} disabled={refreshing}>{refreshing ? "Refreshing…" : "Refresh evidence"}</button>
            <a href="/office">Virtual Office</a>
          </div>
        </header>

        <div className="opsTrustBar">
          <div><strong>{snapshot.environment}</strong><span>environment</span></div>
          <div><strong>{counts.verified}</strong><span>ready / verified</span></div>
          <div><strong>{counts.gated}</strong><span>gated</span></div>
          <div><strong>{counts.unknown}</strong><span>unknown</span></div>
          <div className="opsPrincipal"><strong>{principal.email ?? "authenticated principal"}</strong><span>{principal.roles.join(", ") || "role pending"}</span></div>
        </div>

        {error ? <div className="opsAlert" role="alert">{error} Existing evidence remains unchanged.</div> : null}

        <div className="opsEvidenceRule">
          <strong>Evidence rule:</strong> {snapshot.evidenceRule} Last console generation: {new Date(snapshot.generatedAt).toLocaleString()}.
        </div>

        <div className="opsGrid">
          {section.items.map((item) => (
            <article className="opsCard" key={item.id}>
              <div className="opsCardTop">
                <div>
                  <span className={`opsStatus ${statusClass[item.status]}`}>{item.status.replaceAll("_", " ")}</span>
                  <h2>{item.label}</h2>
                </div>
                <span className="opsEvidenceClass">{item.evidenceClass.replaceAll("_", " ")}</span>
              </div>
              <p>{item.detail}</p>
              <dl>
                <div><dt>Source</dt><dd>{item.source}</dd></div>
                <div><dt>Verified</dt><dd>{item.verifiedAt ? new Date(item.verifiedAt).toLocaleString() : "Not verified"}</dd></div>
              </dl>
              {item.action ? <div className="opsActionHint">Controlled action: {item.action}</div> : null}
            </article>
          ))}
        </div>

        {active === "topology" ? (
          <div className="opsTopology" aria-label="RTPSC application topology">
            {section.items.map((item, index) => (
              <div className="opsTopologyStep" key={item.id}>
                <span>{index + 1}</span><strong>{item.label}</strong>{index < section.items.length - 1 ? <b aria-hidden="true">→</b> : null}
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
