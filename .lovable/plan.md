

# App Journey & Strategic Feature Redesign — MOOM Gym Management

## Current State Analysis

The app currently has a solid foundation with ~30+ pages covering operations (lobby, schedule, check-in), CRM (members, leads), finance, and configuration. However, the experience is **operator-centric** — it serves the daily "run the gym" workflow but lacks strategic growth tools and modern AI-powered automation that would make it a true business growth platform.

### Current Flow
```text
Login → Dashboard (today's ops) → Navigate to specific modules
         ↓
    Daily: Lobby / Schedule / Check-in
    CRM: Members / Leads
    Business: Packages / Promotions / Finance / Analytics / Reports
    Config: Classes / Rooms / Staff / Roles / Settings
```

### Key Gaps Identified
1. **No actionable growth loop** — Dashboard shows what happened today, not what to do next
2. **Analytics and Reports are separate pages** with overlapping concerns
3. **AI infrastructure exists** (ai_runs, ai_suggestions, ai_policies tables) but is barely used — only a suggestion approve/reject card
4. **No retention strategy tools** — members at risk are listed but no automated re-engagement
5. **No revenue optimization** — revenue forecast is a simple average, no cohort analysis
6. **Lead funnel has no automation** — no follow-up reminders, no conversion tracking over time
7. **Finance lacks profitability insights** — no ARPU, LTV, churn rate, or cost tracking

---

## Proposed New App Journey

### Philosophy: "Open → Understand → Decide → Act → Grow"

```text
┌──────────────────────────────────────────────────────────┐
│  COMMAND CENTER (Dashboard)                              │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Today's  │  │ AI       │  │ Needs    │               │
│  │ Pulse    │  │ Actions  │  │ Attention│               │
│  └─────────┘  └──────────┘  └──────────┘               │
│  ┌──────────────────────────────────────┐               │
│  │ Schedule / Check-ins (live)          │               │
│  └──────────────────────────────────────┘               │
├──────────────────────────────────────────────────────────┤
│  GROW (New strategic hub)                                │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Revenue  │  │ Members  │  │ Retention│  │ Lead    │ │
│  │ Insights │  │ Health   │  │ Score    │  │ Pipeline│ │
│  └─────────┘  └──────────┘  └──────────┘  └─────────┘ │
├──────────────────────────────────────────────────────────┤
│  OPERATE (existing, refined)                             │
│  Lobby / Schedule / Members / Leads / Finance / Packages │
├──────────────────────────────────────────────────────────┤
│  CONFIGURE (existing)                                    │
│  Classes / Rooms / Staff / Roles / Settings              │
└──────────────────────────────────────────────────────────┘
```

---

## Implementation Plan — Phased, Zero Regression

### Phase 1: Enhanced Dashboard (High Impact, Medium Effort)

**1a. Add "Business Health Score" widget to Dashboard**
- A single 0-100 score computed from: retention rate, revenue trend, class utilization, lead conversion
- Shows trend arrow (up/down vs last week)
- Tapping opens the new Insights page
- **Files:** New `useBusinessHealth.ts` hook, new `BusinessHealthCard.tsx` component, update `Dashboard.tsx`

**1b. Upgrade "Needs Attention" to "AI Action Queue"**
- Instead of just listing problems, show AI-generated recommended actions with one-click execution
- Examples: "Send re-engagement message to 12 members expiring this week", "Follow up with 3 hot leads (last contact >5 days)"
- Uses existing `ai_suggestions` table + Lovable AI edge function to generate suggestions
- **Files:** Update `NeedsAttentionCard.tsx`, new edge function `ai-action-suggestions/index.ts`

**1c. Add Revenue mini-chart to Dashboard**
- Small sparkline showing 30-day revenue trend (not just this/last month comparison)
- Already have `useRevenueForecast` — extend with daily granularity
- **Files:** Update `RevenueForecastCard.tsx`, extend `useRevenueForecast.ts`

### Phase 2: Insights Hub (High Impact, High Effort)

**2a. Merge Analytics + Reports into unified "Insights" page**
- Current problem: Analytics shows 4 charts, Reports shows a list of sub-reports — users must navigate between them
- New design: Single "Insights" page with tabs: **Overview | Revenue | Members | Classes | Packages**
- Overview tab: Business Health Score + 4 key metrics (ARPU, Retention Rate, Class Utilization, Lead Conversion Rate)
- Each tab: relevant charts + drill-down tables
- **Files:** New `src/pages/Insights.tsx`, keep existing report detail pages, update sidebar nav, update routing

**Key new metrics to add:**
| Metric | Formula | Source |
|--------|---------|--------|
| ARPU | Total revenue / Active members | transactions + members |
| Retention Rate | Members renewed / Members eligible | member_packages |
| Churn Rate | 1 - Retention Rate | member_packages |
| LTV (est.) | ARPU × avg membership months | transactions + member_packages |
| Class Utilization | Avg(checked_in / capacity) | schedule |
| Lead Conversion Rate | Converted / Total leads | leads |
| Revenue per sqm | Revenue / Location area | transactions + locations |

**2b. Cohort Analysis chart**
- Group members by join month, show retention over time (month 1, 2, 3... still active?)
- Classic heatmap-style cohort table
- **Files:** New `useCohortAnalysis.ts` hook, new `CohortChart.tsx` component

### Phase 3: AI-Powered Automation (Differentiator)

**3a. AI Daily Briefing Enhancement**
- Current: Text summary from edge function
- Upgrade: Structured briefing with specific action items, each clickable
- "Revenue is 15% below last month → View declining packages"
- "3 members haven't visited in 14+ days → Send re-engagement"
- **Files:** Update `daily-briefing/index.ts` edge function, update `DailyBriefingCard.tsx`

**3b. Smart Lead Scoring**
- Auto-score leads based on: engagement (visits, responses), package interest price, recency
- Show score on Leads list, sort by highest potential
- **Files:** New `useLeadScoring.ts`, update `Leads.tsx` to show score column

**3c. Predictive Churn Alerts**
- AI analyzes attendance patterns + package expiry to predict which members will churn
- Show on Dashboard + Member Details
- Uses Lovable AI edge function for prediction
- **Files:** New edge function `predict-churn/index.ts`, new `useChurnPrediction.ts`

### Phase 4: Growth Tools (Business Differentiator)

**4a. Goal Setting & Tracking**
- Set monthly goals: revenue target, new member target, retention target
- Dashboard shows progress bars against goals
- **DB:** New `goals` table (type, target_value, current_value, period_start, period_end)
- **Files:** New `useGoals.ts`, new `GoalProgressCard.tsx`, update Dashboard

**4b. Member Journey Timeline**
- On MemberDetails: visual timeline showing: joined → first class → package purchased → renewed → at risk
- Helps staff understand member lifecycle at a glance
- **Files:** New `MemberTimeline.tsx` component, update `MemberDetails.tsx`

**4c. Automated Follow-up Reminders**
- For leads: auto-create follow-up tasks based on status age
- For members: package expiry reminders (7 days, 3 days, day-of)
- Uses `event_outbox` table that already exists
- **Files:** New edge function `auto-reminders/index.ts`, scheduled via cron

---

## Sidebar Navigation Update

```text
Current:                          Proposed:
─────────                         ─────────
Daily                             Daily
  Dashboard                         Dashboard
  Lobby                             Lobby  
  Schedule                          Schedule

People                            People
  Members                           Members
  Leads                             Leads

Business                          Business
  Packages                          Packages
  Promotions                        Promotions
  Finance                           Finance
  Analytics    ← MERGE →            Insights (NEW - replaces Analytics + Reports)
  Reports      ← MERGE →           

Your Gym                          Your Gym
  (unchanged)                       (unchanged)
```

---

## Priority & Risk Assessment

| Phase | Impact | Effort | Risk | Dependencies |
|-------|--------|--------|------|-------------|
| 1a Business Health | High | Low | Zero — additive component | None |
| 1b AI Action Queue | High | Medium | Low — uses existing tables | Lovable AI edge function |
| 1c Revenue sparkline | Medium | Low | Zero — extends existing hook | None |
| 2a Insights Hub | High | High | Medium — replaces 2 pages | Keep old routes as redirects |
| 2b Cohort Analysis | High | Medium | Low — new query + chart | None |
| 3a-c AI features | High | High | Medium — depends on AI gateway | LOVABLE_API_KEY |
| 4a-c Growth tools | Medium | High | Low — new tables + components | DB migration |

### Recommended Start: Phase 1 (all 3 items) + Phase 2a

This gives the most visible impact with manageable risk. Phase 1 can be done without any DB changes. Phase 2a consolidates navigation and adds the key business metrics that gym owners actually need.

### Zero-Regression Strategy
- All new features are additive (new files/components)
- Analytics and Reports pages keep their routes (add redirects later)
- Existing hooks/queries are NOT modified — new hooks for new metrics
- Sidebar change is minimal (replace 2 items with 1)

