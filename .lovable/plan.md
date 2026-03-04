

# Packages Data Completeness Recheck (`packages_data_complete_01`)

## Current State Analysis

### DB Schema — ✅ Already Complete
The `packages` table already has ALL required columns:
- `type` (enum: unlimited/session/pt), `name_en`, `name_th`, `price`, `description_en`, `description_th`
- `term_days`, `expiration_days`, `sessions`
- `recurring_payment`, `quantity`, `infinite_quantity`, `user_purchase_limit`, `infinite_purchase_limit`
- `usage_type` (enum: class_only/gym_checkin_only/both), `all_categories`, `categories` (text[]), `all_locations`, `access_locations` (uuid[]), `any_day_any_time`, `access_days` (jsonb)
- `status` (enum: on_sale/scheduled/drafts/archive), `is_popular`, `schedule_start_at`, `schedule_end_at`
- `created_at`, `updated_at`

### Create/Edit Package — ✅ Working
`CreatePackage.tsx` has full react-hook-form + zod schema covering all fields. `onSubmit` maps every form field to DB columns. Edit mode loads existing package and populates form. Draft autosave works.

### Package Details — ✅ Working
Inline edit sections for names, price, term, recurring, quantity, access, description, distribution. Activity log with old/new diff.

### Packages List — ✅ Working
Status tabs, search, type/category/access columns displayed.

### Activity Log — ✅ Working
`useCreatePackage`, `useUpdatePackage`, `useDeletePackage`, `useArchivePackage` all call `logActivity`. Details page additionally inserts detailed old/new diffs.

### Realtime — ✅ Working
`packages` in `TABLE_INVALIDATION_MAP` → invalidates `['packages', 'package-stats', 'package-metrics']`.

---

## Gaps Found

### GAP 1: `usePackageStats` hits 1000-row limit
**Severity**: High — Same issue fixed for members. `usePackageStats` fetches ALL package `status` values client-side and counts them. Will be wrong for 1000+ packages.
**Fix**: Use individual head-only count queries per status (same pattern as `useMemberStats` fix).

### GAP 2: Categories stored as names (text[]) not UUIDs
**Severity**: Known/Deferred — `packages.categories` stores category name strings, not UUIDs. This is consistent with `rooms.categories` and the schedule validation RPC. Previously explicitly deferred. **Remains deferred** — internally consistent across the system.

### GAP 3: Access locations detail page shows hardcoded "-"
**Severity**: Low — `PackageDetails.tsx` line 494 has `{/* TODO: access_locations not in DB yet — show '-' */}` but the column `access_locations` (uuid[]) DOES exist in DB and is persisted by CreatePackage. The detail page just doesn't display it.
**Fix**: Resolve `access_locations` UUIDs to location names and display them. Also add location editing to the access section inline edit.

### GAP 4: `usePackageMetrics` hits 1000-row limit
**Severity**: Medium — Fetches ALL transactions and member_packages for a package client-side. For popular packages with many purchases, this will be inaccurate.
**Fix**: Use count queries with filters instead of fetching all rows.

---

## Implementation Plan

### Step 1: Fix `usePackageStats` — count queries
Replace client-side counting with 4 individual `{ count: 'exact', head: true }` queries per status.

**File**: `src/hooks/usePackages.ts` — rewrite `usePackageStats`

### Step 2: Fix `usePackageMetrics` — count queries
Replace client-side filtering with server-side filtered count/sum queries.

**File**: `src/hooks/usePackageMetrics.ts`

### Step 3: Fix PackageDetails access locations display
Remove the TODO comment. Query locations by IDs from `pkg.access_locations` and display names. Add locations to the inline edit for the access section.

**File**: `src/pages/PackageDetails.tsx`

### Step 4: Create `docs/data-contract-packages.md`
No existing contract doc for packages — document all fields, derived data, activity log events, query keys.

### Files to Touch

| File | Change |
|------|--------|
| `src/hooks/usePackages.ts` | Fix `usePackageStats` to use count queries |
| `src/hooks/usePackageMetrics.ts` | Fix to use count/sum queries |
| `src/pages/PackageDetails.tsx` | Display `access_locations` resolved names |
| `docs/data-contract-packages.md` (new) | Data contract |

No DB migration needed. No breaking changes.

