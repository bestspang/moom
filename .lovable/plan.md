

# Gamification Studio — Admin Module Plan

## 1. Information Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        GAMIFICATION STUDIO                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Overview   │  │   Rules     │  │  Challenges │  │   Badges    │    │
│  │  (KPIs &    │  │   Engine    │  │   Builder   │  │   Builder   │    │
│  │  Analytics) │  │             │  │             │  │             │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Rewards    │  │  Trainer    │  │   Squads    │  │   Risk &    │    │
│  │  Catalog    │  │   Tiers     │  │  Management │  │   Audit     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. Route Structure

| Route | Component | Purpose |
|-------|-----------|---------|
| `/gamification` | GamificationStudio.tsx | Shell with tabs (like Settings/Finance pattern) |
| `/gamification/overview` | GamificationOverview.tsx | KPIs, participation, lift metrics |
| `/gamification/rules` | GamificationRules.tsx | XP/Points mapping, streaks, anti-abuse |
| `/gamification/challenges` | GamificationChallenges.tsx | Challenge CRUD + targeting |
| `/gamification/badges` | GamificationBadges.tsx | Badge CRUD + conditions |
| `/gamification/rewards` | GamificationRewards.tsx | Reward catalog management |
| `/gamification/trainers` | GamificationTrainers.tsx | In-house & freelance tier rules |
| `/gamification/squads` | GamificationSquads.tsx | Squad management |
| `/gamification/risk` | GamificationRisk.tsx | Abuse detection, audit logs |

## 3. Sidebar Integration

Add new group "Gamification" in Sidebar.tsx under the Business section:
- Icon: `Trophy` or `Gamepad2` from lucide-react
- Minimum access: `level_3_manager`
- New resource key: `gamification`

## 4. Key Screens & Components

### A. Overview Tab
- StatCards: Participation rate, XP distributed, Points redeemed, Active challenges
- Charts: Repeat visit lift trend, Package renewal correlation, Merch attach rate
- Trainer leaderboard widget (top 5)
- Recent reward redemptions feed

### B. Rules Engine Tab
- Action-to-XP table (editable): check_in, class_attended, streak_7_day, etc.
- Action-to-Points table
- Streak configuration panel (thresholds, multipliers)
- Cooldown settings (anti-gaming: max XP/day, min interval)
- Season configuration (start/end, reset behavior)

### C. Challenge Builder Tab
- DataTable listing challenges with status filter
- CreateChallengeDialog with:
  - Name, description (bilingual)
  - Type: daily/weekly/seasonal
  - Eligibility: all members, package holders, tier X+, location
  - Goal: action count, XP threshold, class count
  - Reward: XP bonus, points, badge unlock, package booster
  - Start/end dates, branch targeting

### D. Badge Builder Tab
- Visual grid of badges with tier indicators
- CreateBadgeDialog:
  - Name, icon upload, tier (bronze/silver/gold/platinum)
  - Unlock conditions (XP threshold, challenge completion, attendance streak)
  - Display priority

### E. Reward Catalog Tab
- DataTable with categories: Perk, Merch, Access, Package Booster, Event
- CreateRewardDialog:
  - Name, description, category
  - Points cost, level requirement
  - Stock/limit (finite or unlimited)
  - Availability period
  - Linked package ID (for boosters)

### F. Trainer Tiers Tab
- In-house trainer section: impact scoring rules, recognition thresholds
- Freelance partner section: separate reputation system, tier definitions
- Clear visual separation between the two systems

### G. Squads Tab
- Squad list with member counts
- CreateSquadDialog: name, captain assignment, max size
- Challenge assignment to squads

### H. Risk & Audit Tab
- Suspicious activity feed (rapid point farming, unusual patterns)
- Abuse flags table with dismiss/escalate actions
- XP/Points audit log with filters

## 5. Database Schema (New Tables)

```sql
-- Core gamification tables
gamification_actions        -- action definitions (check_in, class, etc.)
gamification_rules          -- XP/points per action, cooldowns
gamification_levels         -- level tier definitions
gamification_streaks        -- streak thresholds & multipliers
gamification_seasons        -- season config

-- Challenges
gamification_challenges     -- challenge definitions
gamification_challenge_entries -- member progress

-- Badges
gamification_badges         -- badge definitions
gamification_badge_awards   -- member awards

-- Rewards
gamification_rewards        -- reward catalog
gamification_redemptions    -- redemption records

-- Trainer
gamification_trainer_tiers  -- tier definitions
gamification_trainer_scores -- individual scores

-- Squads
gamification_squads
gamification_squad_members

-- Audit
gamification_audit_log      -- all point/XP changes
gamification_abuse_flags    -- flagged activity
```

## 6. First Implementation Milestone

**Phase 1 (MVP):**
1. Create base tables: `gamification_rules`, `gamification_levels`, `gamification_challenges`, `gamification_badges`, `gamification_rewards`
2. Build GamificationStudio shell with tab navigation
3. Implement Overview tab with placeholder KPIs
4. Implement Rules Engine tab with basic CRUD
5. Add sidebar navigation entry
6. Add i18n keys for all new labels

**Phase 2:**
- Challenge Builder with full targeting
- Badge Builder with visual uploads
- Reward Catalog with stock management

**Phase 3:**
- Trainer Tiers (separate in-house vs freelance)
- Squads management
- Risk & Audit dashboard

## 7. Files to Create

```text
src/pages/
  gamification/
    GamificationStudio.tsx       -- Shell (pattern from Settings.tsx)
    GamificationOverview.tsx
    GamificationRules.tsx
    GamificationChallenges.tsx
    GamificationBadges.tsx
    GamificationRewards.tsx
    GamificationTrainers.tsx
    GamificationSquads.tsx
    GamificationRisk.tsx

src/components/gamification/
    ChallengeDialog.tsx
    BadgeDialog.tsx
    RewardDialog.tsx
    RuleEditor.tsx
    SquadDialog.tsx
    AbuseReviewCard.tsx

src/hooks/
    useGamificationRules.ts
    useGamificationChallenges.ts
    useGamificationBadges.ts
    useGamificationRewards.ts
    useGamificationAnalytics.ts
    useGamificationAudit.ts
```

## 8. Files to Modify

- `src/App.tsx` — Add routes under ProtectedRoute (level_3_manager)
- `src/components/layout/Sidebar.tsx` — Add Gamification nav group
- `src/hooks/usePermissions.ts` — Add `gamification` to ResourceKey
- `src/i18n/locales/en.ts` — Add gamification section
- `src/i18n/locales/th.ts` — Add Thai translations
- `src/types/domain.ts` — Add gamification entity types

## 9. Backend Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Database tables | Required | 12+ new tables |
| RLS policies | Required | Manager+ access |
| Edge Functions | Future | Point calculation, abuse detection |
| Realtime | Optional | Live leaderboards |
| Storage bucket | Future | Badge icon uploads |

## 10. Assumptions

1. XP/Points are calculated by backend Edge Functions (not frontend)
2. Member-facing display lives in Experience App (this is admin control only)
3. Seasons can overlap with challenges
4. Trainer tiers are business-rule-separate from member tiers
5. Redemption stock is enforced at DB level with triggers
6. Abuse detection is rule-based initially (not ML)

