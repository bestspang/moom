

# Fix: QR Display "Failed to generate" 

## Root Cause

Two issues preventing QR generation on the kiosk page:

1. **DB constraint**: `checkin_qr_tokens.member_id` is `NOT NULL`, but the kiosk generates location-only QR codes (no member). The insert fails at the database level.
2. **RLS policy**: INSERT requires `level_2_operator` access level. The kiosk page is public, so unauthenticated users can't insert tokens.

## Fix

### 1. Database migration
- ALTER `checkin_qr_tokens.member_id` to be nullable (`DROP NOT NULL`)

### 2. Require staff login on kiosk page
The kiosk is set up by gym staff on a tablet — requiring login once is reasonable and secure. No need to weaken RLS.

- **`src/pages/CheckinDisplay.tsx`**: Import `useAuth()`, check if user is authenticated with sufficient access. If not, show a compact login form or redirect to `/login?redirect=/checkin-display`.
- **`src/App.tsx`**: Keep route public but handle auth inside the component (so the login redirect works cleanly).

### Files

| Action | File | Details |
|--------|------|---------|
| Migration | DB | `ALTER TABLE checkin_qr_tokens ALTER COLUMN member_id DROP NOT NULL` |
| Edit | `src/pages/CheckinDisplay.tsx` | Add auth check — show login prompt if not authenticated as operator |

