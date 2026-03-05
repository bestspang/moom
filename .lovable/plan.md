

# Fix: Add "Date modified" and missing columns to Settings package export

## Problem
The package export from **Settings > Import/Export** page (`SettingsImportExport.tsx` lines 149-163) only exports 8 basic columns: `name_en, name_th, type, price, sessions, expiration_days, term_days, status`.

It is missing columns that the Packages page export (`Packages.tsx` lines 105-119) already includes:
- **ID** (formatted as PKG-00001)
- **Categories**
- **Access locations**
- **Sold at** (same as access locations)
- **Date modified** (from `updated_at`)

The user's screenshot shows these columns are expected in the export.

## Fix (surgical, 1 file)

**File:** `src/pages/settings/SettingsImportExport.tsx` lines 149-163

Update the packages export `cols` array to match the full column set from the Packages page export, adding:
1. `id` column — formatted as `PKG-{index}` (same pattern as Packages page)
2. `categories` — resolve from `all_categories` / `categories` array
3. `access_locations` — resolve from `all_locations` / `access_locations` array joined with locations table
4. `sold_at` — same as access_locations
5. `date_modified` — from `updated_at`, formatted as `d MMM yyyy` uppercase

Also fetch locations (join or separate query) to resolve location UUIDs to names, matching how the Packages page does it.

## Risk
- **Low**: Only changes the CSV output of one export path. No other behavior affected.

