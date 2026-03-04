# Data Contract — Promotions

## Table: `promotions`

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| name | text | — | Legacy, kept for backward compat. Use name_en. |
| name_en | text | — | Display name (EN) |
| name_th | text | — | Display name (TH) |
| type | promotion_type enum | 'promo_code' | 'discount' or 'promo_code' |
| promo_code | text | — | Unique, nullable. Required when type='promo_code' |
| discount_type | text | 'percentage' | Legacy. Use discount_mode instead. |
| discount_mode | text | 'percentage' | 'percentage' or 'flat_rate' |
| discount_value | numeric | — | Legacy. Use percentage_discount or flat_rate_discount |
| percentage_discount | numeric | — | Active when discount_mode='percentage' |
| flat_rate_discount | numeric | — | Active when discount_mode='flat_rate' |
| same_discount_all_packages | boolean | true | If false, per-package overrides in promotion_packages |
| description_en | text | — | |
| description_th | text | — | |
| has_max_redemption | boolean | false | |
| max_redemption_value | numeric | — | Max THB discount per redemption |
| has_min_price | boolean | false | |
| min_price_requirement | numeric | — | Min package price to use promo |
| units_mode | text | 'infinite' | 'infinite' or 'specific' |
| available_units | integer | — | Total available when units_mode='specific' |
| usage_limit | integer | — | Legacy (mapped from available_units) |
| usage_count | integer | 0 | Legacy counter |
| per_user_mode | text | 'unlimited' | 'unlimited', 'one_time', 'multiple' |
| per_user_limit | integer | — | Required when per_user_mode='multiple' |
| usage_time_mode | text | 'any_day_any_time' | |
| usage_time_rules | jsonb | — | Day/time windows when specific |
| start_mode | text | 'start_now' | 'start_now' or 'scheduled' |
| start_date | timestamptz | — | |
| has_end_date | boolean | false | |
| end_date | timestamptz | — | |
| status | promotion_status enum | 'drafts' | 'active', 'scheduled', 'drafts', 'archive' |
| applicable_packages | uuid[] | '{}' | Legacy — being replaced by promotion_packages join table |
| created_by | uuid | — | |
| created_at | timestamptz | now() | |
| updated_at | timestamptz | now() | Auto via trigger |

## Table: `promotion_packages` (join table)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| promotion_id | uuid | FK → promotions, ON DELETE CASCADE |
| package_id | uuid | FK → packages, ON DELETE CASCADE |
| discount_override | numeric | Per-package discount (overrides global when same_discount_all_packages=false) |
| max_sale_amount | numeric | Per-package max sale amount |
| created_at | timestamptz | |

Unique constraint: (promotion_id, package_id)

## Table: `promotion_redemptions`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| promotion_id | uuid | FK → promotions |
| member_id | uuid | FK → members |
| transaction_id | uuid | FK → transactions |
| redeemed_at | timestamptz | |
| discount_amount | numeric | |
| gross_amount | numeric | |
| net_amount | numeric | |
| promo_code_used | text | |

## Activity Log Events

| Event | Trigger |
|-------|---------|
| promotion_created | Create promotion |
| promotion_updated | Update promotion |
| promotion_archived | Status → archive |
| promotion_package_added | Add package to promotion |
| promotion_package_removed | Remove package |
| promotion_redeemed | Redemption recorded |

## Query Keys (React Query)

| Key | Used by |
|-----|---------|
| `['promotions', status?, search?]` | List page |
| `['promotions', id]` | Detail page |
| `['promotion-stats']` | Tab counts |
| `['promotion-packages', promotionId]` | Eligible packages |
| `['promotion-redemptions', promotionId]` | Redemption history |

## Realtime Invalidation

Tables in `useRealtimeSync`:
- `promotions` → invalidates `promotions`, `promotion-stats`, `promotion-packages`
- `promotion_packages` → invalidates `promotion-packages`, `promotions`
- `promotion_redemptions` → invalidates `promotion-redemptions`, `promotions`, `promotion-stats`
