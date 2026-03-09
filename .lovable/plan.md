

# Fix: Member Header Disappears on Member Page

## Root Cause

In `AuthContext.tsx` line 114, the `onAuthStateChange` callback unconditionally sets `setUser(session?.user ?? null)` for ALL events. If a non-`SIGNED_OUT` event fires with a null/undefined session (e.g., during token refresh or navigation), `user` is set to `null`. This triggers `MemberLayout`'s guard (`if (!user) → Navigate to /login`), making the entire layout (including MemberHeader) disappear.

The previous fix correctly guarded role-clearing to only happen on `SIGNED_OUT`, but forgot to apply the same guard to `setUser` and `setSession`.

## Fix — `src/contexts/AuthContext.tsx`

In the `onAuthStateChange` callback (~lines 112-129), move the `setSession`/`setUser` calls inside the conditional branches so user is only cleared on explicit `SIGNED_OUT`:

```typescript
async (event, session) => {
  if (session?.user) {
    setSession(session);
    setUser(session.user);
    if (fetchingForUserRef.current !== session.user.id) {
      setTimeout(() => fetchUserRoleAndStatus(session.user.id), 0);
    } else {
      setLoading(false);
    }
  } else if (event === 'SIGNED_OUT') {
    setSession(null);
    setUser(null);
    setRole(null);
    setAllRoles([]);
    setAccessLevel(null);
    setStaffStatus(null);
    setLoading(false);
  }
}
```

## Files to Modify
1. `src/contexts/AuthContext.tsx` — Guard `setUser(null)` / `setSession(null)` to only fire on `SIGNED_OUT` (~3 line change)

## Risks
- Zero regression: only prevents accidental null-clearing during non-signout events
- Explicit signout still correctly clears all state

