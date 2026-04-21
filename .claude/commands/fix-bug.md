---
description: Diagnose a bug, propose a minimal fix, implement, and run the relevant test
argument-hint: [error message or symptom — optional]
---

You are debugging an issue in the MOOM codebase.

## Step 1 — Capture the symptom

If `$ARGUMENTS` is empty, ask the user in one `AskUserQuestion`:
- What did you do, what did you expect, what happened?
- Error message / stack trace (paste if available)?
- Which surface (admin / member / trainer / staff) and route?

If `$ARGUMENTS` is provided, treat it as the symptom and proceed.

## Step 2 — Locate

- Grep the codebase for the error string, component name, or hook name mentioned.
- Read the actual failing file(s) — don't trust the stack trace alone. Line numbers shift.
- Trace the data flow: UI page → `src/hooks/use*.ts` → Supabase query/RPC → table. For edge-function failures, read `supabase/functions/<name>/index.ts`.
- If it's a data/RLS issue, check whether the table has policies that match the caller's `access_level` — misdiagnosed "500s" are often RLS denies.

## Step 3 — Hypothesize, then report

Before editing, tell the user:
- The root cause in one sentence
- The minimal change that fixes it (file + lines)
- Any blast-radius concerns (other callers, RLS, realtime invalidation)

Then proceed (auto mode) or wait (plan mode).

## Step 4 — Implement

- **Smallest possible diff.** Don't refactor unrelated code. Don't "improve" nearby code.
- If the fix is a DB mutation path: make sure `logActivity()` still fires in `onSuccess` (hard rule), and that the query key being invalidated is the one declared in `src/lib/queryKeys.ts`.
- If the fix touches an edge function: keep the response envelope `{ data, error }` + one of the canonical error codes (`VALIDATION_ERROR | NOT_FOUND | FORBIDDEN | CONFLICT | INTERNAL`).
- If the fix touches `src/components/ui/*`, `src/contexts/AuthContext.tsx`, or `src/apps/shared/hostname.ts` — STOP and ask first (do-not-touch / approval-required list).

## Step 5 — Verify

- If a relevant test file exists next to the source: `bunx vitest run <path>` and confirm green.
- If no test exists and the fix is non-trivial logic in `src/lib/*`: add a small regression test (`*.test.ts` next to the source).
- `bun run build` — confirms no TS regressions (there's no separate typecheck).
- If UI work: launch `bun run dev` and reproduce the original scenario to confirm the fix.

## Step 6 — Summarize

Report: root cause, files changed, test added (if any), remaining risks / follow-ups.
