# XML route registration

The production application exposes standards-based XML discovery and a proprietary route-readiness contract.

| Resource | Purpose |
|---|---|
| `/sitemap.xml` | Search-engine discovery for public HTML pages |
| `/robots.txt` | Crawler policy and sitemap pointer |
| `/route-registry.xml` | Machine-readable page/API inventory and expected response contract |
| `/schemas/route-registry.xsd` | XML Schema for the route registry |
| `/opensearch.xml` | OpenSearch discovery metadata |

`lib/public-routes.ts` is the single source of truth for page metadata. The Next.js sitemap and XML registry are generated from that typed registry. Operational settings and APIs are deliberately excluded or disallowed from search indexing even when their readiness endpoints remain testable.
