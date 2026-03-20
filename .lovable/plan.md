

# Fix: Member Page Refresh Redirects to Admin

## Root Cause

Race condition in `AuthContext.tsx` auth initialization:

1. User is on `/member/...`, refreshes the page
2. `AuthProvider` mounts with `loading=true`, `user=null`
3. `onAuthStateChange` is set up + `consumeSessionFromUrl()` starts
4. `consumeSessionFromUrl()` returns `false` → `getSession()` called
5. **Race:** `getSession()` can resolve with `null` before `onAuthStateChange` fires `INITIAL_SESSION` with the actual session
6. Lines 152-154: `setLoading(false)` with no user set
7. `MemberLayout` sees `loading=false` + `!user` → `<Navigate to="/login">`
8. Auth then resolves → Login page redirect fires → `detectSurface()` returns `'admin'` (dev/preview env) → user role is not `'member'` → redirects to `/` (admin dashboard)

The bug is on **line 153** of `AuthContext.tsx`: when `getSession()` returns null in the fallback path, it prematurely sets `loading=false` before `onAuthStateChange` has a chance to fire with the real session.

A secondary issue: `onAuthStateChange` only handles `session?.user` (line 115) and `event === 'SIGNED_OUT'` (line 124). It does **not** handle `INITIAL_SESSION` with a null session, so if `onAuthStateChange` fires first with no session, `loading` stays `true` forever.

## Fix (2 changes in `AuthContext.tsx`)

### Change 1: Handle all no-session events in `onAuthStateChange`

Line 124: Change `else if (event === 'SIGNED_OUT')` to handle any event with no session:

```typescript
} else if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
```

This ensures `INITIAL_SESSION` with no user (genuinely not logged in) also properly clears state and sets `loading=false`.

### Change 2: Don't prematurely end loading in `getSession` null path

Lines 152-154: When `getSession()` returns no session, mark `initializedRef` but **don't** set `loading=false` — let `onAuthStateChange` handle it. If `onAuthStateChange` already fired (meaning `initializedRef.current` is true), this block is skipped entirely.

```typescript
// Before:
} else {
  setLoading(false);
}

// After:
} else {
  initializedRef.current = true;
  // Don't setLoading(false) here — let onAuthStateChange INITIAL_SESSION handle it
  // Safety net: if onAuthStateChange never fires (shouldn't happen), timeout
  setTimeout(() => {
    if (!initializedRef.current) return; // already handled
    setLoading((prev) => prev ? false : prev); // only if still loading
  }, 2000);
}
```

Wait, actually that's over-engineered. The simpler approach:

Since we now handle `INITIAL_SESSION` in `onAuthStateChange` (Change 1), `onAuthStateChange` will always fire and resolve loading. The `getSession` fallback is only needed if `onAuthStateChange` somehow doesn't fire. So the null path in `getSession` should just be a safety net with a timeout, not an immediate `setLoading(false)`.

**Simplest correct fix:**

```typescript
// Line 124: handle INITIAL_SESSION with no user
} else if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
  initializedRef.current = true;
  // ... clear state, setLoading(false)
}

// Lines 152-154: just mark initialized, no premature loading=false  
} else {
  initializedRef.current = true;
  // onAuthStateChange INITIAL_SESSION will handle setLoading(false)
}
```

## Risk Assessment

- **Zero risk to existing auth flow**: `onAuthStateChange` already handles sign-out clearing. Adding `INITIAL_SESSION` to the same branch is a strict superset.
- **No changes to**: MemberLayout, ProtectedRoute, Login page, any routes, any other components.
- **Only file changed**: `src/contexts/AuthContext.tsx` — 2 lines modified.

