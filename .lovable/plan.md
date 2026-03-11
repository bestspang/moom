

# Critical & High-Priority Bug Fixes

## Bugs Found

### Bug 1 — CRITICAL: Both edge functions missing required Supabase CORS headers

Both `gamification-process-event` and `gamification-admin-ops` only allow:
```
authorization, x-client-info, apikey, content-type
```

But `supabase.functions.invoke()` sends additional headers: `x-supabase-client-platform`, `x-supabase-client-platform-version`, `x-supabase-client-runtime`, `x-supabase-client-runtime-version`. Missing these causes CORS preflight failures when calling from the browser.

**Fix:** Update `Access-Control-Allow-Headers` in both functions to include all required Supabase client headers.

### Bug 2 — CRITICAL: `gamification-process-event` blocks Lovable preview origins

Unlike `gamification-admin-ops` (which has `isAllowedOrigin` with wildcard regex), `gamification-process-event` only does `ALLOWED_ORIGINS.includes(origin)` — an exact match. Any call from a Lovable preview URL (e.g., `id-preview--xxx.lovable.app`) falls back to `admin.moom.fit`, causing CORS failures for the member app during development.

**Fix:** Add the same `isAllowedOrigin()` wildcard function from `gamification-admin-ops`.

---

## Files to Edit

| File | Change |
|---|---|
| `supabase/functions/gamification-process-event/index.ts` | Add wildcard origin support + full CORS headers |
| `supabase/functions/gamification-admin-ops/index.ts` | Add full CORS headers |

## Implementation Order
1. Fix `gamification-process-event` CORS (critical — member app calls this)
2. Fix `gamification-admin-ops` CORS (critical — admin ops calls this)

Both are safe, additive changes — no logic is altered.

