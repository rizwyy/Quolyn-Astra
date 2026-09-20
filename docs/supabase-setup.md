# Supabase setup

## Connected development environment

The user selected and authorized restoration of project `ahctcbpvbrdeoqrtwvva` in Mumbai. Supabase MCP was used to inspect tables, extensions, policies, migrations and buckets; apply Quolyn migrations; deploy `analyse-enquiry`; generate TypeScript types; and run advisors. Existing `public.profiles`, `public.customers` and the original account were preserved.

The local `.env` contains only this project's URL and publishable key. It is ignored by Git. There is no service-role or AI key in the application configuration. Developer MCP authorization is never exposed to application users.

## Run against the connected project

1. Use Node 24.11 or later (Node 24.19 was used for verification).
2. `npm ci`
3. Ensure `.env` has `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. `npm run dev` and open http://localhost:3000.
5. Create your own account and workspace. Add the distributor's address and defaults in Settings.

For a production build, run `npm run build`, then load the environment when starting the server, for example `node --env-file=.env .output/server/index.mjs`. A built Nitro server does not automatically load `.env`.

## Authentication configuration

In Supabase Authentication → URL Configuration, set the intended Site URL and explicitly allow the application callback URL, e.g. `http://localhost:3000/api/auth/callback` (and the equivalent 127.0.0.1 address when used). For recovery, also allow the callback with `?next=recovery`. Add the real HTTPS origin before hosting.

The callback accepts a PKCE `code` or Supabase email-template `token_hash` with `type=signup`, `email` or `recovery`. When using token-hash email templates, point the confirmation URL to `/api/auth/callback?token_hash={{ .TokenHash }}&type=signup` and the recovery URL to `/api/auth/callback?token_hash={{ .TokenHash }}&type=recovery` on your application origin. Retain Supabase's actual template syntax and configure it in the dashboard.

Hosted SMTP delivery and the user's email inbox are not verified by automated local tests. Local tests exercise registration, token confirmation, recovery and session restoration using an isolated Supabase Auth instance. Before inviting a distributor, verify one real confirmation and recovery email yourself.

The security advisor reports leaked-password protection disabled. Enable it if available for the selected plan: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection. No unrelated authentication settings were changed silently.

## Reproducible schema

All Quolyn changes are in `supabase/migrations`. Local filenames match remote migration versions returned by MCP. Do not replay already-applied migrations using the SQL editor. Never reset this shared hosted project.

For another empty development project: inspect it, apply the migrations in order with Supabase CLI/MCP, deploy the Edge Function, then generate types. `npm run db:types` generates types from a running local stack; for hosted work use MCP `generate_typescript_types` or the documented CLI project option. The checked-in `shared/types/database.generated.ts` comes from the selected project and therefore also includes its untouched pre-existing tables.

## Local backend

Docker Desktop is required. `npm run db:start` starts the full stack. A lighter development stack can exclude `realtime,imgproxy,studio,logflare,vector,supavisor,postgres-meta`. Use the pinned CLI's `--help` before changing commands. Store local status output in a private file; it includes administrative credentials and must never be committed.

Use `supabase status` to obtain the local API URL and publishable/anon key. Put those public values in a separate local environment file and start the application with them. Test setup may use local admin credentials to create fixture accounts; security assertions themselves use ordinary authenticated and anonymous clients.

## Private Storage

- `catalogue-imports`: 10 MB CSV/XLSX originals.
- `quote-documents`: immutable PDF/CSV paths, 10 MB maximum.
- `workspace-assets`: owner-uploaded PNG/JPEG logo, 2 MB maximum.

Every path starts with the workspace UUID. Membership controls reads and inserts. There are no ordinary update/delete policies, preserving existing assets and quote files. Downloads use short-lived signed links after user-authorized record lookup. Storage retention and cleanup are a production operations task.

## Optional Gemini provider

Set `GEMINI_API_KEY` and `GEMINI_MODEL` using Supabase Edge Function secrets. Do not enter them in chat or frontend configuration. Choose a currently available model in your own provider account; no model is hardcoded. Redeploy the included `analyse-enquiry` files if needed. The function performs explicit authentication, so its checked-in `verify_jwt=false` does not allow anonymous access.

Deterministic mode works without these secrets. AI errors are shown and do not replace saved interpretation. Live Gemini calls, provider billing, model behavior and provider data-processing terms remain unverified until configured.

## Official references

- SSR client and cookie integration: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Nuxt installation/runtime requirements: https://nuxt.com/docs/4.x/getting-started/installation
