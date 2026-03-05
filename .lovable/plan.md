

# MOOM App Journey Redesign — Strategic UX & Feature Blueprint

## Current State Analysis

MOOM has 40+ pages organized in a traditional CRUD admin pattern:
- **Sidebar**: 9 groups, ~25 menu items, all visible at once
- **Dashboard**: KPI cards + schedule table + 6 sidebar widgets (information overload)
- **Flow**: Every page is a flat list → detail page. No guided workflows.
- **Reports**: Index page with cards linking to sub-reports (extra clicks)
- **Finance**: Single table view, no visual analytics

### Core Pain Points (from a real gym operator's perspective)

1. **Morning routine takes 5+ clicks** — Owner opens app, scans dashboard, then must navigate to Lobby, Schedule, Finance separately to understand "how is today going?"
2. **No action-oriented flow** — Dashboard shows data but doesn't guide "what should I do next?"
3. **Reports are buried** — The most strategic data (retention, revenue trends, class performance) requires navigating to Reports → picking a sub-report → setting filters
4. **Sidebar is overwhelming** — 25 items for a daily user who mostly needs 5-6 screens
5. **No visual storytelling** — All pages are tables. No charts on the main pages where decisions happen
6. **Lead-to-Member funnel is invisible** — No conversion tracking, no pipeline view
7. **No goal tracking** — Revenue targets, member growth targets, class fill rates — nowhere to set or track them

---

## Redesigned App Journey

### Philosophy: "Open → Understand → Act → Grow"

```text
┌─────────────────────────────────────────────────┐
│  LOGIN                                          │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│  DASHBOARD (Command Center)                     │
│  ┌─────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │AI Brief │ │Today KPIs│ │ Action Items     │  │
│  │(1 card) │ │(4 stats) │ │ (tasks to do)    │  │
│  └─────────┘ └──────────┘ └──────────────────┘  │
│  ┌──────────────────┐ ┌──────────────────────┐  │
│  │Today's Schedule  │ │ Revenue Pulse        │  │
│  │+ Live Check-ins  │ │ (mini sparkline)     │  │
│  └──────────────────┘ └──────────────────────┘  │
│  ┌──────────────────────────────────────────┐   │
│  │ Attention Required (expiring, at-risk)   │   │
│  └──────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   OPERATIONS      GROWTH         ADMIN
   (daily work)    (strategy)     (setup)
```

---

## Specific Changes & New Features

### 1. Dashboard Redesign — "Command Center"

**Current**: 3 stat cards + schedule table + 6 sidebar cards = too much noise
**New**: Organized into 3 clear sections

**Section A: "Today at a Glance"** (top)
- AI Briefing (keep, but make it 1-line summary with expand)
- 4 KPI cards in a row: Check-ins | In Class Now | Classes Today | Revenue Today
- Each card shows delta vs yesterday with sparkline trend (7-day)

**Section B: "Live Operations"** (middle)
- Combined schedule + check-in view (keep current tabs but add live counter badge)
- Add a **mini timeline/gantt** for today's classes (visual at-a-glance)

**Section C: "Needs Attention"** (bottom, replaces sidebar cards)
- Unified "Action Items" card combining:
  - Expiring packages (with "Renew" action)
  - High-risk members (with "Contact" action)
  - Pending transfer slips (with "Review" action)
  - Hot leads (with "Follow up" action)
- Each item is actionable in-place (not just a link to another page)

**Remove from sidebar**: Birthday card (move to member detail), AI suggestions (merge into briefing)

### 2. Sidebar Restructure — Role-Based Smart Nav

**Current**: 25 flat items, all visible
**New**: Contextual grouping with smart defaults

```text
DAILY (always visible)
  Dashboard
  Lobby / Check-in
  Schedule

PEOPLE
  Members
  Leads

BUSINESS
  Packages & Promotions
  Finance
  Reports & Analytics

YOUR GYM (manager+)
  Classes & Rooms
  Staff & Roles
  Locations
  Settings
```

Changes:
- Merge "Packages" + "Promotions" into one nav item with tabs inside
- Merge "Finance" + "Transfer Slips" into one Finance page with tabs
- Move "Workout List" into Classes section
- Move "Activity Log" into Settings
- Move "Announcements" into a notification/comms hub
- Add visual indicators: red dot for pending actions (transfer slips, expiring packages)

### 3. New: Analytics Dashboard Page (`/analytics`)

A dedicated strategy page for gym owners with:

**Row 1: Revenue Analytics**
- Monthly revenue trend (bar chart, 12 months)
- Revenue by package type (donut chart)
- MRR (Monthly Recurring Revenue) calculation
- Revenue per member trend

**Row 2: Member Analytics**
- Member growth curve (new vs churned, line chart)
- Retention funnel (signed up → active → renewed → churned)
- Engagement score distribution (histogram)
- Average visit frequency trend

**Row 3: Class Analytics**
- Class fill rate by day of week (heatmap, already exists)
- Most/least popular classes (ranked bar)
- Trainer utilization rate
- Peak hours analysis

**Row 4: Lead Pipeline**
- Lead source breakdown (pie chart)
- Conversion funnel: New → Contacted → Trial → Converted
- Average time to convert
- Lead-to-member conversion rate trend

### 4. New: Goals & Targets System

Simple goal-setting that creates accountability:
- Set monthly targets: Revenue, New Members, Check-ins, Class Fill Rate
- Show progress bars on Dashboard
- AI compares actual vs target and suggests actions
- Store in a new `goals` table (goal_type, target_value, period_start, period_end)

### 5. Enhanced Finance Page

**Current**: Single transaction table
**New**: Finance hub with tabs

- **Tab 1: Overview** — Revenue chart (daily/weekly/monthly), KPI cards (revenue, refunds, outstanding), payment method breakdown donut
- **Tab 2: Transactions** — Current table (keep as-is)
- **Tab 3: Transfer Slips** — Merged from separate page
- **Tab 4: Forecasting** — Revenue projection, package renewal predictions

### 6. Lead Pipeline View

**Current**: Simple list with status filter
**New**: Add a Kanban/pipeline toggle

- Board view: Columns = New | Contacted | Trial Booked | Trial Done | Negotiating | Converted | Lost
- Each card shows name, source, days in stage, next action
- Drag to advance stage
- Conversion rate shown at top of each column

### 7. Smart Notifications & Action Center

**New page: `/actions`** (or notification panel)
- Aggregates all "things that need attention" from across the system
- Categories: Urgent (expiring today) | Follow-up | Review | FYI
- Each item has inline actions (approve slip, contact member, renew package)
- AI-prioritized: most impactful items first

### 8. Member 360 View Enhancement

Add to MemberDetails page:
- **Visit heatmap** (calendar view showing visit days, like GitHub contribution graph)
- **Engagement trend** (sparkline of last 90 days)
- **Lifetime value** (total spent)
- **Predicted churn date** (based on engagement decay)

---

## Implementation Priority

```text
Phase 1 (This Sprint) — Quick Wins
─────────────────────────────────────
1. Dashboard "Needs Attention" section     — consolidate sidebar cards
2. Sidebar restructure                     — merge related pages
3. Finance page tabs (merge transfer slips)— reduce nav items
4. Add sparkline trends to stat cards      — visual storytelling

Phase 2 (Next Sprint) — Growth Features
─────────────────────────────────────
5. Analytics Dashboard page               — strategic decision-making
6. Lead pipeline/kanban view              — sales process
7. Goals & targets on dashboard           — accountability
8. Member visit heatmap                   — retention insight

Phase 3 (Following Sprint) — AI-Powered
─────────────────────────────────────
9. Smart action center                    — AI-prioritized tasks
10. Predicted churn                       — proactive retention
11. Auto-generated weekly report          — owner email/LINE digest
```

## Files Impact Summary

### Phase 1 (recommended to implement now):
| Change | Files |
|--------|-------|
| Dashboard consolidation | `Dashboard.tsx` — merge sidebar cards into "Attention" section |
| Sidebar restructure | `Sidebar.tsx` — regroup nav items, add badges |
| Finance merge | `Finance.tsx` — add tabs for overview + transfer slips |
| Sparkline on StatCard | `StatCard.tsx` — add optional `trend` prop with mini chart |
| i18n updates | `en.ts`, `th.ts` |

### New files needed (Phase 2):
- `src/pages/Analytics.tsx` — strategic analytics dashboard
- `src/components/analytics/*` — chart components
- `src/components/leads/LeadPipeline.tsx` — kanban view
- `src/hooks/useAnalytics.ts` — aggregation queries
- `src/hooks/useGoals.ts` — goals CRUD
- DB migration: `goals` table

**Risk**: Phase 1 is pure UI reorganization (zero DB changes). Phase 2 needs one new table (`goals`). All existing functionality preserved.

---

## Business Impact Projection

| Metric | Current | After Redesign |
|--------|---------|----------------|
| Time to daily overview | ~2 min (5 pages) | ~10 sec (1 dashboard) |
| Expiring package follow-up rate | Manual check | Auto-surfaced with 1-click action |
| Lead conversion visibility | None | Full funnel with conversion rates |
| Revenue forecasting | None | AI-projected with goal tracking |
| Decision-making data | Scattered across 6+ pages | 1 Analytics page |

This redesign transforms MOOM from a "data entry system" into a "business intelligence platform that happens to do operations."

