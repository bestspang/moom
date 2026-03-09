

# Root Cause: You're Viewing the Admin Surface, Not Member Surface

## Diagnosis

You're currently on route `/` (the admin dashboard). The gamification UI lives under `/member/*` routes. On the preview domain (`*.lovable.app`), the app defaults to the **admin surface** — the member gamification pages (MomentumCard, DailyBonusCard, badges, streaks, etc.) only render under `/member`.

**This is NOT a code bug** — the gamification components are correctly wired and present in the codebase:
- `MemberHomePage` imports and renders `MomentumCard`, `DailyBonusCard`, `ReferralCard`, `SuggestedClassCard` ✅
- Routes `/member/momentum`, `/member/badges`, `/member/leaderboard`, `/member/squad`, `/member/rewards` are all registered in `App.tsx` ✅
- `MomentumCard` has a fallback starter profile when no DB row exists ✅

## How to See the Member Gamification UI

**Option A** — Navigate directly:
Go to `https://id-preview--b8b9a3e3-aed2-4929-b0e8-028cf38a94e6.lovable.app/member`

**Option B** — Use the surface override:
Go to `https://id-preview--b8b9a3e3-aed2-4929-b0e8-028cf38a94e6.lovable.app/member?surface=member`

## No Code Changes Needed

All gamification UI components are already implemented and integrated:

| Feature | Location | Status |
|---------|----------|--------|
| MomentumCard (XP/Tier/Streak/Badges/Quests) | MemberHomePage | ✅ |
| DailyBonusCard | MemberHomePage + MomentumPage | ✅ |
| Badge Gallery with rarity labels | `/member/badges` | ✅ |
| Leaderboard | `/member/leaderboard` | ✅ |
| Squad | `/member/squad` | ✅ |
| Rewards Store | `/member/rewards` | ✅ |
| Momentum Hub (Level/Quests/Rewards tabs) | `/member/momentum` | ✅ |
| Check-in Celebration with challenges | `/member/check-in` | ✅ |
| Referral Card | MemberHomePage | ✅ |

The issue is purely **navigation** — you need to be on `/member` to see member-surface content.

