

# Phase 3 & 4 Implementation Plan

## What's Already Done (Phase 1 + 2a)
- ✅ BusinessHealthCard on Dashboard
- ✅ RevenueForecastCard with bar chart
- ✅ Insights Hub page with tabs (Overview/Revenue/Members/Classes/Packages)
- ✅ DailyBriefingCard with AI edge function
- ✅ NeedsAttentionCard with expiring packages, high-risk members, hot leads, pending slips

## Phase 3: AI-Powered Automation

### 3a. Structured Daily Briefing
**Current state:** DailyBriefingCard renders a plain text `summary` string from the AI edge function.

**Change:** Upgrade edge function to return structured JSON with action items, update card to render clickable items.

- **Edge function** (`daily-briefing/index.ts`): Change prompt to request JSON output with `{ summary, actions: [{ text, route, priority }] }`. Keep template fallback also structured.
- **Hook** (`useDailyBriefing.ts`): Update return type to include `actions` array.
- **Component** (`DailyBriefingCard.tsx`): Render each action as a clickable row with icon + navigate on click.
- **Risk:** Zero — additive change, fallback still works.

### 3b. Smart Lead Scoring
**Current state:** Leads page has no scoring. `leads` table has `ai_tags`, `times_contacted`, `last_contacted`, `last_attended`, `package_interest_id`, `source` — all usable for scoring.

**Change:** Compute a 0-100 lead score client-side based on existing fields (no AI needed for v1).

- **New hook** (`useLeadScoring.ts`): Pure function scoring based on: recency of contact, times contacted, has package interest, source quality, status progression.
- **Update** `Leads.tsx`: Add "Score" column with colored badge, sortable.
- **i18n keys:** `leads.score`, `leads.scoreHigh`, `leads.scoreMedium`, `leads.scoreLow`
- **Risk:** Zero — new column, no existing logic changed.

### 3c. Predictive Churn Alerts (Simplified v1)
**Current state:** `useHighRiskMembers` already identifies at-risk members by expiry. No attendance-based churn prediction.

**Change:** Enhance risk detection with attendance frequency decline — purely client-side using existing `member_attendance` data.

- **New hook** (`useChurnPrediction.ts`): Query members with declining attendance (compare last 30d vs prior 30d). Flag members whose frequency dropped >50%.
- **Update** `MemberDetails.tsx`: Show churn risk badge in sidebar if applicable.
- **Update** `NeedsAttentionCard.tsx`: Add "Declining Attendance" section.
- **Risk:** Low — additive sections, no existing logic touched.

## Phase 4: Growth Tools

### 4a. Goal Setting & Tracking
**Change:** New `goals` table + UI widget on Dashboard.

- **DB migration:** Create `goals` table with columns: `id`, `type` (enum: revenue, new_members, retention), `target_value`, `current_value`, `period_start`, `period_end`, `created_by`, `created_at`.
- **RLS:** Managers can manage, staff can read.
- **New hook** (`useGoals.ts`): CRUD for goals + auto-compute `current_value` from transactions/members.
- **New component** (`GoalProgressCard.tsx`): Progress bars for each active goal on Dashboard.
- **Update** `Dashboard.tsx`: Add GoalProgressCard below BusinessHealthCard.
- **i18n keys:** `goals.*` section.

### 4b. Member Journey Timeline
**Change:** Visual timeline component on MemberDetails showing lifecycle events.

- **New component** (`MemberTimeline.tsx`): Collects data from existing hooks (member join date, first attendance, package purchases, renewals, suspensions) and renders as a vertical timeline.
- **Update** `MemberDetails.tsx`: Add timeline in the "Home" tab.
- **Risk:** Zero — reads existing data, purely additive UI.

## Implementation Order
1. Structured Daily Briefing (edge function + card)
2. Lead Scoring (hook + Leads page column)
3. Goal Setting DB migration + hook + Dashboard widget
4. Member Journey Timeline component
5. Churn prediction hook + NeedsAttention enhancement
6. i18n keys for all new features

## Files to Create
- `src/hooks/useLeadScoring.ts`
- `src/hooks/useChurnPrediction.ts`
- `src/hooks/useGoals.ts`
- `src/components/dashboard/GoalProgressCard.tsx`
- `src/components/members/MemberTimeline.tsx`

## Files to Modify
- `supabase/functions/daily-briefing/index.ts` — structured output
- `src/hooks/useDailyBriefing.ts` — new types
- `src/components/dashboard/DailyBriefingCard.tsx` — action items UI
- `src/pages/Leads.tsx` — score column
- `src/pages/Dashboard.tsx` — GoalProgressCard
- `src/pages/MemberDetails.tsx` — MemberTimeline
- `src/components/dashboard/NeedsAttentionCard.tsx` — churn section
- `src/i18n/locales/en.ts` — new keys
- `src/i18n/locales/th.ts` — new keys

## DB Migration (Phase 4a only)
```sql
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('revenue', 'new_members', 'retention', 'checkins')),
  target_value numeric NOT NULL DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read goals" ON public.goals
  FOR SELECT TO authenticated
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Managers can manage goals" ON public.goals
  FOR ALL TO authenticated
  USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));
```

