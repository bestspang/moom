

# Redesign: Member Check-In — Camera-First QR Scanner

## Current Problem
When a member taps the check-in button in the bottom nav, they land on a page with a **big button they have to tap again** to self-check-in. Two taps for one action = friction. The gym has QR kiosks but members can't scan them from inside the app.

## New Flow
**Bottom nav tap → Camera opens instantly → Scan kiosk QR → Auto check-in → Celebration**

No extra taps. The member is already authenticated, so when they scan the kiosk QR, we know who they are — no phone/ID input needed (unlike the public `/checkin` page).

```text
┌─────────────────────────────┐
│  Tap "Check In" in nav      │
│             ↓                │
│  Camera opens (full area)   │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │    📷 Live viewfinder │  │
│  │                       │  │
│  └───────────────────────┘  │
│  "Scan QR at the gym"       │
│                              │
│  ─── OR ───                  │
│                              │
│  [ ⚡ Quick Check-In ]       │
│  (self-service fallback)     │
│                              │
│  Streak: 🔥 Day 5           │
└─────────────────────────────┘
```

## Technical Design

### 1. Add `html5-qrcode` dependency
The `qrcode.react` package only **generates** QR codes. We need `html5-qrcode` to **read/scan** them via camera. It's the most reliable cross-browser QR scanner library (uses both `BarcodeDetector` API and fallback canvas decoding).

### 2. Rewrite `MemberCheckInPage.tsx`
The page will have three states:

- **`scanning`** (default on mount): Camera viewfinder active, scanning for QR
- **`processing`**: QR detected, validating token + checking in
- **`fallback`**: Camera denied/failed, shows the original self-service button

**On mount:**
- Auto-start camera via `Html5Qrcode.start()` 
- When QR decoded → extract `token` param from URL → call `useValidateQRToken({ token, memberId })` → fire gamification event → show CheckInCelebration

**Camera failure fallback:**
- If camera permission denied or device has no camera → show self-service button (current behavior)
- i18n keys `member.cameraAccessDenied` and `member.stopCamera` already exist

**Layout:**
- Camera viewfinder takes ~60% of screen (rounded corners, subtle border)
- Below: "Scan the QR code at the gym" text
- Divider: "— or —"
- Self-service "Quick Check-In" button (the current big button, but smaller)
- Streak info at bottom

### 3. Files Changed

| File | Change |
|------|--------|
| `package.json` | Add `html5-qrcode` dependency |
| `src/apps/member/pages/MemberCheckInPage.tsx` | Full rewrite — camera-first with self-service fallback |
| `src/i18n/locales/en.ts` | Add `scanQrAtGym`, `orQuickCheckin`, `qrCheckInSuccess` keys |
| `src/i18n/locales/th.ts` | Same keys in Thai |

### 4. What stays the same
- `MemberBottomNav.tsx` — no changes, still links to `/member/check-in`
- `CheckInCelebration` component — reused as-is
- `useValidateQRToken` hook — reused for QR path
- `memberSelfCheckin` RPC — reused for self-service fallback
- `fireGamificationEvent` — reused for both paths
- All routes in `App.tsx` — unchanged

### 5. Safety
- The camera uses `html5-qrcode` which handles permissions gracefully and has a clear error callback
- If camera fails → fallback to self-service button (existing proven code)
- QR validation goes through the same `useValidateQRToken` that `/checkin` uses — battle-tested
- The `memberSelfCheckin` RPC remains available as an alternative — no functionality removed
- Mobile responsive: camera viewfinder uses `aspect-square` with `max-w` constraint

