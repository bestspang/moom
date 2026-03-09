

# Fix: Member Header Still Disappearing — Race Condition in Auth Init

## Problem Verification

The screenshot shows member page content rendering (greeting, bookings, bottom nav) but **no MemberHeader bar**. Since MemberLayout renders both `<MemberHeader />` and `<Outlet />` together when `user` exists, and the content IS rendering, the issue must be a **flash**: user briefly becomes null → MemberLayout redirects to `/login` → then auth recovers. OR there's a race where `getSession()` overwrites valid auth state.

## Root Cause

**Race condition between `getSession()` and `onAuthStateChange`**:

1. `onAuthStateChange` fires with `INITIAL_SESSION` + valid session → sets `user` ✓
2. `getSession().then()` resolves — if it returns `session = null` (e.g., during token refresh), line 137 executes `setUser(null)` + line 143 `setLoading(false)`
3. MemberLayout sees `loading=false, user=null` → `<Navigate to="/login" />` — **header gone**

Both paths (`onAuthStateChange` AND `getSession`) independently set user state, creating a race. The `getSession()` path can overwrite valid state set by `onAuthStateChange` with null.

## Fix — `src/contexts/AuthContext.tsx`

**Make `onAuthStateChange` the single source of truth.** Remove `setUser`/`setSession` from the `getSession().then()` block entirely. `onAuthStateChange` always fires (including `INITIAL_SESSION` event), so `getSession` is redundant for state setting.

```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
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
  );

  // Fallback: if onAuthStateChange hasn't fired after a timeout, check getSession
  // This handles edge cases where the listener might not fire
  supabase.auth.getSession().then(({ data: { session } }) => {
    // Only set state if onAuthStateChange hasn't already handled it
    // (user is still null = listener hasn't fired yet)
    if (!user && !session?.user) {
      // No session anywhere — stop loading
      setLoading(false);
    }
    // If session exists here but user is null, onAuthStateChange will handle it
    // Do NOT call setUser/setSession here to avoid overwriting listener state
  });

  return () => { subscription.unsubscribe(); };
}, []);
```

**BUT** — stale closure problem: `user` inside useEffect is always `null` (initial value). Use a ref instead:

```typescript
const initializedRef = useRef(false);

// In onAuthStateChange callback, after setting user:
initializedRef.current = true;

// In getSession().then():
if (!initializedRef.current && !session?.user) {
  setLoading(false);
}
```

## Files to Modify
1. **`src/contexts/AuthContext.tsx`** — Remove `setUser`/`setSession` from `getSession()` path, add `initializedRef` to prevent race (~10 lines changed)

## Risks
- Zero regression: `onAuthStateChange` already handles all auth events including `INITIAL_SESSION`
- The `getSession()` path becomes a safety net only for the "no session at all" case

