

# Phase 5E: ReferralCard + SuggestedClassCard + XPToast i18n

## Diagnosis

After Phases 5A-5D, momentum components and trainer pages are fully localized. Three remaining member-facing components still have hardcoded English:

| Component | Hardcoded Strings |
|-----------|------------------|
| `ReferralCard.tsx` | "Join MOOM!", "Use my code...", "Invite Friends, Earn Points!", "friend(s) joined · X Coin earned", "Share your code & both get 200 Coin", "Copied!", "Share", "Link copied!" |
| `SuggestedClassCard.tsx` | "Suggested for You", "Based on your favorites", "Popular this week", "Class" |
| `XPToast.tsx` | "Keep up the momentum!" |

These appear on the member home page (high traffic). `CheckInCelebration` and `DailyBonusCard` already use `useLanguage()` and are localized.

## Plan

### Step 1: Add ~15 i18n keys to en.ts and th.ts

Under `member.*`:

**ReferralCard**: `inviteFriendsTitle`, `referralShareText`, `friendsJoinedStats` (with `{{count}}` and `{{coins}}`), `shareCodeHint`, `copied`, `share`, `linkCopied`, `joinMoom`

**SuggestedClassCard**: `suggestedForYou`, `basedOnFavorites`, `popularThisWeek`

**XPToast**: `keepMomentum`

### Step 2: Update 3 component files

- `ReferralCard.tsx`: Add `useTranslation()`, replace 8 strings, use interpolation for stats
- `SuggestedClassCard.tsx`: Add `useTranslation()`, replace 3 strings, pass reason keys from fetch function
- `XPToast.tsx`: Import i18n directly (no hook since it's in useEffect), replace fallback string

### Files Modified

| File | Changes |
|------|---------|
| `src/i18n/locales/en.ts` | ~15 new keys |
| `src/i18n/locales/th.ts` | ~15 new keys |
| `src/apps/member/features/referral/ReferralCard.tsx` | i18n 8 strings |
| `src/apps/member/features/suggestions/SuggestedClassCard.tsx` | i18n 4 strings |
| `src/apps/member/features/momentum/XPToast.tsx` | i18n 1 string |

No database changes. No new files. Frontend-only.

