

# Phase 4C: Final i18n Cleanup + Remaining Hardcoded Strings

## Diagnosis

After auditing every member-facing file, the following hardcoded English strings remain:

### MemberHomePage.tsx
- Line 26-29: `getTimeGreeting()` returns hardcoded "Good morning"/"Good afternoon"/"Good evening"

### MemberRewardsPage.tsx
- Lines 14-24: `EVENT_LABELS` dictionary entirely hardcoded English ("Check-in", "Quest", "Streak Bonus", etc.)
- Line 81: `Level {profile.level}` hardcoded

### MemberBadgeGalleryPage.tsx
- Lines 13-18: `TIER_COLORS` labels hardcoded ("Common", "Rare", "Epic", "Legendary")
- Lines 20-25: `BADGE_TYPE_LABELS` labels hardcoded ("Permanent", "Boost", "Access", "Seasonal")
- Lines 32-33: "Expired", "d left" hardcoded
- Lines 39-42: Effect descriptions hardcoded ("coin bonus", "XP bonus", "Unlocks access")

### MemberPackagesPage.tsx
- Line 111: `Expires ${format(...)}` hardcoded
- Line 62: uses `auth.earnXpOnRenewal` — should be in `member` namespace

### Namespace issue
- `auth.earnXpOnRenewal`, `auth.almostThere`, `auth.xpToNextLevel` are member-surface strings incorrectly placed under `auth` namespace

## Plan

### Step 1: Add ~20 new i18n keys to en.ts and th.ts

Add to `member` namespace:
- `goodMorning`, `goodAfternoon`, `goodEvening`
- `eventCheckin`, `eventQuest`, `eventStreakBonus`, `eventChallenge`, `eventReferral`, `eventPurchase`, `eventBadgeEarned`, `eventActivityReward`, `eventRedemption`
- `levelLabel` (for "Level {{n}}")
- `tierCommon`, `tierRare`, `tierEpic`, `tierLegendary`
- `typePermanent`, `typeBoost`, `typeAccess`, `typeSeasonal`
- `badgeExpired`, `badgeDaysLeft`
- `effectCoinBonus`, `effectXpBonus`, `effectAccess`
- `expiresOn`
- `earnXpOnRenewal`, `almostThere`, `xpToNextLevel` (move from auth namespace)

### Step 2: Update files to use `t()` for all remaining hardcoded strings

- **MemberHomePage.tsx**: Update `getTimeGreeting` to use `t()`. Fix `auth.almostThere` → `member.almostThere`, `auth.xpToNextLevel` → `member.xpToNextLevel`.
- **MemberRewardsPage.tsx**: Replace `EVENT_LABELS` with `t()` calls. Fix "Level" string.
- **MemberBadgeGalleryPage.tsx**: Replace tier/type labels, expiry text, and effect descriptions with `t()`.
- **MemberPackagesPage.tsx**: Fix "Expires" string. Fix `auth.earnXpOnRenewal` → `member.earnXpOnRenewal`.

### Files Modified

| File | Changes |
|------|---------|
| `src/i18n/locales/en.ts` | Add ~20 keys to member namespace |
| `src/i18n/locales/th.ts` | Add ~20 keys (Thai translations) |
| `src/apps/member/pages/MemberHomePage.tsx` | i18n greeting + fix namespace |
| `src/apps/member/pages/MemberRewardsPage.tsx` | i18n event labels + level |
| `src/apps/member/pages/MemberBadgeGalleryPage.tsx` | i18n tier/type/expiry/effect labels |
| `src/apps/member/pages/MemberPackagesPage.tsx` | i18n "Expires" + fix namespace |

No database changes. No new Edge Functions. All frontend-only.

