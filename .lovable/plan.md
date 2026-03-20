

# Fix: Check-In Camera Not Opening on Mobile

## Root Cause

Line 142-143 starts the camera inside `useEffect` + `setTimeout(300ms)`. Mobile browsers require `getUserMedia` to be triggered by a **direct user gesture** (tap/click). The `useEffect`/`setTimeout` breaks the gesture security chain, so the browser silently blocks camera access.

## Solution

Add a 4th state `ready` as the default. Show a large "Tap to Scan" button. When tapped, `startScanner()` runs inside the click handler — satisfying the browser's gesture requirement. Once camera is active, switch to `scanning`.

## Changes

**`src/apps/member/pages/MemberCheckInPage.tsx`**

1. Change `PageState` to `'ready' | 'scanning' | 'processing' | 'fallback'`
2. Default state: `'ready'` instead of `'scanning'`
3. Remove the `useEffect` auto-start (lines 142-155) — replace with cleanup-only effect
4. Add `handleStartCamera` click handler that calls `startScanner()`
5. In JSX: when `state === 'ready'`, show a camera icon button with "Tap to scan QR" text
6. When `state === 'scanning'`/`'processing'`, show the existing viewfinder UI (unchanged)

**`src/i18n/locales/en.ts`** — Add `tapToScan: 'Tap to scan QR'`
**`src/i18n/locales/th.ts`** — Add `tapToScan: 'แตะเพื่อสแกน QR'`

## What stays the same
- All scanning logic, QR validation, self-service fallback, celebration — unchanged
- Only the trigger mechanism changes from auto-start to user-tap-start

