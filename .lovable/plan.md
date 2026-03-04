

# Members & Leads Data Completeness — Gap Analysis & Plan

## Current State Analysis

### Members Table Schema
The `members` table has:
- Basic fields: `first_name`, `last_name`, `nickname`, `gender`, `date_of_birth`, `phone`, `email`, `member_id`, `status`, `is_new`, `member_since`
- Location: `register_location_id` (FK)
- Address: Single `address` text field (NO structured address columns)
- Emergency: `emergency_contact_name`, `emergency_contact_phone`, `emergency_relationship`
- Medical/Consent: Stored as `medical` (jsonb) and `consents` (jsonb) — NOT flat columns
- Other: `source`, `package_interest_id`, `notes`

### Leads Table Schema
Has all structured fields: `address_1`, `address_2`, `subdistrict`, `district`, `province`, `postal_code`, `emergency_first_name`, `emergency_phone`, `has_medical_conditions`, `medical_notes`, `allow_physical_contact`, `physical_contact_notes`. Complete.

### Create Member Form
- Address step uses single `address` textarea — no structured fields
- Medical/consent correctly maps to jsonb (`medical`, `consents`)
- All other fields persist correctly

### Create Lead Form
- All sections fully mapped to DB columns. Working correctly.

### Members List Enrichment
- `useMembersEnrichment` correctly queries `member_packages`, `member_attendance`, `member_contracts`
- Query key is `['members-enrichment', memberIds]` — NOT invalidated by realtime changes to those tables

### Member Stats
- `useMemberStats` fetches ALL member `status` values client-side — will break at 1000+ members (Supabase default limit)

### Realtime
- `member_packages` changes invalidate `['member-packages']` but NOT `['members-enrichment']`
- `member_attendance` changes invalidate `['member-attendance']` but NOT `['members-enrichment']`
- `member_contracts` changes invalidate `['member-contracts']` but NOT `['members-enrichment']`

---

## Gaps Found

### GAP 1: Members missing structured address columns
**Severity**: Medium
The spec asks for `address_1`, `address_2`, `subdistrict`, `district`, `province`, `postal_code` (like Leads has). Members only has a single `address` text field. The wizard StepAddress is just a single textarea.
**Fix**: Add structured address columns to `members` table. Update StepAddress to use structured fields. Update create member submit to persist them.

### GAP 2: Members use jsonb for medical/consent — spec wants flat columns
**Severity**: Low — current jsonb approach works and is internally consistent. Adding flat columns would require migrating existing data and updating all read/write paths.
**Recommendation**: Keep jsonb approach. It works. The form correctly maps to it.

### GAP 3: Enrichment not invalidated by realtime
**Severity**: Medium — When a member checks in, purchases a package, or uploads a contract, the list won't update until manual refresh.
**Fix**: Add `'members-enrichment'` to `member_packages`, `member_attendance`, and `member_contracts` entries in `TABLE_INVALIDATION_MAP`.

### GAP 4: `useMemberStats` hits 1000-row limit
**Severity**: High — Stats will be wrong for gyms with 1000+ members.
**Fix**: Use `select('status', { count: 'exact', head: false })` with individual status queries, or better: make 4 count queries with `.eq('status', X).select('id', { count: 'exact', head: true })`.

### GAP 5: No `docs/data-contract-members.md`
**Severity**: Low — Documentation gap.
**Fix**: Create the file.

### GAP 6: `docs/data-contract-leads.md` already exists
Already provided in project files. No action needed.

---

## Implementation Plan

### Step 1: DB Migration — Add structured address columns to `members`
```sql
ALTER TABLE members ADD COLUMN IF NOT EXISTS address_1 text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS address_2 text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS subdistrict text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS province text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS postal_code text;
```

### Step 2: Fix `useMemberStats` to avoid 1000-row limit
Replace client-side counting with individual count queries per status, plus a total count. Each uses `{ count: 'exact', head: true }`.

### Step 3: Fix realtime invalidation for enrichment
Add `'members-enrichment'` to `member_packages`, `member_attendance`, and `member_contracts` entries in `TABLE_INVALIDATION_MAP`.

### Step 4: Update StepAddress to use structured fields
Replace the single textarea with fields for `address_1`, `address_2`, `subdistrict`, `district`, `province`, `postal_code`. Update the wizard schema to include these fields.

### Step 5: Update CreateMemberDialog submit to persist structured address
Map the new address fields to DB columns in the `onSubmit` handler.

### Step 6: Create `docs/data-contract-members.md`
Document all fields, DB mappings, derived columns, activity log events, and query keys.

### Files to Touch

| File | Change |
|------|--------|
| DB migration | Add structured address columns to `members` |
| `src/hooks/useMembers.ts` | Fix `useMemberStats` to use count queries |
| `src/hooks/useRealtimeSync.ts` | Add `members-enrichment` to 3 table entries |
| `src/components/members/wizard/StepAddress.tsx` | Structured address fields |
| `src/components/members/wizard/types.ts` | Add address fields to schema + STEP_FIELDS |
| `src/lib/personSchemas.ts` | Update `personAddressSchema` with structured fields |
| `src/components/members/CreateMemberDialog.tsx` | Map structured address in submit |
| `src/components/leads/CreateLeadDialog.tsx` | Already uses structured address — no change |
| `docs/data-contract-members.md` (new) | Data contract |
| `src/i18n/locales/en.ts` + `th.ts` | Add address field labels for member wizard |

### Out of Scope
- Converting `medical`/`consents` from jsonb to flat columns (working as-is, too risky)
- Lead module changes (already complete)

