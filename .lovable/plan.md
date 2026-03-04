

# Add Edit Mode to CreatePackage

## Current State
- `CreatePackage.tsx` is create-only, no edit support
- Route is `/package/create`; detail view is at `/package/:id` (PackageDetails page)
- `usePackage(id)` and `useUpdatePackage()` hooks already exist in `usePackages.ts`
- Form uses react-hook-form + Zod with `defaultValues` and draft autosave to localStorage

## Plan

### 1. Add Edit Route — `src/App.tsx`
Add `<Route path="package/:id/edit" element={<CreatePackage />} />` next to the create route.

### 2. Modify `src/pages/CreatePackage.tsx`

**Detect edit mode:**
- Read `id` from `useParams()`. If present → edit mode.
- Fetch package via `usePackage(id)` when in edit mode.
- Import `useUpdatePackage` alongside `useCreatePackage`.

**Populate form on load:**
- When `usePackage` data arrives, map the DB record back to `FormValues` and call `reset(mappedValues)`.
- Skip draft restore when in edit mode.
- Skip draft autosave when in edit mode.

**Mapping DB → Form (reverse of `onSubmit`):**
```
nameEn ← name_en
nameTh ← name_th
packageType ← type
price ← String(price)
duration ← String(term_days)
expiration ← String(expiration_days)
sessions ← String(sessions)
recurringPayment ← recurring_payment
quantityType ← infinite_quantity ? 'infinite' : 'specific'
quantity ← String(quantity)
purchaseLimitType ← infinite_purchase_limit ? 'infinite' : 'specific'
purchaseLimit ← String(user_purchase_limit)
usageType ← usage_type ('gym_checkin_only' → 'gym_only')
categoryType ← all_categories ? 'all' : 'specific'
selectedCategories ← categories
locationMode ← all_locations ? 'all' : 'specific'
selectedLocations ← access_locations
accessType ← any_day_any_time ? 'any' : 'specific'
accessDays ← access_days
descriptionEn ← description_en
descriptionTh ← description_th
distribution ← status → reverse map
scheduleStartAt ← schedule_start_at
scheduleEndAt ← schedule_end_at
```

**Submit behavior:**
- In edit mode: call `updatePackage.mutate({ id, data: packageData })` instead of `createPackage.mutate`.
- No localStorage clear needed in edit mode.
- Navigate back to `/package/${id}` on success.

**UI changes:**
- Title: "Edit Package" instead of "Create Package" when editing.
- Hide "Discard Draft" button in edit mode.
- Submit button text: "Save Changes" vs "Create Package".
- Breadcrumb: include package name.

### 3. Add Navigation from PackageDetails
Add an "Edit" button on PackageDetails that navigates to `/package/${id}/edit`.

### 4. i18n Keys
Add `packages.edit.title`, `packages.edit.saveChanges` to en.ts and th.ts.

## Files Summary

| Action | File |
|--------|------|
| Modify | `src/App.tsx` — add edit route |
| Modify | `src/pages/CreatePackage.tsx` — add edit mode logic |
| Modify | `src/pages/PackageDetails.tsx` — add edit button |
| Modify | `src/i18n/locales/en.ts` — new keys |
| Modify | `src/i18n/locales/th.ts` — new keys |

No database changes. No new files. Reuses existing `usePackage` and `useUpdatePackage` hooks.

