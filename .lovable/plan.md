

# Recheck: Promotions Data Completeness (`promotions_data_complete_01`)

## Verification Summary

| Area | Status | Notes |
|------|--------|-------|
| DB Schema (promotions columns) | ✅ Done | All new columns exist: discount_mode, percentage_discount, flat_rate_discount, same_discount_all_packages, has_max_redemption, max_redemption_value, has_min_price, min_price_requirement, units_mode, available_units, per_user_mode, per_user_limit, usage_time_mode, usage_time_rules, start_mode, has_end_date, name_en, name_th, description_en, description_th, created_by |
| DB: promotion_packages join table | ✅ Done | Exists with discount_override, max_sale_amount, unique constraint |
| DB: promotion_redemptions table | ✅ Done | Exists with all required columns |
| usePromotionStats (1000-row fix) | ✅ Done | Uses head-only count queries per status |
| Promotions list page | ✅ Done | Tabs, search, row click navigation all work |
| Create promotion route | ✅ Done | Route `/promotion/create` exists, button wired |
| Create promotion form (zod + all fields) | ✅ Done | All sections: type, promo_code, discount, limits, schedule |
| promotion_packages hooks (CRUD) | ✅ Done | add/remove/update with discount_override and max_sale_amount |
| EditPackagesDialog | ✅ Done | Checkbox toggle, batch save |
| Realtime sync | ✅ Done | promotion_packages and promotion_redemptions in TABLE_INVALIDATION_MAP |
| Activity log | ✅ Done | promotion_created/updated logged in useCreatePromotion/useUpdatePromotion |

## Gaps Found

### GAP 1: CreatePromotion.onSubmit does NOT persist new columns to DB
**Severity: HIGH**

The `onSubmit` function (lines 103-133) only saves these legacy fields:
```typescript
{ name, type, discount_type, discount_value, promo_code, start_date, end_date, status, usage_limit }
```

It does **NOT** persist: `name_en`, `name_th`, `description_en`, `description_th`, `discount_mode`, `percentage_discount`, `flat_rate_discount`, `same_discount_all_packages`, `has_max_redemption`, `max_redemption_value`, `has_min_price`, `min_price_requirement`, `units_mode`, `available_units`, `per_user_mode`, `per_user_limit`, `usage_time_mode`, `start_mode`, `has_end_date`.

This means the form renders all fields but **none of the new ones actually save**. After refresh, all data is lost.

### GAP 2: PromotionDetails still uses only legacy fields
**Severity: MEDIUM**

- `getDiscountDisplay()` reads `promo.discount_type` / `promo.discount_value` (legacy) instead of `discount_mode` / `percentage_discount` / `flat_rate_discount` (new)
- Stats use placeholder `usage_count` instead of querying `promotion_redemptions`
- Details card doesn't show new fields (max_redemption, min_price, per_user, usage_time)
- `computeDiscountAmount` doesn't respect per-package `discount_override` from join table

### GAP 3: Promotions list search doesn't cover name_en/name_th
**Severity: LOW**

`usePromotions` search filter uses `name.ilike` (legacy column) instead of `name_en.ilike` / `name_th.ilike`.

---

## Implementation Plan

### Step 1: Fix CreatePromotion.onSubmit to persist ALL new columns

**File**: `src/pages/CreatePromotion.tsx` (lines 103-133)

Map all form fields to their DB columns:
- `name` → `name` (keep for backward compat) AND `name_en`
- `name_th` → `name_th`
- `description_en/th` → `description_en/th`
- `discount_mode` → `discount_mode`
- `percentage_discount` / `flat_rate_discount` → respective columns
- `same_discount_all_packages` → `same_discount_all_packages`
- All limit/usage fields → their DB columns
- Also keep populating legacy `discount_type` and `discount_value` for backward compat

### Step 2: Fix PromotionDetails to use new columns + join table overrides

**File**: `src/pages/PromotionDetails.tsx`

- `getDiscountDisplay()`: Use `discount_mode` + `percentage_discount`/`flat_rate_discount` (fallback to legacy)
- `computeDiscountAmount()`: Check per-package `discount_override` from linked packages data when `same_discount_all_packages === false`
- Add new fields to the details card: max_redemption, min_price, per_user, usage_time
- Stats: Query `promotion_redemptions` count for units_sold and sum for net_revenue (instead of placeholder)

### Step 3: Fix search to cover name_en/name_th

**File**: `src/hooks/usePromotions.ts` (line 22)

Change search filter from `name.ilike` to `name.ilike.%${search}%,name_en.ilike.%${search}%,name_th.ilike.%${search}%,promo_code.ilike.%${search}%`

### Files to Touch

| File | Change |
|------|--------|
| `src/pages/CreatePromotion.tsx` | Fix onSubmit to persist all new columns |
| `src/pages/PromotionDetails.tsx` | Use new columns, per-package overrides, real stats |
| `src/hooks/usePromotions.ts` | Fix search filter to include name_en/name_th |

No DB migration needed. No breaking changes — backward compatible via dual-write of legacy + new columns.

