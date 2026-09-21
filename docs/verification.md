# Quolyn pilot verification

Verified 21 September 2026. This report distinguishes working code, actual connected services and external setup still required. All fixtures are fictional; their counts and timing measurements are not customer adoption or time-savings evidence.

## Connected services

The explicitly selected Supabase project `ahctcbpvbrdeoqrtwvva` is restored and active. Ten Quolyn migrations have been applied using Supabase MCP, with matching local migration versions. The checked-in types were regenerated from the project. `analyse-enquiry` version 3 is deployed and authenticates requests through Supabase Auth. The three private Storage buckets and their workspace policies are active. Pre-existing `public.profiles`, `public.customers` and the original account were preserved.

The Nuxt frontend runs locally. It has not been hosted or published. The configured production build uses the real hosted Supabase backend, not browser-only persistence.

## Automated evidence

| Check | Result and scope |
| --- | --- |
| TypeScript | `npm run typecheck` passed. |
| Production bundle | `npm run build` passed on Node 24.19. |
| Unit tests | 26 passed, including exact pricing, custom dimensions, pack/area conversion, discount replacement, half-up rounding, CSV formula safety, CSV/XLSX parsing, strict extraction, conflicts/unknown attributes and PDF text checks. Poppler was available; the PDF test ran. |
| Hosted integration | 51 passed using ordinary authenticated and anonymous HTTP clients against the selected Supabase project. |
| Local integration | The same 51 checks passed against local Supabase. Local administrator access is confined to fixture preparation. |
| Hosted browser | 2 passed: the full workflow and anonymous-route/export denial. The local-only Auth test was intentionally skipped in this run. |
| Local Auth browser | 1 passed: registration, workspace creation, reload, logout, confirmation callback and password recovery. |
| Dependency audit | `npm audit --omit=dev`: zero reported vulnerabilities at verification time. This is a point-in-time dependency check, not a security guarantee. |
| Capacity | 10,000 fictional products inserted through ordinary local authenticated clients in 50-row batches; the 10,001st product was rejected and updating an existing item at capacity succeeded. Alias and exact SKU lookup passed. |

The integration suite checks permitted reads, rejected cross-workspace access, membership tampering, editable metadata, workspace reassignment, inconsistent foreign keys, audit manipulation, direct quote/line tampering, private-file isolation, exact totals, incomplete review gates, optimistic concurrency, idempotent creation/revision retries, concurrent quote numbers, snapshot preservation and ready-state invalidation. It also checks unconfigured-provider failure, anonymous Edge denial, custom-unit ownership, unknown/conflicting specifications requiring clarification, server-derived correction counts and transactional combine rollback.

Local capacity measurements were 10.87 seconds for 10,000 inserts and 257.9 ms for one paginated search. These are local fixture observations, not hosted performance guarantees. See `tests/integration/scale.ts`; its temporary local dataset was removed afterward.

## Browser and document evidence

The browser suite uses installed Google Chrome and the built Nuxt application. It covers login, cookie restoration after reload, worksheet preview, CSV import, enquiry capture, authenticated deterministic extraction, missing-information resolution, product selection, confirmed review, quote calculation, readiness, reopening records and private PDF/CSV downloads. A separate local Auth test covers registration, first workspace, logout, confirmation callback and recovery callback/password change. Hosted email inbox delivery is outside that test.

The reference quotation requests 100 m² with 2.4 m² per box: 42 boxes deliver 100.8 m². At ₹1,200 per box, a 5% replacement discount and 18% tax produce ₹56,498.40. The persisted snapshot, browser preview and PDF agree. CSV exports exclude internal costs/margins. Draft PDF text checks require the draft label, unresolved values and no final total; customer-facing output must not include internal fields.

PDFs were rendered with Poppler. The single-page reference and all pages of a 13-page long-description fixture were visually inspected. Currency glyphs, line detail, totals and page footers remained readable without clipping. A 900-pixel tablet dashboard was visually inspected and the browser checked for horizontal overflow.

Screenshots, test PDFs, local fixture configuration and run outputs are intentionally ignored in `artifacts/`. Test credentials are temporary files outside the repository and are never application credentials for a real customer. Hosted verification records remain isolated in the dedicated fictional test workspaces.

## Requirement audit

| Area | Implemented and verified boundary |
| --- | --- |
| Accounts and workspaces | Real Supabase Auth, SSR cookies, independent server validation, atomic owner workspace creation, owner settings and workspace RLS. Registration/confirmation/recovery browser checks use local Auth; hosted login/reload is exercised against real Supabase. |
| Catalogue and customers | Product CRUD/deactivation, filters, alias lookup, CSV/XLSX preview and mapping, explicit duplicate rules, 50-row imports, stable retry IDs, error reports and related customer records. |
| Enquiry review | Original request preserved, editable extraction, add/remove/split/combine, missing information, clarification, exclusions, manual items, comparison drawer and persisted candidate reasons. |
| Matching | Exact SKU, manufacturer code, alias, full-text, then fuzzy ranking; up to five workspace candidates; Strong/Possible/Weak heuristic labels with separate specification checks. |
| Analysis | Authenticated deterministic mode works without secrets. Strict Gemini adapter is implemented; no provider credentials were configured or real Gemini generation tested. AI output cannot supply product IDs or authoritative prices. |
| Pricing | Exact database arithmetic, explicit dimension factors, pack rounding, requested/delivered billable basis, nonstacking discounts, tax after discount, missing margin state and readiness blockers. |
| Quote lifecycle | Transactional saves, idempotency, version conflicts, atomic numbering, review transitions, manual statuses, snapshots and linked issued revisions. |
| Documents | Persisted snapshots, private PDF/CSV exports, short-lived links, saved-document records, embedded font, draft marking and multipage rendering. |
| Pilot measurement | Stored counts, trusted activity, manual corrections, selected/replaced matches, unresolved lines and quote completion events. No labour-saving claims. |
| Demonstration | Optional repeatable fictional catalogue/customer/enquiries; sample import file, ambiguous request and complete reference example. |

## Advisors and remaining external configuration

The final security advisor reported one warning: leaked-password protection is disabled. Enable it if supported by the project's plan; see [Supabase password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). It reported no Quolyn table/RLS security finding. Passing advisors alone does not establish isolation; the HTTP-client tests above provide separate evidence.

The performance advisor's seven policy warnings concern the pre-existing `public.profiles` and `public.customers`, which this build does not alter. Informational unused-index notices are expected on a new pilot. They do not justify removing relationship/search indexes without real workload evidence.

Before inviting an external distributor:

1. Choose hosting, deploy Nuxt and configure its HTTPS origin in Supabase Auth redirects.
2. Verify one real hosted registration/confirmation email and one recovery email. Configure SMTP/deliverability as needed.
3. Decide whether to use the optional AI provider; configure Edge secrets only if wanted. Deterministic mode is already usable.
4. Establish backups, monitoring, retention/deletion procedures and a recovery exercise appropriate to real customer data.
5. Test one real redacted catalogue and five recent enquiries with the distributor. Record mismatches, corrections and completion against their current process; ask for a paid pilot commitment.

Different cost-unit conversions remain outside the margin calculation: margin is explicitly unavailable in that case. There is no currency conversion, automated tax-compliance claim, inventory reservation, message delivery, ERP sync, OCR, billing, or team invitation interface. Those are intentional scope boundaries.
