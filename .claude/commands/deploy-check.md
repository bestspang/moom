---
description: Run lint + build + tests in parallel and block on any failure before deploy
---

You are running the pre-deploy gate for MOOM. Lovable auto-deploys on push — this check catches issues BEFORE the push.

## Step 1 — Run all three checks in parallel

Launch in a single tool message (three parallel Bash calls), each `run_in_background: true` so we can stream them:

- `bun run lint`
- `bun run build`  (this is also the de-facto typecheck — no separate `tsc --noEmit` in this repo)
- `bun run test`

Use `Monitor` or poll the background processes until they exit.

## Step 2 — Collect results

For each check, capture:
- Exit code
- First 30 lines of stderr on failure
- For `bun run build` failures: look for `error TS` lines (type errors) vs Vite bundling errors — they need different fixes.
- For `bun run test` failures: capture the failing test name and file.

## Step 3 — Report

Produce a compact status table:

```
lint   : ✅ pass  (or ❌ fail — N problems)
build  : ✅ pass  (or ❌ fail — first error)
tests  : ✅ pass  (or ❌ fail — N failing in <file>)
```

## Step 4 — Gate

- **All three pass** → tell the user deploy is safe. Remind them: Lovable auto-deploys on push to `main`, so merging the PR is the deploy trigger.
- **Any fail** → BLOCK. Do not suggest `--no-verify`, do not suggest skipping the check. Offer to investigate the specific failure (offer `/fix-bug` or direct triage).

## Step 5 — Optional extras (only if user asks)

- `git status` — confirm the working tree is clean before deploy
- `git log main..HEAD --oneline` — show what's about to ship
- Supabase edge-function sanity: `ls supabase/functions/` — changes here deploy on push too; there's no separate deploy step.
