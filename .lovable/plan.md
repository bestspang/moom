

# AI Foundation Layer: Tables, Hooks, and Dashboard Widget

## Overview

Create 4 database tables, a React Query hook, and a small Dashboard widget to lay the groundwork for future AI features — without touching any existing functionality.

---

## 1. Database Migration

### New Tables

| Table | Purpose |
|-------|---------|
| `ai_prompt_templates` | Versioned prompt storage |
| `ai_runs` | Audit log for every AI invocation (cost, latency, model) |
| `ai_suggestions` | Actionable AI outputs with approve/reject/apply workflow |
| `ai_policies` | Configurable AI behavior rules (rate limits, opt-outs, etc.) |

### New Enums
- `ai_suggestion_status`: `pending`, `approved`, `rejected`, `applied`
- `ai_policy_scope`: `global`, `location`, `role`, `user`
- `ai_run_status`: `pending`, `running`, `completed`, `failed`

### RLS Policies
- **ai_prompt_templates**: Staff can read, managers+ can manage
- **ai_runs**: Staff can read own runs, managers+ can read all, operators+ can insert
- **ai_suggestions**: All staff can read, operators+ can manage (approve/reject/apply)
- **ai_policies**: Staff can read, managers+ can manage

### Realtime
- Add `ai_suggestions` to `supabase_realtime` publication

### Indexes
- `ai_suggestions(status)` partial index on `pending`
- `ai_suggestions(entity_type, entity_id)`
- `ai_runs(actor_user_id, created_at DESC)`
- `ai_policies(key, scope)`

---

## 2. Update `src/lib/queryKeys.ts`

Add:
```typescript
aiSuggestions: (status?: string) => ['ai-suggestions', status] as const,
aiRuns: () => ['ai-runs'] as const,
```

---

## 3. Update `src/hooks/useRealtimeSync.ts`

Add `ai_suggestions` to the table-invalidation map:
```
ai_suggestions → ['ai-suggestions']
```

---

## 4. New File: `src/hooks/useAiSuggestions.ts`

Exports:
- `useAiSuggestions(status?, limit?)` — query pending suggestions
- `useApproveSuggestion()` — mutation
- `useRejectSuggestion()` — mutation
- `useApplySuggestion()` — mutation
- `AiSuggestion` type

All use `queryKeys.aiSuggestions()` and invalidate on success.

---

## 5. New File: `src/components/dashboard/AiSuggestionsCard.tsx`

Small card for Dashboard right sidebar showing:
- Title: "AI Suggestions" with a sparkle icon
- Top 3 pending suggestions
- Each row: suggestion type badge + entity type + approve/reject buttons
- Empty state when no pending suggestions
- Loading skeleton

---

## 6. Update `src/pages/Dashboard.tsx`

Import and render `AiSuggestionsCard` in the right sidebar (after "Upcoming Birthdays" card).

---

## 7. i18n Keys

**English (`en.ts`)** — add `ai` section:
```
ai: {
  suggestions: 'AI Suggestions',
  noSuggestions: 'No pending suggestions',
  approve: 'Approve',
  reject: 'Reject',
  suggestionApproved: 'Suggestion approved',
  suggestionRejected: 'Suggestion rejected',
  suggestionApplied: 'Suggestion applied',
  suggestionError: 'Failed to update suggestion',
  confidence: 'Confidence',
}
```

**Thai (`th.ts`)** — matching translations.

---

## Files Summary

| Action | File |
|--------|------|
| Migration | New SQL: 4 tables, 3 enums, RLS, indexes, realtime, triggers |
| Modify | `src/lib/queryKeys.ts` — add AI keys |
| Modify | `src/hooks/useRealtimeSync.ts` — add `ai_suggestions` |
| Create | `src/hooks/useAiSuggestions.ts` |
| Create | `src/components/dashboard/AiSuggestionsCard.tsx` |
| Modify | `src/pages/Dashboard.tsx` — add widget |
| Modify | `src/i18n/locales/en.ts` — add AI translations |
| Modify | `src/i18n/locales/th.ts` — add AI translations |

No existing behavior changed. Tables start empty. Widget shows empty state until suggestions are inserted.

