# Codex + Lovable Shared Main Workflow

MOOM uses `main` as the shared trunk between Codex and Lovable.
Codex commits directly to `main`, Lovable pulls those changes automatically, and
Lovable can commit generated changes back to `main`.

## Start Of Every Codex Round

1. Run `git pull --rebase --autostash origin main`.
2. Run `git status -sb`.
3. Inspect recent Lovable changes before editing overlapping files.
4. Keep each commit focused on one feature, fix, or checkpoint.

## Ownership Boundaries

- Lovable owns Cloud, Auth, AI, secrets, publish/preview behavior, Supabase schema generation, and generated integration files.
- Codex owns React/TypeScript behavior, hooks, tests, CI, lint/build fixes, and targeted Edge Function fixes.
- Do not hand-edit `src/integrations/supabase/*`, `src/integrations/lovable/*`, or `.env`.
- Prefer Lovable/Supabase workflows for simple schema and RLS changes.
- Hand-authored migrations are only for explicit RPC, policy, or data backfill changes that need code review.

## Before Pushing Main

Run the local quality gate:

```bash
bun install --frozen-lockfile
bun run build
bun run test
bun run lint
node scripts/compare-i18n.mjs
```

If Lovable commits to `main` after Codex pushes, pull again before the next edit.

## Lovable References

- GitHub sync: https://docs.lovable.dev/integrations/github
- Supabase integration: https://docs.lovable.dev/integrations/supabase
- Lovable Cloud: https://docs.lovable.dev/integrations/cloud
- Lovable AI: https://docs.lovable.dev/integrations/ai
- Publish flow: https://docs.lovable.dev/features/publish
