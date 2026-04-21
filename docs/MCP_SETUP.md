# MCP Setup — Claude Code + MOOM

This repo has three MCP servers wired into `.mcp.json` at the project root. They auto-start when you open the repo in Claude Code.

| Server | Purpose | Credentials | Scope |
|--------|---------|-------------|-------|
| `supabase` | Query DB, debug RLS, view migrations, regen types (read-only) | `SUPABASE_ACCESS_TOKEN` | Pinned to project `qedxqilmnkbjncpnopty` |
| `sequential-thinking` | Structured step-by-step reasoning for complex tasks | — | Local, no I/O |
| `context7` | Fetch up-to-date library docs (TanStack Query, Radix, date-fns, Supabase, …) | Optional `CONTEXT7_API_KEY` | Shared free tier by default |

Only `supabase` requires setup.

---

## 1. Generate a Supabase Personal Access Token

**Step-by-step:**

1. Sign in to the Supabase dashboard: https://supabase.com/dashboard
2. Open **Account → Access Tokens**: https://supabase.com/dashboard/account/tokens
3. Click **Generate new token**
4. Name the token so Future You can identify it — recommended format:
   ```
   MOOM MCP — Claude Code — <your-machine-name> — <YYYY-MM>
   ```
   Example: `MOOM MCP — Claude Code — best-mbp — 2026-04`
5. Click **Generate token**. **Copy it immediately** — Supabase shows it exactly once, then only the prefix is visible.
6. Add it to your local env file:
   ```sh
   cp .env.example .env.local      # if you haven't already
   # edit .env.local and replace the placeholder
   # SUPABASE_ACCESS_TOKEN=sbp_<your_token>
   ```
7. Restart Claude Code so it picks up the new env var.

**Security posture built into `.mcp.json`:**
- `--read-only` — blocks all write SQL and `apply_migration`. Schema writes still go through Lovable auto-gen.
- `--project-ref=qedxqilmnkbjncpnopty` — locks queries to the MOOM project. Even if the token has access to other Supabase projects on your account, the MCP server will refuse them.
- `--features=database,docs,debug` — disables `account` (billing), `storage` (buckets), `functions` (edge-fn deploy). Re-enable explicitly if a specific task needs them.

**Why not service role?** Service role bypasses RLS. The MCP should behave as a realistic staff operator, not as a god user — use a PAT tied to your account and rely on `has_min_access_level()` / RLS to model real permissions.

---

## 2. Verify the connection

In Claude Code, type `/mcp` to open the MCP panel. You should see:

```
supabase              connected     N tools
sequential-thinking   connected     1 tool
context7              connected     N tools
```

If `supabase` shows `failed` or `disconnected`:
- Check that `SUPABASE_ACCESS_TOKEN` is set in `.env.local` and Claude Code was restarted after editing.
- Run `echo $SUPABASE_ACCESS_TOKEN` in the same shell Claude Code inherits from — should print `sbp_...`, not blank.
- Confirm the token hasn't been revoked (dashboard → Access Tokens → check "Last used").

**Smoke tests:**

| MCP | Ask Claude | Expected |
|-----|-----------|----------|
| supabase | "List the tables in this Supabase project" | Lists ~27+ tables (`members`, `staff`, `user_roles`, `schedule`, …) |
| supabase | "Show me the RLS policies on the `transfer_slips` table" | Returns existing policies |
| context7 | "Get the TanStack Query v5 docs for useMutation" | Returns recent API docs, not cached/outdated |
| sequential-thinking | "Use sequential thinking to design an RLS policy for a new `class_waitlist` table" | Invokes the `sequentialthinking` tool with step-by-step reasoning |

---

## 3. Token rotation checklist (every 90 days)

Supabase PATs don't auto-expire — you rotate manually. Set a calendar reminder for **90 days** after generation.

**Rotation procedure (no-downtime):**

1. **Generate the new token first** — steps 1–5 above, with a new name suffix (e.g. `2026-07`).
2. **Update `.env.local`** with the new token — DO NOT delete the old one yet.
3. **Restart Claude Code** and run `/mcp` — confirm `supabase` shows `connected`.
4. **Smoke test** with a read query (see the table above).
5. **Now revoke the old token:** dashboard → Access Tokens → find the previous entry → Revoke.
6. **Verify revocation took effect:** the "Last used" column should stop updating for the old token within ~1 minute.

**Records to keep:**
- The token name on the dashboard doubles as an audit trail. Don't edit/reuse old names — always add a new-dated one.
- If you rotate because the 90-day clock hit, note it in `docs/DEVLOG.md` (optional but helpful for team audits).

---

## 4. If a token leaks

**Immediately:**

1. **Revoke.** https://supabase.com/dashboard/account/tokens → find the leaked token → **Revoke**. This takes effect in ~1 minute; any open MCP sessions using it will start failing.
2. **Generate a replacement** and update `.env.local`.
3. **Restart Claude Code.**

**Then, audit for abuse:**

4. **Check Supabase logs** for unexpected queries:
   - Dashboard → Logs → API / Postgres / Auth logs, filtered by timestamps since the leak window.
   - Dashboard → Logs → Edge Function logs for any unexpected invocations.
   - Look for queries to sensitive tables: `members`, `transactions`, `member_billing`, `identity_map`, `user_roles`.
5. **Check for schema changes** — even though `.mcp.json` uses `--read-only`, if the leaked token was used outside MCP (e.g. in a script without the flag), it could have `apply_migration` access:
   ```sh
   git log -- supabase/migrations/ --since="<leak date>"
   ```
   Compare against expected migrations. Anything unfamiliar → investigate.
6. **Rotate ANY other secret** that may have been exposed alongside the token (check clipboard history, browser history, screenshots, chat logs). Specifically consider: Stripe secret, LINE channel secret, service-role key — they live in Supabase Edge Function secrets, but if the leak vector also touched that surface, rotate them via Supabase dashboard → Edge Functions → Secrets.

**Post-mortem:**

7. How did it leak? (committed to git? pasted into chat? screenshot? shared over Slack?)
8. What guardrails prevent recurrence? (pre-commit hook for `sbp_` patterns? secrets scanner? editor plugin?)
9. Log the incident in `docs/DEVLOG.md` with the timestamp, scope, and remediation steps taken.

---

## 5. Adding more MCP servers later

### GitHub (remote, OAuth-based) — if you want structured PR/issue tooling

Claude Code supports remote MCP over HTTP. To add GitHub's official remote MCP with OAuth (no PAT to manage locally):

```jsonc
// Add under "mcpServers" in .mcp.json
"github": {
  "type": "http",
  "url": "https://api.githubcopilot.com/mcp/"
}
```

On first use, Claude Code opens a browser for GitHub OAuth. Token is stored by Claude Code, not in this repo. Revoke via https://github.com/settings/applications.

> You already have the `gh` CLI available via Bash — GitHub MCP is only worth adding if you want Claude to read/write PR review comments as structured tool calls instead of parsing `gh api` JSON.

### Anything else

Before adding a new MCP, ask:
1. Does Claude Code already have this capability via a built-in tool (Read/Write/Edit/Grep/Glob/Bash)? If yes, skip — less attack surface.
2. What credentials does it need, and what's their blast radius if leaked?
3. Can it be scoped down (read-only flags, project/org scoping)?
4. Update **this doc** + `.env.example` when you add it.
