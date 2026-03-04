

# Member Creation Wizard — Implementation Plan

## Current State

- `members` table already has: `emergency_contact_name`, `emergency_contact_phone`, `address`, `notes`, `register_location_id`, `gender`, `date_of_birth`, `nickname`
- Missing from DB: emergency_relationship, medical/consent/AI/LINE jsonb fields, source, package_interest_id
- `CreateMemberDialog` is a simple single-step form
- `CreateLeadDialog` shows the draft persistence pattern we can reuse

## Plan

### 1. Database Migration — Add columns to `members`

Add these nullable columns (additive only, zero regression):

```sql
ALTER TABLE members ADD COLUMN emergency_relationship text;
ALTER TABLE members ADD COLUMN medical jsonb DEFAULT '{}'::jsonb;
ALTER TABLE members ADD COLUMN consents jsonb DEFAULT '{}'::jsonb;
ALTER TABLE members ADD COLUMN source text;
ALTER TABLE members ADD COLUMN package_interest_id uuid REFERENCES packages(id);
ALTER TABLE members ADD COLUMN line_user_id text;
ALTER TABLE members ADD COLUMN line_display_name text;
ALTER TABLE members ADD COLUMN line_picture_url text;
ALTER TABLE members ADD COLUMN line_link_status text DEFAULT 'unlinked';
ALTER TABLE members ADD COLUMN ai_profile_summary text;
ALTER TABLE members ADD COLUMN ai_tags jsonb DEFAULT '[]'::jsonb;
ALTER TABLE members ADD COLUMN ai_risk_signals jsonb DEFAULT '[]'::jsonb;
```

### 2. Replace `CreateMemberDialog.tsx` with Step Wizard

Rewrite the form body as a 6-step wizard inside the same Dialog/Drawer shell:

- **Step indicator**: numbered progress dots (1–6) at the top
- **Step 1 — Profile**: photo placeholder, first_name*, last_name*, nickname, dob, gender, register_location_id*
- **Step 2 — Contact**: phone, email (at least one required), line_id field + disabled "Link LINE" button with tooltip
- **Step 3 — Address**: address (single text field — matches existing column)
- **Step 4 — Emergency**: emergency_contact_name, emergency_contact_phone, emergency_relationship
- **Step 5 — Medical & Consent**: has_medical_conditions toggle + medical_notes, allow_physical_contact toggle + physical_contact_notes
- **Step 6 — Other**: source, package_interest_id, internal notes

**Bottom bar**: Back / Next buttons, with "Create" on final step. Error banner when required fields incomplete.

### 3. Draft Persistence

- localStorage key `member-create-draft`, debounced save on every change (same pattern as CreateLeadDialog)
- Restore on open, "Discard" button clears and closes

### 4. Validation (Zod)

- `first_name`, `last_name` required
- `register_location_id` required
- `.refine()`: phone OR email at least one
- Per-step validation on "Next" click (only validate current step's fields)

### 5. Submit Mapping

Insert into `members` table with:
- Profile fields → direct columns
- Emergency → `emergency_contact_name`, `emergency_contact_phone`, `emergency_relationship`
- Medical/Consent → `medical` jsonb, `consents` jsonb (typed Zod shapes)
- Other → `source`, `package_interest_id`, `notes`
- AI/LINE fields left null on creation

### 6. i18n Keys

Add wizard step labels, emergency/medical/consent field labels, LINE tooltip text to both `en.ts` and `th.ts`.

---

## Files Summary

| Action | File |
|--------|------|
| Migration | Add ~13 nullable columns to `members` table |
| Rewrite | `src/components/members/CreateMemberDialog.tsx` — wizard stepper |
| Modify | `src/i18n/locales/en.ts` — wizard + medical/emergency labels |
| Modify | `src/i18n/locales/th.ts` — matching translations |

No changes to `Members.tsx`, `useMembers.ts`, or any other existing files. The mutation (`useCreateMember`) already accepts `MemberInsert` which will auto-include new columns after migration.

