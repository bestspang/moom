

# UX/UI Audit: Gamification Studio Module

## Scope
Full UX/UI review of the Gamification Studio (8 tabs) — copy, colors, flow, consistency, mobile responsiveness, i18n, and functional completeness.

---

## Issues Found (Prioritized)

### A. Hardcoded English in Dialogs & Forms (i18n violation — HIGH)

All 4 CRUD dialogs have **hardcoded English labels** instead of i18n keys. This breaks the bilingual contract.

**Files affected:**
- `CreateChallengeDialog.tsx`: "Name (EN) *", "Name (TH)", "Description (EN)", "Description (TH)", "Type", "Goal Type", "Action Count", "XP Threshold", "Class Count", "Streak", "Goal Value", "Goal Action Key", "e.g. check_in", "Reward XP", "Reward Points", "Reward Badge", "None", "Start Date *", "End Date *"
- `CreateBadgeDialog.tsx`: "Name (EN) *", "Name (TH)", "Description (EN)", "Description (TH)", "Tier", "Display Priority", "Bronze/Silver/Gold/Platinum"
- `CreateRewardDialog.tsx`: "Name (EN) *", "Name (TH)", "Description (EN)", "Description (TH)", "Category", "Perk/Merch/Access/Package Booster/Event Access", "Points Cost *", "Level Required", "Unlimited Stock", "Total units"
- `CreateTrainerTierDialog.tsx`: "Trainer Type", "In-House/Freelance", "Tier Name (EN) *", "Tier Name (TH)", "Min Score", "Sort Order", "Add Tier" (in Trainers page too)
- `GamificationRules.tsx` dialog: "Label (EN)", "Label (TH)", "e.g. check_in"
- `GamificationLevels.tsx` dialog: "Level #", "Name (EN)", "Name (TH)", "XP Required"

**Fix:** Add ~40 i18n keys to EN/TH and replace all hardcoded strings.

### B. Rewards Page — Edit Button Not Accessible on Mobile (HIGH)

Edit buttons use `opacity-0 group-hover:opacity-100` — this is invisible on touch devices. Affects: Challenges, Badges, Rewards, Levels, Trainers.

**Fix:** On mobile, always show edit buttons (or use a tap-to-reveal pattern). Use `opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100` with `opacity-100` on mobile as default.

### C. Overview — Duplicate Icons & Weak Information Hierarchy (MEDIUM)

- `Gift` icon is used for both "Total Badges" and "Active Rewards" — visually confusing.
- 6 stat cards in a single row on desktop is dense but acceptable; on `grid-cols-2` mobile some cards have long titles that may wrap oddly.
- No color differentiation between cards — all look the same. The original spec calls for meaningful colors (participation, rewards, risk).

**Fix:** 
- Use `Award` for badges (already used elsewhere), keep `Gift` for rewards.
- Add color props to StatCards: teal for positive metrics, orange for flagged.

### D. Challenges — Status Badge Shows Raw DB Value (MEDIUM)

`<StatusBadge>{c.status}</StatusBadge>` shows "draft", "active", "ended" in lowercase English regardless of language. Should use translated labels.

**Fix:** Map status to translated label: `statusLabelMap[c.status]` using i18n keys.

### E. Rewards — Category Label Shows Raw DB Value (MEDIUM)

`reward.category.replace('_', ' ')` shows "package booster" in lowercase. Not localized.

**Fix:** Create a category label map with i18n keys.

### F. Risk & Audit — Audit Log Shows Raw `event_type` (LOW-MEDIUM)

`entry.event_type` displays raw DB values like "xp_earned" or "points_redeemed". Not user-friendly for managers.

**Fix:** Create a human-readable event type map with i18n.

### G. Trainers — "Add Tier" Button is Hardcoded English (MEDIUM)

Line 30 of GamificationTrainers.tsx: `<Button>Add Tier</Button>` — not using i18n.

### H. Dialog Forms — No Field Grouping or Section Headers (LOW-MEDIUM)

Challenge dialog has 15+ fields in a flat list. It's functional but overwhelming. Consider grouping into sections: "Basic Info", "Goal Configuration", "Rewards", "Schedule".

**Fix:** Add lightweight section headers (`<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">`) to break up the form visually.

### I. Levels — Color Picker UX is Minimal (LOW)

A raw `<input type="color">` doesn't match the premium design system. It's functional but looks out of place.

**Fix:** Replace with a preset color palette (8-10 curated colors) plus optional custom input. This matches the "manager-friendly" goal.

### J. Overview — "System Status" Card Duplicates StatCard Info (LOW)

The "System Status" card shows "Active Rules: X / Y", "Active Challenges: X / Y" — the same numbers already shown in the stat cards above. This is redundant.

**Fix:** Replace "System Status" with something more useful: e.g., "Quick Actions" (links to create rule, create challenge) or remove it and use the space for a chart placeholder.

### K. Badges — Description Can Be Empty/Null (LOW)

Badge cards show `description_en` which can be null, resulting in empty space. Should show a fallback.

### L. Tab Navigation — 8 Tabs May Overflow on Tablet (LOW)

The tab bar has 8 items. On tablet widths (~768-1024px), this may cause horizontal scroll. The `ScrollArea` handles it, but users may not notice the scroll indicator.

**Fix:** Already handled by `ScrollArea` + `ScrollBar`. Acceptable.

---

## Implementation Plan

### Task 1: Fix all hardcoded English in dialogs (i18n)
- Add ~40 new i18n keys under `gamification.form.*` in both `en.ts` and `th.ts`
- Update all 4 dialog components + Rules/Levels inline dialogs

### Task 2: Fix mobile accessibility for edit buttons
- Update hover-only opacity pattern in: GamificationChallenges, GamificationBadges, GamificationRewards, GamificationLevels, GamificationTrainers
- Make edit buttons always visible on mobile (small touch target otherwise)

### Task 3: Fix visual/UX issues in Overview
- Change Badge StatCard icon from `Gift` to `Award`
- Add meaningful color props to StatCards
- Replace "System Status" with "Quick Actions" or a more useful summary

### Task 4: Fix raw DB values shown to users
- Challenges: Map status to translated label
- Rewards: Map category to translated label
- Risk: Map event_type to human-readable label

### Task 5: Add section headers to Challenge dialog
- Group fields into logical sections for readability

### Task 6: Minor polish
- Badge null description fallback
- Trainers "Add Tier" → i18n
- Levels color picker → preset palette (optional, lower priority)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/i18n/locales/en.ts` | Add ~40 gamification form keys |
| `src/i18n/locales/th.ts` | Add ~40 gamification form keys |
| `src/components/gamification/CreateChallengeDialog.tsx` | i18n labels, section headers |
| `src/components/gamification/CreateBadgeDialog.tsx` | i18n labels |
| `src/components/gamification/CreateRewardDialog.tsx` | i18n labels |
| `src/components/gamification/CreateTrainerTierDialog.tsx` | i18n labels |
| `src/pages/gamification/GamificationOverview.tsx` | Fix icon, add colors, improve System Status |
| `src/pages/gamification/GamificationChallenges.tsx` | Translated status labels, mobile edit button |
| `src/pages/gamification/GamificationBadges.tsx` | Mobile edit button, null description fallback |
| `src/pages/gamification/GamificationRewards.tsx` | Translated category, mobile edit button |
| `src/pages/gamification/GamificationLevels.tsx` | Mobile edit button, i18n in dialog |
| `src/pages/gamification/GamificationTrainers.tsx` | "Add Tier" i18n, mobile edit button |
| `src/pages/gamification/GamificationRules.tsx` | i18n in dialog labels |
| `src/pages/gamification/GamificationRisk.tsx` | Human-readable event types |

**No structural/architectural changes. No new files. No DB changes. Surgical UX fixes only.**

