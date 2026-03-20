

# Redesign: Member Check-In Page — 3-Zone Layout

## Current Problem
The page has a "Tap to Scan" button that opens a camera, plus a self-service button below. But the user wants:
1. **Camera scanner** always visible at top (scan gym's QR to check in)
2. **Member's own dynamic QR** below (gym scans this, or for collecting points)
3. **Code input field** at bottom (manual code entry for redemption/check-in fallback)

## New Layout (Mobile-First)

```text
┌──────────────────────────────┐
│  📷 Camera Viewfinder        │
│  ┌────────────────────────┐  │
│  │  (Tap to activate)     │  │
│  │   Live QR scanner      │  │
│  └────────────────────────┘  │
│  "Scan QR at the gym"        │
│                              │
│  ─── My QR Code ───         │
│                              │
│  ┌────────────────────────┐  │
│  │  ▓▓▓ Member QR ▓▓▓    │  │ ← Dynamic, refreshes every 30s
│  │  (gym scans this)      │  │
│  └────────────────────────┘  │
│  Refreshes in 0:25           │
│                              │
│  ─── or enter code ───      │
│                              │
│  [ Enter code...    ] [Go]   │
│                              │
│  🔥 Streak: Day 5           │
└──────────────────────────────┘
```

## Technical Design

### Camera Section (Top)
- Same state machine: `ready` → `scanning` → `processing` → `fallback`
- On `ready`: Show camera icon card with "Tap to open camera" — tapping triggers scanner
- On `scanning`: Live camera viewfinder (existing `html5-qrcode` logic, unchanged)
- Smaller viewfinder: `max-w-[240px]` instead of `280px` to leave room for QR below

### Member QR Code Section (Middle)
- Uses `useGenerateQRToken` to create a member-specific token with `memberId` + a dummy location
- Actually, simpler approach: generate a unique member identifier URL like `${origin}/checkin?member=${memberId}&ts=${timestamp}`
- **Dynamic rotation**: Token refreshes every 30 seconds with a countdown ring
- Uses `QRCodeSVG` from existing `qrcode.react` package (already installed)
- The QR encodes: `${origin}/checkin?member=${memberId}&nonce=${random}` — staff kiosk or app scans this

### Code Input Section (Bottom)
- Simple text input + submit button
- Accepts either a check-in code (token string) or redemption code
- On submit: tries `useValidateQRToken({ token: inputCode, memberId })` first
- If that fails, could be a redemption code — show appropriate error

### Streak + Celebration
- Streak flame stays at the very bottom (compact)
- `CheckInCelebration` dialog unchanged

## Files Changed

| # | File | Change |
|---|------|--------|
| 1 | `src/apps/member/pages/MemberCheckInPage.tsx` | Full rewrite — 3-zone layout with camera + member QR + code input |
| 2 | `src/i18n/locales/en.ts` | Add keys: `myQrCode`, `gymScansThis`, `refreshesIn`, `enterCode`, `submitCode`, `codeSubmitting` |
| 3 | `src/i18n/locales/th.ts` | Same keys in Thai |

## What Stays The Same
- `MemberBottomNav.tsx` — unchanged
- `useValidateQRToken` hook — reused for both QR scan and code input
- `memberSelfCheckin` RPC — removed (replaced by code input which is more versatile)
- `CheckInCelebration` component — reused as-is
- `fireGamificationEvent` — reused
- `html5-qrcode` + `qrcode.react` — both already installed
- All routes in `App.tsx` — unchanged
- Camera state machine logic — same pattern, just embedded in smaller section

## Member QR Token Strategy
Rather than generating real `checkin_qr_tokens` (which need a `location_id`), the member QR will encode a simple signed payload: `memberId + timestamp`. The gym's kiosk/staff scanner reads this and processes check-in on their end. This keeps the member app stateless — no token generation needed, just a rotating identifier.

Simple approach: `QRCodeSVG` value = `${origin}/checkin?member=${memberId}&t=${Math.floor(Date.now()/30000)}` — changes every 30s, staff kiosk validates the member ID.

## Risk Assessment
- Zero backend changes — all frontend
- Camera scanner logic preserved (same state machine)
- `qrcode.react` already in dependencies
- Fallback paths intact (code input replaces self-service button with more utility)

