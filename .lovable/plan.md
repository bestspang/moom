

# System Consistency Audit — Issues Found & Fix Plan

## Issues Identified

### Issue 1: POS Purchase Missing `member_billing` Record (Data Gap)
**Root cause**: When staff purchases a package via the 3-step wizard (`useAssignPackageToMember`), it creates a `transactions` record and `member_packages` record, but does NOT create a `member_billing` record. The `approve-slip` edge function does create one. This means:
- Member Details → Billing tab won't show POS purchases
- `useMemberSummaryStats` (totalSpent) won't include POS purchases
- Financial reports that rely on `member_billing` will be incomplete

**Fix**: Add a `member_billing` insert in `useAssignPackageToMember` after the transaction insert (same pattern as `approve-slip/index.ts`).

```typescript
// After inserting transaction, add:
await supabase.from('member_billing').insert({
  member_id: memberId,
  transaction_id: txn.id,
  amount: amountGross,
  description: `Purchase: ${pkg.name_en}`,
});
```

**File**: `src/hooks/useMemberDetails.ts` — add ~5 lines after line 606.
Also invalidate `['member-billing', memberId]` in onSuccess.

### Issue 2: Command Palette Labels Not i18n-ized
**Root cause**: `QUICK_ACTIONS` and `PAGE_ITEMS` in `CommandPalette.tsx` use hardcoded English strings. These are defined as module-level constants outside the component, so they can't use `t()` directly.

**Fix**: Move labels to use `t()` at render time by storing i18n keys instead of raw strings, or compute labels inside the component.

**File**: `src/components/command-palette/CommandPalette.tsx`
- Change `QUICK_ACTIONS` to use `labelKey` and resolve via `t()` at render time
- Same for `PAGE_ITEMS`

### Issue 3: Missing `member-billing` Cache Invalidation in Purchase
**Root cause**: `onSuccess` in `useAssignPackageToMember` invalidates `member-packages`, `members`, `finance-transactions`, `package-metrics` — but not `member-billing` or `member-summary-stats`.

**Fix**: Add invalidation for `['member-billing', variables.memberId]` and `['member-summary-stats', variables.memberId]`.

**File**: `src/hooks/useMemberDetails.ts` — add 2 lines in onSuccess block.

## Files to Modify

| File | Change | Risk |
|------|--------|------|
| `src/hooks/useMemberDetails.ts` | Add `member_billing` insert + cache invalidation | Low — additive, same pattern as approve-slip |
| `src/components/command-palette/CommandPalette.tsx` | i18n-ize all labels | Low — display-only change |

## What Is NOT Broken (Confirmed Working)
- Package enum fix (`type: pkg.type`) — correct
- Command event bus (`commandEvents.ts`) — wired correctly in Lobby, Members, Leads
- PurchasePackageDialog 3-step UI — renders correctly with all i18n keys present
- VAT calculation logic — correct
- Finance i18n keys (`finance.cash`, etc.) — all exist in both en.ts and th.ts
- `useCommandListener` with `React.useCallback` — stable references, no stale closure issues

