## Quick Recheck — Overall Functions

Systematic smoke pass across all 4 surfaces (Admin, Member, Trainer, Staff) using live Playwright against the running preview, verifying real data flows (not just code). No code changes unless a bug is confirmed.

### Scope

**Admin (desktop)**
- Dashboard: KPI strip, LIVE 12h pulse, 30-day chart, Business Health, Goals, Activity feed, Daily Briefing
- Members: list loads, search/filter, bulk action bar position, member details (Overview + Records tabs)
- Schedule: today's classes render, roster, booking counts
- Finance: transactions list, revenue chart, slip review queue
- Packages / Promotions / Classes / Staff / Locations: list + CRUD buttons wired
- Gamification: rules, rewards, quests, badges pages load with data
- Settings → Brand Kit: name/logo change propagates to sidebar/header/tab/favicon

**Member (mobile)**
- Home: greeting, momentum card, today's plan, quick actions
- Schedule + Booking flow
- Check-in QR
- Rewards + XP ledger
- Profile + tier

**Trainer (mobile)**
- Home impact cards, Schedule (filtered by staff_id), Roster, Workouts, Badges

**Staff (mobile)**
- Home recent check-ins, Check-in, Members lookup, Payments, Schedule

### Method

1. Launch Playwright against `http://localhost:8080` with injected Supabase session.
2. For each surface, navigate route → screenshot → verify:
   - Data present (not empty/loading/hardcoded)
   - Numbers match DB via a quick `supabase--read_query` cross-check on 2-3 KPIs
   - Realtime: mutate one record (e.g. toggle a booking) → confirm list updates without reload
   - No console errors, no failed network requests
3. Classify each area **WORKING / PARTIAL / BROKEN** with screenshot evidence.
4. Report findings; propose targeted fixes only for confirmed issues (separate plan per fix, no bundled refactors).

### Deliverable

A single report with:
- Per-surface checklist (pass/fail + screenshot ref)
- List of confirmed bugs with root-cause hypothesis and minimal-diff fix proposal
- Zero speculative changes

### Out of Scope

- Redesigns, refactors, new features
- Fixing anything not confirmed broken via screenshot + data cross-check
- Backend schema changes
