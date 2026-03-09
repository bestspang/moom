

# Fix: Admin Surface Switcher Links Missing After Navigation from Member

## Problem Verification

The screenshot confirms: admin dropdown shows "Owner" label (so `role` IS set to `'owner'`) but the Member App / Trainer App links are completely absent. The code at line 238 checks `role && ['owner', ...].includes(role)` which should be `true`.

**Root cause:** The `onAuthStateChange` listener (line 108-123) fires multiple events during page load. If an event fires with session but then another event briefly triggers with a different state, the `else` branch (line 117-121) resets `role` to `null` and `allRoles` to `[]`. The `getSession` path then re-fetches, but there's a brief window where `role` is null while `user` is already set — and if the dropdown is opened during this window or the re-render doesn't propagate correctly, the links disappear.

Additionally, the `setTimeout` on line 115 creates a gap where `user` is set but `role`/`allRoles` are still stale from a previous state.

## Fix (2 files)

### 1. `src/components/layout/Header.tsx` — Use `allRoles` as primary check

Change line 238 from:
```
role && ['owner', 'admin', 'trainer', 'freelance_trainer', 'front_desk'].includes(role)
```
to:
```
allRoles.length > 0 && allRoles.some(r => ['owner', 'admin', 'trainer', 'freelance_trainer', 'front_desk'].includes(r))
```

This is more resilient because `allRoles` is set atomically with `role` and doesn't depend on the single `role` value matching.

### 2. `src/contexts/AuthContext.tsx` — Prevent intermediate null-role resets

In the `onAuthStateChange` callback, DON'T reset role/allRoles in the `else` branch if we're still processing. Instead, only clear them on explicit `SIGNED_OUT` event. This prevents brief null-state flashes during INITIAL_SESSION / TOKEN_REFRESHED cycles.

Change:
```typescript
async (event, session) => {
  setSession(session);
  setUser(session?.user ?? null);
  if (session?.user) {
    setTimeout(() => fetchUserRoleAndStatus(session.user.id), 0);
  } else {
    setRole(null);
    setAllRoles([]);
    ...
  }
}
```
to:
```typescript
async (event, session) => {
  setSession(session);
  setUser(session?.user ?? null);
  if (session?.user) {
    setTimeout(() => fetchUserRoleAndStatus(session.user.id), 0);
  } else if (event === 'SIGNED_OUT') {
    setRole(null);
    setAllRoles([]);
    setAccessLevel(null);
    setStaffStatus(null);
    setLoading(false);
  }
}
```

## Risks
- Zero regression: only makes the conditions more defensive
- `SIGNED_OUT` is the only event where roles should actually clear

