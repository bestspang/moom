

# Phase 5: UX Polish, Automation & Operational Excellence

## What's Done (Phases 1-4)
- ✅ Dashboard Command Center (BusinessHealth, GoalProgress, Revenue sparkline)
- ✅ Insights Hub (unified analytics with ARPU, retention, LTV)
- ✅ AI Structured Briefing with clickable actions
- ✅ Lead Scoring, Churn Prediction, NeedsAttention enhancement
- ✅ Goal Setting & Tracking, Member Journey Timeline

## Phase 5 Focus: Closing operational gaps and making existing features more useful

### 5a. Schedule Calendar View (High Impact)
**Problem:** Schedule page is a flat table — hard to see the day at a glance. Every modern gym software has a timeline/calendar grid.
**Change:** Add a visual timeline view (hour rows × room columns) alongside the existing table. Toggle between "List" and "Timeline" views.
- New component: `ScheduleTimeline.tsx` — CSS grid with hour slots, colored blocks per class
- Update `Schedule.tsx` — add view toggle button
- Zero regression: table view stays default, timeline is additive

### 5b. Quick Actions & Keyboard Shortcuts (UX)
**Problem:** Common operations (check-in, new member, new lead) require navigating to specific pages. Power users need speed.
**Change:** Enhance existing `CommandPalette.tsx` with real actions:
- ⌘K opens palette → type "check in" → opens CheckInDialog
- "New member" → opens CreateMemberDialog
- "New lead" → opens CreateLeadDialog
- "Go to finance" → navigates
- Update `Header.tsx` to wire ⌘K shortcut
- Low risk: CommandPalette already exists, just needs action wiring

### 5c. Notification-Driven Workflows (Automation)
**Problem:** Notifications exist but are passive — no auto-generation for common events. Staff must manually check everything.
**Change:** Create an edge function `auto-notifications` that generates notifications for:
- Package expiring in 7 days / 3 days / today
- Lead not contacted in 5+ days
- Member hasn't visited in 14+ days
- New transfer slip pending review
- Triggered via scheduled cron (daily at 8am Bangkok time)
- Uses existing `notifications` table + `event_outbox`
- New: `supabase/functions/auto-notifications/index.ts`
- Update `supabase/config.toml` — NOT allowed, so we'll use manual cron setup

### 5d. Finance Profit & Loss Summary (Business Intelligence)
**Problem:** Finance page shows transactions but no P&L summary. Gym owners can't see net position.
**Change:** Add a "P&L" tab to Finance with:
- Revenue by category (packages, walk-ins, PT)
- Simple expense tracking (manual entry for now)
- Net profit calculation
- DB migration: `expenses` table (date, category, amount, description, created_by)
- New hook: `useExpenses.ts`
- Update `Finance.tsx` — add P&L tab

### 5e. Member Communication Log (CRM Enhancement)
**Problem:** No way to track communications with members (calls, LINE messages, emails). Staff can add notes but there's no structured communication history.
**Change:** Add a "Communications" section to MemberDetails:
- Log entries: type (call/line/email/in-person), date, note, logged_by
- Uses existing `member_notes` with a `note_type` discriminator
- No new table needed — extend member_notes with a `type` field via migration
- New component: `MemberCommunicationLog.tsx`
- Update `MemberDetails.tsx` — add tab or section

## Implementation Order
1. **5b** Command Palette actions (smallest, highest UX impact)
2. **5a** Schedule Timeline view (visual impact)
3. **5c** Auto-notifications edge function (automation)
4. **5d** P&L tab with expenses (business value)
5. **5e** Communication log (CRM depth)

## Files to Create
- `src/components/schedule/ScheduleTimeline.tsx`
- `supabase/functions/auto-notifications/index.ts`
- `src/hooks/useExpenses.ts`
- `src/components/members/MemberCommunicationLog.tsx`

## Files to Modify
- `src/components/command-palette/CommandPalette.tsx` — wire real actions
- `src/components/layout/Header.tsx` — ⌘K shortcut
- `src/pages/Schedule.tsx` — timeline toggle
- `src/pages/Finance.tsx` — P&L tab
- `src/pages/MemberDetails.tsx` — communication section
- `src/i18n/locales/en.ts` + `th.ts` — new keys

## DB Migrations
```sql
-- Expenses table for P&L
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL DEFAULT 'general',
  amount numeric NOT NULL DEFAULT 0,
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can manage expenses" ON public.expenses
  FOR ALL TO authenticated
  USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));

-- Add type to member_notes for communication tracking
ALTER TABLE public.member_notes
  ADD COLUMN IF NOT EXISTS note_type text DEFAULT 'note';
```

## Risk Assessment
- All features are additive — no existing pages/logic modified except adding new tabs/sections
- Schedule table view preserved as default
- Command Palette already exists, just needs action handlers
- Expense/P&L is a new tab, doesn't touch existing Finance transaction logic

