

# Recheck: Members & Leads Data Completeness (`members_leads_data_completeness_01`)

## Verification Results

### A) Data Contracts — ✅ DONE
- `docs/data-contract-members.md` exists with full field mapping, derived columns, activity log events, query keys, and realtime spec.
- `docs/data-contract-leads.md` exists with full field mapping, activity log events, query keys, CSV import/export spec.

### B) DB Schema — ✅ DONE
- **Members table**: All columns verified in generated types — `address_1`, `address_2`, `subdistrict`, `district`, `province`, `postal_code`, `emergency_contact_name`, `emergency_contact_phone`, `emergency_relationship`, `medical` (jsonb), `consents` (jsonb), `source`, `package_interest_id`, `status` enum, `is_new`, `member_since`.
- **Leads table**: All columns verified in DB schema — structured address, emergency, medical, consent, sales tracking fields all present.
- **Supporting tables**: `member_packages`, `member_attendance`, `member_contracts`, `member_billing`, `transactions` all exist.

### C) Create Member form — ✅ DONE
- `CreateMemberDialog.tsx` persists ALL fields: profile, contact, structured address (`address_1`..`postal_code`), emergency, medical/consent (jsonb), source, package interest, notes.
- Activity log: `member_created` logged in `useCreateMember`.

### D) Create Lead form — ✅ DONE (per previous analysis)
- All sections mapped to DB columns. Activity log: `lead_created` logged.

### E) Members list derived columns — ✅ DONE
- `useMembersEnrichment` queries `member_packages` (active/ready_to_use + join packages.name_en), `member_attendance` (latest check_in_time), `member_contracts` (existence).
- Search covers: `first_name`, `last_name`, `nickname`, `member_id`, `phone`, `email`.

### F) Member stats — ✅ DONE
- `useMemberStats` uses individual head-only count queries per status, avoiding the 1000-row limit.

### G) Leads list — ✅ DONE
- Shows status, times_contacted, last_contacted, last_attended. Search by name/phone.

### H) Realtime + invalidation — ✅ DONE
- `member_attendance` → invalidates `['members-enrichment']` ✅
- `member_packages` → invalidates `['members-enrichment']` ✅
- `member_contracts` → invalidates `['members-enrichment']` ✅
- `leads` → invalidates `['leads', 'hot-leads']` ✅

---

## Minor Gap Found

### GAP: `useMembersEnrichment` doesn't filter contracts by `is_signed = true`
**Severity**: Low
The data contract says "Contract = EXISTS where is_signed = true", but `useMembersEnrichment` line 39-42 queries `member_contracts` without filtering by `is_signed`. This means unsigned/draft contracts would show "Yes" in the list.

**Fix**: Add `.eq('is_signed', true)` to the contracts query in `useMembersEnrichment`.

---

## Plan

### Single change: Fix contract enrichment filter

**File**: `src/hooks/useMembersEnriched.ts` line 41
- Add `.eq('is_signed', true)` to the contracts query

No other changes needed. Everything else is complete and verified.

