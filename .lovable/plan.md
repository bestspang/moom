

# Convert Lead to Member — Implementation Plan

## Current State

- **Leads table**: No `converted_member_id` column exists. Has `status` with `converted` value.
- **Member wizard**: Uses its own Zod schema in `src/components/members/wizard/types.ts`. Lead form uses inline schema in `CreateLeadDialog.tsx`.
- **Leads page**: DataTable has no row actions (no 3-dot menu).
- **DataTable component**: No built-in actions column support — must add a column manually.

## Plan

### 1. Database Migration

Add `converted_member_id` to `leads` table:

```sql
ALTER TABLE leads ADD COLUMN converted_member_id uuid REFERENCES members(id);
```

### 2. Create `src/lib/personSchemas.ts`

Extract shared Zod schemas used by both lead and member forms:
- `personProfileSchema(t)` — firstName, lastName, nickname, dateOfBirth, gender
- `personContactSchema(t)` — phone, email
- `personAddressSchema()` — address
- `emergencyContactSchema()` — name, phone, relationship
- `medicalInfoSchema()` — hasMedicalConditions, medicalNotes
- `consentInfoSchema()` — allowPhysicalContact, physicalContactNotes

### 3. Refactor `CreateLeadDialog.tsx` schema

Replace inline `leadSchema` with composition from `personSchemas` + lead-specific fields (source, registerLocationId, notes). Behavior stays identical.

### 4. Refactor `wizard/types.ts` schema

Replace `createMemberWizardSchema` with composition from `personSchemas` + member-specific fields (registerLocationId required). Behavior stays identical.

### 5. Add "Convert to member" action to Leads table

- Add an actions column to the DataTable in `Leads.tsx` with a DropdownMenu (3-dot icon) per row.
- "Convert to member" menu item opens `CreateMemberDialog` with `initialData` prefilled from the lead record.

### 6. Update `CreateMemberDialog` to accept `initialData` + `onConvertLead` callback

- Add optional prop `initialData?: Partial<MemberWizardFormData>` to prefill form fields from a lead.
- Add optional prop `convertLeadId?: string` — when set, on successful member creation, call `useUpdateLead` to set `status = 'converted'` and `converted_member_id = newMemberId`.
- Invalidate both `leads` and `members` queries on success.

### 7. Add `useConvertLeadToMember` hook (in `useLeads.ts`)

A simple wrapper that updates the lead with `status: 'converted'` and `converted_member_id`. Called from `CreateMemberDialog` after successful member insert.

### 8. i18n keys

Add `leads.convertToMember`, `leads.convertSuccess` to both `en.ts` and `th.ts`.

---

## Files Summary

| Action | File |
|--------|------|
| Migration | Add `converted_member_id uuid` to `leads` |
| Create | `src/lib/personSchemas.ts` — shared Zod schemas |
| Modify | `src/components/leads/CreateLeadDialog.tsx` — use shared schemas |
| Modify | `src/components/members/wizard/types.ts` — use shared schemas |
| Modify | `src/components/members/CreateMemberDialog.tsx` — accept `initialData` + `convertLeadId` |
| Modify | `src/pages/Leads.tsx` — add actions column with convert option |
| Modify | `src/hooks/useLeads.ts` — add convert mutation |
| Modify | `src/i18n/locales/en.ts` + `th.ts` — add convert keys |

No breaking changes. All existing form behavior preserved. Schema refactor is purely structural — same validation rules, same field names.

