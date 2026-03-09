

# Fix: Admin Surface Switcher Always Missing After Navigation

## Problem Verification

Despite multiple attempts to fix the conditional rendering logic, the "Member App" and "Trainer App" links still don't appear in the admin Header dropdown when navigating from the member surface. The code logic appears correct (`role='owner'` is set, condition should pass), yet the links don't render.

## Root Cause

The fundamental issue is a **race condition between double-invocations of `fetchUserRoleAndStatus`** combined with React's state update batching. The function is called twice on every page load:
1. Directly from `getSession()` (synchronous after session resolves)
2. Via `setTimeout` from `onAuthStateChange` (INITIAL_SESSION event)

The `role === null` check on line 116 uses a **stale closure** (captured at useEffect mount time, always `null`), so both paths always fire. This creates two concurrent async flows writing to the same state, and depending on timing, can leave `allRoles` temporarily empty during a render cycle.

## Solution: Two-Part Fix

### 1. `AuthContext.tsx` — Eliminate double-fetch with a ref guard

Use a `useRef` to track the userId currently being fetched. If a fetch is already in progress for the same user, skip the duplicate call. This eliminates the race entirely.

### 2. `Header.tsx` — Simplify the surface switcher to always show for authenticated users

The admin surface is already gated by `ProtectedRoute`. Any authenticated user on the admin surface should be able to navigate to member/trainer surfaces (those surfaces handle their own access control). Remove the fragile role-based conditional entirely and just check `!!user`.

This eliminates all possible timing/state-race issues with the surface switcher visibility.

## Files to Modify
1. **`src/contexts/AuthContext.tsx`** — Add a `fetchingForUserRef` to prevent duplicate concurrent fetches (~5 lines)
2. **`src/components/layout/Header.tsx`** — Simplify surface switcher gate from role check to `!!user` (~2 lines)

## Risks
- Zero regression: surface switcher links become MORE available, not less
- Trainer App link visibility no longer gated by role — acceptable since the trainer surface has its own access control

