

# Wire Real Actions into Command Palette (Phase 5b)

## Problem
The Command Palette quick actions (`Create Member`, `Create Lead`, etc.) navigate to URLs with `?action=create` query params, but **no page reads those params**. The actions just navigate to the page without opening any dialog. The "Check-in" shortcut is also missing entirely.

## Solution

### Approach: Event-based actions instead of URL params
Rather than adding `useSearchParams` to every page (fragile, couples palette to page internals), use a **lightweight global event bus** so the CommandPalette can directly trigger dialog opens from anywhere.

**Two-part fix:**

### 1. Create a tiny event helper (`src/lib/commandEvents.ts`)
A simple `CustomEvent` dispatcher + hook pattern:
- `dispatchCommand(action: string)` — fires a custom DOM event
- `useCommandListener(action: string, callback: () => void)` — listens for it

### 2. Update CommandPalette quick actions
Replace URL-based navigation with:
- **"Check In"** → navigate to `/lobby` + dispatch `command:open-checkin`
- **"Create Member"** → navigate to `/members` + dispatch `command:open-create-member`
- **"Create Lead"** → navigate to `/leads` + dispatch `command:open-create-lead`
- **"Create Class"** / **"Create Package"** → keep existing path navigation (these go to dedicated `/create` routes that already work)
- **Add "Quick Check-in"** as a new action with `DoorOpen` icon

### 3. Wire listeners in target pages
- **Lobby.tsx**: `useCommandListener('open-checkin', () => setDialogOpen(true))`
- **Members.tsx**: `useCommandListener('open-create-member', () => setCreateDialogOpen(true))`
- **Leads.tsx**: `useCommandListener('open-create-lead', () => setCreateDialogOpen(true))`

### 4. Add i18n keys for new action labels
- `commandPalette.checkIn` → `'Quick Check-in'` / `'เช็คอินด่วน'`

## Files to create/modify

| File | Change |
|------|--------|
| `src/lib/commandEvents.ts` | **NEW** — `dispatchCommand()` + `useCommandListener()` |
| `src/components/command-palette/CommandPalette.tsx` | Replace URL-based quick actions with event-based; add Check-in action; small delay for navigation before dispatch |
| `src/pages/Lobby.tsx` | Add `useCommandListener('open-checkin', ...)` |
| `src/pages/Members.tsx` | Add `useCommandListener('open-create-member', ...)` |
| `src/pages/Leads.tsx` | Add `useCommandListener('open-create-lead', ...)` |
| `src/i18n/locales/en.ts` | Add `commandPalette.checkIn` |
| `src/i18n/locales/th.ts` | Same in Thai |

## Risk
- **Low**: Additive — new event system, existing page state unchanged
- Navigation + dispatch timing: use `setTimeout(dispatch, 100)` so the target page mounts before the event fires
- No existing behavior altered (Create Class/Package still use direct route navigation)

