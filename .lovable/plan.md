

# Fix: Settings page loses sub-route on refresh

## Problem
The `/setting` route has no index redirect. When navigating to `/setting` directly (or if any redirect strips the sub-path), the Outlet renders empty. The fix is to add an index route that redirects `/setting` → `/setting/general`.

## Change

### `src/App.tsx`
Add an index redirect under the `setting` route:

```tsx
import { Navigate } from 'react-router-dom';

<Route path="setting" element={<Settings />}>
  <Route index element={<Navigate to="general" replace />} />
  <Route path="general" element={<SettingsGeneral />} />
  ...
</Route>
```

One line addition. Zero risk.

