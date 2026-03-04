# Data Contract — Packages

## Table: `packages`

| UI Field | DB Column | Type | Required | Notes |
|---|---|---|---|---|
| Package type | `type` | enum: unlimited/session/pt | ✅ | |
| Name (EN) | `name_en` | text | ✅ | |
| Name (TH) | `name_th` | text | | |
| Price | `price` | numeric | ✅ | incl VAT |
| Description (EN) | `description_en` | text | | |
| Description (TH) | `description_th` | text | | |
| Sessions | `sessions` | int | ✅ for session/pt | null for unlimited |
| Term days | `term_days` | int | ✅ | days after activation |
| Expiration days | `expiration_days` | int | ✅ | days after sale |
| Recurring payment | `recurring_payment` | bool | | default false |
| Quantity total | `quantity` | int | | null if infinite |
| Infinite quantity | `infinite_quantity` | bool | | default true |
| User purchase limit | `user_purchase_limit` | int | | null if infinite |
| Infinite purchase limit | `infinite_purchase_limit` | bool | | default true |
| Usage type | `usage_type` | enum: class_only/gym_checkin_only/both | | default both |
| All categories | `all_categories` | bool | | default true |
| Categories | `categories` | text[] | | category names (not UUIDs — consistent with rooms) |
| All locations | `all_locations` | bool | | default true |
| Access locations | `access_locations` | uuid[] | | location UUIDs |
| Any day any time | `any_day_any_time` | bool | | default true |
| Access days | `access_days` | jsonb | | weekday→time windows |
| Is popular | `is_popular` | bool | | default false |
| Schedule start | `schedule_start_at` | timestamptz | | for scheduled status |
| Schedule end | `schedule_end_at` | timestamptz | | for scheduled status |
| Status | `status` | enum: on_sale/scheduled/drafts/archive | | default drafts |

## Derived Data (Package Details page)

| Metric | Source | Query |
|---|---|---|
| Sold this week | `transactions` | count where package_id=X AND created_at >= 7 days ago |
| Revenue to date | `transactions` | sum(amount) where package_id=X AND status='paid' |
| Active holders | `member_packages` | count where package_id=X AND status='active' |
| Inactive holders | `member_packages` | count where package_id=X AND status in (expired,completed,on_hold) |

## Activity Log Events

| Event | Trigger | Data |
|---|---|---|
| `package_created` | useCreatePackage | package name |
| `package_updated` | useUpdatePackage | old/new values |
| `package_deleted` | useDeletePackage | package id |
| `package_archived` | useArchivePackage | package id |

## Query Keys

| Key | Hook | Invalidated by |
|---|---|---|
| `['packages', status, search]` | usePackages | create/update/delete/archive |
| `['packages', id]` | usePackage | update |
| `['package-stats']` | usePackageStats | create/update/delete/archive |
| `['package-metrics', id]` | usePackageMetrics | transactions/member_packages changes |
| `['package-access-locations', id]` | PackageDetails inline | package update |

## Realtime Invalidation

Table `packages` in `TABLE_INVALIDATION_MAP` → invalidates `['packages', 'package-stats', 'package-metrics']`.

## Known Deferrals

- **Categories as names vs UUIDs**: `packages.categories` stores category name strings, not UUIDs. Consistent with `rooms.categories` and schedule validation RPC. Deferred — internally consistent.
