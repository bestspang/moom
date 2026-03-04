

# QR Check-in Redemption Page — Plan

## Summary

Create a public page at `/checkin?token=...` that validates a QR token and completes the check-in. Since the QR is location-only (no member_id), the page needs member identification — either via existing auth session or a simple member lookup form.

## Current State

- `useValidateQRToken` in `useCheckinQR.ts` already handles: token validation, marking used, creating `member_attendance` row
- QR tokens are generated without `member_id` (location-only)
- No `/checkin` route or page exists
- The page must be **public** (not behind `ProtectedRoute`) since members scan from their phone

## Changes

### 1. Create `src/pages/CheckinRedeem.tsx`

Public page that:
- Reads `token` from URL search params
- Validates token immediately on load (check exists, not expired, not used) — read-only check first
- Shows location name from token data
- **Member identification**: Simple form asking for phone number or member ID to look up the member
  - Query `members` table by phone/member_id match
  - On match, call `useValidateQRToken` with token + memberId
- States: loading → token info → member input → success / error
- Success screen: checkmark animation, "You're checked in at {location}!" message
- Error states: expired, already used, invalid, member not found

### 2. Add route in `App.tsx`

Add `/checkin` as a public route (alongside `/login`, `/signup`):
```
<Route path="/checkin" element={<CheckinRedeem />} />
```

### 3. Add member lookup query in `useCheckinQR.ts`

Add `useTokenInfo(token)` — fetches token data + location name without marking as used:
- Query `checkin_qr_tokens` joined with `locations` by token string
- Returns token status (valid/expired/used) + location name

### 4. i18n keys (EN + TH)

Keys for: page title, enter phone/member ID, check in button, success message, expired/used/invalid errors

## Files

| Action | File |
|--------|------|
| Create | `src/pages/CheckinRedeem.tsx` |
| Modify | `src/App.tsx` — add public route |
| Modify | `src/hooks/useCheckinQR.ts` — add `useTokenInfo` query |
| Modify | `src/i18n/locales/en.ts` + `th.ts` — add checkin keys |

No DB migration needed — all tables and columns exist.

