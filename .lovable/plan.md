
# Phase 6: Complete Remaining Features - MOOM CLUB v0.0.1

## Current Status Summary
- **Pages**: 28/28 implemented
- **Database**: All 25 tables established with RLS
- **i18n**: EN/TH complete (Phase 5 done)
- **UX/UI Polish**: Complete (animations, accessibility, mobile)

---

## Remaining Work (4 Items)

### 1. Reports Section - Members at Risk Page
**Location**: `/report/member/members-at-risk`

**Current State**: Report cards show "Coming Soon" toast

**Required Implementation**:
- Create `src/pages/reports/MembersAtRisk.tsx`
- Add route to App.tsx
- Components needed:
  - Pie chart (High 55% vs Low 45%)
  - Risk level definition cards
  - Filter buttons (High/Medium/Low risk)
  - Member table with columns: Avatar+Name, At-risk package, Type, Usage, Expires In, Contact

**Risk Level Criteria** (per spec):
| Level | Criteria |
|-------|----------|
| High | ≤30 days OR ≤33% AND ≤3 remaining sessions |
| Medium | ≤60 days OR ≤60% AND ≤15 remaining sessions |
| Low | ≥61 days AND ≥61% AND ≥16 remaining sessions |

---

### 2. Schedule Stats - Real Comparison Calculations
**File**: `src/pages/Schedule.tsx` (lines 85-109)

**Current State**: Hardcoded comparison values (+5, -10, +8, -50)

**Required Fix**:
```typescript
// Current (hardcoded)
comparison={{ value: 5, label: t('dashboard.comparedToYesterday') }}

// Should be (calculated)
comparison={{ 
  value: stats?.classesCountDiff || 0, 
  label: t('dashboard.comparedToYesterday') 
}}
```

**Changes needed**:
- Update `useScheduleStats` hook to fetch yesterday's data
- Calculate actual differences for all 4 stats

---

### 3. Dashboard High Risk Members - Actual Expiry Dates
**File**: `src/hooks/useDashboardStats.ts` (line 106)

**Current State**: `expiryDate: 'Soon'` is hardcoded

**Required Fix**:
- Join with `member_packages` table
- Get actual nearest expiry date per member
- Format as "X days" or actual date

---

### 4. Reports Navigation - Make Report Cards Functional
**File**: `src/pages/Reports.tsx`

**Current State**: All cards show toast "Coming Soon"

**Required Changes**:
- "Members at Risk" card → Navigate to `/report/member/members-at-risk`
- Other cards → Keep toast (future development)

---

## Implementation Plan

### Step 1: Create Reports Hook
**File**: `src/hooks/useReports.ts`
```typescript
export function useMembersAtRiskStats() {
  // Calculate risk levels based on member_packages data
  // Return: { highRisk, mediumRisk, lowRisk, members }
}
```

### Step 2: Create Members at Risk Page
**File**: `src/pages/reports/MembersAtRisk.tsx`
- Back button navigation
- Pie chart using recharts
- Risk level definition cards
- Filter buttons with counts
- DataTable with member list

### Step 3: Update Schedule Stats Hook
**File**: `src/hooks/useSchedule.ts`
- Add `useScheduleStatsWithComparison` function
- Query both current and previous day
- Return diff values

### Step 4: Fix Dashboard High Risk Members
**File**: `src/hooks/useDashboardStats.ts`
- Update `useHighRiskMembers` query
- Join member_packages for expiry_date
- Calculate days until expiry

### Step 5: Update Reports Page Navigation
**File**: `src/pages/Reports.tsx`
- Replace toast with navigation for implemented reports
- Keep toast for "Coming Soon" reports

### Step 6: Update Routes
**File**: `src/App.tsx`
- Add route: `/report/member/members-at-risk`

---

## Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `src/pages/reports/MembersAtRisk.tsx` | Create | New page with chart + table |
| `src/hooks/useReports.ts` | Create | Risk calculation hooks |
| `src/hooks/useSchedule.ts` | Modify | Add comparison calculations |
| `src/hooks/useDashboardStats.ts` | Modify | Fix expiry date query |
| `src/pages/Reports.tsx` | Modify | Add navigation to implemented reports |
| `src/pages/Schedule.tsx` | Modify | Use real comparison values |
| `src/App.tsx` | Modify | Add report route |
| `src/i18n/locales/en.ts` | Modify | Add report-related keys |
| `src/i18n/locales/th.ts` | Modify | Add Thai translations |

**Total**: 9 files (2 new, 7 modified)

---

## Estimated Effort
| Task | Time |
|------|------|
| Reports hook + Members at Risk page | 1.5h |
| Schedule stats comparison | 30min |
| Dashboard expiry dates fix | 30min |
| i18n updates | 15min |
| Testing | 30min |
| **Total** | ~3 hours |

---

## Technical Notes

### Pie Chart Implementation (recharts)
```typescript
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#FF6B6B', '#1ABFA8']; // High risk, Low risk

<ResponsiveContainer width="100%" height={200}>
  <PieChart>
    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%">
      {data.map((_, index) => (
        <Cell key={index} fill={COLORS[index]} />
      ))}
    </Pie>
  </PieChart>
</ResponsiveContainer>
```

### Risk Level Calculation Logic
```typescript
function calculateRiskLevel(pkg: MemberPackage): RiskLevel {
  const daysLeft = differenceInDays(pkg.expiry_date, new Date());
  const usagePercent = pkg.sessions_remaining 
    ? (pkg.sessions_remaining / pkg.package.sessions) * 100 
    : 100;
  
  if (daysLeft <= 30 || (usagePercent <= 33 && pkg.sessions_remaining <= 3)) {
    return 'high';
  }
  if (daysLeft <= 60 || (usagePercent <= 60 && pkg.sessions_remaining <= 15)) {
    return 'medium';
  }
  return 'low';
}
```

---

## Success Criteria
1. Members at Risk page displays pie chart with accurate percentages
2. Schedule page shows real comparison vs yesterday
3. Dashboard high risk members show actual expiry dates
4. "Members at Risk" report card navigates to detail page
5. All i18n keys work in both EN/TH
