

# Wire package_purchased + profile_completed Events & Add Leaderboard Navigation

## 1. Wire `package_purchased` gamification event

**Where:** `src/hooks/useMemberDetails.ts` — `useAssignPackageToMember.onSuccess` (line ~654)

The activity log already fires `package_purchased` but no gamification event is triggered. Add `fireGamificationEvent()` call after the `logActivity()` call, using `idempotency_key: 'purchase:{transactionId}'` and `metadata: { package_id, package_name }`.

Also wire in the member-side purchase: `src/apps/member/pages/MemberPurchasePage.tsx` — after `setStep('success')` in `handlePurchase`, fire `fireGamificationEvent({ event_type: 'package_purchased', member_id: memberId, idempotency_key: 'purchase:{id}:{timestamp}' })`.

## 2. Wire `profile_completed` gamification event

**Where:** `src/apps/member/pages/MemberEditProfilePage.tsx` — `mutation.onSuccess` (line 41)

Fire `fireGamificationEvent({ event_type: 'profile_completed', member_id: memberId, idempotency_key: 'profile_completed:{memberId}' })`. The idempotency key uses memberId only (not timestamp) so this event fires at most once per member — the edge function's idempotency check prevents duplicate XP.

Requires: import `fireGamificationEvent` and `useMemberSession` already provides `memberId`.

## 3. Add Leaderboard link to Member Home Page

**Where:** `src/apps/member/pages/MemberHomePage.tsx` — after the Momentum section (~line 243)

Add a tappable card linking to `/member/leaderboard` with a Trophy icon and "Leaderboard" label, styled as a subtle card with chevron. This keeps the bottom nav clean (5 items is the mobile UX limit) while making leaderboard discoverable from the home feed.

### Files to modify
1. `src/hooks/useMemberDetails.ts` — add `fireGamificationEvent` import + call in `onSuccess` (~3 lines)
2. `src/apps/member/pages/MemberPurchasePage.tsx` — add gamification event after checkout success (~4 lines)
3. `src/apps/member/pages/MemberEditProfilePage.tsx` — add gamification event after profile save (~4 lines)
4. `src/apps/member/pages/MemberHomePage.tsx` — add leaderboard discovery card (~12 lines)

### Risks
- All events are fire-and-forget, non-blocking — zero regression risk
- Leaderboard card is additive UI, no existing elements moved

