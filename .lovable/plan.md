

# Hybrid Level + Status Tier System — Implementation Plan

## What We're Building

Adding a second progression axis — **Status Tiers (Bronze → Black)** — alongside the existing 20-level system. This creates a dual-track model:

- **Level (1–20)**: Lifetime XP progression. Never goes down.
- **Status Tier (Bronze–Black)**: Rolling 90-day performance tier. Goes up AND down based on recent activity.

Status Tiers use a new metric: **Status Points (SP)**, earned from real activity (gym visits, classes, quests, purchases) and evaluated every 30 days.

---

## Current State vs Target

```text
CURRENT:                          TARGET:
┌──────────────┐                 ┌──────────────┐  ┌──────────────┐
│  Level 1–20  │                 │  Level 1–20  │  │ Status Tier  │
│  (XP-based)  │                 │  (XP-based)  │  │ Bronze–Black │
│              │       →         │  permanent   │  │ 90-day SP    │
│  tier =      │                 │              │  │ goes up/down │
│  f(level)    │                 └──────────────┘  └──────────────┘
└──────────────┘                        ↕ independent systems ↕
```

The existing `MomentumTier` (starter/mover/strong/elite/legend) becomes a **level grouping label** only, while the new Status Tier (Bronze–Black) drives perks and benefits.

---

## Phase 1: Database Schema (Migration)

### New Tables

**`status_tier_rules`** — Admin-configurable tier qualification rules
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| tier_code | text | bronze/silver/gold/platinum/diamond/black |
| tier_order | int | 1–6 for sorting |
| display_name_en | text | "Bronze" |
| display_name_th | text | "บรอนซ์" |
| color_hsl | text | CSS color variable |
| icon_emoji | text | 🥉🥈🥇💎👑🖤 |
| min_level | int | Minimum Level required |
| min_sp_90d | int | Min Status Points in 90 days |
| min_active_days_period | int | Min active days in period |
| active_days_window | int | Window for active days (30/60/90) |
| requires_active_package | boolean | |
| extra_criteria | jsonb | For Black: seasonal badge, referral, etc. |
| is_active | boolean | |

**`status_tier_benefits`** — Benefits per tier
| Column | Type |
|--------|------|
| id | uuid PK |
| tier_code | text |
| benefit_code | text |
| description_en | text |
| description_th | text |
| frequency | text | monthly/ongoing/one_time |
| max_per_month | int |
| sort_order | int |
| is_active | boolean |

**`sp_ledger`** — Status Points ledger (append-only, like xp_ledger)
| Column | Type |
|--------|------|
| id | uuid PK |
| member_id | uuid FK |
| event_type | text |
| delta | int |
| created_at | timestamptz |
| metadata | jsonb |

**`member_status_tiers`** — Current tier state per member
| Column | Type |
|--------|------|
| id | uuid PK |
| member_id | uuid FK (unique) |
| current_tier | text | bronze/silver/gold/platinum/diamond/black |
| sp_90d | int | Cached rolling 90-day SP |
| active_days_30d | int | Cached |
| active_days_60d | int | Cached |
| active_days_90d | int | Cached |
| last_evaluated_at | timestamptz |
| grace_until | timestamptz | Grace period end |
| tier_changed_at | timestamptz |
| previous_tier | text |

**`status_tier_sp_rules`** — SP earning rules (admin-configurable)
| Column | Type |
|--------|------|
| id | uuid PK |
| action_key | text | open_gym_45min, class_attend, etc. |
| sp_value | int |
| daily_cap | int |
| is_active | boolean |

### Alter Existing Tables

Add to `member_gamification_profiles`:
- No changes needed — tier state lives in `member_status_tiers`

### RLS Policies
- Members: SELECT own rows from `member_status_tiers`, `sp_ledger`
- Staff: SELECT all
- Admin: Full CRUD on `status_tier_rules`, `status_tier_benefits`, `status_tier_sp_rules`

---

## Phase 2: SP Earning Logic (Edge Function Update)

Update `gamification-process-event` to **also write SP** alongside XP/Coin:

```text
After XP/Coin insert → lookup sp_rules for action_key → insert into sp_ledger
```

SP values from the user's spec:
| Action | SP |
|--------|-----|
| open_gym_45min | 1 |
| class_attend | 2 |
| pt_session | 3 |
| daily_quest_done | 1 |
| weekly_quest_done | 3 |
| monthly_challenge | 6 |
| seasonal_challenge | 15 |
| community_event | 5 |
| referral_conversion | 20 |
| package_purchase | 8/20/35/55 by term |
| shop_purchase | floor(net_paid/400), cap 5 |

---

## Phase 3: Tier Evaluation (New Edge Function or DB Function)

**`evaluate-member-tier`** — Called periodically (cron or after events):

1. Calculate `sp_90d` = SUM(sp_ledger.delta) WHERE created_at >= now() - 90 days
2. Calculate `active_days_30d/60d/90d` from `member_attendance`
3. Check `member_packages` for active package
4. Check `member_gamification_profiles.current_level` for min level
5. Match against `status_tier_rules` ordered by tier_order DESC
6. Apply grace period rules (14 days after package expiry, 1-tier-per-cycle max drop)
7. Write result to `member_status_tiers`

---

## Phase 4: Frontend Changes

### New Type: `StatusTier`
```typescript
export type StatusTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'black';
```

### New Component: `StatusTierBadge`
Metallic-styled badge (distinct from the existing `TierBadge` which shows Level group). Shows tier name + icon with tier-specific colors.

### Updated `MomentumProfile` interface
```typescript
export interface MomentumProfile {
  // ... existing fields
  statusTier: StatusTier;    // NEW
  sp90d: number;             // NEW
  spToNextTier: number;      // NEW (derived)
}
```

### Pages Updated

1. **MemberHomePage** — Show StatusTierBadge next to name, SP progress indicator
2. **MemberMomentumPage** — Add "Your Status" section showing current tier, SP progress, next tier requirements, grace warnings
3. **MemberProfilePage** — Show both Level badge and Status Tier badge
4. **MomentumCard** — Add small StatusTierBadge below existing TierBadge
5. **LevelPerksCard** — Add a "Status Tier Benefits" tab/section explaining tier perks vs level perks

### New CSS Variables
```css
--tier-bronze: 30 50% 45%;
--tier-silver: 210 10% 65%;
--tier-gold: 45 85% 50%;
--tier-platinum: 200 15% 75%;
--tier-diamond: 195 80% 65%;
--tier-black: 0 0% 15%;
```

### i18n Keys (en + th)
Add translations for tier names, SP explanations, grace period messages, comeback prompts.

---

## Phase 5: Admin Studio

### New Admin Page: "Status Tiers" under Gamification Studio
- View/edit tier qualification rules
- View/edit tier benefits
- View/edit SP earning rules
- Preview tier distribution across members

---

## Phase 6: Tier Downgrade & Comeback

### Downgrade Rules (implemented in evaluation function)
1. Package expired → 14-day grace period (tier holds, warning shown)
2. Monthly review: if SP < 85% of requirement → drop 1 tier
3. Max 1 tier drop per 30-day cycle
4. 90 days inactive → reset to Bronze (Level untouched)

### Comeback Mechanics
- Renew package + 2 visits in 7 days → restore paused perks
- Reach 60% of previous tier's SP in 14 days → recover 1 tier
- Special "comeback quest" templates (admin-configurable)

---

## Safety Analysis

### What stays exactly the same (no regression risk)
- XP earning logic — unchanged
- Coin earning logic — unchanged  
- Level 1–20 progression — unchanged
- Quest system — unchanged
- Badge system — unchanged
- Reward shop — unchanged
- Prestige criteria for Level 18–20 — unchanged
- All existing RPCs — unchanged
- Existing `MomentumTier` (starter/mover/strong/elite/legend) — still derived from level, still used as level grouping label

### What changes
- `gamification-process-event` gets an **additive** SP write (new code path, doesn't touch existing XP/Coin logic)
- New tables only — no ALTER on existing tables
- New components — existing components get minor additions (StatusTierBadge rendered alongside existing elements)
- `MomentumProfile` type gets new optional fields — backward compatible

### Migration Safety
- All new tables with defaults
- SP ledger starts empty — first evaluation gives everyone Bronze
- Tier evaluation is a separate function — can be enabled independently
- Grace periods prevent sudden drops on launch

---

## Implementation Order

1. **Database migration** — Create all 5 new tables + seed tier rules + SP rules + benefits
2. **Update edge function** — Add SP writing to gamification-process-event
3. **Create tier evaluation function** — DB function `evaluate_member_tier()`
4. **Frontend types + API** — StatusTier type, fetchMemberTier(), SP data
5. **StatusTierBadge component** — New visual component
6. **Update member pages** — MomentumPage, ProfilePage, HomePage
7. **Admin tier management page** — Under Gamification Studio
8. **Economy v3 doc** — Update docs/ECONOMY_V2.md → V3 with tier system
9. **i18n** — Add en + th translations

This is a large feature. Shall I proceed with the full implementation?

