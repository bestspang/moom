

# Phase 2 Complete — Phase 3 Plan: Trainer & Staff Surfaces + Remaining Migration Gaps

## Current State Assessment

### What's DONE (Phase 1 + Phase 2):
- Surface detection, SurfaceContext, hostname utilities ✓
- Member layout with BottomNav ✓
- Trainer/Staff layouts with BottomNav (correct nav items, matching MOOM Connect's config) ✓
- 5 member pages (Home, Schedule, Bookings, Packages, Profile) — all data-wired ✓
- Member API services (`services.ts`) querying this project's schema ✓
- Momentum feature module (types, api, UI components) ✓
- `useMemberSession` hook ✓
- Shared components (FilterChips, QueryError, MobileStatusBadge, EmptyState, ListCard, Section, SummaryCard, MobilePageHeader) ✓
- Routes in App.tsx for all 4 surfaces ✓
- Diagnostics page ✓

### What's REMAINING (Phases 3-5):

**Trainer surface** — currently a static placeholder. MOOM Connect has:
- `TrainerHome` with schedule data, today's classes, CoachImpactCard/PartnerReputationCard
- Schedule, Roster, Workouts, Profile pages
- Only `/trainer` index route exists; no sub-routes

**Staff surface** — currently a static placeholder. MOOM Connect has:
- `StaffHome` with member search, check-in, stats, pending slips, leads
- Check-in, Members, Payments, Profile pages
- Only `/staff` index route exists; no sub-routes

**Missing sub-routes** for all surfaces (e.g., `/member/notifications`, `/member/attendance`, `/trainer/schedule`, `/staff/checkin`, etc.) — these currently 404.

**No auth guard** on member/trainer/staff layouts — anyone can access without login.

---

## Phase 3 Implementation Plan

### Step 1 — Wire Trainer Home with real data
**File:** `src/apps/trainer/pages/TrainerHomePage.tsx`
- Replace static placeholder with data-fetching version
- Query `schedule` table filtered by trainer's staff ID
- Show today's classes, total bookings stats
- Add announcements section
- Use `useAuth()` for trainer identity (user → staff record)

### Step 2 — Wire Staff Home with real data
**File:** `src/apps/staff/pages/StaffHomePage.tsx`
- Replace static placeholder with data-fetching version
- Member search with Enter key → navigate to `/staff/members?search=...`
- Stats: today's classes count, pending transfer slips, hot leads
- Today's classes list, pending slips list

### Step 3 — Add missing Trainer sub-routes
Add placeholder pages + routes in App.tsx:
- `/trainer/schedule` → reuse `MemberSchedulePage` pattern (trainer sees all classes)
- `/trainer/roster` → placeholder
- `/trainer/workouts` → placeholder
- `/trainer/profile` → profile page similar to member but with trainer role items

### Step 4 — Add missing Staff sub-routes
- `/staff/checkin` → placeholder (check-in scanner)
- `/staff/members` → placeholder (member list)
- `/staff/payments` → placeholder (payment/slip management)
- `/staff/profile` → profile page with staff role items

### Step 5 — Add auth guards to experience layouts
Update `MemberLayout`, `TrainerLayout`, `StaffLayout`:
- Check `useAuth()` — if no session, redirect to `/login`
- Show loading spinner while auth is loading
- Keep it lightweight (no role enforcement yet — that's Phase 4)

### Step 6 — Shared components index fix
Update `src/apps/shared/components/index.ts` to export all components (FilterChips, QueryError, MobileStatusBadge, EmptyState are missing from the barrel export).

---

## Files to Create
| File | Purpose |
|---|---|
| `src/apps/trainer/pages/TrainerSchedulePage.tsx` | Schedule view for trainers |
| `src/apps/trainer/pages/TrainerRosterPage.tsx` | Roster placeholder |
| `src/apps/trainer/pages/TrainerWorkoutsPage.tsx` | Workouts placeholder |
| `src/apps/trainer/pages/TrainerProfilePage.tsx` | Trainer profile with menu |
| `src/apps/staff/pages/StaffCheckinPage.tsx` | Check-in placeholder |
| `src/apps/staff/pages/StaffMembersPage.tsx` | Members list placeholder |
| `src/apps/staff/pages/StaffPaymentsPage.tsx` | Payments placeholder |
| `src/apps/staff/pages/StaffProfilePage.tsx` | Staff profile with menu |

## Files to Modify
| File | Change |
|---|---|
| `src/apps/trainer/pages/TrainerHomePage.tsx` | Replace static with data-wired |
| `src/apps/staff/pages/StaffHomePage.tsx` | Replace static with data-wired |
| `src/apps/member/layouts/MemberLayout.tsx` | Add auth guard |
| `src/apps/trainer/layouts/TrainerLayout.tsx` | Add auth guard |
| `src/apps/staff/layouts/StaffLayout.tsx` | Add auth guard |
| `src/apps/shared/components/index.ts` | Add missing exports |
| `src/App.tsx` | Add trainer + staff sub-routes |
| `src/apps/trainer/index.ts` | Export new pages |
| `src/apps/staff/index.ts` | Export new pages |

## Risks
- Trainer identity resolution: need to map auth user → staff record to filter "my classes". Will use same pattern as `useMemberSession` but for staff/trainer.
- Sub-pages are placeholders for now — full functionality (check-in scanner, payment flows) is deferred to later phases.
- Zero changes to existing admin pages/routes/components.

