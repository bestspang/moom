

# Critical Bug Fixes — Gamification Admin Control

## Bugs Found

### Bug 1 — CRITICAL: `g()` function zero-value fallback prevents admin control

**File:** `supabase/functions/gamification-process-event/index.ts` line 120

```typescript
return isNaN(val) || val === 0 ? Number(GUARDRAIL_DEFAULTS[key] ?? "0") : val;
```

If admin sets a term bonus to `0` (e.g., disable 1-month bonus), the function treats `0` as invalid and falls back to the default (`8`). This means admin **cannot set any guardrail to zero**. The zero-check was intended to protect against missing/broken values, but it breaks intentional zero-setting for bonuses and base values.

**Fix:** Only treat `isNaN` as fallback. For zero-protection on divisors specifically, add a separate guard in the calculation to prevent divide-by-zero.

### Bug 2 — HIGH: No audit trail for admin guardrail/prestige changes

`useEconomyGuardrails.ts` and `GamificationPrestige.tsx` directly update their respective tables without logging who changed what. The audit prompt specifically requires audit logging for all admin economy changes. This is a governance gap.

**Fix:** Insert into `gamification_audit_log` on each guardrail and prestige update with the old value, new value, and admin user ID.

### Bug 3 — MEDIUM: `gamification-admin-ops` CORS missing preview origin

The admin-ops edge function only allows `admin.moom.fit` and `moom.lovable.app`, but `gamification-process-event` also allows `member.moom.fit`. During development, the preview URL (`id-preview--*.lovable.app`) is also blocked. While this is fine for production, it prevents testing from the Lovable preview.

**Fix:** Add the preview origin pattern to the allowed origins in admin-ops.

### Bug 4 — LOW: `LevelRequirementsCard` XP threshold uses hardcoded `types.ts` values instead of DB

The `XP_THRESHOLDS` array in `types.ts` is a static copy. If admin edits level XP thresholds via the Levels page, `LevelRequirementsCard` and `LevelPerksCard` still use the old hardcoded array. This is a known limitation documented in the audit but is low priority since level thresholds rarely change.

**No fix now** — would require fetching levels from DB in the member app, which is a larger refactor.

---

## Implementation Plan

### Fix 1: `g()` function zero-value fallback

**File:** `supabase/functions/gamification-process-event/index.ts`

Change `g()` to only fallback on `NaN` or `undefined`, not on `0`. Add explicit divide-by-zero guards at each division site.

```typescript
function g(guardrails: GuardrailMap, key: string): number {
  const raw = guardrails[key] ?? GUARDRAIL_DEFAULTS[key];
  if (raw === undefined) return 0;
  const val = Number(raw);
  return isNaN(val) ? Number(GUARDRAIL_DEFAULTS[key] ?? "0") : val;
}
```

Then add `Math.max(divisor, 1)` around the 4 division operations (lines 498, 499, 507, 508) to prevent divide-by-zero if admin accidentally sets a divisor to 0.

### Fix 2: Audit logging for guardrail and prestige updates

**File:** `src/hooks/useEconomyGuardrails.ts`

After the `.update()` call, insert a row into `gamification_audit_log` with event_type `admin_update_guardrail`, the old and new values, and the current user ID.

**File:** `src/pages/gamification/GamificationPrestige.tsx`

Same pattern — log `admin_update_prestige_criterion` after updating prestige_criteria.

### Fix 3: CORS for preview

**File:** `supabase/functions/gamification-admin-ops/index.ts`

Add a wildcard match for `*.lovable.app` origins to support preview testing.

---

## Files to Edit

| File | Change |
|---|---|
| `supabase/functions/gamification-process-event/index.ts` | Fix `g()` zero fallback + add divide-by-zero guards |
| `src/hooks/useEconomyGuardrails.ts` | Add audit log insert after update |
| `src/pages/gamification/GamificationPrestige.tsx` | Add audit log insert after update |
| `supabase/functions/gamification-admin-ops/index.ts` | Fix CORS to allow preview origins |

## Order

1. Fix `g()` (critical — affects all economy calculations)
2. Fix CORS (quick, unblocks testing)
3. Add audit logging (governance)

