# Integration Notes — MOOM Fitness Management

> System map documenting each page's data sources, realtime subscriptions, and computed field definitions.

## Architecture Overview

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Lovable Cloud (Supabase) — Postgres + Auth + Edge Functions + Realtime
- **State**: React Query (TanStack) with centralized query keys (`src/lib/queryKeys.ts`)
- **Realtime**: Global `useRealtimeSync` hook subscribes to 30+ tables and auto-invalidates query caches
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
