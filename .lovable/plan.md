

# Phase 4F: Final Hardcoded String Cleanup

## Diagnosis

After Phases 4A-4E, the member surface is nearly 100% localized. Only a handful of straggling hardcoded English strings remain in auth validation and booking display:

| File | Issue |
|------|-------|
| `MemberLogin.tsx:143` | `t('auth.phoneNumber') + ' is required'` — hardcoded English suffix |
| `MemberLogin.tsx:374` | `t('auth.useDifferentEmail').replace('email', 'number')` — hack instead of using existing `auth.useDifferentNumber` key |
| `MemberSignup.tsx:119` | `t('auth.phoneNumber') + ' is required'` — same issue |
| `MemberSignup.tsx:123` | `t('auth.firstName') + ' is required'` — same issue |
| `MemberHomePage.tsx:205` | `` `with ${booking.schedule.trainerName}` `` — should use `member.withTrainer` key |
| `MemberBookingsPage.tsx:76` | `` `with ${booking.schedule.trainerName}` `` — same issue |

All required i18n keys already exist (`validation.required`, `auth.useDifferentNumber`, `member.withTrainer`). This is purely a wiring fix — no new keys needed.

## Plan

### Files Modified (6 small edits)

| File | Change |
|------|--------|
| `MemberLogin.tsx` | Line 143: use `t('validation.required')`. Line 374: use `t('auth.useDifferentNumber')` |
| `MemberSignup.tsx` | Lines 119, 123: use `t('validation.required')` |
| `MemberHomePage.tsx` | Line 205: use `t('member.withTrainer').replace('{{name}}', ...)` |
| `MemberBookingsPage.tsx` | Line 76: use `t('member.withTrainer').replace('{{name}}', ...)` |

No database changes. No new i18n keys. No new files. All frontend-only, ~6 line changes total.

