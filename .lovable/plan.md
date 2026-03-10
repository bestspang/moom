

# Dynamic QR Check-in Display Page

สร้างหน้าเต็มจอสำหรับแสดง QR Code บนจอแยก (tablet/TV ที่หน้ายิม) — member สแกนเพื่อ check-in ได้เลย

## Design

```text
┌─────────────────────────────────┐
│                                 │
│         🏋️ GYM LOGO            │
│       "Scan to Check In"       │
│                                 │
│     ┌───────────────────┐       │
│     │                   │       │
│     │    QR CODE (300)  │       │
│     │                   │       │
│     └───────────────────┘       │
│                                 │
│       📍 Location Name          │
│     ⏱ Auto-refresh 1:45        │
│                                 │
│    Circular progress ring       │
│    around countdown             │
│                                 │
│   ─── Current time: 14:30 ───  │
│                                 │
└─────────────────────────────────┘
```

**Key behaviors:**
- Auto-generates QR token every 2 minutes (reuses `useGenerateQRToken`)
- Full-screen dark mode, no header/nav — designed for kiosk/tablet
- Location selector on first load, remembers in `localStorage`
- Shows live clock + circular countdown ring
- Subtle pulse animation when QR refreshes
- URL: `/checkin-display` (public route, no auth required to view)
- QR links to existing `/checkin?token=xxx`

## Files

| Action | File | Details |
|--------|------|---------|
| Create | `src/pages/CheckinDisplay.tsx` | Full-screen kiosk QR page |
| Edit | `src/App.tsx` | Add route `/checkin-display` |
| Edit | `src/i18n/locales/en.ts` | Add ~8 keys under `checkinDisplay` |
| Edit | `src/i18n/locales/th.ts` | Thai translations |

## Implementation Details

- **No auth needed** — page uses `useLocations()` query (public) + `useGenerateQRToken()` mutation
- **Location selector**: shown once → stored in `localStorage('checkin-display-location')` → can reset via small gear icon
- **Auto-refresh**: `useEffect` timer watches `expires_at`, regenerates at 0s remaining
- **Kiosk-friendly**: `cursor-none` option, prevent sleep via Wake Lock API if available
- **Responsive**: QR scales from 200px (mobile) to 400px (desktop/tablet)

