

# Next High-Impact Milestone: Split Finance.tsx (806 lines)

## Problem Confirmed
`Finance.tsx` is 806 lines mixing 5 tab contents (Overview, Transactions, Transfer Slips, Forecasting, P&L), chart rendering, column definitions, export logic, expense CRUD, and template downloads — all in a single component. This makes it fragile to edit and hard to maintain.

## What Already Works (Preserve)
- All 5 tabs render correctly with real Supabase data
- Export CSV, import, template download all functional
- Slip detail dialog, expense add/delete, date range filtering all wired
- Consistent use of PageHeader, StatCard, DataTable, StatusBadge, ManageDropdown patterns

## Plan: Extract Each Tab into Its Own Component

### Files to Create

| File | Responsibility | Lines extracted |
|------|---------------|----------------|
| `src/components/finance/FinanceOverview.tsx` | Stats cards + daily revenue chart + payment breakdown pie chart | ~80 lines |
| `src/components/finance/FinanceTransactions.tsx` | Filters + transaction DataTable + column defs + export/template helpers | ~120 lines |
| `src/components/finance/FinanceTransferSlips.tsx` | Slip filters + StatusTabs + DataTable + slip detail dialog trigger + export | ~80 lines |
| `src/components/finance/FinanceForecasting.tsx` | Forecast stats + comparison chart | ~40 lines |
| `src/components/finance/FinancePnL.tsx` | P&L stats + revenue/expense breakdowns + expense CRUD dialog | ~150 lines |
| `src/components/finance/index.ts` | Barrel export | 5 lines |

### File to Modify
- `src/pages/Finance.tsx` — reduced to ~100 lines: hooks, shared state (dateRange), tab shell, and imports from sub-components

### Approach
- Each sub-component receives only the props it needs (data, loading states, handlers)
- Shared state (dateRange, formatters) stays in the parent `Finance.tsx`
- Column definitions move into their respective tab components
- Export/template logic moves with its tab
- Zero behavior change — identical rendering and functionality

### Risk
- **Zero regression**: Pure extraction refactor. No logic changes, no hook changes, no data flow changes.
- **Rollback**: Revert the 7 files to restore the original monolith.

