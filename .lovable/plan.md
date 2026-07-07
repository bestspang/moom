
## 1. UI-visible error handling on cards/components

Goal: Every data-driven card shows an inline error + Retry when its query fails, instead of silently blank or "฿0".

- Reuse existing `src/apps/shared/components/QueryError.tsx` (already has message + retry) and add a compact sibling `CardQueryError` variant sized for KPI/chart cards (icon + one-line message + small Retry button).
- Wrap render bodies of the main dashboard/chart components with a standard pattern:
  ```
  if (isLoading) <Skeleton/>
  else if (isError) <CardQueryError message={error.message} onRetry={refetch}/>
  else <Content/>
  ```
- Apply to:
  - `src/pages/Dashboard.tsx` KPI tiles (checkins, revenue, classes, active members)
  - `src/components/admin-ds/RevenueAreaChart.tsx` host page (pass `isError` + `onRetry` props; add optional `error`/`onRetry` to the component)
  - `src/pages/Analytics.tsx` four charts (Revenue, Growth, Fill Rate, Funnel)
  - `LivePulseCard`, `AttentionList`, `AIBrief` on dashboard
- Add i18n keys `common.cardError`, `common.retry` (retry exists) in `src/i18n/locales/{en,th}.ts`.
- No hook signature changes — just surface `isError`, `error`, `refetch` already returned by TanStack Query.

## 2. Revenue chart UX when `paid_at` is missing

Problem: Chart shows ฿0 because most `transactions` rows have `paid_at = NULL`, hiding real revenue.

- Update `useRevenueSeries` (and `useDashboardStats.todayRevenue`, `useRevenueByMonth`) to return an extra shape:
  ```
  { data, total, paidCount, missingPaidAtCount }
  ```
  Query both: rows with `paid_at` in range (used for chart), and count of `status='paid'` rows with `paid_at IS NULL` in the same created_at window.
- In `RevenueAreaChart`:
  - If `total === 0 && missingPaidAtCount > 0`: replace the empty "—" state with a warning card:
    "ไม่มีข้อมูล `paid_at` สำหรับ N รายการที่จ่ายแล้ว — กราฟจึงยังว่าง" + link/button "ดูรายการ" that routes to Finance filtered by `paid_at IS NULL`.
  - If `total > 0 && missingPaidAtCount > 0`: show a subtle inline badge under the summary: "N รายการรอเติม paid_at".
- Same warning surfaced in Dashboard revenue KPI tile subtitle.
- Add i18n strings (EN/TH). No schema change.

## 3. Verify realtime updates on KPIs/charts

Goal: KPI numbers and charts update without page reload when `transactions`, `member_attendance`, `schedule`, `members` change.

- Audit `src/hooks/useRealtimeSync.ts` `TABLE_INVALIDATION_MAP`:
  - Ensure `transactions` → invalidates `queryKeys.dashboardStats`, `queryKeys.revenueSeries*`, `queryKeys.revenueByMonth`.
  - Ensure `member_attendance` → dashboardStats + checkin series + livePulse.
  - Ensure `schedule` → dashboardStats (classesToday) + schedule lists.
  - Ensure `members` → dashboardStats (activeMembers) + members list + high-risk.
- Add missing mappings if absent. Add a lightweight dev-only `console.debug` tag `[rt] invalidated <keys> from <table>` behind `import.meta.env.DEV` to make realtime observable during QA.
- Manual verification checklist added to `docs/SMOKE_TEST.md` (insert paid transaction → dashboard revenue tile updates ≤2s, no reload).

## 4. Playwright regression for LobbyFilters

- New spec `e2e/lobby-filters.spec.ts`:
  1. Login as staff (reuse existing session-injection pattern from `e2e/qr-checkin.spec.ts`).
  2. Attach a network listener: fail the test if any response `status >= 400` OR any request URL contains `location_status=eq.active`.
  3. Navigate to `/lobby`, open the location filter, iterate through each option.
  4. Assert filter chips render and the list re-queries with `location_status=eq.open`.
- Add to `.github/workflows/e2e.yml` matrix (already runs Playwright).

## Technical notes

- Files touched:
  - New: `src/apps/shared/components/CardQueryError.tsx`, `e2e/lobby-filters.spec.ts`
  - Edit: `src/pages/Dashboard.tsx`, `src/pages/Analytics.tsx`, `src/components/admin-ds/RevenueAreaChart.tsx`, `src/components/admin-ds/LivePulseCard.tsx`, `src/hooks/useDashboardStats.ts`, `src/hooks/useRevenueSeries.ts`, `src/hooks/useAnalytics.ts`, `src/hooks/useRealtimeSync.ts`, `src/i18n/locales/{en,th}.ts`, `docs/SMOKE_TEST.md`, `docs/DEVLOG.md`
- No DB migration. No RLS change. No hook API break — additive fields only.
- Zero-regression: existing consumers ignoring new fields keep working.

## Regression checklist

- Dashboard KPIs still render numbers when queries succeed.
- Forcing a 500 on any card shows error + Retry, Retry refetches.
- Revenue chart with real paid_at data unchanged visually.
- Insert paid `transactions` row → dashboard revenue tile updates without reload.
- `bun run test` and `bun run build` pass.
- New Playwright spec passes locally.
