

# Leads Module Data Completion Plan

## Current State

**What exists:**
- `leads` DB table with: first_name, last_name, nickname, phone, email, gender, date_of_birth, address (single field), source, notes, register_location_id, status enum, times_contacted, last_contacted, last_attended, converted_member_id, line fields, ai fields
- CreateLeadDialog saves basic fields (name, phone, email, gender, dob, source, location, address, notes)
- Leads list page with status tabs, search, convert-to-member action
- Hooks: useLeads, useCreateLead, useUpdateLead, useDeleteLead, useConvertLeadToMember (all with activity logging)
- Realtime sync already covers `leads` table

**What's missing:**
- DB: No address_1/address_2/subdistrict/district/province/postal_code, no emergency_* columns, no medical/consent columns, no temperature, no internal_notes (separate from notes)
- CreateLeadDialog: Only saves basic fields — no emergency, medical, consent, or structured address
- Leads list: No Manage dropdown (Import/Export), no source/location columns
- No ImportLeadsDialog
- No export function for leads

## Plan

### 1. DB Migration — Add missing columns to `leads` table

Add columns:
- `address_1`, `address_2`, `subdistrict`, `district`, `province`, `postal_code` (all text nullable)
- `emergency_first_name`, `emergency_last_name`, `emergency_phone`, `emergency_relationship` (all text nullable)
- `has_medical_conditions` (boolean default false)
- `medical_notes` (text nullable)
- `allow_physical_contact` (boolean default false)
- `physical_contact_notes` (text nullable)
- `temperature` (text nullable — 'hot'/'cold')
- `internal_notes` (text nullable)

Keep existing `address` column for backward compat. Keep existing `notes` for general notes.

### 2. Expand CreateLeadDialog to save ALL fields

Restructure CreateLeadDialog to include sections matching the member wizard:
- Profile (existing): first_name, last_name, nickname, gender, dob
- Contact (existing): phone, email
- Source/Location (existing): source, register_location_id
- Address (new): address_1, address_2, subdistrict, district, province, postal_code
- Emergency (new): emergency_first_name, emergency_last_name, emergency_phone, emergency_relationship
- Medical (new): has_medical_conditions, medical_notes
- Consent (new): allow_physical_contact, physical_contact_notes
- Other (existing+new): package_interest_id, internal_notes, notes

Use collapsible sections to keep the form manageable. Reuse `personSchemas` where applicable.

### 3. Update Leads list with Manage dropdown + more columns

- Add Manage dropdown (Import CSV / Export to CSV) like Members page
- Add columns: Source, Register location (join with locations table)
- Keep existing columns: Name, Phone, Email, Status, Times contacted, Last contacted, Last attended

### 4. Create ImportLeadsDialog

Mirror the Members ImportMembersDialog pattern:
- Step 1: Upload CSV (drag & drop)
- Step 2: Mapping (auto-detect with HEADER_ALIASES for lead fields)
- Step 3: Preview with validation (first_name required, phone or email required)
- Step 4: Import with progress + error CSV download

Upsert: match by phone → email. Insert new or update existing.
Activity log: `lead_bulk_import` with counts.

### 5. Export leads to CSV

Export current filtered dataset with columns: first_name, last_name, nickname, phone, email, status, temperature, times_contacted, last_contacted, last_attended, source.

### 6. i18n keys

Add English and Thai translations for new form fields, import/export labels.

## Files Summary

| Action | File |
|--------|------|
| Migration | Add ~14 columns to `leads` table |
| Modify | `src/components/leads/CreateLeadDialog.tsx` — expand form sections |
| Modify | `src/pages/Leads.tsx` — add Manage dropdown, more columns |
| Create | `src/components/leads/ImportLeadsDialog.tsx` — full CSV import flow |
| Modify | `src/lib/exportCsv.ts` — add `exportLeads` function |
| Modify | `src/hooks/useLeads.ts` — join locations for display |
| Modify | `src/i18n/locales/en.ts` + `th.ts` — new keys |

No breaking changes to existing functionality.

