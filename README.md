# Quolyn

**From enquiry to accurate quote.** A Nuxt/Supabase pilot for human-reviewed distributor quotations.

Import a catalogue → paste an enquiry → resolve requirements → select products → review pricing → export a private PDF or CSV. Quolyn never sends messages, places orders or claims unknown product suitability.

## Run

Use **Node 24.11+**. This workspace was verified using Node 24.19.

```sh
npm ci
cp .env.example .env  # only on a fresh checkout; preserve an existing .env
# Set the Supabase URL and publishable key locally.
npm run dev
```

Open http://localhost:3000. The existing ignored `.env` in this workspace points at the user-selected Supabase development project. Create your own account and workspace, fill in distributor details, then import your catalogue or load clearly fictional demo data from Settings.

```sh
npm run typecheck
npm test
npm run build
node --env-file=.env .output/server/index.mjs
```

## Implementation

- Real email/password Supabase Auth, SSR cookie sessions, confirmation/recovery callback and protected operations.
- Atomic workspace creation, owner settings and workspace-isolated business records.
- Catalogue editing, CSV/XLSX preview and mapping, bounded imports, explicit duplicate handling, retry-safe identifiers and reports.
- Customer records, enquiry capture, deterministic or optional AI extraction, manual corrections, product comparison and review.
- Exact backend pricing, pack/area distinctions, discount replacement, tax after discount, incomplete drafts and review gates.
- Atomic quote numbering, retry safety, edit-conflict detection, issued snapshots and linked revisions.
- Private uploads and saved PDF/CSV documents, 60-second download links, embedded Unicode font and multipage layout.
- Fictional catalogue and examples, activity history, unit tests, live-client isolation tests and Playwright workflows.

## Connected versus configured

The user-selected project `ahctcbpvbrdeoqrtwvva` was restored. Supabase MCP applied the checked-in Quolyn migrations, deployed the authenticated `analyse-enquiry` function, generated database types and ran advisors. Three private storage buckets are configured. Pre-existing tables and the original account were preserved. New tables use a `quolyn_` prefix.

The frontend has **not been published**. Gemini requires server-side `GEMINI_API_KEY` and `GEMINI_MODEL`; no live AI provider was configured or tested. Hosted email delivery and production redirect settings still need a real inbox check before customer onboarding. This is a pilot, not evidence of adoption, revenue or production readiness.

See [verification report](docs/verification.md) for the exact tested scope and outstanding limitations.

## Guides

- [Architecture and trust boundaries](docs/architecture.md)
- [Supabase, auth and optional AI setup](docs/supabase-setup.md)
- [Pilot walkthrough and evidence-based decision rule](docs/pilot-testing.md)
- [Sample catalogue](public/sample-catalogue.csv)

## Tests against a local backend

Start Docker and `npm run db:start`. On a fresh local stack the migrations are applied automatically. Do not reset the hosted project.

```sh
npx supabase status -o json > /tmp/quolyn-local-status.json
node --import tsx scripts/prepare-local-tests.ts
node --env-file=artifacts/.env.local-tests --import tsx tests/integration/security.ts
```

Local status includes administrator credentials: keep it private. The preparation script refuses remote URLs; the test assertions use ordinary signed-in and anonymous clients. The suite creates fictional records. To repeat the hosted checks, explicitly supply a dedicated fixture file with test-account credentials through `TEST_FIXTURES` and the selected public URL/key. Never use a real customer's password.

For browser tests, start the built app with the local environment on port 3003, then run:

```sh
PORT=3003 node --env-file=artifacts/.env.local-tests .output/server/index.mjs
# In another terminal:
TEST_LOCAL_AUTH=1 TEST_APP_URL=http://localhost:3003 node --env-file=artifacts/.env.local-tests node_modules/@playwright/test/cli.js test
```

Playwright uses installed Google Chrome (`channel: 'chrome'`). Install Chrome or change the channel and install the corresponding Playwright browser. The local auth test uses administrator privileges only to generate test confirmation/recovery links; user flows operate through normal authentication.

## Intentional pilot boundaries

No email/WhatsApp connector, payment billing, OCR, ERP sync, customer portal, purchasing, inventory reservations, vector search or team invitations. Matching is heuristic. Conversions cover each, boxes, m²/ft², linear metres and owner-configured compatible units. Different cost-unit margin conversions are not implemented; the margin stays unavailable. A 10,000-product local fixture passed the capacity and paginated-search checks; real hosted catalogue latency still needs measurement. Operational monitoring, retention/deletion and production deployment are follow-up work.

The next commercial step is one distributor and five real enquiries. Test whether catalogue quality and review effort support a paid assisted pilot before adding scope.
