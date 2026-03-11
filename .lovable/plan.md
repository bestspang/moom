

# Fix: Economy Guardrails Key Mismatch + Validation Bug

## Critical Bug Found

The edge function `getGuardrails()` fetches from `economy_guardrails` correctly, but the **lookup keys don't match the DB rule_codes**. Every single lookup falls back to `GUARDRAIL_DEFAULTS`, making the admin-editable guardrails table completely non-functional.

### Mismatch Table

| Edge Function Key | DB rule_code | Match? |
|---|---|---|
| `PACKAGE_XP_PER_THB_DIVISOR` | `PACKAGE_XP_PER_300_THB` | No |
| `PACKAGE_COIN_PER_THB_DIVISOR` | `PACKAGE_COIN_PER_180_THB` | No |
| `PACKAGE_COIN_CAP` | `PACKAGE_COIN_CAP_PER_ORDER` | No |
| `PACKAGE_TERM_BONUS_XP_1` | `PACKAGE_XP_TERM_BONUS_1M` | No |
| `PACKAGE_TERM_BONUS_XP_3` | `PACKAGE_XP_TERM_BONUS_3M` | No |
| `PACKAGE_TERM_BONUS_XP_6` | `PACKAGE_XP_TERM_BONUS_6M` | No |
| `PACKAGE_TERM_BONUS_XP_12` | `PACKAGE_XP_TERM_BONUS_12M` | No |
| `PACKAGE_TERM_BONUS_COIN_1` | `PACKAGE_COIN_TERM_BONUS_1M` | No |
| `PACKAGE_TERM_BONUS_COIN_3` | `PACKAGE_COIN_TERM_BONUS_3M` | No |
| `PACKAGE_TERM_BONUS_COIN_6` | `PACKAGE_COIN_TERM_BONUS_6M` | No |
| `PACKAGE_TERM_BONUS_COIN_12` | `PACKAGE_COIN_TERM_BONUS_12M` | No |
| `SHOP_XP_BASE` | `SHOP_XP_BASE_PER_ORDER` | No |
| `SHOP_XP_PER_THB_DIVISOR` | `SHOP_XP_PER_180_THB` | No |
| `SHOP_XP_CAP` | `SHOP_XP_CAP_PER_ORDER` | No |
| `SHOP_COIN_PER_THB_DIVISOR` | `SHOP_COIN_PER_120_THB` | No |
| `SHOP_COIN_CAP` | `SHOP_COIN_CAP_PER_ORDER` | No |

**None match.** The guardrails table is 100% ignored at runtime.

### Second Bug: Validation in `useEconomyGuardrails.ts`

Line 34: `if (rule_value.includes('DIVISOR'))` — this checks `rule_value` (e.g. "300") for the word "DIVISOR" instead of checking `rule_code`. Will never trigger.

## Fix Plan

### 1. Update Edge Function `GUARDRAIL_DEFAULTS` keys to match DB rule_codes

Change every key in the defaults map and every `g()` call to use the actual DB rule_codes. This is the correct approach since the DB already has seeded data with these codes.

### 2. Fix `useEconomyGuardrails.ts` validation

Check `rule_code` field (passed as a parameter or matched separately) instead of `rule_value` for DIVISOR/CAP validation.

## Files to Edit

| File | Change |
|---|---|
| `supabase/functions/gamification-process-event/index.ts` | Rename all `GUARDRAIL_DEFAULTS` keys + all `g()` calls to match DB codes |
| `src/hooks/useEconomyGuardrails.ts` | Fix validation to check rule_code not rule_value |

