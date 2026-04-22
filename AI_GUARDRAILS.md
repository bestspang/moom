# 🛡️ AI Guardrails — Mandatory Pre-Edit Checklist

> **READ THIS FIRST.** Every AI session that intends to modify code in this repository **MUST** follow this checklist before writing a single line. Violating these rules has historically caused regressions that took multiple loops to repair.

---

## Why this exists

This codebase has been touched by many AI sessions. The dominant failure pattern is:

> **AI walks into a working file, "improves" something adjacent to the actual task, and breaks a feature that was working five minutes ago.**

These guardrails are designed to make that pattern **physically harder** to execute.

---

## The 7 Rules (in order)

### 1. Read the target file in full — never guess from memory
- Use `code--view` on the **entire file** before proposing any edit.
- Do not rely on a summary, on a previous session's recollection, or on the file name alone.
- If the file is >500 lines, read it in segments — but read every segment that touches your change.

### 2. Identify blast radius before editing
- Before changing a function/component/hook/type, run `code--search_files` to find every importer and caller.
- A "1-line fix" that changes a function signature is **not** a 1-line fix — it is N call-sites × test surface.
- If the blast radius is larger than expected, **stop and report** instead of silently rewriting callers.

### 3. Classify each touched area: WORKING / PARTIAL / BROKEN / GHOST
- **WORKING** — feature works as designed → **DO NOT TOUCH** even if you'd write it differently.
- **PARTIAL** — works but missing a piece the user asked for → patch the missing piece only.
- **BROKEN** — fails the user's stated bug → fix root cause, minimal diff.
- **GHOST** — dead code (no callers) → leave it; mention it; do not delete unless the task is "remove dead code".

### 4. Minimal, surgical diffs only
- Every changed line must trace directly to the user's request.
- No drive-by reformatting, no comment cleanup, no import reordering, no rename "while I'm here".
- If you find yourself touching >3 files for a 1-feature task, **stop and re-read the task**.

### 5. Do not touch fields, props, or imports outside scope
- If the task is "fix the button label", do not also change the `onClick` handler, the query key, or the type signature.
- If you must change a shared type, **announce it first** — that is a contract change, not a UI tweak.

### 6. Check `PROTECTED_FILES.md` before every write
- If the file you're about to edit is on that list → **STOP**. Either:
  - (a) The user explicitly named that file → proceed with extra care.
  - (b) The user did not name it → ask for approval before touching it.

### 7. Verify after editing — feature still works
- Run `bun run build` (catches type/import errors).
- Manually trace the unrelated features in the file you touched: did imports stay valid? Did existing props still flow?
- If you changed an i18n key in EN, you **must** add the same key to TH (and vice versa) — run `node scripts/compare-i18n.mjs` to confirm parity.

---

## Common AI Anti-Patterns (do not do these)

| ❌ Anti-pattern | ✅ Correct behavior |
|---|---|
| "I see this could be cleaner, let me refactor" | Touch only what the task says. Refactor is a separate, named task. |
| "I'll regenerate the whole file" | Use `code--line_replace` on the specific section. |
| "I'll add a new utility instead of finding the existing one" | Search first (`code--search_files`). Reuse existing utilities. |
| Changing a working function signature to add a feature | Add a new optional parameter, or a new sibling function. Preserve the old shape. |
| Removing a chip / card / button "because it looks redundant" | The user did not ask for removal. Leave it. |
| Editing `src/integrations/supabase/types.ts` | **Never.** It is auto-generated from the live DB schema. |
| Editing `src/components/ui/*` (shadcn) | **Never.** Wrap in a new component instead. |
| Touching an already-deployed migration file | **Never.** Write a new reverse migration. |
| Adding `// TODO` or stub UI for a button | All buttons on live surfaces must be wired. Use `opacity-60 pointer-events-none` for "Coming Soon". |

---

## When in doubt

Ask. A 30-second clarifying question is cheaper than a 30-minute repair loop.

---

## Enforcement

This file is referenced from `CLAUDE.md` Section 9 as a **MUST READ every session** document. The smoke test in `docs/SMOKE_TEST.md` includes an **AI Change Verification Gate** that explicitly checks compliance with these rules before a change is marked done.

See also: [`PROTECTED_FILES.md`](./PROTECTED_FILES.md) for the explicit do-not-touch list.
