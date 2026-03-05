

# Align Package Export/Template with Real-World CSV Format

The user uploaded a sample CSV showing the actual columns they use for packages. The current export doesn't match — it's missing key columns like ID, Categories, Access locations, Sold at, and Date modified.

## Current Export vs Desired Format

| Desired (from CSV) | Current Export | Status |
|---|---|---|
| ID (PKG-00001) | — | Missing |
| Name | Name (EN) | Partial (no TH) |
| Type | Type | OK |
| Term(D) | Term (Days) | OK (rename header) |
| Sessions | Sessions | OK (use "-" for null) |
| Price | Price | OK |
| Categories | — | Missing |
| Access locations | — | Missing |
| Sold at | — | Missing (needs location name resolution) |
| Date modified | — | Missing |
| Status | Status | OK |

## Plan

### 1. Update Export Columns (`Packages.tsx`)
Align `csvColumns` to match the uploaded CSV format:
- Add a generated `ID` column (could use a sequence or format from index, but the CSV shows `PKG-XXXXX` — we don't store this. We can use a truncated UUID or row index formatted as `PKG-NNNNN`)
- Rename headers to match: `Name`, `Type`, `Term(D)`, `Sessions`, `Price`, `Categories`, `Access locations`, `Sold at`, `Date modified`, `Status`
- Sessions: output `"-"` for null (unlimited)
- Categories: output `"All"` if `all_categories`, else join array
- Access locations: need to resolve UUIDs to names (fetch locations)
- Sold at: same as access locations (packages don't have a separate "sold at" — likely same as access locations or needs clarification)
- Date modified: format `updated_at`

### 2. Update Template Headers
Change `TEMPLATE_HEADERS` to match the export format so import/export are consistent.

### 3. Files
- **Edit**: `src/pages/Packages.tsx` — update export columns, template headers, add location fetching for name resolution

### Risk
- Zero regression: only changing export output format and template headers. No DB changes.

