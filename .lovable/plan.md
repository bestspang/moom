## Problem

`/liff/member` and `/liff/trainer` still render "Coming Soon" shells (`LiffMemberApp.tsx`, `LiffTrainerApp.tsx`), and `LiffCallback.tsx` routes users into those dead-ends on error and as its default target. The real apps live at `/member` and `/trainer`.

## Changes

### 1. New redirect component — `src/pages/liff/LiffRedirect.tsx` (new)
Small component that:
- Reads `target: 'member' | 'trainer'` prop.
- Preserves `location.search` (query params) and `location.hash`.
- If a `liff.state` query param is present, uses it as the destination path (LINE deep-link convention); otherwise uses `/member` or `/trainer`.
- Calls `navigate(destination, { replace: true })` inside `useEffect` — client-side redirect keeps auth/session state intact.
- Renders a minimal spinner while redirecting (reuse `Loader2` pattern already in `LiffCallback`).

Because `/liff/*` is a shared route served from either hostname, staying within react-router (no full page reload) is correct and preserves login. No `buildCrossSurfaceUrl` needed here — same origin, same session.

### 2. `src/App.tsx`
- Remove imports of `LiffMemberApp`, `LiffTrainerApp`.
- Import `LiffRedirect`.
- Replace routes:
  - `/liff/member` → `<LiffRedirect target="member" />`
  - `/liff/trainer` → `<LiffRedirect target="trainer" />`
- Leave `/liff/callback` route untouched.

### 3. `src/pages/liff/LiffCallback.tsx`
- Change default `targetPath` from `/liff/member` / `/liff/trainer` to `/member` / `/trainer`.
- Change the error-state "back to app" button target from `/liff/member` to `/member`.
- Keep the `liff.state` deep-link behavior and the rest of the flow (LINE login round-trip) untouched.
- No hostname hardcoding; all navigation stays within react-router since `/member` and `/liff/*` are both served on the same host (`member.moom.fit`). `buildCrossSurfaceUrl` is not required for this same-origin case.

### 4. Delete orphaned files
After the route swap, nothing else imports them (verified: only `App.tsx` and each other). Delete:
- `src/pages/liff/LiffMemberApp.tsx`
- `src/pages/liff/LiffTrainerApp.tsx`
- `src/components/liff/LiffComingSoon.tsx` (only used by the two files above)

Leave `LiffContext.tsx`, `LiffBottomNav.tsx`, and the `line-auth` edge function untouched.

### 5. i18n cleanup
Remove now-unused keys from `src/i18n/locales/{en,th}.ts`:
- `liff.member.*` (welcome, guest, linked, notLinked, memberId, nextClass, linkPrompt)
- `liff.nav.*` (booking, packages, checkin, profile, home)
- `liff.trainerNav.*` (schedule, attendance, ptLog, members)
- `liff.comingSoonDescription`

Keep the keys still used by `LiffCallback.tsx`: `liff.callbackError`, `liff.backToApp`, `liff.loggingIn`.

Run `scripts/compare-i18n.mjs` mentally / by matching keys — both locales must stay in sync.

### 6. Docs
Append a short `docs/DEVLOG.md` entry noting the legacy LIFF shell removal and the redirect.

## Regression Checklist
- `/liff/member?foo=bar` → lands on `/member?foo=bar`, session preserved (single client-side redirect).
- `/liff/member?liff.state=%2Fmember%2Fpackages` → lands on `/member/packages`.
- `/liff/trainer` → lands on `/trainer`.
- `/liff/callback` LINE login flow behaves identically for the success path.
- On callback error, "back to app" button goes to `/member` (real home), not the Coming Soon shell.
- `bun run build` clean (no dangling imports).
- `bun run test` green.
- No orphaned i18n keys (`en.ts` ↔ `th.ts` in sync).

## Out of Scope
`LiffContext`, `line-auth`, `SurfaceGuard`, RLS, auth flow.
