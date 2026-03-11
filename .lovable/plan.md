

# Admin Control Audit + Fix Plan — Gamification System

## Audit Results

### CRITICAL FINDING: `economy_guardrails` table exists with all v2 values BUT the Edge Function ignores it completely

The `economy_guardrails` table has 25 rules (package XP/coin formulas, shop formulas, caps, term bonuses, rollback rules). However, `gamification-process-event/index.ts` **hardcodes all these values** on lines 438-447:

```text
Lines 438-439: termBonusXp = { 1: 8, 3: 18, 6: 35, 12: 55 }  ← HARDCODED
Lines 440-441: netPaid / 300, netPaid / 180               ← HARDCODED  
Lines 442-443: cap at 100                                   ← HARDCODED
Lines 446-447: 6 + netPaid/180 cap 16, netPaid/120 cap 18  ← HARDCODED
```

**Zero references** to `economy_guardrails` in any Edge Function. Admin can edit the table but it has no effect.

### Full Audit by Section

| Area | Admin UI | Editable | Truly Live-Driven | Verdict |
|------|----------|----------|-------------------|---------|
| **XP/Coin per activity** | Rules page | Yes | **Yes** — `findMatchingRule()` reads from `gamification_rules` | Fully controlled |
| **Cooldowns / daily caps** | Rules page | Yes | **Yes** — read from rules table | Fully controlled |
| **Package XP/Coin formulas** | No UI | No | **No** — hardcoded in Edge Function | Broken control |
| **Shop XP/Coin formulas** | No UI | No | **No** — hardcoded in Edge Function | Broken control |
| **Levels / XP thresholds** | Levels page | Yes | **Yes** — `checkLevelUp()` reads from DB | Fully controlled |
| **Level perks (JSONB)** | Levels page | Yes (raw) | Informational only — no runtime enforcement | Partially controlled |
| **Prestige criteria** | No UI | No | **Yes** — `check_prestige_eligibility` reads `prestige_criteria` table | DB-driven but no admin UI |
| **Level benefits** | No UI | No | Not enforced at runtime | No control |
| **Quests** | Quests page | Full CRUD | **Yes** — assignment reads templates | Fully controlled |
| **Badges** | Badges page | Full CRUD | **Yes** — unlock checks read from DB | Fully controlled |
| **Rewards** | Rewards page | Full CRUD | **Yes** — redemption reads from DB | Fully controlled |
| **Coupons** | Coupons page | Full CRUD | **Yes** — issuance reads templates | Fully controlled |
| **Shop Rules** | Shop Rules page | Full CRUD | **Yes** — separate shop_reward_rules table | Fully controlled |
| **Challenges** | Challenges page | Full CRUD | **Yes** — progress checks read from DB | Fully controlled |
| **Trainer tiers** | Trainers page | CRUD | Partial — tier definitions stored, scoring logic references DB | Partially controlled |
| **Referral points** | No UI | No | Reads from `member_referrals` columns, fallback 200 hardcoded | Partially controlled |
| **Manual ops (adjust XP/coin, grant badge)** | None | N/A | No capability exists | Missing |
| **Audit log** | Risk page | View only | Events auto-logged | View only (correct) |
| **Draft/Publish** | None | N/A | All edits go live immediately | Missing |
| **Economy guardrails UI** | None | N/A | Table exists but unused by logic | Broken |

### Summary Verdict

- **Fully controlled (8):** XP rules, cooldowns, levels, quests, badges, rewards, coupons, challenges
- **Broken control (2):** Package formulas, Shop formulas (guardrails table ignored)
- **Missing admin UI (3):** Prestige criteria, level benefits, economy guardrails
- **Missing capabilities (2):** Manual operations, draft/publish
- **No control (1):** Referral reward points (partially hardcoded)

---

## Implementation Plan

### Phase 1 — Fix the Critical Gap: Make Edge Function read from `economy_guardrails`

**`supabase/functions/gamification-process-event/index.ts`**

Replace hardcoded package/shop formulas (lines 435-448) with a function that reads `economy_guardrails` at runtime:

```text
async function getGuardrails(db) → fetches all active rules from economy_guardrails
  → builds map: { PACKAGE_XP_PER_300_THB: 1, PACKAGE_COIN_PER_180_THB: 1, ... }
  → uses these values in package_purchase and shop_purchase calculations
  → falls back to current hardcoded values if table read fails
```

This is the single most important fix — it makes 12 guardrail rules actually work.

### Phase 2 — Admin UI for Economy Guardrails

**New page: `src/pages/gamification/GamificationGuardrails.tsx`**

Table-based editor for `economy_guardrails` (rule_code, rule_value, description, is_active). Add as a new tab "Guardrails" in GamificationStudio.

**New hook: `src/hooks/useEconomyGuardrails.ts`** — CRUD for economy_guardrails table.

### Phase 3 — Admin Manual Operations Edge Function

**New Edge Function: `supabase/functions/gamification-admin-ops/index.ts`**

Supports actions:
- `adjust_xp` — add/subtract XP with reason, writes xp_ledger + audit
- `adjust_coin` — add/subtract coin with reason, writes points_ledger + audit
- `grant_badge` — insert badge_earnings + audit
- `revoke_badge` — delete badge_earnings + audit
- `issue_coupon` — calls existing coupon issuance logic

All require `level_3_manager` access. All write to `gamification_audit_log`.

**New admin UI: `src/pages/gamification/GamificationOperations.tsx`**

Simple form-based interface for each operation. Add as "Operations" tab in GamificationStudio.

### Phase 4 — Prestige Criteria Admin UI

**New page: `src/pages/gamification/GamificationPrestige.tsx`**

Displays `prestige_criteria` table for levels 18-20 with edit capability. Shows current criterion_code, target_value, and description. Add as sub-section within Levels page or as its own tab.

### Phase 5 — Validation Rules

Add to Edge Function and admin forms:
- XP/coin values must be ≥ 0
- Caps must be > 0
- Guardrail divisors (e.g., `PER_300_THB`) must be > 0
- Reward coin cost must be > 0
- Stock cannot go below 0

---

## Files to Create/Edit

| File | Action |
|------|--------|
| `supabase/functions/gamification-process-event/index.ts` | Read guardrails from DB instead of hardcoded values |
| `supabase/functions/gamification-admin-ops/index.ts` | New: manual operations Edge Function |
| `src/hooks/useEconomyGuardrails.ts` | New: CRUD hook for economy_guardrails |
| `src/pages/gamification/GamificationGuardrails.tsx` | New: guardrails admin page |
| `src/pages/gamification/GamificationOperations.tsx` | New: manual ops admin page |
| `src/pages/gamification/GamificationPrestige.tsx` | New: prestige criteria admin page |
| `src/pages/gamification/GamificationStudio.tsx` | Add 3 new tabs |
| `src/App.tsx` | Add routes for new pages |
| `supabase/config.toml` | Add `verify_jwt = false` for new Edge Function |

## Implementation Order

1. Fix Edge Function to read `economy_guardrails` (critical — makes existing data work)
2. Create guardrails admin page
3. Create admin ops Edge Function + page
4. Create prestige criteria admin page
5. Add validation rules

