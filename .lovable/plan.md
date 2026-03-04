

# Finance Dashboard Data Complete (`finance_dashboard_data_complete_01`)

## Current State

| Area | Status |
|------|--------|
| DB table `transactions` | ✅ Exists with all needed columns |
| Finance page with date range + search + KPI cards + table | ✅ Working |
| Stats computed from DB (client-side aggregation) | ✅ Working but has issues |
| Realtime sync for transactions | ✅ Wired in `useRealtimeSync` |
| Transfer slips page | ✅ Separate page, working |
| Activity logging on status update | ✅ Working |

## Gaps

### GAP 1: Missing auth guard
`useFinanceTransactions` and `useFinanceStats` have no `enabled: !!user` — same empty-list bug as other modules.

### GAP 2: Stats and table use different base queries (inconsistency)
Stats query (`useFinanceStats`) only filters by date range — it ignores `search` and `status` filters. The table applies all filters. This means KPI cards can show "42 transactions" while the table shows 5 filtered rows. The requirement explicitly says they must be consistent.

**Fix**: Stats should share the same filters as the table (date range + status + search), OR stats should always show the unfiltered range totals with clear labeling. The requirement says "Total 42 transactions matches table pagination count for same range/filters" — so stats must use the same filters.

### GAP 3: No status filter dropdown
The page has no status filter UI (Paid/Pending/Voided). The hook supports `filters.status` but the page never passes it.

### GAP 4: No payment method filter
Requirement asks for payment method filter. Not currently available.

### GAP 5: Stats hit 1000-row limit
`useFinanceStats` fetches all rows to aggregate client-side. Will silently produce wrong numbers once transactions exceed 1000.

**Fix**: Compute stats from the same filtered transaction list (already fetched for the table), eliminating the separate query entirely. This guarantees consistency and avoids the 1000-row limit issue (table already has pagination awareness).

### GAP 6: Missing table columns
Current: Date, Transaction No, Order Name, Type, Sold To, Amount, Status.
Missing per requirement: Location, Price excl. VAT, VAT (these columns don't exist in DB schema — `amount` is the only price column). We'll add Location column (join exists). VAT breakdown requires new DB columns or is out of scope — will note as future.

### GAP 7: No CSV export
Optional per requirement. Simple to add using existing `exportToCsv` utility.

---

## Implementation Plan

### Step 1: Fix `useFinance.ts` hook
- Add `enabled: !!user` auth guard to all queries (import `useAuth`)
- **Remove separate `useFinanceStats`** — compute stats from the transaction list data instead. This guarantees KPI/table consistency and avoids the 1000-row limit
- Add `paymentMethod` to `FinanceFilters` interface
- Apply payment method filter in query

### Step 2: Update `Finance.tsx` page
- Add status filter dropdown (All / Paid / Pending / Voided / Needs Review)
- Add payment method filter dropdown (All / Cash / Bank Transfer / Credit Card / etc.)
- Compute stats from `transactions` data directly (count, sum paid amounts, sum voided amounts)
- Add Location column to table (from joined data — already available via `location_id`)
- Add CSV export button using `exportToCsv`
- Add pagination (page size 50)

### Step 3: i18n updates
- Add keys: `finance.paymentMethod`, `finance.location`, `finance.allStatuses`, `finance.export`, `finance.priceExclVat`, `finance.vat`, `finance.priceInclVat`

### Files to Touch

| File | Change |
|------|--------|
| `src/hooks/useFinance.ts` | Auth guard, payment method filter, remove separate stats query |
| `src/pages/Finance.tsx` | Status/payment filters, computed stats, location column, CSV export, pagination |
| `src/i18n/locales/en.ts` | New finance keys |
| `src/i18n/locales/th.ts` | New finance keys |

### KPI Definitions (documented)
- **Transactions**: Count of all transactions matching current filters (date range + status + payment method + search)
- **Total Sales**: Sum of `amount` where `status = 'paid'` within filtered results
- **Net Income**: Same as Total Sales (no separate net_amount column exists; identical until VAT model is added)
- **Refunds Given**: Sum of `amount` where `status = 'voided'` within filtered results

No DB migration needed. No breaking changes. All additive.

