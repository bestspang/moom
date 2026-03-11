

# Cross-System Consistency Audit — Round 6

## What was checked

I audited all member-facing API services, hooks, pages, edge functions, gamification API, referral system, suggestions, types, and CORS headers for consistency with recent RPC changes and generated types.

## Verified Working (No Changes Needed)

| Area | Status | Evidence |
|---|---|---|
| `cancel_booking_safe` RPC | Correct | Used in `services.ts` line 245 |
| `create_booking_safe` RPC | Correct | Used in `services.ts` line 296 |
| `member_self_checkin` RPC | Correct | Used in `services.ts` line 385 |
| `member_upload_slip` RPC | Correct | Used in `services.ts` line 367, with file upload |
| CORS headers (all 15 edge functions) | Correct | All include `x-supabase-client-*` headers |
| `isAllowedOrigin` wildcard | Correct | All gamification functions use it |
| ReferralCard nested button fix | Correct | Now uses `<div role="button">` |
| SuggestedClassCard skeleton wrapper | Correct | Now wrapped in `<div>` |
| Gamification event fire-and-forget | Correct | `fireGamificationEvent` is non-blocking |
| `handle_new_user` trigger | Correct | Provisions member + identity_map + referral |

## Confirmed Issues

### Issue 1 — UNNECESSARY `as any` on `class_ratings` and `member_referrals`

Both tables exist in `src/integrations/supabase/types.ts`:
- `class_ratings` — lines 560-598
- `member_referrals` — lines 2222-2270

But code still casts them as `as any`:
- `ClassRatingSheet.tsx` line 31: `.from('class_ratings' as any)`
- `MemberBookingDetailPage.tsx` line 49: `(supabase as any).from('class_ratings')`
- `referral/api.ts` lines 33, 46, 58, 74, 105: `.from('member_referrals' as any)`

**Root cause:** These casts were added before the types were generated. Now that types exist, the casts hide compile-time errors and prevent IDE autocompletion.

**Fix:** Remove `as any` from these 7 call sites. The generated types already match the column names used.

### Issue 2 — UNNECESSARY `as any` on `check_prestige_eligibility` RPC

`check_prestige_eligibility` IS in the generated types (line 4338). But `api.ts` line 952 does `(supabase.rpc as any)('check_prestige_eligibility', ...)`.

**Fix:** Change to `supabase.rpc('check_prestige_eligibility', ...)` — works because it returns `Json`.

### Issue 3 — LEGITIMATE `as any` on squad RPCs (no changes needed)

`get_squad_feed_reactions` and `toggle_squad_feed_reaction` are NOT in the generated types. These `as any` casts are **required** until those DB functions are regenerated. No change.

### Issue 4 — RPC result `as any` pattern in `services.ts`

Lines 253, 304, 377, 392 all do:
```ts
const result = data as any;
if (result?.error) throw new Error(result.message || result.error);
```

All 4 RPCs return `Json` type. The `as any` cast is necessary because `Json` doesn't have `.error` typed. This pattern is correct and safe — **no change needed**, but a typed helper could improve it later.

### Issue 5 — `useLanguage()` vs `useTranslation()` inconsistency

5 member files use `useLanguage()` while 15+ use `useTranslation()`. Both produce identical `t()` since `LanguageContext` wraps `useTranslation()`. Not a bug — but inconsistent.

**Only `MemberHeader.tsx` actually needs `useLanguage()`** (for the `language` and `setLanguage` properties). The other 4 files (`MemberPackagesPage`, `MemberBadgeGalleryPage`, `DailyBonusCard`, `CheckInCelebration`) only use `t()` and could switch to `useTranslation()`.

**Fix:** Leave as-is — functionally equivalent, no risk. Mark as tech debt.

---

## Implementation Plan

### Files to change

| File | Change |
|---|---|
| `src/apps/member/features/momentum/ClassRatingSheet.tsx` | Remove `as any` on `.from('class_ratings')` |
| `src/apps/member/pages/MemberBookingDetailPage.tsx` | Remove `(supabase as any)`, use `supabase` directly |
| `src/apps/member/features/referral/api.ts` | Remove all 5 `as any` casts on `member_referrals` + 2 `as any` casts on insert objects |
| `src/apps/member/features/momentum/api.ts` | Remove `as any` on `check_prestige_eligibility` RPC call |

**Safety:** Pure type-refinement changes. Zero logic changes. Runtime behavior is identical — we're only removing unnecessary casts that the generated types already support.

### What NOT to change (regression prevention)

- `services.ts` RPC result casts — needed because `Json` return type
- `get_squad_feed_reactions` / `toggle_squad_feed_reaction` casts — RPCs not in types
- `useLanguage()` usage — functionally identical to `useTranslation()`
- Edge functions — CORS is already correct and consistent
- Any existing RPC logic — all 4 security RPCs verified working

---

## Suggested Features (verified safe to add)

1. **Slip upload confirmation screen** — After successful upload, show transaction reference + "Pending review" status before navigating away. Only touches `MemberUploadSlipPage.tsx`, no backend change.

2. **`useMemberSession` could use `get_my_member_id` RPC** — Currently does manual `identity_map` + `line_users` lookup (2 queries). The RPC does the same thing in 1 call. Would simplify the hook but current approach works identically. Low priority.

3. **Typed RPC result helper** — Create a `function parseRpcResult<T>(data: Json): T` utility to replace the repeated `as any` + `.error` check pattern in `services.ts`. Would prevent future regression if someone changes the pattern inconsistently.

