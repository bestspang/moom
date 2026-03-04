

# Improve Promotions: Package Linking + Performance + AI-Ready

## Current State
- `promotions` table already has `applicable_packages uuid[]` — no join table needed
- No `/promotion/:id` detail route exists
- No PromotionDetails page exists
- Promotions list page is basic (no row click navigation)
- Realtime for `promotions` already enabled

## Plan

### 1. Database Migration
Add AI-ready columns to `promotions`:
```sql
ALTER TABLE promotions ADD COLUMN ai_target_segment jsonb;
ALTER TABLE promotions ADD COLUMN ai_recommended_rules jsonb;
```

### 2. Add Route — `src/App.tsx`
Add `<Route path="promotion/:id" element={<PromotionDetails />} />` after the promotion list route.

### 3. Wire Row Click — `src/pages/Promotions.tsx`
Add `onRowClick` to DataTable to navigate to `/promotion/${row.id}`.

### 4. Create `src/pages/PromotionDetails.tsx`
Structure (following PackageDetails pattern):
- **Header**: Back button, promotion name, status badge, promo code copy, type badge
- **Performance cards**: Units sold, Net revenue, Usage (used/limit), Active status
  - Units sold: count from `transactions` where `package_id` in `applicable_packages` (TODO: needs promotion_id on transactions for accurate tracking — use placeholder count from `usage_count` field for now)
  - Net revenue: placeholder computed from usage_count × discount_value (TODO marker)
- **Details section**: Name, type, discount, dates, usage limit, promo code
- **Eligible packages section**:
  - Table showing linked packages (fetched by IDs from `applicable_packages`)
  - Columns: Name, Sessions, Price, Discount applied, Net price
  - "Edit packages" button opens a dialog
- **AI Assist placeholder**: Disabled card "AI Suggest promotion rules (coming soon)"

### 5. Create `src/components/promotions/EditPackagesDialog.tsx`
- Dialog with package search + multi-select checkboxes
- Fetches all packages via `usePackages()`
- On save: updates `applicable_packages` array via `useUpdatePromotion()`

### 6. Create `src/hooks/usePromotionPackages.ts`
- Hook that fetches packages by IDs from `applicable_packages` array
- Returns package data for the eligible packages table

### 7. Update Realtime — `src/hooks/useRealtimeSync.ts`
- Add `promotion-packages` to promotions invalidation list (already has `promotions`, `promotion-stats`)

### 8. i18n Keys
Add to `en.ts` and `th.ts`:
- `promotions.details`, `promotions.eligiblePackages`, `promotions.editPackages`, `promotions.unitsSold`, `promotions.netRevenue`, `promotions.usageLimit`, `promotions.aiAssist`, `promotions.aiComingSoon`, `promotions.netPrice`, `promotions.sessions`

## Files Summary

| Action | File |
|--------|------|
| Migration | Add 2 AI columns to `promotions` |
| Modify | `src/App.tsx` — add route |
| Modify | `src/pages/Promotions.tsx` — add onRowClick |
| Create | `src/pages/PromotionDetails.tsx` |
| Create | `src/components/promotions/EditPackagesDialog.tsx` |
| Create | `src/hooks/usePromotionPackages.ts` |
| Modify | `src/i18n/locales/en.ts` — new keys |
| Modify | `src/i18n/locales/th.ts` — new keys |

No breaking changes. Uses existing `applicable_packages uuid[]` column. Performance metrics use `usage_count` placeholder with TODO for accurate transaction-based tracking.

