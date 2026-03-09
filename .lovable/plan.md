

# Fix: Admin Header Missing Surface Switcher Links

## Problem

The screenshot confirms: admin dropdown shows "Owner" role label (proving `role` is set), but Member App / Trainer App links are absent. The code at line 238 checks `allRoles.length > 0 && allRoles.some(...)` which should pass.

## Root Cause

Two issues compounding:

1. **Double-fetch race**: `fetchUserRoleAndStatus` is called twice (from `getSession` directly AND from `onAuthStateChange` via `setTimeout`). The setTimeout call can overwrite stable state with a fresh DB query, causing a brief render cycle where `allRoles` might flash.

2. **Fragile condition**: The condition uses `allRoles` which starts as `[]` and is set asynchronously. A safer approach is to also fallback to `role` (which the screenshot proves IS set to 'owner').

## Fix

### 1. `src/components/layout/Header.tsx` — Make surface switcher condition more robust

Change the gate check to use BOTH `role` and `allRoles` as fallback:

```typescript
// Before (line 238):
{allRoles.length > 0 && allRoles.some(r => ['owner', 'admin', 'trainer', 'freelance_trainer', 'front_desk'].includes(r)) && (

// After — show if EITHER role or allRoles indicates staff:
{(role && ['owner', 'admin', 'trainer', 'freelance_trainer', 'front_desk'].includes(role)) || (allRoles.length > 0 && allRoles.some(r => ['owner', 'admin', 'trainer', 'freelance_trainer', 'front_desk'].includes(r))) ? (
```

And same fix for the Trainer App sub-condition at line 247.

### 2. `src/contexts/AuthContext.tsx` — Prevent duplicate role fetching

Add a guard so `fetchUserRoleAndStatus` doesn't run twice for the same user on initial load. Skip the `onAuthStateChange` fetch if roles are already loaded for the same user:

```typescript
// In onAuthStateChange callback:
if (session?.user) {
  // Only fetch if roles aren't already set for this user
  if (allRoles.length === 0) {
    setTimeout(() => fetchUserRoleAndStatus(session.user.id), 0);
  }
}
```

## Files to Modify
1. `src/components/layout/Header.tsx` — dual condition for surface switcher visibility (~2 lines)
2. `src/contexts/AuthContext.tsx` — guard against duplicate role fetch (~1 line)

## Risks
- Zero regression: purely defensive/additive changes
- The dual condition ensures links show whenever either `role` or `allRoles` is populated

