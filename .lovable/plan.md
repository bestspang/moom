

# Gamification Migration Plan — Unified MOOM Platform

## Current State Assessment

### What Already Exists in This Project
The gamification system is **already substantially built** in this unified project:

**Member Surface** (fully wired):
- `/member/rewards` → `MemberRewardsPage` — balance, redeemable rewards, points history
- `/member/badges` → `MemberBadgeGalleryPage` — earned badges with tier styling
- `/member/squad` → `MemberSquadPage` — squad info, join/leave
- `/member/check-in` → `MemberCheckInPage` — QR scan + celebration + gamification event fire
- Member home widgets: `MomentumCard`, `SquadCard`, `ChallengeCard`, `UpcomingMilestones`, `TodayCard`
- Full API layer: `src/apps/member/features/momentum/api.ts`
- Full types: `src/apps/member/features/momentum/types.ts`
- 15 UI components in `src/apps/member/features/momentum/`

**Admin Surface** (fully wired):
- `/gamification/*` → `GamificationStudio` with 8 sub-tabs: overview, rules, levels, challenges, badges, rewards, trainers, risk
- Full CRUD hooks: `useGamificationBadges`, `useGamificationChallenges`, `useGamificationRewards`, `useGamificationRules`, `useGamificationLevels`
- Audit hooks: `useGamificationAudit`, `useGamificationTrainerTiers`, `useGamificationSeasons`

**Backend** (fully built):
- All 18 gamification tables exist in DB with proper RLS
- Edge Functions: `gamification-process-event`, `gamification-redeem-reward`, `sync-gamification-config`
- Realtime enabled for gamification tables
- Notification enum expanded with gamification types

### What's Missing (from Reference Project)
Only **trainer gamification** is missing from this project:

1. **CoachImpactCard** — in-house trainer score arc + metrics (classes, attendance, return rate, streak)
2. **PartnerReputationCard** — freelance trainer reputation arc + metrics (punctuality, rating, repeat, sessions)
3. **XPToast** — realtime XP/RP toast on `xp_ledger` INSERT
4. **SquadBadge** — small inline squad badge component
5. **Trainer type detection** — API to determine in-house vs freelance
6. **CSS variables** for coach levels and partner tiers
7. **TrainerHomePage integration** — show CoachImpact or PartnerReputation based on trainer type

---

## Migration Plan

### What Needs to Be Done

Since member gamification and admin studio are **already complete**, this migration is focused on:

1. **Add trainer gamification components** (from reference project)
2. **Add trainer gamification API functions**
3. **Add trainer gamification types**
4. **Add XPToast component** for member layout
5. **Add CSS variables** for coach levels and partner tiers
6. **Wire TrainerHomePage** to show the correct card
7. **Add SquadBadge** component

### Files to Create

```text
src/apps/trainer/features/impact/
  CoachImpactCard.tsx     ← Port from reference, adapt to use useAuth() instead of useSession()
  PartnerReputationCard.tsx ← Port from reference, adapt similarly
  SquadBadge.tsx          ← Port from reference
  api.ts                  ← fetchCoachImpactProfile, fetchPartnerReputationProfile, fetchTrainerType
                             Adapt to query `trainer_gamification_scores` + `gamification_trainer_tiers`
                             instead of reference's `coach_impact_profiles` table
  types.ts                ← CoachLevel, PartnerTier, CoachImpactProfile, PartnerReputationProfile,
                             COACH_LEVEL_CONFIG, PARTNER_TIER_CONFIG
```

```text
src/apps/member/features/momentum/XPToast.tsx  ← Port from reference, adapt to use useAuth()
```

### Files to Modify

1. **`src/index.css`** — Add CSS variables:
   ```css
   --coach-rising: 210 60% 55%;
   --coach-established: 152 55% 42%;
   --coach-senior: 32 80% 50%;
   --coach-master: 280 65% 55%;
   --coach-elite: 45 93% 47%;
   --partner-new: 220 10% 60%;
   --partner-verified: 152 55% 42%;
   --partner-preferred: 210 70% 55%;
   --partner-premium: 45 93% 47%;
   ```

2. **`src/apps/trainer/pages/TrainerHomePage.tsx`** — Add CoachImpactCard/PartnerReputationCard section below summary cards, conditionally rendered based on trainer type

3. **`src/apps/member/layouts/MemberLayout.tsx`** — Add `<XPToast />` component so XP toasts appear on any member page

### API Adaptation Notes

The reference project queries `coach_impact_profiles` and `partner_reputation_profiles` — tables that **don't exist** in this project. Instead, this project has:
- `trainer_gamification_scores` — with `staff_id`, `score`, `tier_id`, `breakdown` (jsonb), `trainer_type`
- `gamification_trainer_tiers` — with `tier_name_en`, `min_score`, `trainer_type`

The API layer must map from `trainer_gamification_scores.breakdown` jsonb to the CoachImpactProfile/PartnerReputationProfile interfaces. The `breakdown` field stores the individual metrics (classes taught, attendance rate, etc.) that the reference project stores as separate columns.

If `breakdown` doesn't yet contain the needed fields, the cards will gracefully show 0/default values — no schema change needed.

### XPToast Adaptation

Reference uses `xp_ledger.user_id` — this project's `xp_ledger` uses `member_id`. The XPToast must:
1. Get `memberId` from `useMemberSession()`
2. Subscribe to `xp_ledger` with filter `member_id=eq.${memberId}`
3. Show toast with `delta` value from the ledger entry

### Route Structure (No Changes Needed)

All routes are already correctly placed:
- Member: `/member/rewards`, `/member/badges`, `/member/squad` ✓
- Admin: `/gamification/*` ✓
- Trainer: No new routes needed — gamification shows on `/trainer` home page

### Folder Structure (Final State)

```text
src/apps/member/features/momentum/   ← Existing (15 files) + XPToast.tsx
src/apps/trainer/features/impact/    ← New (5 files)
src/pages/gamification/              ← Existing admin studio (9 files)
src/hooks/useGamification*.ts        ← Existing admin hooks (7 files)
src/lib/gamificationEvents.ts        ← Existing client helper
supabase/functions/gamification-*/   ← Existing edge functions (3)
```

---

## Risks and Validation

| Risk | Severity | Mitigation |
|------|----------|------------|
| `trainer_gamification_scores.breakdown` may not contain expected fields | Low | Default to 0 for missing metrics; cards still render |
| XPToast realtime filter on `member_id` must match RLS | Low | `xp_ledger` already has member SELECT policy via `get_my_member_id()` |
| Coach/partner CSS variables missing causes invisible text | Low | Adding variables in same commit as components |
| TrainerHomePage regression from adding card | Low | Card returns `null` when no data; zero visual impact |

### Validation Steps
1. Member home: verify MomentumCard, SquadCard, ChallengeCard still render
2. Member rewards/badges/squad pages: verify still functional
3. Admin gamification studio: verify all 8 tabs still work
4. Trainer home: verify CoachImpactCard or PartnerReputationCard renders (or gracefully hides with no data)
5. XP toast: check-in on member surface should trigger toast

---

## First Migration Milestone

**"Trainer Impact Cards + XP Toast"** — 6 files to create, 3 files to modify:
1. Create trainer impact feature folder with types, API, CoachImpactCard, PartnerReputationCard
2. Create XPToast in member momentum
3. Add CSS variables
4. Wire TrainerHomePage
5. Wire MemberLayout with XPToast

This completes gamification coverage across all three consumer surfaces (member, trainer, admin) without touching any existing working functionality.

