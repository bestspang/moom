---
description: Scaffold a new feature in the correct surface folder with query key + i18n keys wired up
argument-hint: <feature-name>
---

You are starting a new feature called **$ARGUMENTS** in the MOOM codebase.

## Step 1 — Clarify scope (ask the user, do not assume)

Ask these questions in a single `AskUserQuestion` call:

1. **Surface** — admin / member / trainer / staff? (determines folder)
2. **Entity** — does this feature read/write a DB table? If yes, which one? (new table → recommend `/db-migration` first)
3. **Route** — what path should it mount at? (default: `/<feature>` for admin, `/<surface>/<feature>` for member/trainer/staff)
4. **Realtime** — should it auto-refresh when the underlying table changes? (if yes, confirm table is in `TABLE_INVALIDATION_MAP` at `src/hooks/useRealtimeSync.ts`)

## Step 2 — Pre-flight

- Check current branch. If on `main`, create feature branch: `git checkout -b feat/<kebab-feature-name>`. If on an existing feature branch, stay.
- Read the relevant surface's layout file to confirm the nav/routing pattern:
  - admin → `src/App.tsx` (flat route table)
  - member → `src/apps/member/index.ts` + `src/apps/member/layouts/*`
  - trainer → `src/apps/trainer/layouts/*`
  - staff → `src/apps/staff/layouts/*`

## Step 3 — Scaffold (place files per CLAUDE.md §3)

- **Page** → `src/pages/<PascalCase>.tsx` (admin) or `src/apps/{surface}/pages/<PascalCase>.tsx`
  - Member/Trainer/Staff pages MUST use `<MobilePageHeader>` (hard invariant #1). Back nav goes in the `action` prop — no inline `ArrowLeft`.
- **Hook** (if DB-backed) → `src/hooks/use<PascalCase>.ts` using TanStack Query
  - Query key declared in `src/lib/queryKeys.ts` — do NOT inline it
  - Mutation `onSuccess`: `toast.success(t(...))` + `logActivity({event_type, ...})` + `queryClient.invalidateQueries(...)`
  - Mutation `onError`: `console.error('[useXxx] <action> failed', err)` + `toast.error(t(...))`
- **i18n keys** → add to **both** `src/i18n/locales/en.ts` AND `src/i18n/locales/th.ts` (hard rule). Never use raw English status text in UI.
- **Route wiring** → register the route in the correct place (admin route table in `src/App.tsx`, or the surface's layout). Protect with `<ProtectedRoute minAccessLevel="...">` if admin-only.

## Step 4 — Don'ts (auto-block)

- Do NOT hardcode hostnames — use `buildCrossSurfaceUrl()` / `getSurfaceBaseUrl()` from `src/apps/shared/hostname.ts` if cross-surface links are needed.
- Do NOT add a global store (Redux/Zustand/Jotai). Use TanStack Query + existing Contexts only.
- Do NOT touch `src/integrations/supabase/{client,types}.ts` (auto-generated).
- Do NOT author a migration file by hand for a new table — run `/db-migration` instead (or let Lovable auto-generate).

## Step 5 — Verify

- `bun run lint` — should pass
- `bun run build` — surfaces any TS errors (no separate typecheck)
- Start `bun run dev` if UI work, and confirm the route renders + header + i18n both locales.

Report back: files created, query key added (name), i18n keys added (names in EN/TH), route registered where.
