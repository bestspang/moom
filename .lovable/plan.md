

# Horizontal Quick Menu + Run Club + Level Perks Sheet

## What the user wants

1. **Horizontal icon menu** (1 row, scrollable) placed above the "Next Up" section — shortcuts to pages not easily reachable from bottom nav
2. **Run Club** as the first icon — navigates to a new `/member/run-club` page (coming soon placeholder)
3. **"More" icon** as the last item — opens a dialog/sheet listing all hard-to-reach member pages
4. **Level perks on tap** — when tapping the TierBadge/level in MomentumCard (level > 1), show a sheet with level benefits using existing `LevelPerksCard`

## Changes

### 1. New component: `QuickMenuStrip.tsx`
Horizontal scrollable row of circular icon buttons. Items:
- 🏃 Run Club → `/member/run-club`
- 🏆 Leaderboard → `/member/leaderboard`
- 👥 Squad → `/member/squad`
- 🎟️ Coupons → `/member/coupons`
- 🎫 Packages → `/member/packages`
- 📋 Attendance → `/member/attendance`
- 🔗 Referral → `/member/referral`
- ⋯ More → opens `Dialog` with full list of all member pages

Each item: icon + label below, ~56px wide circles in a horizontal scroll.

### 2. New page: `MemberRunClubPage.tsx`
Simple coming-soon placeholder page with Run Club branding. Route: `/member/run-club`.

### 3. MomentumCard: Level perks sheet
When `level > 1`, make the TierBadge area clickable → opens a `Dialog` containing the existing `LevelPerksCard` component.

### 4. Route registration
Add `/member/run-club` route in `App.tsx`.

### 5. i18n keys
Add keys for: `runClub`, `moreMenu`, `comingSoonRunClub`, and quick menu item labels.

### Files

| File | Change |
|------|--------|
| `src/apps/member/components/QuickMenuStrip.tsx` | New — horizontal icon menu + "More" dialog |
| `src/apps/member/pages/MemberRunClubPage.tsx` | New — coming soon placeholder |
| `src/apps/member/pages/MemberHomePage.tsx` | Insert `<QuickMenuStrip>` above "Next Up" section |
| `src/apps/member/features/momentum/MomentumCard.tsx` | Wrap TierBadge in clickable area → Dialog with LevelPerksCard (when level > 1) |
| `src/App.tsx` | Add run-club route |
| `src/i18n/locales/en.ts` | Add ~8 i18n keys |
| `src/i18n/locales/th.ts` | Add ~8 i18n keys |

