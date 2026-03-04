

# Recheck: Promotions Data Completeness (`promotions_data_complete_01`)

## Verification Summary — ALL GAPS RESOLVED ✅

| Area | Status | Notes |
|------|--------|-------|
| DB Schema (promotions columns) | ✅ Done | All new columns exist |
| DB: promotion_packages join table | ✅ Done | Exists with discount_override, max_sale_amount, unique constraint |
| DB: promotion_redemptions table | ✅ Done | Exists with all required columns |
| usePromotionStats (1000-row fix) | ✅ Done | Uses head-only count queries per status |
| Promotions list page | ✅ Done | Tabs, search, row click navigation all work |
| Create promotion route | ✅ Done | Route `/promotion/create` exists, button wired |
| Create promotion form (zod + all fields) | ✅ Done | All sections: type, promo_code, discount, limits, schedule |
| **GAP 1 FIXED: CreatePromotion.onSubmit** | ✅ Done | Now persists ALL new columns (name_en, name_th, discount_mode, percentage_discount, flat_rate_discount, same_discount_all_packages, has_max_redemption, max_redemption_value, has_min_price, min_price_requirement, units_mode, available_units, per_user_mode, per_user_limit, usage_time_mode, start_mode, has_end_date) + dual-write legacy fields |
| **GAP 2 FIXED: PromotionDetails** | ✅ Done | Uses discount_mode/percentage_discount/flat_rate_discount (fallback to legacy), per-package discount_override, real stats from promotion_redemptions, shows max_redemption/min_price/per_user fields |
| **GAP 3 FIXED: Search filter** | ✅ Done | Now covers name, name_en, name_th, promo_code |
| promotion_packages hooks (CRUD) | ✅ Done | add/remove/update with discount_override and max_sale_amount |
| EditPackagesDialog | ✅ Done | Checkbox toggle, batch save |
| Realtime sync | ✅ Done | promotion_packages and promotion_redemptions in TABLE_INVALIDATION_MAP |
| Activity log | ✅ Done | promotion_created/updated logged |

## Remaining (Future Phase)

- **Checkout integration**: Server-side RPC `apply_promotion_to_transaction` with all validation rules (Phase 6)
- **Usage time rules**: UI for specific day/time windows (usage_time_rules jsonb)
