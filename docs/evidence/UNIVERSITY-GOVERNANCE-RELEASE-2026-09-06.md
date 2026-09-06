# University Governance and Academic Controls Release Evidence

**Release time:** 2026-09-06 05:29 UTC  
**Approver:** Business owner authorization supplied in project directive  
**Technical executor:** Codex release agent  
**Repository:** ceortpsc/TAXPRACTITIONERVIRTUALOFFICE  
**Branches:** main and staging  
**Commit:** 9d6f92ed55b2db619fa90e8623ab62613f523fa4  
**Production deployment:** dpl_2F7MdhcLRp8vxgwCqiPLzAJX5DN7  
**Deployment URL:** https://tax-practitioner-virtual-office-85r4amd9y-condrer-3533.vercel.app  
**Aliases reported by Vercel:** rosstaxsoftware.com; www.rosstaxsoftware.com; tax-practitioner-virtual-office.vercel.app

## Verified

- Vercel deployment state READY and source commit matched.
- Lint and strict TypeScript passed.
- Seventeen security, authorization, academic-gate, GPA, bookstore, assessment, and governance tests passed.
- Static secret scan passed.
- Next.js production build passed and generated 66 pages.
- Public bookstore route returned HTTP 200 through Vercel authenticated fetch.
- Governance/manual PDF generated as a 21-page Letter document with no JavaScript and visually inspected as a contact sheet.
- Schema lock contains SHA-256 hashes for migrations 009 through 012.
- Duplicate assessment/proctoring relation names were reconciled before this evidence record.

## Configured, not operational

- Governance registry, board records, approvals, exceptions, and institutional assessment schema.
- Assignment, grade, GPA, attendance, schedule, degree-audit, intervention, and appeal schema.
- Bookstore/resource, EPUB, rights, offer, and entitlement schema.
- 221-item course-bank blueprint, secure item/form/attempt/response, and proctoring schema.
- Student progress interface and API use synthetic demonstration data only.

## Blocked or deferred

- Database migrations are not marked applied: no authoritative production database execution evidence was available.
- Clerk-backed authenticated flow, organization isolation, and student progress identity were not end-to-end verified in this release.
- The direct deployment has Vercel Deployment Protection; some automated route fetches returned the protection redirect instead of application content.
- DNS resolution and certificate validation for the custom domain were not independently completed from the restricted runtime, although Vercel reported both aliases without alias error.
- Accreditation, Texas degree-granting authority, Title IV/FAFSA participation, TWC applicability, clearinghouse participation, court approval, live proctoring, paid bookstore checkout, and credential conferment remain blocked.
- The 221-item standard defines the required reviewed bank composition. It does not claim that 221 valid questions have been authored and approved for every course.

## Rollback

Promote prior known-good production deployment `dpl_BpaBgeqvG5FRNTYkPBQfsADVHn5n`, or restore Git refs to commit `7ca5eacab46d1e81366bd9bcbbd07e82c149903f`. Do not delete identity, student, audit, or evidence records. No migrations from this release were verified as applied, so no database down migration is authorized by this record.
