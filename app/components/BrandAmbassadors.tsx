import Image from "next/image";
import Link from "next/link";
import { brandAmbassadors } from "@/lib/brand-ambassadors";

export default function BrandAmbassadors() {
  const primary = brandAmbassadors.find((ambassador) => ambassador.primary) ?? brandAmbassadors[0];
  const supporting = brandAmbassadors.filter((ambassador) => ambassador.id !== primary.id);

  return (
    <section className="ambassadorSection" aria-labelledby="brand-ambassadors-title">
      <div className="sectionKickerRow">
        <div>
          <p className="eyebrow">HUMAN-CENTERED PRODUCT GUIDANCE</p>
          <h2 id="brand-ambassadors-title">Meet the RTPSC brand ambassadors.</h2>
        </div>
        <p>
          Distinct product voices help visitors find the right workspace faster while keeping regulated and
          consequential decisions behind human review.
        </p>
      </div>

      <div className="ambassadorFeature">
        <div className="ambassadorPortraitWrap">
          <div className="ambassadorGlow" aria-hidden="true" />
          <Image
            className="ambassadorPortrait"
            src={primary.asset}
            alt={`${primary.name}, ${primary.role}`}
            width={1200}
            height={1500}
            sizes="(max-width: 900px) 100vw, 46vw"
          />
        </div>
        <div className="ambassadorFeatureCopy">
          <div className="personaStatus"><span aria-hidden="true" /> DIGITAL PERSONA</div>
          <p className="personaDivision">{primary.division}</p>
          <h3>{primary.name}</h3>
          <p className="personaRole">{primary.role}</p>
          <p className="personaDescription">{primary.description}</p>
          <div className="capabilityChips" aria-label={`${primary.name} capabilities`}>
            {primary.capabilities.map((capability) => <span key={capability}>{capability}</span>)}
          </div>
          <div className="actions compactActions">
            <Link className="button primary" href="/andreaa">Meet Andreaa</Link>
            <Link className="button" href="/support">Ask for guidance</Link>
          </div>
        </div>
      </div>

      <div className="ambassadorGrid">
        {supporting.map((ambassador) => (
          <article className={`ambassadorCard ambassador-${ambassador.accent}`} key={ambassador.id}>
            <div className="ambassadorCardImage">
              <Image
                src={ambassador.asset}
                alt={`${ambassador.name}, ${ambassador.role}`}
                width={900}
                height={1100}
                sizes="(max-width: 680px) 92vw, (max-width: 1050px) 45vw, 30vw"
              />
            </div>
            <div className="ambassadorCardBody">
              <p className="personaDivision">{ambassador.division}</p>
              <h3>{ambassador.name}</h3>
              <p className="personaRole">{ambassador.role}</p>
              <p>{ambassador.description}</p>
              <div className="capabilityChips compactChips">
                {ambassador.capabilities.map((capability) => <span key={capability}>{capability}</span>)}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
