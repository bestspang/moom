

# Add "Manage" Dropdown to 7 Pages

Add a consistent "Manage" dropdown button (matching Members/Leads pattern) with Export CSV, Import CSV, and Download Template options to: **Packages, Promotions, Staff, Roles, Locations, Workout List, Finance (Transfer Slips tab)**.

## Pattern

Each page gets a `DropdownMenu` with:
- **Export CSV** — exports current table data using `exportToCsv()`
- **Download Template** — downloads a blank CSV with correct headers
- **Import CSV** (where applicable) — opens an import dialog (future; for now just Export + Template)

Since most of these entities don't have import dialogs yet, we'll add Export + Template for all 7 pages now. Import dialogs can be added later per entity.

## Changes Per Page

| Page | Current Actions | New Actions |
|------|----------------|-------------|
| **Packages** | Separate Export button + Create | Manage dropdown (Export, Template) + Create |
| **Promotions** | Create button only | Manage dropdown (Export, Template) + Create |
| **Staff** | Create button only | Manage dropdown (Export, Template) + Create |
| **Roles** | Create button only | Manage dropdown (Export, Template) + Create |
| **Locations** | Create button only | Manage dropdown (Export, Template) + Create |
| **Workout List** | Create button only | Manage dropdown (Export, Template) + Create |
| **Finance** | Export on Transactions tab | Manage dropdown on Transactions + Transfer Slips tabs |

## Implementation

### 1. Create reusable `ManageDropdown` component
A shared component at `src/components/common/ManageDropdown.tsx` accepting:
- `onExport: () => void`
- `onDownloadTemplate: () => void`  
- `onImport?: () => void` (optional, renders Import item only if provided)
- `exportDisabled?: boolean`

This avoids duplicating the dropdown markup 7 times.

### 2. Update each page
- Replace standalone Export buttons with `ManageDropdown`
- Add export logic using `exportToCsv` with appropriate column configs
- Add template download with correct CSV headers per entity

### 3. i18n
Add missing keys if needed (most like `common.manage`, `common.downloadTemplate` should already exist from Members page).

## Files
| File | Action |
|------|--------|
| `src/components/common/ManageDropdown.tsx` | **Create** — reusable dropdown |
| `src/components/common/index.ts` | **Edit** — re-export |
| `src/pages/Packages.tsx` | **Edit** — replace export button |
| `src/pages/Promotions.tsx` | **Edit** — add manage dropdown |
| `src/pages/Staff.tsx` | **Edit** — add manage dropdown |
| `src/pages/Roles.tsx` | **Edit** — add manage dropdown |
| `src/pages/Locations.tsx` | **Edit** — add manage dropdown |
| `src/pages/WorkoutList.tsx` | **Edit** — add manage dropdown |
| `src/pages/Finance.tsx` | **Edit** — add manage dropdown to slip tab |

## Risk
- Zero regression: only adding a new dropdown next to existing Create buttons
- Export logic uses existing `exportToCsv` utility
- No DB/schema changes

