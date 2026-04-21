# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 1. Project Context

**MOOM — Gym Management Platform.** Multi-location fitness business management: members, classes, schedule, packages, finance, gamification, and LINE integration.

**Five user roles** — treat Member as a first-class surface, not an end-user of admin:

| Role | Surface | Auth |
|------|---------|------|
| Owner (`level_4_master`) | Admin (full + Diagnostics) | Email/password |
| Manager (`level_3_manager`) | Admin (CRUD: staff, finance, packages) | Email/password |
| Trainer (`level_2_operator`) | Trainer app (mobile) + Admin read-mostly | Email/password |
| Front Desk (`level_1_minimum`) | Staff app (mobile) — check-in / lookup | Email/password |
| **Member** | Member app (mobile; Gen-Z / Elder personas) | LINE LIFF → `line-auth` edge fn |

**Production routing** (source of truth: `src/apps/shared/hostname.ts`):

| Surface | URL pattern |
|---------|-------------|
| Admin | `admin.moom.fit/*` (desktop-first) |
| Member | `member.moom.fit/member/*` (mobile-first; 22 pages) |
| Trainer | `member.moom.fit/trainer/*` |
| Staff | `member.moom.fit/staff/*` |
| LIFF callbacks | `member.moom.fit/liff/{member,trainer,callback}` |
| Preview / staging | `moom.lovable.app` (Lovable-hosted; doubles as staging) |
| Dev preview | `id-preview--*.lovable.app` (per-PR, login-gated) |

Trainer/Staff share the **member.moom.fit** subdomain because surface grouping is by **device profile** (mobile vs desktop), not role hierarchy. Both staff and member auth land in the same `auth.users`; the `handle_new_user` trigger routes by `signup_surface` metadata. Member RLS uses `get_my_member_id()` (own-data only); staff RLS uses `has_min_access_level()`.

## 2. Tech Stack

- **Frontend** — React 18 + TS 5 · Vite 5 (SWC) · Tailwind 3 + shadcn/ui (slate) · TanStack Query 5 · react-router-dom 6 · react-hook-form + Zod · i18next (EN/TH) · recharts · date-fns 3 · lucide-react
- **Backend** — Single Supabase project `qedxqilmnkbjncpnopty` (Lovable-managed; no separate staging Supabase). Postgres + Auth + Realtime + Storage + **17 Edge Functions** (Deno). RLS + 4-tier `access_level` enum. **91 migrations** under `supabase/migrations/`.
- **External** — Stripe (checkout + webhook) · LINE LIFF/OA · **Lovable AI Gateway → Gemini Flash** (`daily-briefing` edge fn)
- **Tooling** — Bun (`bun.lock` / `bun.lockb` committed; `package-lock.json` gitignored) · Vitest + jsdom (setup at `src/test/setup.ts`) · ESLint flat config · Lovable platform (auto-deploy on push)

## 3. Architecture Rules

**Files & naming**
- Pages: `PascalCase.tsx`
- Components: `<feature-folder>/PascalCase.tsx` (kebab folder)
- Hooks: `useCamelCase.ts` (shadcn lib uses kebab — `use-mobile.tsx`, `use-toast.ts` — documented exception)
- Path alias `@/*` → `src/*` (set in `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`)
- Vite config dedupes `react`, `react-dom`, `react/jsx-runtime`, `@tanstack/react-query` — do not add another copy. HMR overlay is disabled.

**Folder placement (enforced)**
- Admin pages → `src/pages/*.tsx` (48 pages, mostly flat-imported in `src/App.tsx`)
- Surface pages → `src/apps/{member,trainer,staff}/pages/*.tsx`
- Domain hooks → `src/hooks/use*.ts`
- Shared utils → `src/lib/*.ts`
- Auto-generated (do not edit) → `src/integrations/supabase/{client,types}.ts`

**State pattern (enforced)**
- Server state → TanStack Query in `src/hooks/useXxx.ts`; keys **always** declared in `src/lib/queryKeys.ts` (never inline)
- UI local → `useState` / `useReducer`
- Cross-cutting → existing Contexts only (`AuthContext`, `LanguageContext`, `SurfaceContext`)
- No new global stores (Redux/Zustand/Jotai)

**Realtime** — Single global `useRealtimeSync` subscribes to ~34 tables and auto-invalidates query caches via `TABLE_INVALIDATION_MAP`. New tables that need live updates **must** be added there.

**Cross-surface links** — Use `buildCrossSurfaceUrl(surface, path)` and `getSurfaceBaseUrl(surface)` from `src/apps/shared/hostname.ts`. Never hardcode hostnames. Shared (host-agnostic) prefixes: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/checkin`, `/liff`, `/diagnostics/surface`, `/diagnostics/auth`.

**Activity log** — Every mutation calls `logActivity()` from `src/lib/activityLogger.ts` in `onSuccess`. The `activity_log` table is append-only.

**i18n** — EN/TH locales at `src/i18n/locales/{en,th}.ts`. New user-facing strings **must be added to both**.

**Testing** — Test files live next to source as `*.test.ts(x)` under `src/**`. There is no separate typecheck script — `tsconfig.json` is intentionally loose; rely on `bun run build` to surface type errors.

## 4. Database Rules

- **RLS default deny.** Every new table must `ENABLE ROW LEVEL SECURITY` + at least one policy. Use canonical helpers `has_min_access_level()` (staff) and `get_my_member_id()` (member). Never disable RLS to fix a bug — fix the policy.
- **Migration source.** Lovable platform auto-generates `supabase/migrations/<timestamp>_<uuid>.sql` when schema is changed via Lovable AI / Supabase Studio. Do not author migrations by hand unless absolutely necessary.
- **Migration immutability.** Once deployed to prod, migrations are append-only — never edit, delete, or reorder. Rollback = write a NEW reverse migration. Migrations in an unmerged PR are still mutable.
- **No schema change without a migration file.** Direct dashboard edits without migration capture = drift.
- **Naming.** snake_case tables / columns / enums / RPCs.

## 5. Coding Standards

- **TypeScript is intentionally loose** (`strictNullChecks: false`, `noImplicitAny: false`, `allowJs: true`, `noUnusedLocals/Parameters: false`). ESLint disables `@typescript-eslint/no-unused-vars`. **Do NOT migrate to strict** — Lovable AI generates UI code that would fail strict null checks.
- **Mutation pattern.** `useMutation` → on success: `toast.success(t(...))` + `logActivity({event_type, ...})` + `queryClient.invalidateQueries(...)`; on error: `console.error('[hookName] action failed', err)` + `toast.error(t(...))`. Look at any `src/hooks/use*.ts` for canonical shape.
- **Comment language.** English by default; Thai allowed when a business term is clearer in Thai. i18n strings must exist in both EN/TH locales.
- **Formatting.** 2-space indent, semicolons, ~100-char line. No prettier/editorconfig configured — rely on ESLint + defaults.

## 6. Git Workflow

- **Branches.** No enforced prefix; Lovable creates feature branches automatically.
- **Commit messages.** Free-form imperative, capitalized first word ("Add live activity feed", "Fix package purchase flow"). Not Conventional Commits. Avoid placeholder commits (`wip`, `asdf`).
- **Never commit.**
  - Service-role key, Stripe secret, LINE channel secret (they live in Supabase Edge Function secrets)
  - `node_modules/`, `dist/`, `package-lock.json` (already gitignored)
  - Edits to `src/integrations/supabase/{client,types}.ts` (auto-generated)
- **`.env` IS committed** — it contains only `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY` (the public anon key). Safe by Supabase design.

## 7. Do Not

**Banned libraries**
1. `moment.js` → use `date-fns 3` (project provides `useDateLocale()` wrapper)
2. `axios` → use `supabase-js` in the client + native `fetch` in edge functions
3. `lodash` full import → use native ES; if needed, `lodash-es` with deep import paths only
4. Redux / Zustand / Jotai → use TanStack Query + the existing Contexts
5. Direct AI SDKs (`openai`, `@anthropic-ai/sdk`, etc.) → route through Lovable AI Gateway only

**Do-not-touch files (auto-overwritten or system-critical)**
- `src/integrations/supabase/{client,types}.ts` (auto-generated)
- `.env` (Lovable Cloud manages `VITE_SUPABASE_*`)
- `supabase/migrations/*.sql` already deployed → revert via NEW migration
- `src/components/ui/*` (shadcn primitives; wrap in new component, don't modify)
- `supabase/config.toml` project-level settings (per-function blocks may be added when registering new edge functions)

**Require explicit approval before editing**
- `src/contexts/AuthContext.tsx` (auth-critical)
- `src/apps/shared/hostname.ts` (surface routing — affects all 4 surfaces)
- `src/App.tsx` route table and the global `useRealtimeSync` hook
- RLS policies in migrations

**Security / runtime don'ts**
1. Never disable RLS — fix the policy instead. Multi-location isolation depends on it.
2. Never use `service_role` in the frontend — frontend uses anon key + JWT only; `service_role` lives in edge-function secrets.
3. Never rely on UI-hide alone for permissions — hide via `can('domain', 'action')` AND enforce in RLS / RPC `SECURITY DEFINER`.
4. Never call AI from the client — all AI calls go through edge functions.
5. Never use anonymous sign-ups — always email/password or LINE LIFF flow.
6. Never skip `logActivity()` on DB mutations (audit policy).
7. Never use raw English status text in UI — always go through i18n.

## 8. Common Commands

```
bun install                                  — install deps
bun run dev                                  — dev server (Vite, port 8080, host ::)
bun run build                                — production build (also surfaces TS errors)
bun run build:dev                            — dev-mode build (keeps lovable-tagger)
bun run preview                              — preview the built bundle
bun run lint                                 — ESLint
bun run test                                 — vitest (jsdom; setup at src/test/setup.ts)
bun run test:watch                           — vitest watch mode
bunx vitest run src/lib/dateRange.test.ts    — single test file
bunx vitest run -t "engagement score"        — single test by name
```

Supabase migrations, edge-function deploys, and DB pushes are managed automatically by Lovable Cloud — no manual CLI required.

## 9. Context Files to Read

```
✨ MUST READ (every session)
  - docs/PROJECT_MEMORY.md     (architecture invariants)
  - docs/CONTRACTS.md          (event keys, slip flow, routes)
  - docs/PLATFORM_CONTRACT.md  (envelope, lifecycles, perms)
  - APP_ANALYSIS.md            (full feature inventory)

📖 PER TASK (read when working on that area)
  - docs/INTEGRATION_NOTES.md  (page → hook → table map)
  - docs/DEVLOG.md             (recent change log; append an entry for any non-trivial change)
  - docs/SMOKE_TEST.md         (manual smoke checklist)

🔍 ON DEMAND (deep-dive references)
  - docs/data-contract*.md     (per-domain data contracts: members, leads, packages, schedule, …)
  - docs/gamification-*.md     (XP / Coin / SP / Badge system)
  - docs/ECONOMY_V2.md         (gamification economy)
  - .lovable/plan.md           (current Lovable AI plan)
```

---

## Hard Invariants (DO NOT BREAK)

From `docs/PROJECT_MEMORY.md` — these apply repo-wide:

1. **MobilePageHeader everywhere.** All member/trainer/staff pages use `MobilePageHeader`. Do not add inline `ArrowLeft` back buttons or custom header divs — back navigation goes in the `action` prop.
2. **Coming Soon pattern.** Unimplemented items use `opacity-60 pointer-events-none` with a "Coming Soon" subtitle. No click handler, no chevron icon, no `toast.info("coming soon")`. Every clickable button on a live surface must be wired to real logic.
3. **Gamification event keys.** Emitters must send keys that match `gamification_rules.action_key`: `class_attend`, `package_purchase`, `check_in` — not the legacy `class_attended` / `package_purchased` (still in the DB enum but not to be used in new emitter calls). See `src/lib/gamificationEvents.ts` and `docs/gamification-event-map.md`.
4. **Transfer slips are the canonical review entity.** Member uploads → `transfer_slips` (status `needs_review`) via `member_upload_slip` RPC. Admin approval → `approve-slip` edge function (atomic write of `transactions` + `member_billing` + `member_packages` + fires `package_purchase`). Do not write directly to `transactions` from upload paths.
5. **Idempotency.** Attendance has unique index `idx_member_attendance_idempotent` on `(member_id, schedule_id)`; bookings unique on `(schedule_id, member_id)`. New ledger writes (XP/coin/SP) must be idempotent — see existing patterns in `gamification-process-event`.
6. **Permission UX mirrors RLS.** Hide write/delete buttons via `can('domain', 'action')` AND rely on RLS as the real boundary.

## Quick Conventions

- **Money.** THB stored as `numeric`; VAT 7% in `vat_rate`; transactions carry `amount`, `amount_gross`, `amount_ex_vat`, `amount_vat`, `discount_amount`, `idempotency_key`.
- **IDs.** UUID v4 internally; human-readable `M-XXXXXXX` (members), `T-XXXXXXX` (transactions).
- **Time.** Stored as UTC `timestamptz`, displayed in `Asia/Bangkok`. Day-bucket queries **must** use `getBangkokDayRange()` from `src/lib/dateRange.ts` — naive `new Date()` boundaries will be off by hours.
- **Stats hooks.** Use `{ count: 'exact', head: true }` to bypass Supabase's 1000-row default cap.
- **Edge function response envelope.** `{ data: T, error: null }` on success, `{ data: null, error: { code, message, details? } }` on failure. Codes: `VALIDATION_ERROR | NOT_FOUND | FORBIDDEN | CONFLICT | INTERNAL`.
- **Surface override (dev only).** `?surface=admin|member|trainer|staff` query param.
- **CORS allowlist (every edge function).** `https://admin.moom.fit`, `https://member.moom.fit`, `https://moom.lovable.app`.

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
