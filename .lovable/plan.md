

# Promotions Data Completeness Recheck (`promotions_data_complete_01`)

## Current State

### What exists:
- **DB**: `promotions` table with basic columns: `name`, `type` (promo_code/discount), `discount_type`, `discount_value`, `promo_code`, `start_date`, `end_date`, `status`, `usage_limit`, `usage_count`, `applicable_packages` (uuid array)
- **List page**: Works with status tabs, search, copy promo code. Button "Create promotion" exists but NOT wired to any page
- **Details page**: Shows stats (placeholder TODOs), eligible packages via `applicable_packages` array, discount calculation
- **Hooks**: CRUD hooks exist. `usePromotionStats` hits 1000-row limit (client-side counting)
- **Realtime**: `promotions` in sync map → invalidates `['promotions', 'promotion-stats', 'promotion-packages']`

### What's missing (vs spec):

**Major gaps:**

1. **No CreatePromotion page** — the button isn't wired, no form exists
2. **DB schema incomplete** — missing ~15 columns (description, same_discount_all_packages, max_redemption, min_price, per_user_mode/limit, usage_time_mode/rules, start_mode, units_mode, created_by, etc.)
3. **No `promotion_packages` join table** — currently uses flat `applicable_packages` uuid[] with no per-package discount override or max_sale_amount
4. **No `promotion_redemptions` table** — no usage tracking infrastructure
5. **No checkout integration** — no RPC or flow to apply promotions during purchase
6. **`usePromotionStats` hits 1000-row limit** — same pattern as members/packages
7. **Details page uses placeholder stats** — "TODO: from transactions" comment

---

## Implementation Plan

This is a large feature. I recommend splitting into phases to keep changes safe and verifiable.

### Phase 1: DB Schema (migration)

Add missing columns to `promotions`:
```sql
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS name_th text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS description_th text,
  ADD COLUMN IF NOT EXISTS discount_mode text DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS percentage_discount numeric,
  ADD COLUMN IF NOT EXISTS flat_rate_discount numeric,
  ADD COLUMN IF NOT EXISTS same_discount_all_packages boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_max_redemption boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_redemption_value numeric,
  ADD COLUMN IF NOT EXISTS has_min_price boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_price_requirement numeric,
  ADD COLUMN IF NOT EXISTS units_mode text DEFAULT 'infinite',
  ADD COLUMN IF NOT EXISTS available_units integer,
  ADD COLUMN IF NOT EXISTS per_user_mode text DEFAULT 'unlimited',
  ADD COLUMN IF NOT EXISTS per_user_limit integer,
  ADD COLUMN IF NOT EXISTS usage_time_mode text DEFAULT 'any_day_any_time',
  ADD COLUMN IF NOT EXISTS usage_time_rules jsonb,
  ADD COLUMN IF NOT EXISTS start_mode text DEFAULT 'start_now',
  ADD COLUMN IF NOT EXISTS has_end_date boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid;
-- Migrate existing data: name → name_en, discount_type → discount_mode, discount_value → percentage/flat, start_date → start_at naming, etc.
UPDATE promotions SET name_en = name WHERE name_en IS NULL;
```

Create `promotion_packages` table:
```sql
CREATE TABLE promotion_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  discount_override numeric,
  max_sale_amount numeric,
  created_at timestamptz DEFAULT now(),
  UNIQUE(promotion_id, package_id)
);
-- RLS + indexes
```

Create `promotion_redemptions` table:
```sql
CREATE TABLE promotion_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES promotions(id),
  member_id uuid REFERENCES members(id),
  transaction_id uuid REFERENCES transactions(id),
  redeemed_at timestamptz DEFAULT now(),
  discount_amount numeric NOT NULL,
  gross_amount numeric NOT NULL,
  net_amount numeric NOT NULL,
  promo_code_used text
);
-- RLS + indexes on (promotion_id, member_id), (promotion_id, redeemed_at)
```

Enable realtime for new tables.

### Phase 2: Fix `usePromotionStats` (1000-row limit)
Same pattern as packages/members — use head-only count queries per status.

### Phase 3: Create Promotion Page
- New file `src/pages/CreatePromotion.tsx`
- react-hook-form + zod validation covering ALL fields from spec
- "Save as draft" → status='drafts', "Publish" → active/scheduled based on start_mode
- Generate random promo code button with uniqueness check
- Add route `/promotion/create` in App.tsx
- Wire the "Create promotion" button on list page

### Phase 4: Eligible Packages Selection (promotion_packages)
- Migrate from `applicable_packages` array to `promotion_packages` join table
- Update `EditPackagesDialog` to use join table with per-package discount_override and max_sale_amount columns
- Update `PromotionDetails` to query from `promotion_packages` instead of flat array

### Phase 5: Realtime + Activity Log
- Add `promotion_packages` and `promotion_redemptions` to `useRealtimeSync`
- Ensure all mutations log activity

### Phase 6 (Future): Checkout Integration
- Server-side RPC `apply_promotion_to_transaction` with all validation rules
- UI integration in member billing flow

### Files to Touch

| File | Change |
|------|--------|
| DB migration | Add columns + 2 new tables |
| `src/hooks/usePromotions.ts` | Fix stats, update queries for new columns |
| `src/pages/CreatePromotion.tsx` (new) | Full create form |
| `src/App.tsx` | Add route |
| `src/pages/Promotions.tsx` | Wire create button |
| `src/hooks/usePromotionPackages.ts` | Migrate to join table |
| `src/components/promotions/EditPackagesDialog.tsx` | Use join table |
| `src/pages/PromotionDetails.tsx` | Use new columns + join table |
| `src/hooks/useRealtimeSync.ts` | Add new tables |
| `src/i18n/locales/en.ts` + `th.ts` | Add i18n keys |
| `docs/data-contract-promotions.md` (new) | Data contract |

### Risk Assessment
- **Breaking change**: Migrating from `applicable_packages` array to `promotion_packages` join table requires data migration for existing promotions
- **Mitigation**: Migration SQL will populate `promotion_packages` from existing `applicable_packages` arrays, keeping backward compatibility

