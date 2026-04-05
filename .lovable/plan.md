

# Strategic Business Intelligence Upgrade — MOOM Gym Management Platform

## Current State Assessment

The platform already has solid foundations:
- **Dashboard**: KPI cards, business health score, revenue forecast, needs attention, schedule preview, goals, AI briefing
- **Analytics/Insights**: Revenue trends, member growth, class fill rate heatmap, lead funnel, KPI overview (ARPU, retention, LTV, utilization)
- **Finance**: Full transaction management, P&L, forecasting, transfer slips
- **Member App**: Gamification (XP, badges, quests, streaks, squads), momentum, referrals, check-in
- **Churn Prediction**: 30-day vs 60-day attendance comparison
- **Goals**: Monthly target tracking (revenue, members, retention, checkins)

## What's Missing — High-Impact Strategic Features

### Priority 1: Cohort Retention Analysis (Revenue Protector)
**Why**: Current retention is just "% with active package." Real retention = "of members who joined in Month X, how many are still active N months later?" This is THE metric that predicts gym survival.

**Implementation**:
- New hook `useCohortRetention` — groups members by join month, tracks active status at 1/3/6/12 month marks
- Cohort retention chart (stacked area or heatmap) on Insights page
- Add a "Retention" tab to Insights

### Priority 2: Revenue Per Visit (RPV) & Unit Economics
**Why**: Knowing revenue/member is basic. Knowing revenue/visit tells you if your pricing matches usage. High RPV = members pay but don't come (risky — they'll churn). Low RPV = they come a lot but pay little (unprofitable).

**Implementation**:
- Calculate RPV = total revenue / total check-ins (per month)
- Add to Insights overview KPI cards
- Add i18n keys

### Priority 3: Peak Hour Revenue Optimizer
**Why**: The class fill rate heatmap exists but doesn't connect to revenue. A gym owner needs: "Which time slots make money? Which ones lose money?" to decide pricing, staffing, and scheduling.

**Implementation**:
- Overlay revenue data onto the existing heatmap (or add a new "Revenue by Time Slot" view)
- Show revenue/class for each time slot
- Highlight underperforming slots with actionable suggestions

### Priority 4: Member Lifetime Journey Timeline
**Why**: Current member detail shows data in tabs. A timeline view ("joined → first class → bought package → streak started → attendance dropped → package expired") tells the story at a glance. This is what enables personal outreach.

**Implementation**:
- New component `MemberJourneyTimeline` on MemberDetails page
- Aggregates events from `member_attendance`, `member_packages`, `transactions`, `badge_earnings`
- Visual timeline with icons per event type

### Priority 5: Smart Notifications / Action Triggers
**Why**: The "Needs Attention" card shows problems but requires the admin to check the dashboard. Automated triggers (e.g., "Member hasn't checked in for 14 days → send LINE message") turn passive data into active retention.

**Implementation**:
- New `notification_rules` table: condition + action + channel
- Edge function `evaluate-notification-rules` runs daily
- Admin UI to create/edit rules (Settings > Automation)

### Priority 6: Competitive Benchmarking Dashboard
**Why**: Gym owners don't know if 60% retention is good or bad. Even simple benchmarks ("industry average: 72%") give context that drives action.

**Implementation**:
- Static benchmark data (configurable in settings) for key metrics
- Show "vs benchmark" indicators on Insights KPI cards
- Allow admin to set their own benchmark targets

## Recommended Implementation Order

| Phase | Feature | Impact | Effort | Files |
|-------|---------|--------|--------|-------|
| A | Cohort Retention Chart | Very High | Medium | New hook + new Insights tab |
| B | Revenue Per Visit KPI | High | Low | Add to `useInsightsMetrics` + Insights page |
| C | Member Journey Timeline | High | Medium | New component on MemberDetails |
| D | Peak Hour Revenue Overlay | Medium | Medium | Extend `useClassFillRate` + Analytics |
| E | Notification Rules (Automation) | Very High | High | New table + edge function + settings UI |
| F | Benchmark Indicators | Medium | Low | Static config + Insights UI |

## What NOT to Change
- Existing dashboard layout (working well after Phase 1-5 redesign)
- Existing hooks and data contracts
- Auth/RLS/permissions system
- Gamification system
- Member/Trainer/Staff surfaces (just completed redesign)

## Technical Approach
- All new features as **additive modules** (new hooks, new components)
- Zero changes to existing working code
- Each phase is independently deployable
- All new i18n keys for EN + TH

## Smoke Test (per phase)
1. New charts render with real data
2. Existing Insights/Analytics pages unchanged
3. Dark mode renders correctly
4. Mobile responsive
5. Permission gates still work
6. Published site unaffected

