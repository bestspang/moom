

# Fix: Member app redirects to admin on refresh

## Root Cause

Two bugs work together to cause this:

1. **MemberLayout hardcodes `from: { pathname: '/member' }`** instead of passing the actual current path (e.g. `/member/momentum`). Same issue in TrainerLayout.

2. **Login.tsx ignores `location.state.from`** entirely. After auth resolves, it redirects based on `detectSurface()` which returns `'admin'` in dev/preview — so admin-role users always land on `/` (admin dashboard) instead of going back to the member page they were on.

**Flow on refresh:** Auth has a brief `loading=false, user=null` window → MemberLayout redirects to `/login` → auth resolves → Login.tsx sends admin-role users to `/` instead of back to `/member/*`.

## Fix (3 files, minimal changes)

### 1. `MemberLayout.tsx` — pass actual location
```diff
- return <Navigate to="/login" state={{ from: { pathname: '/member' } }} replace />;
+ return <Navigate to="/login" state={{ from: location }} replace />;
```

### 2. `TrainerLayout.tsx` — same fix
```diff
- return <Navigate to="/login" state={{ from: { pathname: '/trainer' } }} replace />;
+ return <Navigate to="/login" state={{ from: location }} replace />;
```

### 3. `Login.tsx` — respect `state.from` redirect target
After auth resolves, check `location.state?.from?.pathname` first. If it exists and starts with `/member` or `/trainer` or `/staff`, redirect there instead of using surface-based logic. This ensures users return to exactly where they were.

```typescript
const from = location.state?.from?.pathname;

if (from && (from.startsWith('/member') || from.startsWith('/trainer') || from.startsWith('/staff'))) {
  navigate(from, { replace: true });
} else if (surface === 'member' || surface === 'trainer' || surface === 'staff') {
  navigate('/member', { replace: true });
} else {
  if (role === 'member') navigate('/member', { replace: true });
  else navigate('/', { replace: true });
}
```

Zero risk to existing admin flows — admin ProtectedRoute already handles its own redirect correctly and doesn't pass member paths in `from`.

