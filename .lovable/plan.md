

# Lobby Module Completion Plan

## Current State Analysis

**DB `member_attendance`** has: id, member_id, location_id, member_package_id, schedule_id, check_in_time, check_in_type, created_at.
- Missing: `checkin_method` (manual/qr/liff), `usage_type` (gym/class/pt), `created_by` (staff uuid).
- `check_in_type` exists but is a generic text field — we'll repurpose it as `usage_type` is conceptually redundant. Instead, add `checkin_method` and rename semantics: `check_in_type` = usage type (gym/class/pt), add `checkin_method` column.

**DB `checkin_qr_tokens`** exists but requires `member_id` NOT NULL — incompatible with "location QR" where member scans later. Need to make `member_id` nullable.

**CheckInDialog** works but: location is optional (should be required), no audit logging, no duplicate check, no `checkin_method` field, search doesn't include phone/email.

**useCheckinQR.ts** exists with generate/validate hooks but assumes member_id upfront.

**Realtime** already invalidates `check-ins` via `member_attendance` changes — but query key pattern needs `check-ins` added explicitly.

## Plan

### 1. DB Migration

Add columns to `member_attendance`:
- `checkin_method text default 'manual'` — values: manual, qr, liff
- `created_by uuid nullable` (FK to staff)

Make `checkin_qr_tokens.member_id` nullable (for location-only QR codes).

Add index on `member_attendance(check_in_time DESC)` and `member_attendance(member_id, check_in_time)`.

### 2. Update `useLobby.ts`

- Add `phone` and `email` to member search in `useMembersForCheckIn`
- Expand `useCheckIns` client-side search to include member_id, phone, email
- Add audit logging to `useCreateCheckIn` (event_type: `member_check_in`)
- Add duplicate check helper: `useCheckDuplicateCheckIn(memberId, locationId, date)`

### 3. Update `CheckInDialog.tsx`

- Make location required (first field, must select before member search)
- Add "No package / walk-in" option in package selector
- Set `checkin_method: 'manual'` on insert
- Pass `created_by` from auth context staff id
- Add duplicate check before submit (warn if same member/location/day)
- Widen member search to show nickname, phone in results

### 4. Create `CheckInQRCodeDialog.tsx`

- Location selector
- Generate QR token (location-only, member_id null) using updated `useCheckinQR`
- Render QR code using a simple SVG/canvas QR generator (add `qrcode` package)
- Download as PNG + Print buttons
- Auto-refresh token every 2 minutes
- Shows countdown timer

### 5. Update `useCheckinQR.ts`

- Make `memberId` optional in `useGenerateQRToken` for location-only tokens
- Update `useValidateQRToken` to create `member_attendance` row with `checkin_method: 'qr'`

### 6. Update `Lobby.tsx`

- Add "QR Code" button next to check-in button
- Replace hardcoded "Yes" column with `checkin_method` display (Manual/QR/LIFF badge)
- Update search placeholder to indicate broader search capability

### 7. Update `useRealtimeSync.ts`

- Add `check-ins` to `member_attendance` invalidation list

### 8. Create `docs/data-contract-lobby.md`

### 9. Add i18n keys (EN + TH)

New keys: `lobby.checkinMethod`, `lobby.manual`, `lobby.qrCode`, `lobby.qrCheckin`, `lobby.selectLocationFirst`, `lobby.noPackage`, `lobby.duplicateWarning`, `lobby.downloadQR`, `lobby.printQR`, `lobby.searchPlaceholder`

## Files

| Action | File |
|--------|------|
| Migration | Add `checkin_method`, `created_by` to `member_attendance`; make `checkin_qr_tokens.member_id` nullable; add indexes |
| Modify | `src/hooks/useLobby.ts` — audit log, duplicate check, broader search |
| Modify | `src/components/lobby/CheckInDialog.tsx` — required location, checkin_method, created_by, duplicate check |
| Create | `src/components/lobby/CheckInQRCodeDialog.tsx` — QR generation + download/print |
| Modify | `src/hooks/useCheckinQR.ts` — optional memberId for location tokens |
| Modify | `src/pages/Lobby.tsx` — QR button, checkin_method column, search placeholder |
| Modify | `src/hooks/useRealtimeSync.ts` — add check-ins invalidation |
| Create | `docs/data-contract-lobby.md` |
| Modify | `src/i18n/locales/en.ts` + `th.ts` — new lobby keys |
| Install | `qrcode` npm package for QR rendering |

No breaking changes to existing flows.

