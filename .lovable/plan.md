
## Findings from Live Preview (admin dashboard at `/`)

Inspected the dashboard at viewport 1366×768 logged in as Owner. Verified each card against the database + source code to separate REAL bugs from "correct-but-zero" dynamic data.

### Modules touched / status

| # | Area | Status | Evidence |
|---|---|---|---|
| 1 | `SidebarBranchSwitcher` — subtitle | **BROKEN** | UI shows raw key `locations.switchBranch` because the key does not exist in `src/i18n/locales/{en,th}.ts`. The `?? 'สลับสาขา'` fallback never fires (i18next returns the key string, which is truthy). |
| 2 | `LivePulseCard` 12-hour sparkline | **PARTIAL / UX bug** | Real data = `[0,0,…,0]`. Current `Sparkline` collapses to a flat orange line at the bottom of the card — looks broken/static, not "no data". Data layer (`useCheckin12hSeries`) is correct & live. |
| 3 | Revenue Forecast card (`฿9,999` last/next month) | **WORKING** | Verified against DB: `select sum(amount) from transactions where status='paid' and last month` = `9999.00`. Number is real and dynamic. No change. |
| 4 | KPI strip (เช็คอิน/กำลังเรียน/คลาส/รายได้/สมาชิก) | **WORKING** | Loads from live hooks after initial skeleton; values match DB (0/0/0/฿0/1). No change. |
| 5 | Revenue 30-day chart, Business Health, Goals, Activity feed, Daily Briefing | **WORKING** | All read from Supabase via TanStack Query + `useRealtimeSync` invalidation. No hardcoded numbers found (grep for `9999` returned only CSS `border-radius`). No change. |

### What must be preserved

- `useCheckin12hSeries`, `useRevenueForecast`, `useDashboardStats`, `useRecentActivity`, `useDailyBriefing` — all already dynamic; do **not** touch.
- `Sparkline` visual style (gradient + stroke), props API of `LivePulseCard`.
- Realtime invalidation map in `useRealtimeSync`.
- All other dashboard cards/components and their layouts.

### What is actually broken

- **Bug A — Missing i18n key** `locations.switchBranch` (and surrounding `locations.*` namespace if not present) → user sees a literal dot-string in the sidebar in both EN and TH.
- **Bug B — Sparkline "zero" rendering** misleads the user into thinking the trend chart is broken/hardcoded when there is simply no check-in activity in the last 12h.

### Minimal-diff plan

**A. Add missing i18n entry (both locales)**
- `src/i18n/locales/th.ts` → add `locations: { switchBranch: 'สลับสาขา', … }` (only add `switchBranch`; preserve any existing `locations.*` keys).
- `src/i18n/locales/en.ts` → add `locations: { switchBranch: 'Switch branch' }`.
- Verify with `scripts/compare-i18n.mjs` — parity must stay green.

**B. Sparkline empty-state in `LivePulseCard`**
- Inside `Sparkline`, detect `max === 0` (all-zero series) and render a subtle dashed baseline + small muted label (`trendLabel` already conveys context; add a tiny "—" or use existing i18n `common.noData`). No new prop, no API change.
- Keep current gradient/stroke when data > 0. Single component, ~6 LOC diff.

**C. No backend changes, no hook changes, no schema changes.**

### Verification gate

1. `bun run build` passes.
2. Reload `/` in preview:
   - Sidebar branch card subtitle reads `สลับสาขา` (TH) / `Switch branch` (EN).
   - LIVE card shows a clear "no activity" baseline instead of a misleading flat orange line; once a check-in is recorded, the curve renders normally (manually verified by inserting a fake `member_attendance` row in a scratch session — read-only verification only).
3. `bun run test` — existing 190 tests stay green.
4. `node scripts/compare-i18n.mjs` — i18n parity unchanged.
5. No regression on other dashboard cards (KPIs, forecast, chart, activity, briefing).

### Doc updates

- Append a one-line entry to `docs/DEVLOG.md` describing the two fixes.
- Add a "Dashboard zero-data sparkline" item to `docs/SMOKE_TEST.md`.

### Out of scope (explicitly)

- No refactor of `LivePulseCard` API.
- No change to revenue/forecast logic (numbers are real).
- No new realtime subscriptions, no DB migration.
- Other surfaces (Member/Trainer/Staff) — not inspected this round; can be a follow-up if you want.
