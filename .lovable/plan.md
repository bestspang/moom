

# Gamification System — Full Consistency Audit & Fix Plan

## Issues Found (verified against actual code + DB schema)

### 1. BUG: CheckInCelebration shows zero challenges (CONFIRMED)
**File**: `src/apps/member/features/momentum/CheckInCelebration.tsx` line 84
**Root cause**: Filters `c.status === 'active'` but the DB enum `challenge_progress_status` only has values: `'in_progress' | 'completed' | 'failed' | 'expired'`. The value `'active'` never exists.
**Impact**: After check-in, the celebration dialog never shows challenge progress — even if the member has active challenges.
**Fix**: Change `'active'` → `'in_progress'`

### 2. Dark mode missing gamification CSS vars
**File**: `src/index.css` lines 129-157
**Root cause**: The `.dark` block does not define `--momentum-flame`, `--tier-*`, `--rarity-*`, `--xp-bar*` variables. Currently falls through to `:root` values, which technically works but may have poor contrast on dark backgrounds.
**Impact**: Low — most users likely on light mode. But for completeness, should add dark-mode-appropriate gamification tokens.
**Fix**: Add gamification CSS vars to `.dark` block with adjusted values for dark backgrounds.

### 3. No issues found (verified correct)
- **Routes**: `/member/momentum` is registered in `App.tsx` ✅
- **MomentumCard** fallback: Shows starter profile when no DB row ✅
- **Badge gallery**: Horizontal scroll + rarity labels ✅
- **Leaderboard/Squad quick links**: Present in both MomentumCard and Momentum Hub ✅
- **DailyBonusCard**: On both home page and momentum page ✅
- **LevelRequirementsCard**: Present in Level tab ✅
- **QuestCard**: Days left badge + XP/RP rewards shown ✅
- **CSS animations**: `animate-flame-flicker`, `animate-pulse-glow`, `animate-bounce-in` defined in `@layer utilities` ✅
- **CSS vars**: `--xp-bar`, `--momentum-flame`, `--rarity-*`, `--tier-*` all defined in `:root` ✅
- **Bottom nav**: Check-In centered, 5 tabs correct ✅
- **MemberMomentumPage**: 3 tabs (Level/Quests/Rewards) with hero XP display ✅
- **Join challenge mutation**: Correctly inserts with `status: 'in_progress'` ✅
- **API functions** (`api.ts`): All match DB schema correctly ✅
- **Types** (`types.ts`): `MomentumTier` uses `'dedicated'` matching CSS var `--tier-dedicated` ✅

## Implementation Plan

### Step 1: Fix CheckInCelebration challenge filter (surgical, 1 line)
- `CheckInCelebration.tsx` line 84: `'active'` → `'in_progress'`
- Zero risk — fixes a broken filter

### Step 2: Add dark mode gamification CSS vars
- `index.css`: Add `--momentum-flame`, `--tier-*`, `--rarity-*`, `--xp-bar*`, `--coach-*`, `--partner-*` to `.dark` block
- Pure additive — only affects dark mode appearance

### Files to modify
- `src/apps/member/features/momentum/CheckInCelebration.tsx` (1 line fix)
- `src/index.css` (add ~20 lines to `.dark` block)

### Risk: Near-zero
- Fix #1: Corrects a filter that was silently broken — no behavior change for anything working today
- Fix #2: Purely additive CSS vars in `.dark` — does not affect light mode

