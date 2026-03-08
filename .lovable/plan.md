

# Phase 2 — Member Migration Plan

## Current State Assessment

**Phase 1 is complete:**
- `src/apps/shared/hostname.ts` — surface detection ✓
- `src/apps/shared/SurfaceContext.tsx` — surface provider ✓  
- `src/apps/member/layouts/MemberLayout.tsx` — mobile shell with BottomNav ✓
- `src/apps/trainer/layouts/TrainerLayout.tsx` — placeholder ✓
- `src/apps/staff/layouts/StaffLayout.tsx` — placeholder ✓
- Routes in `App.tsx` — `/member/*`, `/trainer/*`, `/staff/*` ✓
- Shared components: `ListCard`, `Section`, `SummaryCard`, `MobilePageHeader` ✓

**Current member pages are PLACEHOLDER-only** (just stub text). They need to be replaced with real pages migrated from MOOM Connect.

**Critical schema difference**: This project's DB uses `class_bookings`, `members`, `member_packages`, `class_schedule`. MOOM Connect's DB uses `bookings`, `member_profiles`, `schedule_instances`. The API service layer must be written for THIS project's schema, NOT copied directly from MOOM Connect.

---

## What to Migrate from MOOM Connect

### Components to recreate in `src/apps/shared/components/`
| MOOM Connect | Already exists? | Action |
|---|---|---|
| `FilterChips` | No | **Create** — scrollable horizontal filter chips |
| `QueryError` | No | **Create** — retry-able error state |
| `StatusBadge` (mobile version) | No | **Create** — mobile-optimized status badges |
| `GlobalSearch` | No | **Defer** to Phase 5 |

### Momentum features to recreate in `src/apps/member/features/momentum/`
| Component | Action |
|---|---|
| `types.ts` | **Create** — tier/XP/badge/quest/squad types |
| `api.ts` | **Create** — queries against THIS project's gamification tables |
| `MomentumCard` | **Create** — XP + streak + quests card |
| `TierBadge` | **Create** — tier pill badge |
| `XPProgressBar` | **Create** — level progress |
| `StreakFlame` | **Create** — weekly streak visualization |
| `QuestCard` | **Create** — active quest progress |
| `ChallengeCard` | **Create** — challenge join/progress |
| `BadgeGrid` | **Create** — badge collection grid |
| `UpcomingMilestones` | **Create** — "almost there" nudges |
| `XPToast` | **Defer** — requires realtime subscription |

### API layer: `src/apps/member/api/services.ts`
Write new service functions querying THIS project's DB tables:
- `fetchSchedule()` → from `class_schedule` + `classes` + `rooms` + `staff`
- `fetchMyBookings()` → from `class_bookings` where `member_id = auth.uid()`
- `fetchMyPackages()` → from `member_packages` where `member_id = auth.uid()`
- `fetchAvailablePackages()` → from `packages` where `is_active = true`
- `fetchMomentumProfile()` → from `member_gamification_profiles` where `member_id = auth.uid()`
- `fetchMyBadges()` → from `badge_earnings` + `gamification_badges`
- `fetchMyQuests()` → gamification tables
- `fetchAnnouncements()` → from `announcements`

### Pages to build (replacing current placeholders)

| Route | Page | Migrated from | Complexity |
|---|---|---|---|
| `/member` | MemberHomePage | `features/member/MemberHome.tsx` | High — greeting, bookings, momentum, challenges, packages, announcements |
| `/member/schedule` | MemberSchedulePage | `pages/SchedulePage.tsx` | Medium — filtered class list grouped by date |
| `/member/bookings` | MemberBookingsPage | `pages/BookingsPage.tsx` | Medium — filtered booking list |
| `/member/packages` | MemberPackagesPage | `pages/PackagesPage.tsx` | Medium — my packages + browse tab |
| `/member/profile` | MemberProfilePage | `pages/ProfilePage.tsx` | High — profile card, momentum showcase, menu items |

### Session/Auth adapter
MOOM Connect uses `useSession()` with `activeRole`. This project uses `useAuth()` from `AuthContext`. Rather than duplicating session logic, we create a thin adapter:
- `src/apps/member/hooks/useMemberSession.ts` — wraps `useAuth()` and provides member-friendly session data (firstName, role, etc.)

---

## Folder Structure (final for Phase 2)

```
src/apps/
├── member/
│   ├── api/
│   │   └── services.ts          # DB queries for member surface
│   ├── components/
│   │   └── MemberBottomNav.tsx   # ✓ exists
│   ├── features/
│   │   └── momentum/
│   │       ├── types.ts
│   │       ├── api.ts
│   │       ├── MomentumCard.tsx
│   │       ├── TierBadge.tsx
│   │       ├── XPProgressBar.tsx
│   │       ├── StreakFlame.tsx
│   │       ├── QuestCard.tsx
│   │       ├── ChallengeCard.tsx
│   │       ├── BadgeGrid.tsx
│   │       └── UpcomingMilestones.tsx
│   ├── hooks/
│   │   └── useMemberSession.ts
│   ├── layouts/
│   │   └── MemberLayout.tsx      # ✓ exists
│   ├── pages/
│   │   ├── MemberHomePage.tsx     # upgrade from placeholder
│   │   ├── MemberSchedulePage.tsx # upgrade from placeholder
│   │   ├── MemberBookingsPage.tsx # upgrade from placeholder
│   │   ├── MemberPackagesPage.tsx # upgrade from placeholder
│   │   └── MemberProfilePage.tsx  # upgrade from placeholder
│   └── index.ts
├── shared/
│   ├── components/
│   │   ├── FilterChips.tsx       # NEW
│   │   ├── QueryError.tsx        # NEW
│   │   ├── MobileStatusBadge.tsx # NEW
│   │   ├── ListCard.tsx          # ✓ exists
│   │   ├── Section.tsx           # ✓ exists
│   │   ├── SummaryCard.tsx       # ✓ exists
│   │   ├── MobilePageHeader.tsx  # ✓ exists
│   │   └── index.ts
│   ├── hostname.ts               # ✓ exists
│   ├── SurfaceContext.tsx         # ✓ exists
│   └── types.ts                  # ✓ exists
```

---

## Implementation Order

### Step 1 — Shared components (no DB dependency)
Create `FilterChips`, `QueryError`, `MobileStatusBadge` in `src/apps/shared/components/`

### Step 2 — Momentum types + API
Create `src/apps/member/features/momentum/types.ts` and `api.ts` querying this project's gamification tables

### Step 3 — Momentum UI components
Create `TierBadge`, `XPProgressBar`, `StreakFlame`, `QuestCard`, `MomentumCard`, `BadgeGrid`, `ChallengeCard`, `UpcomingMilestones`

### Step 4 — Member API services
Create `src/apps/member/api/services.ts` with schedule, bookings, packages queries for THIS project's schema

### Step 5 — Member session hook
Create `src/apps/member/hooks/useMemberSession.ts`

### Step 6 — Replace placeholder pages
Rewrite all 5 member pages with real data-fetching, matching MOOM Connect UX patterns

### Step 7 — Update MemberLayout
Add XPToast support, auth guard (redirect to /login if no session)

---

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Admin DB tables may not have all columns MOOM Connect expects (e.g., `momentum_profiles`) | Check actual DB schema; gamification tables exist from earlier migrations |
| `class_bookings` vs `bookings` column mismatch | Write member API layer from scratch against actual types.ts |
| Momentum features depend on tables that may not have data yet | All queries use `.maybeSingle()` or null-safe patterns; UI shows empty states |
| No admin route changes | All changes are additive under `/member/*` — zero regression to admin surface |

---

## What is NOT touched
- All existing admin pages, layouts, contexts, hooks — ZERO changes
- `src/components/*` — not modified
- `src/pages/*` — not modified
- `src/contexts/AuthContext.tsx` — not modified
- `src/hooks/*` — not modified
- Database schema — no migrations needed (gamification tables already exist)

