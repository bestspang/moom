

# Member Experience Recreation — Migration Plan

## Current State Analysis

**Already built in this project (11 pages):**
- MemberHomePage, MemberSchedulePage, MemberClassDetailPage, MemberBookingsPage, MemberBookingDetailPage, MemberPackagesPage, MemberPurchasePage, MemberAttendancePage, MemberProfilePage, MemberEditProfilePage, MemberUploadSlipPage

**Already built momentum components:**
- MomentumCard, TierBadge, XPProgressBar, StreakFlame, BadgeGrid, ChallengeCard + types + api

**Missing from reference (focus areas requested):**

| Reference Page | Current Status | Gap |
|---|---|---|
| CheckInPage (QR scan + celebration) | Not built | New page needed |
| RewardsPage (RP wallet + redeemable drops) | Not built | New page needed |
| BadgeGalleryPage (full collection) | Not built | New page needed |
| SquadPage (create/join/view) | Not built | New page needed |
| CheckInCelebration dialog | Not built | New component |
| RewardDropCard | Not built | New component |
| QuestCard | Not built | New component |
| UpcomingMilestones | Not built | New component |
| SquadCard (home widget) | Not built | New component |

**Key DB schema differences from reference:**
- This project uses `member_id` (not `user_id`) across all tables
- `gamification_rewards` (not `reward_drops`) — has `points_cost`, `stock`, `redeemed_count`, `level_required`, `category`
- `reward_redemptions` (not `reward_claims`) — has `member_id`, `reward_id`, `points_spent`, `status`, `idempotency_key`
- `squad_memberships` (not `squad_members`) — uses `member_id`
- `squads` table exists but has different shape: no `motto`, `icon_emoji`, `color`, `invite_code` columns; has `description`, `is_active`, `total_xp`, `season_id`
- No `squad_goals` table exists
- `xp_ledger` uses `delta`, `balance_after`, `event_type`, `member_id` (not `xp_amount`/`rp_amount`/`source`/`user_id`)
- `badge_earnings` uses `member_id` (not `user_id`)
- No `member_quests`/`quests` tables visible in schema

## Migration Mapping

| Reference Path | New Path | Notes |
|---|---|---|
| `/check-in` | `/member/check-in` | QR scanner + manual code + celebration |
| `/rewards` | `/member/rewards` | Reward wallet using `gamification_rewards` + `reward_redemptions` |
| `/badges` | `/member/badges` | Full badge gallery using `badge_earnings` + `gamification_badges` |
| `/squad` | `/member/squad` | Adapted to actual `squads` + `squad_memberships` schema (no goals/invite since DB lacks those columns) |

## Implementation Plan

### 1. Extend Momentum Types & API (`src/apps/member/features/momentum/`)

**types.ts** — Add interfaces:
- `RewardItem` (mapped from `gamification_rewards`)
- `RewardRedemption` (mapped from `reward_redemptions`)
- `XPLedgerEntry` (mapped from `xp_ledger`)
- `SquadWithMembers` (mapped from `squads` + `squad_memberships` + `members` join)

**api.ts** — Add functions:
- `fetchRewards(memberId)` — query `gamification_rewards` where `is_active = true`
- `fetchMyRedemptions(memberId)` — query `reward_redemptions` by `member_id`
- `redeemReward(memberId, rewardId, pointsCost)` — insert into `reward_redemptions`, decrement `available_points` in `member_gamification_profiles`
- `fetchXPHistory(memberId)` — query `xp_ledger` by `member_id`, ordered by `created_at desc`
- `fetchAllBadges()` — query `gamification_badges` where `is_active = true`
- `fetchMySquad(memberId)` — query `squad_memberships` → `squads` + members join
- `joinSquad(memberId, squadId)` — insert into `squad_memberships`
- `leaveSquad(memberId)` — delete from `squad_memberships`
- `checkInMember(memberId)` — insert attendance record + fire gamification event

### 2. New Momentum Components

- **RewardDropCard.tsx** — Adapted from reference, uses `gamification_rewards` fields (`points_cost`, `stock`, `redeemed_count`, `level_required`). Shows tier lock, sold out, claim button.
- **CheckInCelebration.tsx** — Post-checkin celebration dialog with XP/RP count-up animation, confetti, streak/tier display, auto-dismiss timer.
- **QuestCard.tsx** — Progress card for quests. Since no `member_quests` table exists in DB, this will render challenge progress from `challenge_progress` table instead (same UX, different data source).
- **UpcomingMilestones.tsx** — Shows badges the member is close to earning, with progress rings. Uses `gamification_badges` + `badge_earnings` + `member_gamification_profiles`.
- **SquadCard.tsx** — Home page widget showing current squad or "Join a Squad" CTA.

### 3. New Pages

**MemberCheckInPage.tsx** (`/member/check-in`):
- QR scanner using camera API + jsQR (add dependency)
- Manual code input fallback
- CheckInCelebration dialog on success
- Adapted from reference but using `memberId`-based API

**MemberRewardsPage.tsx** (`/member/rewards`):
- RP balance card with tier badge
- Redeemable rewards grid using `gamification_rewards`
- Points history from `xp_ledger`
- Uses shared `Section`, `EmptyState`, `Skeleton`

**MemberBadgeGalleryPage.tsx** (`/member/badges`):
- Collection counter
- 2-column grid of earned badges with rarity styling
- Uses existing `badge_earnings` + `gamification_badges` query

**MemberSquadPage.tsx** (`/member/squad`):
- If no squad: show available squads to join (query active squads with member count < max)
- If in squad: show squad details, member list, total XP, leave button
- Simplified vs reference (no goals, no invite code, no create — since DB lacks those columns)

### 4. Route Updates (App.tsx)

Add under `/member` route group:
```
<Route path="check-in" element={<MemberCheckInPage />} />
<Route path="rewards" element={<MemberRewardsPage />} />
<Route path="badges" element={<MemberBadgeGalleryPage />} />
<Route path="squad" element={<MemberSquadPage />} />
```

### 5. Home Page Enhancement

Update `MemberHomePage.tsx` to add:
- SquadCard widget (after MomentumCard)
- UpcomingMilestones nudge (before quick actions)

### 6. Profile Page Enhancement

Update `MemberProfilePage.tsx` to add menu items for:
- Rewards → `/member/rewards`
- Badges → `/member/badges`
- Squad → `/member/squad`

### 7. Dependency

Add `jsqr` package for QR code scanning on the check-in page.

## Component Reuse Plan

| Component | Source | Reuse Strategy |
|---|---|---|
| Section, EmptyState, ListCard, FilterChips, MobilePageHeader | `src/apps/shared/components/` | Direct reuse |
| Button, Input, Dialog, Skeleton, Progress, Tabs, Label | `src/components/ui/` | Direct reuse |
| TierBadge, XPProgressBar, StreakFlame, BadgeGrid | `src/apps/member/features/momentum/` | Direct reuse |
| MomentumCard, ChallengeCard | `src/apps/member/features/momentum/` | Direct reuse |
| AlertDialog (for confirm) | `src/components/ui/alert-dialog` | Use instead of reference's `ConfirmDialog` |
| useMemberSession | `src/apps/member/hooks/` | Direct reuse for memberId resolution |

## UI Differences — Intentional

1. **Squad page**: Simplified — no create flow, no invite codes, no goals section (DB lacks those columns). Instead shows a list of joinable squads.
2. **Rewards page**: Uses `gamification_rewards` schema (`points_cost`, `level_required`) instead of reference's `reward_drops` (`rp_cost`, `min_tier`). Functionally equivalent.
3. **Check-in**: Uses `memberId`-based flow instead of `user_id`. The celebration dialog will show streak/tier/XP like the reference.
4. **QuestCard**: Renders `challenge_progress` data (since no quests table exists), same visual pattern.
5. **XP history**: Uses `xp_ledger.delta` and `event_type` instead of `xp_amount`/`rp_amount`/`source`.

## Files Summary

**Create (10 files):**
- `src/apps/member/pages/MemberCheckInPage.tsx`
- `src/apps/member/pages/MemberRewardsPage.tsx`
- `src/apps/member/pages/MemberBadgeGalleryPage.tsx`
- `src/apps/member/pages/MemberSquadPage.tsx`
- `src/apps/member/features/momentum/RewardDropCard.tsx`
- `src/apps/member/features/momentum/CheckInCelebration.tsx`
- `src/apps/member/features/momentum/QuestCard.tsx`
- `src/apps/member/features/momentum/UpcomingMilestones.tsx`
- `src/apps/member/features/momentum/SquadCard.tsx`

**Update (4 files):**
- `src/apps/member/features/momentum/types.ts` — add new interfaces
- `src/apps/member/features/momentum/api.ts` — add new API functions
- `src/App.tsx` — add 4 new routes
- `src/apps/member/pages/MemberHomePage.tsx` — add SquadCard + UpcomingMilestones
- `src/apps/member/pages/MemberProfilePage.tsx` — add menu items

**Zero changes to:** Admin pages, shared contexts, Supabase client, existing member pages

## Risks

1. **jsQR dependency** — needed for QR scanning; lightweight, no conflicts expected
2. **DB tables may lack data** — rewards/squads/badges may be empty; all pages handle empty states gracefully
3. **No quests table** — QuestCard will use challenge_progress instead; visually identical
4. **Squad schema is simpler** — no invite codes or goals; the UX will be adapted accordingly without breaking anything

