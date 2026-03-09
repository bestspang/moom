

# MOOM Momentum Club — Final RP→Coin Rename

## Current State

**Database: 100% complete.** All 17 tables exist with correct schema. All production data seeded and verified against spec:
- 24 rules, 20 levels, 20 badges, 31 rewards, 33 quest templates, 9 coupon templates, 2 shop rules

**Member UI: 95% complete.** Quest Hub, Coupon Wallet, Reward Store with hybrid pricing, Badge Gallery, Level Perks — all built and wired.

## Remaining Gap

**7 files still reference "RP" instead of "Coin":**

| File | Lines with "RP" |
|------|----------------|
| `StreakFreezeButton.tsx` | "Need X RP", "X RP spent", "Freeze (X RP)" |
| `MemberReferralPage.tsx` | "200 RP" (×4) |
| `MemberProfilePage.tsx` | "Reward Points" label + "RP" suffix |
| `ReferralCard.tsx` | "X RP earned", "200 RP" |
| `ChallengeCard.tsx` | "X RP" |
| `MomentumCard.tsx` | "RP" comment |
| `CheckInCelebration.tsx` | "RP earned" + comment |

## Plan

Replace all "RP" references with "Coin" in these 7 files. Pure text changes, zero logic changes, zero regression risk.

