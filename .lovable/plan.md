

# Realtime Sync for Packages, Promotions & Member Purchases

## Current State

- `queryKeys.ts` has no entries for packages, promotions, or package metrics
- `useRealtimeSync` subscribes to `member_packages` and `package_usage_ledger` but only invalidates `high-risk-members`/`member-bookings` — missing packages/promotions/transactions
- Hooks use these actual query key prefixes:
  - `packages`, `package-stats`, `package-metrics` (usePackages, usePackageStats, usePackageMetrics)
  - `promotions`, `promotion-stats` (usePromotions, usePromotionStats)
  - `member-packages` (useMemberDetails.useMemberPackages)
  - `package-usage`, `package-usage-summary` (usePackageUsage)
  - `transactions` (useFinance)

## Plan

### 1. Extend `src/lib/queryKeys.ts`

Add canonical keys:
```
packages: (status?, search?) => ['packages', status, search]
package: (id) => ['packages', id]
packageStats: () => ['package-stats']
packageMetrics: (id) => ['package-metrics', id]
promotions: (status?, search?) => ['promotions', status, search]
promotion: (id) => ['promotions', id]
promotionStats: () => ['promotion-stats']
memberPackages: (memberId) => ['member-packages', memberId]
packageUsage: (memberPackageId) => ['package-usage', memberPackageId]
transactions: () => ['transactions']
```

### 2. Extend `src/hooks/useRealtimeSync.ts`

Add tables to `TableName` union and `TABLE_INVALIDATION_MAP`:
- `packages` → invalidate `['packages']`, `['package-stats']`, `['package-metrics']`
- `promotions` → invalidate `['promotions']`, `['promotion-stats']`
- `transactions` → invalidate `['transactions']`, `['package-metrics']`, `['dashboard-stats']`

Update existing entries:
- `member_packages` → add `['member-packages']`, `['package-metrics']`, `['packages']`
- `package_usage_ledger` → add `['package-usage']`, `['package-usage-summary']`, `['package-metrics']`

Enable realtime publication for new tables via migration:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.packages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.promotions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
```

### 3. No other changes needed

- Single channel `realtime-sync` already used — just adding more tables to it
- Cleanup on unmount already handled via `supabase.removeChannel`

## Files Summary

| Action | File |
|--------|------|
| Modify | `src/lib/queryKeys.ts` — add package/promotion/transaction keys |
| Modify | `src/hooks/useRealtimeSync.ts` — add 3 tables + update 2 existing |
| Migration | Enable realtime for packages, promotions, transactions |

