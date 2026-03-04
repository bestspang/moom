

# Members Import/Export & Enhanced Table Plan

## Current State
- Members page has a standalone Export button + Create button
- `useMembers` fetches only from `members` table (no joins for packages/attendance/contracts)
- `exportMembers()` in `lib/exportCsv.ts` exports basic fields only
- No import functionality exists
- `ManageDropdown` component exists in reports (reusable pattern)

## Plan

### 1. Enhance `useMembers` query with related data

**File: `src/hooks/useMembers.ts`**

Add a new hook `useMembersWithDetails` (or modify existing) that fetches members with:
- Latest active `member_packages` → joined `packages(name_en)` for "Recent package"
- Latest `member_attendance(check_in_time)` for "Last attended"  
- Count of `member_contracts` for "Contract status"

Since Supabase PostgREST can't easily do "latest of each" in a single query, fetch these as separate lightweight queries per page load, or use embedded selects with limit. Pragmatic approach: fetch `member_packages`, `member_attendance`, `member_contracts` as embedded relations in the members query, then compute in JS.

### 2. Update Members table columns

**File: `src/pages/Members.tsx`**

Add columns: Recent Package, Last Attended, Contract (Yes/No). Replace Export button with Manage dropdown.

### 3. Create Manage Dropdown for Members

**File: `src/pages/Members.tsx`**

Use a dropdown with "Import CSV" and "Export to CSV" items, plus the existing "Create Member" button.

### 4. Create ImportMembersDialog

**File: `src/components/members/ImportMembersDialog.tsx`**

Multi-step dialog:
- **Step 1 - Upload**: File input / drag-drop for CSV
- **Step 2 - Mapping**: Auto-detect columns from headers, show mapping UI
- **Step 3 - Preview**: Show first 20 rows with validation warnings
- **Step 4 - Import**: Process rows with progress, show results + error CSV download

Key logic:
- Parse CSV client-side (no library needed — split by newline/comma with quote handling)
- Header mapping: case-insensitive match of known aliases (Firstname→first_name, etc.)
- Dedup: match by member_id → phone → email
- Upsert: create or update via existing `useCreateMember` / `useUpdateMember` or direct batch
- Date parsing: accept YYYY-MM-DD and DD/MM/YYYY
- Phone: keep as string, preserve leading zeros
- Medical conditions → `has_medical_conditions` + `medical_notes`
- Activity log: one summary entry for bulk import

### 5. Update Export

**File: `src/lib/exportCsv.ts`**

Update `exportMembers` to accept the enriched data type (with recent_package, last_attended, contract_status) and export all visible columns.

### 6. Add CSV Templates

Generate template CSVs in-app (no static files needed). Two download links in ImportMembersDialog:
- Minimal: Firstname, Lastname, Nickname, Gender, Birthdate, Phone, Joined Date, Address, Medical Conditions
- Full: all supported fields

### 7. i18n Keys

Add translation keys for import/export UI labels in `en.ts` and `th.ts`.

## Files Summary

| Action | File |
|--------|------|
| Modify | `src/hooks/useMembers.ts` — add enriched query with joins |
| Modify | `src/pages/Members.tsx` — manage dropdown, new columns |
| Create | `src/components/members/ImportMembersDialog.tsx` — full import flow |
| Modify | `src/lib/exportCsv.ts` — update export with new columns |
| Modify | `src/i18n/locales/en.ts` + `th.ts` — import/export labels |

No DB migrations needed. No breaking changes.

