

# Package Details Page — Implementation Plan

## Current State
- Routes: `/package` (list) and `/package/create` only
- `usePackage(id)` and `useUpdatePackage()` already exist
- `DataTable` supports `onRowClick` prop — just needs to be wired
- Related tables for metrics: `transactions` (has `package_id`), `member_packages` (has `package_id`, `status`)

## Plan

### 1. Add route — `src/App.tsx`
Add `<Route path="package/:id" element={<PackageDetails />} />` after the create route.

### 2. Wire row click — `src/pages/Packages.tsx`
Add `onRowClick={(row) => navigate(`/package/${row.id}`)}` to the DataTable. No new columns needed now (access_locations, sold_at not in DB — would show '-' with no value).

### 3. Create metrics hook — `src/hooks/usePackageMetrics.ts`
Queries `member_packages` and `transactions` filtered by `package_id`:
- **Sold this week**: count from `transactions` where `package_id = id` and `created_at >= 7 days ago`
- **Revenue to date**: sum `amount` from `transactions` where `package_id = id` and `status = 'completed'`
- **Active**: count from `member_packages` where `status = 'active'`
- **Inactive**: count from `member_packages` where `status` in ('expired', 'completed', 'on_hold')

### 4. Create page — `src/pages/PackageDetails.tsx`
Structure (following MemberDetails pattern):
- **Header**: Back button, package name, status badge, Edit/Archive actions
- **Performance cards row**: 4x StatCard (sold this week, revenue, active, inactive)
- **Details sections** in Card components with pencil icon toggle for inline edit:
  - Names (EN/TH)
  - Price
  - Term (term_days, expiration_days, sessions)
  - Recurring payment toggle
  - Quantity + user purchase limit
  - Access (usage_type, categories, access_days)
  - Description (EN/TH)
  - Status/Distribution
- Each section: view mode → edit mode on pencil click → save calls `useUpdatePackage()` → toast + invalidate

### 5. Activity log on edit
After successful update, insert into `activity_log` with `entity_type: 'package'`, `entity_id`, `old_value`/`new_value` diff.

### 6. i18n keys
Add package detail labels to `en.ts` and `th.ts`: `packages.details.*`, `packages.metrics.*`, section headers.

---

## Files Summary

| Action | File |
|--------|------|
| Modify | `src/App.tsx` — add route |
| Modify | `src/pages/Packages.tsx` — add onRowClick |
| Create | `src/hooks/usePackageMetrics.ts` |
| Create | `src/pages/PackageDetails.tsx` |
| Modify | `src/i18n/locales/en.ts` — detail keys |
| Modify | `src/i18n/locales/th.ts` — detail keys |

No DB migration needed. All data comes from existing tables.

