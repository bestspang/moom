

# Fix: Token Lifetime 15s + Real-time Check-in Feedback

## Issues
1. **Toast spam**: `useGenerateQRToken` shows "QR code generated" toast every 15 seconds — very annoying on kiosk
2. **Not real-time**: When a member scans and checks in, there's no visual feedback on the kiosk display

## Changes

### 1. `src/pages/CheckinDisplay.tsx`
- Suppress the toast when generating QR by not using `mutateAsync` from the hook directly, or override `onSuccess` — simplest: call `generateQR.mutateAsync()` inside a try/catch and handle silently (already doing this). The issue is the hook's `onSuccess` still fires. Fix: add a `silentMode` option or create a separate silent mutation.
- **Better approach**: Override by passing `{ onSuccess: undefined }` or just create the token inline without the hook's toast.
- Add **realtime subscription** to `checkin_qr_tokens` table — listen for `UPDATE` events where `used_at` changes from null to a timestamp. When detected, show a celebration/confirmation overlay (e.g., "✓ Check-in successful!" with member name) for 3 seconds, then resume QR display.

### 2. `src/hooks/useCheckinQR.ts`
- Remove the `toast.success('QR code generated')` from `onSuccess` in `useGenerateQRToken`, or make it conditional. Since other callers might want the toast, best to remove it from the hook and let callers decide.

### 3. Database (if needed)
- Enable realtime on `checkin_qr_tokens`: `ALTER PUBLICATION supabase_realtime ADD TABLE public.checkin_qr_tokens;`

## Summary of files

| File | Change |
|------|--------|
| `src/hooks/useCheckinQR.ts` | Remove toast from `onSuccess` in `useGenerateQRToken` |
| `src/pages/CheckinDisplay.tsx` | Add realtime subscription for check-in events, show celebration overlay when member scans |
| DB migration | Enable realtime on `checkin_qr_tokens` |

