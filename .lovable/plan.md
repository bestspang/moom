

# Fix: Double Highlight on Sidebar Nav Items

## Problem
When navigating to `/class-category`, both "Class list" (`/class`) and "Class categories" (`/class-category`) highlight because `isActiveRoute` uses `location.pathname.startsWith(path)`.

Since `/class-category`.startsWith(`/class`) === `true`, both match.

## Fix
In `src/components/layout/Sidebar.tsx`, update `isActiveRoute` to also check that the next character after the prefix is either `/` or end-of-string — preventing `/class` from matching `/class-category`.

```typescript
const isActiveRoute = (path: string) => {
  if (path === '/') return location.pathname === '/';
  if (location.pathname === path) return true;
  return location.pathname.startsWith(path + '/');
};
```

This ensures `/class` only matches `/class` or `/class/something`, not `/class-category`.

## Files
| File | Change |
|------|--------|
| `src/components/layout/Sidebar.tsx` | Fix `isActiveRoute` logic (1 line change) |

## Risk
- **Zero regression**: This is a stricter match — no route that previously worked correctly will break.

