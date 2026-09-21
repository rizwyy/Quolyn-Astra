# Quolyn architecture

Quolyn is a distributor quotation pilot, not an ERP, accounting system, inventory reservation service or autonomous sales agent.

## Request and trust boundaries

Nuxt 4 serves Vue pages and authenticated server operations for spreadsheet preview, fictional demo loading, document export and saved-document downloads. `@supabase/ssr` keeps sessions in cookies; protected middleware calls `getUser()`, and every protected server handler independently validates the user. Normal queries and Storage operations carry the user's identity. The application does not need a service-role key.

Supabase PostgreSQL owns membership, transactional quote saving, exact pricing, optimistic version checks, numbering and status transitions. Supabase Storage keeps original catalogue uploads, assets and exports private. The deployed `analyse-enquiry` Edge Function authenticates with `getUser()` in its body, rate limits, validates extraction and stores analysis transactionally. Gateway `verify_jwt` is disabled because authentication is handled explicitly in the function and modern publishable keys are supported. This is not an anonymous function.

The selected project already had `profiles` and `customers`. To preserve that application, all new tables are named `quolyn_*` in `public`. Privileged implementation functions live in `quolyn_private`; restricted invoker wrappers expose named operations. Migrations do not alter the pre-existing tables, policies or accounts.

## Data model

- `quolyn_profiles`, `quolyn_workspaces`, `quolyn_workspace_members`: identity and authorization.
- `quolyn_products`, `quolyn_product_aliases`, `quolyn_units`, `quolyn_catalogue_imports`: catalogue and imports.
- `quolyn_customers`, `quolyn_enquiries`, `quolyn_enquiry_lines`, `quolyn_match_candidates`: requests and human review.
- `quolyn_quotes`, `quolyn_quote_lines`, `quolyn_quote_documents`, `quolyn_quote_counters`: commercial records and snapshots.
- `quolyn_activity_logs`: immutable event records. `quolyn_private.analysis_limits`: controlled counters.

Composite workspace/id foreign keys reject cross-business relationships. An immutable-workspace trigger rejects reassignment even when a caller belongs to both workspaces. Membership grants do not permit direct insert, update or delete. Workspace creation and owner membership are atomic and retry safe. Table grants are deliberately narrower than RLS: quote tables, counters and logs are not directly writable by users.

## Pricing contract

Quantities and conversions use exact PostgreSQL numeric values. Authoritative monetary calculations occur in `quolyn_private.save_quote`. The Decimal.js module provides a separately testable reference implementation.

1. Convert only the same unit, m²/ft² (`1 ft² = 0.09290304 m²`), or workspace-configured units within the same dimension. Owner-defined factors are relative to m², linear metres or each. Linear metres are never derived from area.
2. When pack coverage is provided, calculate packs using ceiling division and retain delivered coverage separately.
3. For box prices, bill packs. For area prices, bill explicitly selected requested or delivered coverage.
4. Round gross minor units half away from zero (all accepted quantities/prices are nonnegative).
5. Round the discount to minor units, subtract it, then calculate and round tax.
6. Sum included line totals. Alternatives remain outside the total.

A manual discount replaces the customer default. A price override preserves the selected discount and requires a reason. Cost is never assumed to be zero; incompatible cost units mean margin unavailable. Explicit tax zero is valid. Missing tax blocks readiness. Currency conversion and automatic wastage are absent. Product money and totals are bounded below JavaScript's safe integer boundary when serialized. This pilot does not claim tax compliance.

## Lifecycle and files

Drafts can retain incomplete values, but they have no final total. Save validates every included line. Ready and sent transitions check validation on the backend. Editing ready commercial values returns the quotation to needs review. Editing an issued quote creates a new revision linked to the original; the original snapshot remains unchanged. Status changes are manual and never send a message.

PDF/CSV generation reads the persisted snapshot. Only public commercial fields enter exports; internal costs, margins and enquiry notes are excluded. Private downloads use 60-second signed URLs. Each file has a new immutable path, with no client update/delete policy. Generated-file metadata checks membership, quote version and path. Files can be downloaded again from their saved record.

## AI boundary

Deterministic extraction is deliberately conservative: explicit quantities only, unknown accessory quantities, and ambiguous delivery notes. Gemini is an optional provider adapter controlled by `GEMINI_API_KEY` and `GEMINI_MODEL` Edge secrets. It extracts requirements only; candidate retrieval remains deterministic. The strict schema does not accept product IDs or pricing fields. Inputs are bounded to 16,000 characters, outputs to 60 lines, provider timeout to 25 seconds, and generation to 6,000 tokens. There are no automatic provider retries. Limits are 30 requests per user/workspace/hour and 150 per workspace/hour.

## Operational limits

10,000 products/workspace, CSV/XLSX files up to 10 MB, expanded XLSX XML up to 30 MB, 20 worksheets, 100 columns, 100 quote lines, 2 MB PNG/JPEG logos. Imports validate first, use 50-row batches and content/mapping-derived IDs, and save progress. Duplicate SKU handling is explicitly skip or replace. Normal tables support one workspace in the UI; team invitations and role-management UI are intentionally excluded.

Catalogues and matching require real distributor validation. Search labels are heuristics, not calibrated confidence. An unknown catalogue attribute cannot establish suitability.
