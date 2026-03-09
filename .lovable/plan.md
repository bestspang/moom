

# Gamification Readiness Audit — MOOM Fitness Platform

---

## SECTION A — Executive Verdict

**This system is already significantly gamification-ready.** The database schema, Edge Functions, admin studio, and member-facing UI for gamification have already been built and deployed. This is not a "pre-gamification" codebase — it is a codebase with gamification partially implemented. The audit shifts from "can we add gamification?" to "is what's built safe, complete, and production-grade?"

**Overall classification: Ready after small fixes**

---

## SECTION B — What Is Already Ready

### Architecture (Strong)
- **4 surfaces cleanly separated**: admin (`/`), member (`/member`), trainer (`/trainer`), staff (`/staff`) with dedicated layouts, bottom navs, and auth guards
- **Surface detection** via hostname + query param override (`detectSurface()`)
- **Shared component library** (`src/apps/shared/components/`) prevents duplication
- **SurfaceProvider** + `useSurface()` for role-aware rendering

### Auth & Identity (Strong)
- `app_role` enum: `owner | admin | trainer | front_desk | member | freelance_trainer` — in-house vs freelance trainer distinction exists
- `access_level` enum with 4 tiers — route-level + UI-level guards in place
- `user_roles` table (separate from profiles) — multi-role supported
- `identity_map` table links auth users to member/trainer records — cross-surface identity is solved
- `useMemberSession()` resolves `memberId` from `identity_map` or `line_users`
- `get_my_member_id()` security definer function for RLS

### Data Model (Fully Built)
All canonical gamification entities **already exist in the database**:

| Entity | Table | Status |
|--------|-------|--------|
| Gamification profiles | `member_gamification_profiles` | Exists, has season_id FK |
| XP ledger | `xp_ledger` | Exists, append-only with idempotency_key |
| Points ledger | `points_ledger` | Exists, append-only with idempotency_key |
| Streak snapshots | `streak_snapshots` | Exists |
| Badges | `gamification_badges` | Exists |
| Badge earnings | `badge_earnings` | Exists |
| Challenges | `gamification_challenges` | Exists with status lifecycle |
| Challenge progress | `challenge_progress` | Exists with status enum |
| Squads | `squads` | Exists with season_id |
| Squad memberships | `squad_memberships` | Exists with role enum |
| Rewards | `gamification_rewards` | Exists |
| Reward redemptions | `reward_redemptions` | Exists with status lifecycle |
| Rules | `gamification_rules` | Exists with cooldown/daily limits |
| Levels | `gamification_levels` | Exists |
| Seasons | `gamification_seasons` | Exists |
| Trainer tiers | `gamification_trainer_tiers` | Exists |
| Trainer scores | `trainer_gamification_scores` | Exists |
| Audit log | `gamification_audit_log` | Exists |

### Edge Functions (Fully Built)
- `gamification-process-event` — handles XP/points awards, idempotency, cooldown, daily limits, streak, level-up, challenge progress, badge earnings
- `gamification-redeem-reward` — handles member redemption + admin rollback (void) with full audit trail
- `sync-gamification-config` — admin-to-experience sync (for future project split)

### Admin Studio (Fully Built)
- `/gamification/*` routes: overview, rules, levels, challenges, badges, rewards, trainers, risk
- Protected at `level_3_manager`
- CRUD hooks for all gamification config entities

### Member UI (Fully Built)
- `MemberHomePage` — MomentumCard, SquadCard, ChallengeCard, UpcomingMilestones, TodayCard
- `MemberCheckInPage` — QR scan + celebration animation
- `MemberRewardsPage` — balance, redeemable rewards, points history
- `MemberBadgeGalleryPage` — earned badges with tier styling
- `MemberSquadPage` — squad info + join/leave
- `MemberProfilePage` — tier badge, streak flame, XP bar, badge showcase

### Event Infrastructure (Partially Ready)
- `fireGamificationEvent()` — fire-and-forget client helper
- Admin check-in (`useLobby`) fires `check_in` gamification event with idempotency key
- `event_outbox` table for async notification processing
- `gamification_event_type` enum covers: check_in, class_attended, class_booked, package_purchased, package_renewed, streak_maintained, challenge_completed, reward_redeemed, referral_converted, profile_completed, first_visit, merch_purchased, review_submitted, manual_adjustment, rollback

### RLS (Properly Configured)
- Gamification config tables: managers can manage, staff can read
- Member-scoped data: `get_my_member_id(auth.uid())` for points_ledger, streak_snapshots
- Audit log: manager-only write, staff read

---

## SECTION C — What Is Missing

### 1. Member check-in page bypasses Edge Function (MEDIUM RISK)
`MemberCheckInPage` inserts directly into `member_attendance` without calling `fireGamificationEvent()`. The admin lobby hook does fire the event, but the member self-service check-in does not.

### 2. Trainer gamification surface is empty (NOT BLOCKING)
- `TrainerHomePage` shows schedule only — no coach impact score, no reputation widget
- No trainer-facing gamification pages exist
- `trainer_gamification_scores` table exists but no trainer UI consumes it
- This is expected for a later phase

### 3. Missing event triggers for several event types
These `gamification_event_type` values have no code firing them yet:
- `class_attended` — no trigger when attendance is confirmed
- `class_booked` — no trigger on booking creation
- `package_purchased` — no trigger on package purchase
- `package_renewed` — no trigger
- `referral_converted` — no trigger
- `profile_completed` — no trigger
- `first_visit` — no trigger
- `merch_purchased` — no trigger
- `review_submitted` — no trigger

### 4. Realtime sync missing for gamification tables
`useRealtimeSync` does not subscribe to any gamification tables (`member_gamification_profiles`, `badge_earnings`, `challenge_progress`, `xp_ledger`, `points_ledger`, `reward_redemptions`). Profile/badge updates won't reflect in real-time.

### 5. Notification types are limited
`notification_type` enum only has 5 values (booking_confirmed, class_cancellation, payment_received, member_registration, package_expiring). Gamification events like `badge_earned`, `level_up`, `challenge_completed`, `reward_fulfilled` are not notification types yet.

### 6. No dedicated member notifications page under `/member/notifications`
The header links to it but the route doesn't exist in the member surface routes.

---

## SECTION D — Risk Map

| Risk | Severity | Mitigation |
|------|----------|------------|
| Member self-check-in skips gamification event | Medium | Add `fireGamificationEvent()` call in `MemberCheckInPage.handleCheckIn` |
| Duplicate XP from replayed events | Low | Already mitigated by idempotency_key + cooldown + daily limits in Edge Function |
| Reward over-redemption | Low | Already mitigated by stock check + daily limit (3) + points validation in Edge Function |
| No-show exploitation (book, get XP, don't show) | Low | `class_booked` event doesn't exist yet; when added, award minimal XP |
| Cancelled/refunded purchase rollback | Low | `rollback` event type exists; admin void flow implemented in redemption function |
| Role leakage | Low | RLS uses `has_min_access_level()` / `get_my_member_id()` — properly scoped |
| Realtime stale data | Low | XP/badge updates only refresh on page reload; add realtime subscriptions when needed |

---

## SECTION E — Required Refactors Before Gamification

### Blockers: None (system is architecturally ready)

### Preconditions (small fixes):

1. **MemberCheckInPage** — Add `fireGamificationEvent()` after successful check-in insert (1 file, ~5 lines)
2. **Add `/member/notifications` route** — wire to a notifications page (the header already links there)
3. **Expand `notification_type` enum** — add gamification-related notification types before sending them from Edge Functions

### Files that need minor updates (not refactors):
- `src/apps/member/pages/MemberCheckInPage.tsx` — add gamification event fire
- `src/App.tsx` — add missing member notifications route
- Database migration — extend `notification_type` enum

---

## SECTION F — Recommended First Gamification Milestone

**Milestone 1: "Check-in XP Loop" (end-to-end)**

This is already 90% built. Complete it by:
1. Fix MemberCheckInPage to fire gamification event
2. Verify the full loop: member checks in → Edge Function awards XP/points → profile updates → celebration shows correct data → badges page reflects new badges
3. Add realtime subscription for `member_gamification_profiles` so the home page MomentumCard updates without refresh

**Milestone 2: "Event Coverage Expansion"**
Wire `class_booked` and `class_attended` events from booking/attendance hooks.

**Milestone 3: "Trainer Impact"**
Build trainer gamification surface using existing `trainer_gamification_scores` table.

---

## SECTION G — Suggested Folder / Route Placement

Current structure is already well-organized:

```text
src/apps/member/features/momentum/     ← Member gamification (exists, good)
  api.ts, types.ts, MomentumCard.tsx, etc.

src/apps/trainer/features/impact/      ← Trainer gamification (create later)
  api.ts, types.ts, CoachImpactCard.tsx

src/pages/gamification/                ← Admin studio (exists, good)
  GamificationStudio.tsx, GamificationRules.tsx, etc.

src/hooks/useGamification*.ts          ← Admin hooks (exist, good)

src/lib/gamificationEvents.ts          ← Client-side event helper (exists, good)

supabase/functions/gamification-*/     ← Edge Functions (exist, good)
```

No restructuring needed.

---

## SECTION H — Final Go / No-Go Recommendation

**GO — with 3 small preconditions**

The gamification system is already substantially built across database, Edge Functions, admin studio, and member UI. The architecture is clean, identity model is sound, RLS is properly configured, and abuse protections (idempotency, cooldown, daily limits, audit logging) are in place.

**Before declaring gamification "live":**
1. Fix MemberCheckInPage gamification event gap
2. Add member notifications route
3. Expand notification_type enum for gamification events

**Recommended rollout order:**
1. Check-in XP loop (fix + verify)
2. Booking/attendance event wiring
3. Reward redemption end-to-end testing
4. Trainer impact surface (new)
5. Squad competitions (new)

