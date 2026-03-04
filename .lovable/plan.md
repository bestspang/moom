

# AI Actions Layer

## Overview

Create a new `src/ai/` module with typed action functions and a stub AI service. These are pure TypeScript modules — no UI changes, no database changes. The app compiles identically; this just provides a callable foundation for future AI integration.

---

## 1. New File: `src/ai/actions/index.ts`

Three typed action functions that fetch structured context data from existing Supabase queries. Each uses Zod for input validation and returns minimal, safe data (no secrets).

- **`getDashboardContext(date: Date)`** — Returns today's check-in count, class count, and top risk members. Reuses queries from `useDashboardStats`.
- **`getScheduleContext(date: Date, locationId?: string)`** — Returns schedule items for a date/location. Reuses `schedule` table query pattern.
- **`getMemberContext(memberId: string)`** — Returns member profile + active packages. Reuses `members` + `member_packages` query pattern.

Each function:
- Validates input with Zod
- Calls Supabase directly (server-side ready)
- Throws typed errors on invalid input or missing auth
- Returns a plain object (no React hooks)

RBAC: Each action accepts a `userId` param and calls `has_min_access_level` RPC or checks locally. Dashboard/Schedule require `level_1_minimum`, Member requires `level_2_operator`.

## 2. New File: `src/ai/aiService.ts`

Stub interface + implementation:

```typescript
interface AiService {
  runPrompt(templateName: string, input: Record<string, unknown>): Promise<unknown>;
  logRun(meta: AiRunMeta): Promise<void>;
}
```

- `runPrompt` — returns `{ stub: true, templateName, input }` for now
- `logRun` — inserts into `ai_runs` table (or no-ops in stub mode)

## 3. New File: `src/ai/types.ts`

Shared types: `DashboardContext`, `ScheduleContext`, `MemberContext`, `AiRunMeta`.

---

## Files Summary

| Action | File |
|--------|------|
| Create | `src/ai/types.ts` — shared AI context types |
| Create | `src/ai/actions/index.ts` — 3 typed action functions with Zod + RBAC |
| Create | `src/ai/aiService.ts` — stub AI service interface |

No existing files modified. No database changes. No UI changes. App compiles with zero behavior difference.

