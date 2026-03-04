

# Create Lead Dialog — Implementation Plan

## Current State Analysis

**Leads table** has: `first_name`, `last_name`, `phone`, `email`, `source`, `notes`, `status`, `times_contacted`, `last_contacted`, `last_attended`.

**Missing from DB** (requested): nickname, gender, date_of_birth, register_location_id, address fields, line fields, AI fields (ai_tags, ai_summary, next_action, followup_at).

**Existing code**: `useCreateLead` mutation already exists in `useLeads.ts`. The Create button in `Leads.tsx` has no `onClick` handler.

---

## Plan

### 1. Database Migration — Add columns to `leads` table

Add columns that naturally belong on a lead record:

```sql
ALTER TABLE leads ADD COLUMN nickname text;
ALTER TABLE leads ADD COLUMN gender text;  -- male/female/other
ALTER TABLE leads ADD COLUMN date_of_birth date;
ALTER TABLE leads ADD COLUMN register_location_id uuid REFERENCES locations(id);
ALTER TABLE leads ADD COLUMN line_user_id text;
ALTER TABLE leads ADD COLUMN line_display_name text;
ALTER TABLE leads ADD COLUMN line_picture_url text;
ALTER TABLE leads ADD COLUMN line_link_status text DEFAULT 'unlinked';
ALTER TABLE leads ADD COLUMN ai_tags jsonb DEFAULT '[]';
ALTER TABLE leads ADD COLUMN ai_summary text;
ALTER TABLE leads ADD COLUMN next_action text;
ALTER TABLE leads ADD COLUMN followup_at timestamptz;
ALTER TABLE leads ADD COLUMN address text;  -- simple single address field
ALTER TABLE leads ADD COLUMN package_interest_id uuid REFERENCES packages(id);
```

This is additive-only — no existing columns changed. All nullable. Zero regression risk.

### 2. Create `src/components/leads/CreateLeadDialog.tsx`

Follow `CreateMemberDialog` pattern exactly:
- Dialog on desktop, Drawer on mobile
- `react-hook-form` + `zodResolver` + i18n memoized schema
- **Fields**: first_name*, last_name*, nickname, phone, email (at least one of phone/email required via `.refine()`), gender, date_of_birth, source (select: walk_in/referral/social_media/website/other), register_location_id (select from `useLocations`), address, notes
- **localStorage draft**: Save form values on change to `lead-create-draft`, restore on open, "Discard draft" button clears it
- LINE and AI fields are NOT shown in the form (they're for future programmatic use only)

### 3. Update `src/pages/Leads.tsx`

- Add `createDialogOpen` state
- Wire Create button `onClick` to open dialog
- Add `StatusTabs` for lead status filtering (new/contacted/interested/not_interested/converted) — consistent with Members page pattern
- Import and render `CreateLeadDialog`

### 4. Add i18n keys for leads form

Add to both `en.ts` and `th.ts`:
- `leads.source`, `leads.sourceOptions.*`, `leads.phoneOrEmailRequired`, `leads.discardDraft`, `leads.draftRestored`, `leads.leadCreated`, `leads.new`, `leads.contacted`, `leads.interested`, `leads.notInterested`, `leads.converted`

### 5. Update `useLeads.ts`

- Add `status` filter param to `useLeads(search, status)`
- Update query key to include status

---

## Files Summary

| Action | File |
|--------|------|
| Migration | Add 14 nullable columns to `leads` table |
| Create | `src/components/leads/CreateLeadDialog.tsx` |
| Modify | `src/pages/Leads.tsx` — dialog state + status tabs |
| Modify | `src/hooks/useLeads.ts` — add status filter |
| Modify | `src/i18n/locales/en.ts` — add lead form keys |
| Modify | `src/i18n/locales/th.ts` — add lead form keys |

No existing behavior changes. All new columns are nullable. Form uses existing `useCreateLead` mutation.

