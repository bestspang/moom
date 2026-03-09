

# Fix Frontend Tier/Level System to Match v1 Economy Spec

## Problem (Critical — All XP/Level UI is wrong)

The frontend hardcodes XP and tier logic that **contradicts the v1 database spec**:

| What | Frontend (wrong) | DB v1 (correct) |
|------|------------------|-----------------|
| `xpForLevel(5)` | `2500` (n²×100) | `660` |
| `xpForLevel(10)` | `10000` | `2360` |
| `xpForLevel(20)` | `40000` | `8760` |
| Tier names | starter/regular/dedicated/elite/champion/legend | starter/mover/strong/elite/legend |
| Tier thresholds | 1/10/20/30/40/50 | 1/4/7/11/15 |

**Impact**: XP progress bars, level-up requirements, tier badges, and tier colors are all displaying incorrect data.

The Edge Function (backend) correctly reads from `gamification_levels` table — only the frontend is wrong.

## Fix — 2 files changed, 1 CSS update

### 1. `src/apps/member/features/momentum/types.ts`

- Change `MomentumTier` type: `'starter' | 'mover' | 'strong' | 'elite' | 'legend'`
- Update `TIER_CONFIG` with correct names/minLevels: starter(1), mover(4), strong(7), elite(11), legend(15)
- Replace `xpForLevel()` hardcoded formula with a **lookup table** matching the 20 DB levels (0, 120, 260, 440, 660, 920, 1220, 1560, 1940, 2360, 2820, 3320, 3860, 4440, 5060, 5720, 6420, 7160, 7940, 8760)
- Update `tierFromLevel()` to use correct thresholds (≥15 legend, ≥11 elite, ≥7 strong, ≥4 mover, else starter)

### 2. `src/index.css`

- Rename CSS variables: `--tier-regular` → `--tier-mover`, `--tier-dedicated` → `--tier-strong`
- Remove `--tier-champion` (no longer exists)
- Keep `--tier-starter`, `--tier-elite`, `--tier-legend`

### 3. No other file changes needed

All consumers (`TierBadge`, `XPProgressBar`, `LevelRequirementsCard`, `MomentumCard`, `RewardDropCard`, `api.ts`) import from `types.ts` — they'll automatically use the corrected values.

## Verification

- XP progress bar: at level 1 with 100 XP → shows 100/120 (not 100/100)
- Tier badge: level 5 → shows "Mover" (not "Starter")
- Level requirements: next level XP matches DB exactly

