---
description: Review unstaged changes, commit them as logical chunks, push, and open a PR
---

You are preparing a pull request from the current branch.

## Step 1 — Survey

Run in parallel:
- `git status` (no `-uall`)
- `git diff` (unstaged + staged)
- `git log main..HEAD --oneline` (commits already on this branch)
- `git rev-parse --abbrev-ref HEAD` (current branch)

If current branch is `main`, STOP and ask the user for a branch name — never open a PR from main.

## Step 2 — Sanity-check before grouping

- Do NOT stage auto-generated files: `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`.
- Do NOT stage secrets or credentials. `.env` IS committed in this repo (anon key only) — fine to include if changed.
- Do NOT include `package-lock.json` (gitignored). Bun's `bun.lock` / `bun.lockb` are the real lockfiles.
- Flag anything that looks like a stray debug log, `console.log`, or commented-out block before commit.

## Step 3 — Group into logical chunks

Look at the diff and propose a commit plan: one commit per self-contained concern. Show the user the proposed chunks before committing. Typical split:
- DB migration (if any) → its own commit
- Hook + query key wiring → one commit
- UI (page, components, i18n keys in both locales) → one commit
- Edge function changes → own commit
- Tests + doc updates → own commit

Small PRs can be a single commit. Don't split just to split.

## Step 4 — Commit (free-form imperative, capitalized first word)

**Message style for this repo** (matches `git log` — NOT Conventional Commits):
- "Add live activity feed"
- "Fix package purchase flow: sell-package edge function + activate on sale"
- "Refactor package sales to server-side Deno function"

Avoid placeholders (`wip`, `updates`, `asdf`). Keep the subject ≤70 chars; use the body for details.

For each chunk:
1. `git add <specific files>` (never `git add -A` / `git add .` — risks pulling in secrets or auto-gen files)
2. Commit with a HEREDOC to keep formatting clean:
   ```sh
   git commit -m "$(cat <<'EOF'
   <subject>

   <body — why, not what>

   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   EOF
   )"
   ```
3. Run `git status` to confirm the chunk landed.

## Step 5 — Push

- If the branch doesn't track a remote: `git push -u origin <branch>`
- Otherwise: `git push`
- Never force-push without explicit user consent.

## Step 6 — Open the PR

Use `gh pr create` with a HEREDOC body:

```sh
gh pr create --title "<≤70 char subject>" --body "$(cat <<'EOF'
## Summary
- <1–3 bullets — what changed and why>

## Surfaces touched
- [ ] admin / [ ] member / [ ] trainer / [ ] staff

## DB / Edge function changes
- <migration filenames, edge functions, new RLS policies — or "none">

## Test plan
- [ ] `bun run lint`
- [ ] `bun run build`
- [ ] `bun run test`
- [ ] Manual smoke: <steps on the affected surface>
- [ ] i18n: EN and TH both checked
EOF
)"
```

Return the PR URL.

## Step 7 — Follow-ups

Remind the user of anything deferred: `docs/DEVLOG.md` entry, `docs/SMOKE_TEST.md` update, or a table that still needs to be added to `TABLE_INVALIDATION_MAP`.
