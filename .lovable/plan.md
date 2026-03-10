

# Fix: Camera Preview Shows Gray

## Root Cause

In `startScanning()` (line 102-118):

```text
1. getUserMedia() → gets stream ✅
2. videoRef.current.srcObject = stream  ← videoRef is NULL here! 
   (because <video> only renders when scanning === true)
3. setScanning(true) → now <video> renders, but stream was never attached
```

The `<video>` element is conditionally rendered only when `scanning` is `true` (line 135-137), but the stream is attached to `videoRef` *before* setting `scanning` to `true`.

## Fix

Restructure `startScanning` to:
1. Get the stream
2. Store it in `streamRef`
3. Set `scanning(true)` — this renders the `<video>` element
4. Use a `useEffect` that watches `scanning` + `streamRef` to attach the stream to the video element and start the scan loop

### File: `src/apps/member/pages/MemberCheckInPage.tsx`

**Changes:**
- `startScanning`: remove the `videoRef` attachment, just get stream and `setScanning(true)`
- Add `useEffect` that runs when `scanning` changes: if scanning and streamRef has a stream, attach to videoRef, call play(), start scanFrame loop
- This guarantees the `<video>` DOM element exists before we try to use it

