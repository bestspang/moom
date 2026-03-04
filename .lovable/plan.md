

# Full Data Audit & Completion Plan

## Analysis Summary

After auditing every hook and page, the system is **mostly well-wired**. The DB schema already covers nearly all UI fields. The main gaps are:

### Gap 1: Missing `logActivity` in many mutation hooks

These hooks perform CRUD but do NOT call `logActivity`:

| Hook | Missing mutations |
|------|-------------------|
| `useClasses.ts` | create, update, delete |
| `useClassCategories.ts` | create, update, delete |
| `useClassBookings.ts` | createBooking, cancelBooking, markAttendance |
| `useRooms.ts` | create, update, delete |
| `usePackages.ts` | create, update, delete, archive |
| `useFinance.ts` | updateTransactionStatus |
| `useAnnouncements.ts` | create, update, delete |
| `useLeads.ts` | create, update, delete, convert |
| `useSettings.ts` | updateSetting, saveSettings |
| `useMemberDetails.ts` | createNote, updateMember (duplicate of useMembers — already logged there) |

### Gap 2: No canonical `docs/data-contract.md` (full system)

`docs/data-contract-yourgym.md` exists but only covers Staff/Locations/Roles/Workouts. Need a full-system contract.

### Gap 3: No Diagnostics/Data Audit page

No `/diagnostics/data-audit` route exists.

### What Already Works (No Changes Needed)

- **Members**: All wizard fields (profile, contact, address, emergency, medical/consents as jsonb, source, package interest) already persist to real DB columns. `useMemberDetails.ts` loads all sub-resources (attendance, packages, billing, injuries, notes, suspensions, contracts).
- **Staff**: Full structured address + demographics + positions persist correctly after previous migration.
- **Leads**: All fields persist (first_name, last_name, phone, email, gender, DOB, address, source, notes, line fields).
- **Locations**: opening_hours, categories, status — all complete.
- **Workouts**: DB-backed via training_templates + workout_items. No hardcoded data.
- **LINE identity**: Normalized in `line_users` table, linked via member_id/lead_id/staff_id.
- **Packages**: All 20+ columns persist (access_locations, access_days, categories, AI fields, etc.).
- **Realtime**: `useRealtimeSync.ts` already covers all key tables including activity_log and announcements.
- **Query keys**: `queryKeys.ts` already centralizes most keys.

---

## Implementation Plan

### Step 1: Add `logActivity` to all remaining mutation hooks (~10 files)

Add `import { logActivity } from '@/lib/activityLogger'` and `logActivity(...)` calls in `onSuccess` for every create/update/delete mutation in:

- `useClasses.ts` — class_created, class_updated, class_deleted
- `useClassCategories.ts` — class_category_created, class_category_updated, class_category_deleted
- `useClassBookings.ts` — booking_created, booking_cancelled, attendance_marked
- `useRooms.ts` — room_created, room_updated, room_deleted
- `usePackages.ts` — package_created, package_updated, package_deleted, package_archived
- `useFinance.ts` — transaction_status_updated
- `useAnnouncements.ts` — announcement_created, announcement_updated, announcement_deleted
- `useLeads.ts` — lead_created, lead_updated, lead_deleted, lead_converted
- `useSettings.ts` — setting_updated

### Step 2: Create comprehensive `docs/data-contract.md`

Document all entities: Members, Leads, Staff, Schedule, Classes, Rooms, Packages, Promotions, Finance, Announcements, Workouts, Settings, Notifications — with fields, storage mapping, who can R/W, event types, and realtime keys.

### Step 3: Create Diagnostics Data Audit page

Create `src/pages/DiagnosticsDataAudit.tsx` and add route `/diagnostics/data-audit`:
- Query each table for rows with null required fields
- Show per-entity health checklist
- Only accessible in dev mode or master role

### Step 4: Add i18n keys for new event types

Add labels for all new activity log event types in `en.ts` and `th.ts`.

---

## Files Summary

| Action | File |
|--------|------|
| Modify | `src/hooks/useClasses.ts` — add logActivity |
| Modify | `src/hooks/useClassCategories.ts` — add logActivity |
| Modify | `src/hooks/useClassBookings.ts` — add logActivity |
| Modify | `src/hooks/useRooms.ts` — add logActivity |
| Modify | `src/hooks/usePackages.ts` — add logActivity |
| Modify | `src/hooks/useFinance.ts` — add logActivity |
| Modify | `src/hooks/useAnnouncements.ts` — add logActivity |
| Modify | `src/hooks/useLeads.ts` — add logActivity |
| Modify | `src/hooks/useSettings.ts` — add logActivity |
| Create | `docs/data-contract.md` — full system contract |
| Create | `src/pages/DiagnosticsDataAudit.tsx` — audit page |
| Modify | `src/App.tsx` — add diagnostics route |
| Modify | `src/i18n/locales/en.ts` — add event type labels |
| Modify | `src/i18n/locales/th.ts` — add event type labels |

No database migrations needed — schema is already complete. No breaking changes.

