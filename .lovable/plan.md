

# Status Tier System — Audit & Remaining Work

## Audit Results

### Verified Working
- Database tables: all 5 tables created and seeded correctly
- Seed data: tier rules, SP rules, and benefits all match the user's spec
- Edge function: SP writing works correctly with package term lookup and shop formula
- Frontend: StatusTierBadge, StatusTierCard, MomentumCard (with tier badge), MemberProfilePage, MemberMomentumPage — all rendering correctly
- Admin: GamificationStatusTiers page shows rules, SP rules, benefits, and member distribution
- i18n: EN + TH translations complete for all status tier UI strings
- Docs: ECONOMY_V2.md Section 9 and gamification-event-map.md both include SP data

### Issues Found

#### 1. `evaluate_member_tier` DOES NOT check `extra_criteria` (Critical Logic Gap)

The DB function checks `min_level`, `min_sp_90d`, `active_days`, and `requires_active_package` — but **ignores** `extra_criteria` entirely. This means:
- **Platinum** should require 1 monthly quest in 60d — not checked
- **Diamond** should require 1 monthly/seasonal challenge in 90d — not checked  
- **Black** should require 2-of-4 criteria — not checked

Members could qualify for Platinum/Diamond/Black without meeting quest/challenge/community requirements.

**Fix:** Update `evaluate_member_tier` to query `challenge_progress`, `badge_earnings`, `member_referrals` and validate `extra_criteria` for each tier.

#### 2. Doc SP daily caps mismatch (Minor Doc Error)

`docs/ECONOMY_V2.md` Section 9.1 shows `open_gym_45min` daily cap = 10, `community_event` daily cap = 3. But DB has correct values: `open_gym_45min` = 1, `community_event` = 2. The doc copied the wrong caps from somewhere.

**Fix:** Correct the doc to match DB values (which match user's original spec).

#### 3. `community_event` daily cap: spec says 3, DB has 2

User's spec table says `community_event` SP daily cap is unspecified in the original table (the "5" is the SP value). But the SP rules seed used daily_cap = 2. The user's full spec says "community event 2 ครั้งขึ้นไป" as a Black requirement. DB value of 2 seems conservative and safe. I'll align doc to DB.

#### 4. `GamificationStatusTiers.tsx` still uses `as any` for distribution query row

Line 52: `(data ?? []).forEach((r: any) => {` — minor, the row is typed but the forEach callback uses `any`.

**Fix:** Remove `as any` on the row parameter.

#### 5. MemberHomePage missing StatusTierBadge in greeting (Planned but not done)

The greeting area shows name but no status tier badge. This was in the original plan.

**Fix:** Add small StatusTierBadge next to the member's name greeting.

---

## Implementation Plan

| # | File | Change |
|---|------|--------|
| 1 | DB migration | Update `evaluate_member_tier` to check `extra_criteria` for Platinum/Diamond/Black tiers |
| 2 | `docs/ECONOMY_V2.md` | Fix SP daily cap values in Section 9.1 to match DB |
| 3 | `src/pages/gamification/GamificationStatusTiers.tsx` | Remove `as any` on distribution row |
| 4 | `src/apps/member/pages/MemberHomePage.tsx` | Add StatusTierBadge in greeting area |

### What stays exactly the same
- All seed data — verified correct
- SP writing in edge function — verified correct
- StatusTierBadge, StatusTierCard components — verified correct
- MomentumCard — already has StatusTierBadge
- MemberProfilePage — already has StatusTierBadge
- MemberMomentumPage — already has StatusTierCard
- i18n — complete
- CSS variables — in place

### Migration detail: `evaluate_member_tier` extra_criteria logic

After the basic checks pass for a tier, if `extra_criteria` is not empty:
- **Platinum**: Query `challenge_progress` for `status='completed'` with monthly type in last 60 days, require count >= `monthly_quest_min`
- **Diamond**: Query `challenge_progress` for completed monthly OR seasonal in last 90 days, require count >= `challenge_min`
- **Black**: Query 4 dimensions (seasonal badges, referral conversions, monthly quests completed, community events attended), count how many meet threshold, require >= 2

