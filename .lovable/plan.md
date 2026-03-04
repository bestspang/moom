

# Members + Leads Data Completeness Plan

## Detected Gaps

### Members DB Schema
- Members uses `emergency_contact_name` (single) + `emergency_contact_phone` — needs split `emergency_first_name`/`emergency_last_name`/`emergency_phone` like leads/staff
- Medical/consent stored in jsonb (`medical`, `consents`) — needs flat columns (`has_medical_conditions`, `medical_notes`, `allow_physical_contact`, `physical_contact_notes`) for consistency with leads and CSV import/export
- Missing `line_id` column (LINE username, distinct from `line_user_id`)

### Members List Page
- Missing columns: `status`, `register_location_name`, `member_since` (joined_date)
- Query (`useMembers`) doesn't join `locations` table for location name

### Members Edit Dialog
- Only saves: name, nickname, email, phone, dob, gender, address (single field), status
- Missing: address_1/2, subdistrict, district, province, postal_code, emergency fields, medical, consent, source, package_interest, line_id

### Members Import
- Template only has 13 columns — needs all 26 contract columns
- `HEADER_ALIASES` and `TARGET_FIELDS` missing: address split fields, emergency, medical flat fields, line_id, register_location_id, allow_physical_contact
- Import doesn't write per-row activity_log entries (only bulk summary)

### Members Export  
- Only exports 10 basic columns — needs all 26 contract columns plus computed fields

### Leads Export
- Only exports 11 columns — missing address, emergency, medical fields

---

## Implementation Plan

### Step 1: DB Migration
Add flat columns to `members` to match leads/staff pattern:
- `emergency_first_name text`, `emergency_last_name text`, `emergency_phone text` (keep legacy `emergency_contact_name`/`emergency_contact_phone` for backward compat)
- `has_medical_conditions boolean DEFAULT false`, `medical_notes text`, `allow_physical_contact boolean DEFAULT false`, `physical_contact_notes text`
- `line_id text`

### Step 2: Update `useMembers` hook
- Change `select('*')` to `select('*, register_location:locations!register_location_id(id, name)')` to join location name

### Step 3: Update Members list page columns
Add columns: `status` (with StatusBadge), `register_location_name`, `member_since`

### Step 4: Update EditMemberDialog
Expand form to include all fields in collapsible sections (matching CreateMemberDialog pattern):
- Contact: phone, email, line_id
- Address: address_1, address_2, subdistrict, district, province, postal_code
- Emergency: emergency_first_name, emergency_last_name, emergency_phone, emergency_relationship
- Medical: has_medical_conditions, medical_notes
- Consent: allow_physical_contact, physical_contact_notes
- Other: source, package_interest_id, notes

### Step 5: Update Members Import
- Expand `HEADER_ALIASES` and `TARGET_FIELDS` to cover all 26+ contract columns
- Update `downloadTemplate('full')` to output exact contract columns
- Write per-row `logActivity` with `source: 'csv_import'` for create/update
- Map new flat columns in import data builder

### Step 6: Update Members Export
- Expand `ExportableMember` and `exportMembers()` to output all contract columns + computed (`recent_package_name`, `last_attended_at`)

### Step 7: Update Leads Export
- Expand `ExportableLead` and `exportLeads()` to include address, emergency, medical, consent fields

### Step 8: Update CreateMemberDialog submit
- Write to new flat columns instead of jsonb for medical/consent/emergency

### Files to Touch

| File | Change |
|------|--------|
| DB migration | Add ~8 columns to `members` |
| `src/hooks/useMembers.ts` | Join locations in query |
| `src/pages/Members.tsx` | Add status, location, joined_date columns |
| `src/components/members/EditMemberDialog.tsx` | Full field coverage with sections |
| `src/components/members/ImportMembersDialog.tsx` | Full template + aliases + per-row audit |
| `src/components/members/CreateMemberDialog.tsx` | Use flat columns for medical/emergency |
| `src/lib/exportCsv.ts` | Full member + lead export columns |
| `src/pages/Leads.tsx` | Export passes full lead data |

No style changes. All additive. Legacy columns preserved.

