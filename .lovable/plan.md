
Root cause is now clear from the current code:

1. The page starts in `state === 'ready'`.
2. In that state, the QR container `<div id="qr-reader" ref={containerRef} />` is not rendered yet.
3. `handleStartCamera()` calls `startScanner()` immediately.
4. `startScanner()` exits at `if (!containerRef.current) return;`
5. Because state never changes before that call, the scanner container never mounts, so the camera never starts.

So this is not the old mobile permission issue anymore. It is now a render-order bug: the user tap happens, but scanner startup runs before the scanner DOM exists.

Implementation plan:

### 1. Fix the start flow in `MemberCheckInPage.tsx`
Use a 2-step start sequence that preserves the user gesture intent but waits for the scanner container to exist.

Safe approach:
- In `handleStartCamera`, first set state to `'scanning'`
- Then trigger scanner startup only after the scanning UI has rendered
- Best implementation: add a `useEffect` that watches `state`, and when `state === 'scanning'` and `scannerRef.current` is empty, call `startScanner()`
- Keep a guard ref like `startingRef` so scanner startup cannot run twice

Why this is safest:
- The QR container will exist before `Html5Qrcode` is created
- No route changes or bottom-nav behavior need to change
- Existing QR validation, celebration, and fallback logic remain intact

### 2. Prevent duplicate scanner initialization
The current flow can re-enter scanning after errors (`setState('scanning'); startScanner();` inside `handleQrScan` catch). That will be risky once startup is effect-driven.

Adjust logic so:
- Error path only sets `state` back to `'scanning'`
- The scanning effect is solely responsible for starting the camera
- Add guards so repeated state changes do not create overlapping scanner instances

### 3. Tighten scanner lifecycle
Refine cleanup rules so the camera behaves predictably:
- On unmount: stop + clear scanner
- On successful scan: stop scanner before processing
- On fallback/error: ensure failed scanner instances are cleaned before retry
- Avoid calling `clear()` on a scanner that never successfully initialized unless wrapped in safe guards

### 4. Improve failure visibility
Right now failures are mostly silent except for `console.warn`.

Add small UX handling in the plan:
- Show `startingCamera` text while scanner is booting
- If startup fails, move to `fallback` with a clearer reason
- Keep the manual “Quick Check-In” button available exactly as now

This is additive and safe because it does not change backend behavior.

### 5. Regression-proof the flow
To stop AI from breaking this again, I would keep the logic structured around explicit states:

```text
ready
  -> user taps
scanning
  -> effect mounts scanner
processing
  -> QR found, stop scanner, validate
fallback
  -> camera unavailable, use quick check-in
```

And document one rule in code comments:
- Never call `startScanner()` while the component is still in `ready`
- The scanner can only start after the `qr-reader` container is rendered

### 6. What I would not change
These parts already look correct and should stay untouched:
- `/member/check-in` route
- bottom nav link
- `useValidateQRToken`
- `memberSelfCheckin`
- `CheckInCelebration`
- i18n keys already added for tap/scan states

### Expected result after implementation
After tapping the bottom check-in button:
- user lands on check-in page
- taps “Tap to scan QR”
- page switches to scanning state
- scanner container mounts
- camera opens reliably
- if camera fails, fallback UI appears instead of doing nothing

This fix is low-risk and localized to `src/apps/member/pages/MemberCheckInPage.tsx`.
