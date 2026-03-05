

# Analytics Dashboard + Enhanced Finance Hub

Two parallel workstreams: (1) new Analytics page and (2) Finance page enhancement with Overview + Forecasting tabs.

---

## 1. Analytics Dashboard (`/analytics`)

New page at `/analytics` — the strategic decision-making hub.

### Layout: 4 sections in cards

**Section A: Revenue Trends** (Bar chart — 6 months of monthly revenue from `transactions` where status='paid')

**Section B: Member Growth** (Line chart — monthly new members vs churned/expired, from `members.created_at` and `member_packages` status changes)

**Section C: Class Fill Rate Heatmap** (7×12 grid — day-of-week × hour, from `schedule` table, showing avg fill rate as color intensity)

**Section D: Lead Conversion Funnel** (Horizontal funnel bars — count by `leads.status`: new → contacted → interested → converted)

### Data Hook: `src/hooks/useAnalytics.ts`
- `useRevenueByMonth()` — query `transactions` grouped by month (last 6 months), sum amount where status='paid'
- `useMemberGrowth()` — query `members` created_at by month + count expired `member_packages`
- `useClassFillRate()` — query `schedule` with checked_in/capacity by day_of_week + hour
- `useLeadFunnel()` — query `leads` count grouped by status

All queries use real Supabase data. No mocks.

### Files
- **New**: `src/pages/Analytics.tsx`
- **New**: `src/hooks/useAnalytics.ts`
- **Edit**: `src/App.tsx` — add route `/analytics`
- **Edit**: `src/components/layout/Sidebar.tsx` — add Analytics nav item in Business group
- **Edit**: `src/i18n/locales/en.ts`, `th.ts` — add analytics translations

---

## 2. Enhanced Finance Page

Add 2 new tabs to existing Finance page: **Overview** (first tab) and **Forecasting** (last tab).

### Tab order: Overview | Transactions | Transfer Slips | Forecasting

**Overview tab**:
- 4 KPI stat cards (reuse existing `computeFinanceStats`)
- Revenue by day bar chart (from filtered transactions, grouped by date)
- Payment method breakdown donut chart

**Forecasting tab**:
- Reuse existing `useRevenueForecast` hook
- Show last/this/next month bars (already have `RevenueForecastCard`)
- Add a simple line chart showing monthly revenue trend (last 6 months)

### Files
- **Edit**: `src/pages/Finance.tsx` — add Overview + Forecasting tabs, move KPI cards into Overview
- Uses `recharts` (already installed) via `ChartContainer` from `src/components/ui/chart.tsx`

---

## Risk Assessment
- Analytics page is 100% new — zero regression risk
- Finance changes: existing Transactions and Transfer Slips tabs preserved exactly. Only adding new tabs around them.
- All data from existing tables with existing RLS policies — no DB changes needed

## Total Files Changed: 6
| File | Action |
|------|--------|
| `src/pages/Analytics.tsx` | Create |
| `src/hooks/useAnalytics.ts` | Create |
| `src/pages/Finance.tsx` | Edit (add 2 tabs) |
| `src/App.tsx` | Edit (add route) |
| `src/components/layout/Sidebar.tsx` | Edit (add nav item) |
| `src/i18n/locales/en.ts` + `th.ts` | Edit (translations) |

