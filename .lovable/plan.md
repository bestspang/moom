

# Feature Recommendations — Business-Impact Analysis

## Current State Summary

MOOM is a **gym management console** (v0.0.1 complete, v0.0.2 in progress) with:
- Operations: Dashboard, Lobby/Check-in, Schedule, Rooms, Classes, Workouts
- CRM: Members (with rich detail page), Leads, Packages, Promotions
- Admin: Staff, Roles, Locations, Finance, Reports, Activity Log, Settings
- Planned: Member LIFF App, Trainer LIFF App, LINE Push, Payments

## Gap Analysis (What's Missing for a Real Gym Business)

After reviewing all 40+ pages and the roadmap, here are the **highest-ROI features** ranked by business impact vs implementation effort:

---

### Tier 1 — "This Week" (High Impact, Low Effort)

#### 1. Command Palette (Cmd+K)
**Why:** Power users (gym managers) navigate 40+ pages. A quick-search command palette lets them jump anywhere, search members, or trigger actions in 2 keystrokes.
- Search members/leads by name/phone
- Jump to any page
- Quick actions: "Check in [member]", "Schedule class", "Create lead"
- Implementation: Single component + keyboard listener, no DB changes

#### 2. Daily Briefing Card (Dashboard)
**Why:** Gym owners open the app every morning. Instead of scanning 4 stat cards + 3 sidebar cards, give them ONE card that says: "Today you have 5 classes, 2 PT sessions. 3 packages expire this week. 1 member hasn't visited in 14 days."
- AI-generated natural language summary using existing data hooks
- Collapsible, shown at top of Dashboard
- Uses Lovable AI (gemini-2.5-flash) — no API key needed
- Implementation: 1 new component + 1 edge function

#### 3. Quick Check-in from Dashboard
**Why:** The #1 daily action (check-in) requires navigating to Lobby. Add a floating "Quick Check-in" button on Dashboard that opens a member search → one-tap check-in.
- Reuses existing `CheckInDialog` component
- Just a FAB (floating action button) + dialog trigger
- Implementation: ~20 lines in Dashboard.tsx

---

### Tier 2 — "This Month" (High Impact, Medium Effort)

#### 4. Expiring Packages Alert System
**Why:** Revenue leaks when packages expire and nobody follows up. Auto-detect packages expiring in 7/14/30 days → show in dashboard → enable one-click "Send renewal reminder".
- New query: `member_packages WHERE expires_at BETWEEN now AND now+30d`
- Dashboard card with urgency tiers (red/yellow/green)
- Action button: "Remind" (creates notification or future LINE push)
- DB: No new tables, just a new query + UI card

#### 5. Revenue Forecast Widget
**Why:** Gym owners need to know "How much money am I going to make next month?" based on active packages and their renewal rates.
- Calculate: active packages × monthly value
- Show: This month confirmed vs next month projected
- Visual: Simple bar chart comparing last 3 months + next month projection
- Implementation: New report component using existing `member_packages` + `finance_transactions` data

#### 6. Member Engagement Score
**Why:** "Members at Risk" exists but is binary. A score (0-100) based on visit frequency, package usage rate, days since last visit, and class attendance gives actionable insight.
- Computed field (no new table): `(visit_frequency × 0.4) + (package_usage_rate × 0.3) + (recency × 0.3)`
- Show as a colored badge on member cards and member detail page
- Sortable in members list
- Implementation: Utility function + UI integration

---

### Tier 3 — "Next Quarter" (Game-Changer, Higher Effort)

#### 7. Automated Retention Workflows
**Why:** The roadmap lists "retention" for v0.1.0, but a simple version can ship now: When engagement score drops below threshold → auto-create a task/notification for staff to follow up.
- Rule engine: IF score < 30 AND no visit in 14 days → create notification
- Edge function running on cron (daily)
- Staff sees "Follow up with [member]" in their notification feed

#### 8. Walk-in Lead Capture (QR → Form)
**Why:** A visitor walks into the gym. Staff shows them a QR code → visitor fills a quick form on their phone (name, phone, interest) → instantly appears in Leads.
- Public form page (no auth required)
- QR code generated per location
- Auto-creates lead with `source: 'walk-in'`
- Simple but powerful for converting foot traffic

---

## Recommended Implementation Order

```text
Priority  Feature                    Impact   Effort   Revenue Impact
──────────────────────────────────────────────────────────────────────
  1       Command Palette (Cmd+K)    ★★★★★   ★★☆☆☆   Productivity
  2       Quick Check-in FAB         ★★★★☆   ★☆☆☆☆   Daily UX
  3       Expiring Packages Alert    ★★★★★   ★★☆☆☆   Direct Revenue
  4       Daily Briefing Card        ★★★★☆   ★★★☆☆   Owner Retention
  5       Member Engagement Score    ★★★★☆   ★★☆☆☆   Churn Prevention
  6       Revenue Forecast Widget    ★★★☆☆   ★★★☆☆   Business Intel
  7       Walk-in Lead Capture QR    ★★★★☆   ★★☆☆☆   Lead Gen
  8       Automated Retention        ★★★★★   ★★★★☆   Churn Prevention
```

## My Recommendation: Start with #1 + #2 + #3

These three features together transform the daily experience:
- **Cmd+K**: Navigate anywhere instantly (power user delight)
- **Quick Check-in**: The #1 daily task becomes 1 tap from anywhere
- **Expiring Packages**: Directly prevents revenue loss

All three require **zero DB changes**, use existing hooks/components, and can ship in one sprint.

