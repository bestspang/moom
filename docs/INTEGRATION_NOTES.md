# Integration Notes — MOOM Fitness Management

> System map documenting each page's data sources, realtime subscriptions, and computed field definitions.

## Architecture Overview

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Lovable Cloud (Supabase) — Postgres + Auth + Edge Functions + Realtime
- **State**: React Query (TanStack) with centralized query keys (`src/lib/queryKeys.ts`)
- **Realtime**: Global `useRealtimeSync` hook subscribes to 34 tables and auto-invalidates query caches
- **Auth**: Supabase Auth with `user_roles` table → `app_role` enum → `access_level` enum
- **Activity Log**: Append-only `activity_log` table; every mutation calls `logActivity()`

---

## Page → Data Source Map

| Page | Primary Hook(s) | Tables Queried | Realtime? | Auth Guard? |
|------|----------------|----------------|-----------|-------------|
| Dashboard | `useDashboardStats`, `useHighRiskMembers`, `useHotLeads`, `useUpcomingBirthdays` | `member_attendance`, `schedule`, `members`, `leads` | ✅ via global sync | ✅ |
| Members | `useMembers`, `useMemberStats`, `useNextMemberId` | `members`, `member_packages` | ✅ | ✅ |
| Member Detail | `useMemberDetails` | `members`, `member_packages`, `member_attendance`, `member_billing`, `member_injuries`, `member_notes`, `member_suspensions`, `member_contracts` | ✅ | ✅ |
| Leads | `useLeads`, `useLeadStats` | `leads` | ✅ | ✅ |
| Packages | `usePackages`, `usePackageStats` | `packages` | ✅ | ✅ |
| Promotions | `usePromotions`, `usePromotionStats` | `promotions`, `promotion_packages` | ✅ | ✅ |
| Classes | `useClasses`, `useClassStats` | `classes`, `class_categories` | ✅ | ✅ |
| Schedule | `useSchedule`, `useScheduleStats` | `schedule`, `classes`, `staff`, `rooms`, `locations` | ✅ | ✅ |
| Lobby | `useLobby` (check-ins) | `member_attendance`, `members`, `member_packages`, `checkin_qr_tokens` | ✅ | ✅ |
| Rooms | `useRooms`, `useRoomStats` | `rooms`, `locations` | ✅ | ✅ |
| Locations | `useLocations`, `useLocationStats` | `locations` | ✅ | ✅ |
| Staff | `useStaff`, `useStaffStats` | `staff`, `roles`, `staff_positions` | ✅ | ✅ |
| Roles | `useRoles` | `roles` | ✅ | ✅ |
| Finance | `useFinance` | `transactions`, `members`, `packages`, `locations`, `staff` | ✅ | ✅ |
| Announcements | `useAnnouncements` | `announcements` | ✅ | ✅ |
| Activity Log | `useActivityLog` | `activity_log` | ✅ | ✅ |
| Workouts | `useTrainingTemplates` | `workouts`, `workout_items` | ✅ | ✅ |
| Diagnostics | DiagnosticsDataAudit | all core tables | Direct queries | ✅ (level_4_master) |

---

## System Invariants (Enforced)

| Invariant | Enforcement | File |
|-----------|------------|------|
| Attendance at most once per (member, schedule) | `hasExistingAttendance()` check before insert | `useClassBookings.ts` |
| Package sessions decremented atomically with ledger entry | Same mutation in `useMarkAttendance` | `useClassBookings.ts` |
| Schedule cancellation refunds sessions | Ledger reversal + `sessions_remaining` increment | `useSchedule.ts` |
| Notifications refresh in real-time | Added to `TABLE_INVALIDATION_MAP` | `useRealtimeSync.ts` |
| Role/permission changes reflect immediately | `roles`, `user_roles` in realtime sync | `useRealtimeSync.ts` |
| Only master-level users access diagnostics | `ProtectedRoute minAccessLevel="level_4_master"` | `App.tsx` |
| Audit log written for every mutation | `logActivity()` in every mutation's `onSuccess` | All hooks |

---

## Realtime Sync Coverage (34 tables)

All tables in `TABLE_INVALIDATION_MAP`:
`schedule`, `member_attendance`, `class_bookings`, `class_waitlist`, `rooms`, `locations`, `classes`, `class_categories`, `members`, `member_packages`, `package_usage_ledger`, `leads`, `ai_suggestions`, `packages`, `promotions`, `promotion_packages`, `promotion_redemptions`, `transactions`, `training_templates`, `workout_items`, `staff`, `staff_positions`, `role_permissions`, `activity_log`, `announcements`, `member_notes`, `member_injuries`, `member_suspensions`, `member_contracts`, `member_billing`, `notifications`, `roles`, `user_roles`, `checkin_qr_tokens`

---

## Computed Field Definitions

### Dashboard KPIs
- **Check-ins Today**: `COUNT(member_attendance) WHERE check_in_time >= today 00:00 AND < today 23:59`
- **Currently In Class**: `COUNT(member_attendance) WHERE check_in_time >= 2h ago AND schedule_id IS NOT NULL`
- **Classes Today**: `COUNT(schedule) WHERE scheduled_date = today AND status = 'scheduled'`

### Risk Level
- `members.risk_level` is an enum: `low`, `medium`, `high`
- High-risk members widget: `WHERE risk_level = 'high' AND status = 'active'`, shows nearest package expiry

### Stats Queries (all use head-count pattern)
All stats hooks use `{ count: 'exact', head: true }` to avoid fetching full row sets and bypass the 1000-row Supabase limit.

---

## CSV Import/Export

### Members
- **Export**: All member fields + computed `recent_package`, `last_attended_at`
- **Import**: 4-step wizard (Upload → Map columns → Preview/Validate → Upsert)
- **Dedup**: By `member_id` → `phone` → `email`

### Leads
- Same 4-step wizard pattern
- **Dedup**: By `phone` → `email`

---

## LINE Integration Fields (ready, not yet active)
- `members`: `line_user_id`, `line_display_name`, `line_picture_url`, `line_link_status`
- `leads`: same LINE fields
- `line_users`: full identity mapping table with `member_id`, `staff_id`, `lead_id`
- `event_outbox`: outbound event queue for future LINE/AI processing

## AI Metadata Fields (ready, not yet active)
- `members`: `ai_tags` (jsonb), `ai_profile_summary` (text), `ai_risk_signals` (jsonb)
- `leads`: `ai_tags` (jsonb), `ai_summary` (text)
- `packages`: `ai_tags`, `ai_price_suggestion`, `ai_copy_suggestions`
- `promotions`: `ai_target_segment`, `ai_recommended_rules`

---

## Security Model
- **RLS**: All tables have row-level security policies using `has_min_access_level()` function
- **Access Levels**: `level_1_minimum` < `level_2_operator` < `level_3_manager` < `level_4_master`
- **Route Guards**: `ProtectedRoute` component checks `user` + optional `minAccessLevel`
- **Auth Guards**: All `useQuery` hooks include `enabled: !!user` to prevent unauthenticated fetches
- **Diagnostics**: Restricted to `level_4_master` via nested `ProtectedRoute`

---

## Idempotency Rules
- **Attendance marking**: Checks `member_attendance` for existing `(member_id, schedule_id)` before insert
- **Schedule cancellation**: Fetches bookings before bulk cancel, refunds only packages that had sessions deducted
- **Booking creation**: DB unique constraint on `(schedule_id, member_id)` prevents duplicates at DB level
