

# System-Wide Hardening & Integration Plan

## 1. Detected Mismatches / Drift

After auditing schema, types, hooks, pages, and realtime sync:

### A. Schema vs Runtime Usage Mismatches
- **`members` table**: Has both legacy JSONB (`medical`, `consents`) AND new flat columns (`has_medical_conditions`, `medical_notes`, `allow_physical_contact`). The `EditMemberDialog` reads flat columns but `CreateMemberDialog` still writes BOTH (dual-write). Some export paths use `(m as any).has_medical_conditions` — indicating type awareness gaps.
- **`members.emergency_*`**: Legacy `emergency_contact_name`/`emergency_contact_phone` coexist with new `emergency_first_name`/`emergency_last_name`/`emergency_phone`. Export uses fallback chain `(m as any).emergency_first_name ?? m.emergency_contact_name`. This works but is fragile.
- **`training_templates`**: `description` column was added via migration but the `useTrainingTemplates` hook doesn't use `description` in insert/update.
- **`leads.status` enum**: DB enum is `new|contacted|interested|not_interested|converted`. The `useConvertLeadToMember` casts `'converted' as any` — this suggests `converted` may not be in the TS enum, OR the dev wasn't sure. Checking types: `lead_status` enum in types.ts DOES include `converted`, so the `as any` cast is unnecessary and masks type safety.

### B. Type Drift
- **`src/types/domain.ts`** exists but is NOT imported by most hooks/pages. Hooks still import directly from `@/integrations/supabase/types`. The domain types file is orphaned.
- **`ExportableMember` in `exportCsv.ts`** has `member_since` but the DB column is also `member_since`. No drift, but the CSV header says `joined_date` (display alias) — this is fine.
- **`useClassBookings` defines local interfaces** (`ClassBooking`, `ClassWaitlist`) instead of using generated types. These could drift if columns are added.

### C. Permission / UI Mismatches
- **Sidebar filters by `can(resource, 'read')`** but individual row actions (edit, delete) don't check `can(resource, 'write')` or `can(resource, 'delete')`. Users can see edit buttons they can't use — the server will reject, but UX is confusing.
- **`DiagnosticsDataAudit` page** has no access level guard in routing (`App.tsx`). Any authenticated user can access it.
- **Activity log `logActivity()` is fire-and-forget** — if it fails, no retry. The `console.warn` is the only signal. This is acceptable for now but means audit completeness is not guaranteed.

### D. Realtime Sync Gaps
- **`notifications` table** is NOT in `useRealtimeSync`'s `TABLE_INVALIDATION_MAP`. Notifications won't auto-refresh.
- **`roles` table** is NOT in the realtime sync map. Role changes require page refresh.
- **`user_roles` table** is NOT in realtime sync. If an admin changes a user's role, the affected user won't see it until they re-login.
- **`checkin_qr_tokens` table** is NOT in realtime sync. QR token expiry/usage won't reflect in real-time.

### E. Missing Idempotency Guards
- **`useMarkAttendance`**: No check for duplicate attendance records. If called twice for the same booking, it will insert 2 `member_attendance` rows and deduct 2 sessions from the package.
- **`useBatchMarkAttendance`**: Same issue at scale.
- **`useCreateCheckIn` (lobby)**: The `useCheckDuplicate` hook exists and is used in the UI, but the server (RLS/trigger) doesn't enforce uniqueness — it's client-side only.

### F. Missing Cross-Module Links
- **Finance transactions** don't have a `staff` join in the query despite `staff_id` being on the table. The `staff` relation is available but not fetched.
- **Lead conversion** copies basic fields but doesn't copy address/emergency/medical data from the lead to the new member.
- **Schedule cancellation** cancels bookings but doesn't refund sessions to `member_packages` or write ledger reversal entries.

### G. Default Data / Config Assumptions
- **No default location** check. If `locations` table is empty, many forms break silently (location dropdowns empty, check-ins fail).
- **No default role** check. If `roles` table is empty, staff creation with positions fails.
- **`handle_new_user` trigger** creates staff with `status: 'pending'` and `role: 'front_desk'` but doesn't assign a `role_id` from the `roles` table. The `staff.role_id` stays null until manually set.

---

## 2. Fix Plan (prioritized by impact)

### Phase 1: Critical Data Integrity Fixes

**File: `src/hooks/useClassBookings.ts`**
- Add idempotency guard to `useMarkAttendance`: before inserting `member_attendance`, check if a record already exists for this `(member_id, schedule_id)`. If yes, skip insert + ledger deduction.
- Same for `useBatchMarkAttendance`.

**File: `src/hooks/useRealtimeSync.ts`**
- Add missing tables to `TABLE_INVALIDATION_MAP`:
  - `notifications` → `['notifications']`
  - `roles` → `['roles', 'role-permissions', 'my-permissions']`
  - `user_roles` → `['my-permissions', 'user-roles']`
  - `checkin_qr_tokens` → `['checkin-qr-tokens', 'check-ins']`

**File: `src/hooks/useLobby.ts` (useCancelSchedule in useSchedule.ts)**
- When cancelling a schedule with booked members who have `member_package_id`, refund sessions: insert positive ledger entry and increment `sessions_remaining`.

### Phase 2: Type & Contract Alignment

**File: `src/hooks/useLeads.ts`**
- Remove `as any` cast in `useConvertLeadToMember` — the `converted` status IS in the enum.

**File: `src/hooks/useClassBookings.ts`**
- Replace local `ClassBooking`/`ClassWaitlist` interfaces with `Tables<'class_bookings'>` and `Tables<'class_waitlist'>` from generated types.

**File: Multiple hooks**
- Where hooks still import directly from `@/integrations/supabase/types`, that's fine — the `src/types/domain.ts` file serves as optional convenience, not mandatory. No forced migration needed.

### Phase 3: Permission UX Alignment

**File: `src/pages/Members.tsx`**
- Wrap the Edit dropdown action with `can('members', 'write')` check — hide if user lacks write permission.

**File: `src/pages/Leads.tsx`**
- Wrap Convert action with `can('leads', 'write')` check.

**File: `src/App.tsx`**
- Add `minAccessLevel="level_4_master"` to the DiagnosticsDataAudit route.

### Phase 4: Cross-Module Integration

**File: `src/hooks/useLeads.ts` — `useConvertLeadToMember`**
- After converting, copy address/emergency/medical fields from lead to the new member record (or document that this is the caller's responsibility and verify the caller does it).

**File: `src/hooks/useFinance.ts`**
- Add `staff:staff(id, first_name, last_name)` to the finance transactions query for display.

**File: `src/hooks/useTrainingTemplates.ts`**
- Accept `description` field in create/update mutations.

### Phase 5: System Health / Diagnostics

**File: `src/pages/DiagnosticsDataAudit.tsx`**
- Expand checks to include:
  - At least 1 location exists
  - At least 1 role exists
  - `handle_new_user` trigger exists (can check via RPC or just document)
  - Realtime subscription count matches expected tables
  - Secrets configured (already in context)

### Phase 6: Documentation

**File: `docs/INTEGRATION_NOTES.md`**
- Update with new invariants, idempotency rules, and realtime coverage map.

---

## 3. Final Invariants List

| Invariant | Enforcement |
|-----------|------------|
| Attendance is recorded at most once per (member, schedule) | Check before insert in `useMarkAttendance` |
| Package sessions are decremented atomically with ledger entry | Same transaction in `useMarkAttendance` |
| Schedule cancellation refunds sessions | Ledger reversal in `useCancelSchedule` |
| Lead conversion copies all profile data | Caller responsibility (CreateMemberDialog) |
| Notifications refresh in real-time | Added to realtime sync map |
| Role changes reflect immediately | Added `roles`/`user_roles` to realtime sync |
| Only master-level users access diagnostics | Route guard in App.tsx |
| Edit/delete buttons hidden when user lacks permission | `can()` checks in UI |
| Audit log written for every mutation | `logActivity()` in every mutation's `onSuccess` |
| At least 1 location and 1 role must exist | Diagnostics page checks |

---

## 4. Golden-Path Test Checklist

1. **Sign up** → verify staff record created with `pending` status and `front_desk` role
2. **Log in** → verify dashboard loads with KPIs (0 if empty)
3. **Create location** → verify it appears in dropdowns
4. **Create role** → verify it appears in staff position assignment
5. **Create member** → verify all fields persisted (profile, contact, address, emergency, medical)
6. **Import members via CSV** → verify upsert, per-row activity log, error reporting
7. **Export members** → verify all 28+ columns present including computed
8. **Create class + schedule** → verify room capacity validation
9. **Book member into class** → verify booking created, session count unchanged
10. **Mark attendance** → verify session decremented, ledger entry created, attendance record created
11. **Mark attendance again (idempotency)** → verify NO duplicate deduction
12. **Cancel schedule** → verify all bookings cancelled, sessions refunded
13. **Check in via lobby** → verify attendance recorded, duplicate check works
14. **Create lead → convert to member** → verify all data carried over
15. **Change user role (as admin)** → verify sidebar updates via realtime
16. **Access diagnostics as non-master** → verify redirect

---

## 5. Implementation Summary

**Files to modify:**
| File | Change | Risk |
|------|--------|------|
| `src/hooks/useClassBookings.ts` | Idempotency guards on attendance marking | Medium — core flow |
| `src/hooks/useRealtimeSync.ts` | Add 4 missing tables | Low — additive |
| `src/hooks/useSchedule.ts` | Session refund on cancel | Medium — financial |
| `src/hooks/useLeads.ts` | Remove `as any` cast | Low — type fix |
| `src/hooks/useFinance.ts` | Add staff join | Low — additive |
| `src/hooks/useTrainingTemplates.ts` | Accept description field | Low — additive |
| `src/pages/Members.tsx` | Permission-gated edit button | Low — UI only |
| `src/pages/Leads.tsx` | Permission-gated convert button | Low — UI only |
| `src/App.tsx` | Access guard on diagnostics route | Low — security |
| `src/pages/DiagnosticsDataAudit.tsx` | Add system health checks | Low — additive |
| `docs/INTEGRATION_NOTES.md` | Update invariants | None |

No DB migrations needed — all schema is already aligned.

