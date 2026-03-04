

# System-Wide Data Completeness & Hardening Plan

## Assessment Summary

After auditing the full codebase, DB schema, hooks, and pages — the system is in **good shape**. All major tables exist, hooks have auth guards, activity logging is present, realtime sync covers 30+ tables, and CSV import/export works for Members and Leads. The gaps are incremental — missing fields in a few spots, some missing auth guards on sub-hooks, and a few missing indexes.

## What's Already Working (No Changes Needed)

- All 44 DB tables exist with appropriate columns
- Auth guards (`enabled: !!user`) on all major hooks (Members, Leads, Packages, Classes, Rooms, Locations, Schedule, Lobby, Finance, Announcements, Staff, Roles)
- Realtime sync for 30+ tables via `useRealtimeSync`
- Activity logging on all CRUD mutations
- CSV export for Members and Leads
- CSV import with 4-step wizard for Members and Leads
- Stats hooks use head-count queries (no 1000-row limit issue)
- LINE fields exist on `members`, `leads`, `line_users`
- AI metadata fields exist (`ai_tags`, `ai_profile_summary`, `ai_risk_signals`, etc.)
- Bilingual fields on packages, promotions, rooms, classes, announcements

---

## Actual Gaps Found

### GAP 1: Missing auth guard on `useStaffMember` and `useStaffPositions`
Both hooks use `enabled: !!id` but don't check `!!user`.

### GAP 2: Missing auth guard on `useDashboardStats`, `useHighRiskMembers`, `useHotLeads`, `useUpcomingBirthdays`
Dashboard hooks have no `enabled: !!user`.

### GAP 3: Members table missing `emergency_first_name`/`emergency_last_name` split
DB has `emergency_contact_name` (single field) + `emergency_contact_phone`, but the data contract requires split first/last. However, the wizard already uses `emergencyContactName`/`emergencyContactPhone` — these map to the existing columns. No actual gap.

### GAP 4: Missing DB indexes on commonly filtered columns
- `members.status` — no index
- `members.register_location_id` — no index  
- `leads.status` — no index
- `leads.register_location_id` — no index
- `transactions.status` — no index
- `transactions.created_at` — no index
- `schedule.scheduled_date` — no index
- `staff.status` — no index
- `classes.status` — no index
- `packages.status` — no index

### GAP 5: `training_templates` missing `description` column
The `training_templates` table only has `id, name, is_active, ai_tags, created_by, created_at, updated_at`. A description field would be useful.

### GAP 6: Finance transactions lack `location` column display
The `useFinanceTransactions` query already joins `location:locations(id, name)`, but the Finance page may not show it in all views.

### GAP 7: Missing `src/types/domain.ts`
No centralized domain types file. Types are scattered across individual hooks using Supabase generated types directly, which is actually fine — but a thin domain types file would help readability.

---

## Implementation Plan

### Step 1: DB Migration — Add missing performance indexes
Add indexes on frequently filtered columns across 6+ tables. No column changes needed.

### Step 2: Fix auth guards on dashboard + staff detail hooks (2 files)
- `src/hooks/useDashboardStats.ts`: Add `enabled: !!user` to all 4 hooks
- `src/hooks/useStaff.ts`: Add `enabled: !!user` to `useStaffMember` and `useStaffPositions`

### Step 3: Create `src/types/domain.ts`
Thin re-exports of Supabase types + enriched types used across pages. Not a rewrite — just a centralized import file.

### Step 4: Create `docs/INTEGRATION_NOTES.md`
Document each page's data sources, realtime subscriptions, and computed field definitions.

### Files to Touch

| File | Change |
|------|--------|
| DB migration | Add ~10 performance indexes |
| `src/hooks/useDashboardStats.ts` | Add auth guards to 4 hooks |
| `src/hooks/useStaff.ts` | Add auth guard to `useStaffMember` and `useStaffPositions` |
| `src/types/domain.ts` | New file — centralized domain type re-exports |
| `docs/INTEGRATION_NOTES.md` | New file — system map + data sources doc |

### What This Plan Does NOT Do (and why)

- **Does not restructure existing hooks/pages** — they already work correctly with full field coverage
- **Does not add new DB columns** — all required fields from the data contracts already exist in the schema
- **Does not change import/export** — already working for Members and Leads
- **Does not change LINE/AI fields** — already present in `members`, `leads`, `line_users`, `event_outbox`
- **Does not add a System Health page** — that was covered in the previous hardening plan and is a separate feature

This is a **minimal, zero-regression** hardening pass focused on the real gaps found during audit.

