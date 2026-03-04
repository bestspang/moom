

# Deep UX/UI Audit & Improvement Plan — Round 2

## Analysis Summary

After the previous round fixed sidebar labels, common i18n keys, export stubs, and search/tab ordering, several **remaining friction points** persist across copy polish, mobile UX, empty states, status display, and page-specific interaction gaps.

---

## Remaining Issues Found

### A. Status Labels Still Use Raw `replace('_', ' ')` (4 files)
**Files:** `Finance.tsx`, `TransferSlips.tsx`, `PromotionDetails.tsx`, `CreatePackage.tsx`
- `row.status?.replace('_', ' ')` displays "needs_review" as "needs review" (lowercase, unpolished)
- Should use proper translated labels like the Members/Leads/Staff pages already do

### B. Dashboard Empty States Are Generic & Cold
- Right sidebar cards show `t('common.noData')` = "No data to show" for high-risk members, hot leads, and birthdays
- No positive framing or CTAs. New users see 3 identical "No data to show" blocks
- No onboarding guidance when all stats are 0

### C. Finance Page Status Display Uses `as any` Cast
- `variant={getStatusVariant(row.status) as any}` — the `paid` and `voided` variants DO exist in StatusBadge, so the cast is unnecessary but harmless. The real issue is the raw `replace('_', ' ')` for the label text.

### D. Profile Page Is Bare Minimum
- Only first name, last name, email (disabled). No password change, no language preference, no notification settings.

### E. Notifications Page Type Filters Are Visually Heavy
- 5 checkboxes in a row with labels — takes too much visual space
- Should use compact pill/tag toggle buttons instead

### F. Mobile: Header Language Dropdown Wastes Space
- On mobile, language dropdown (`EN ▼`) takes up header real estate. Could be moved into user dropdown.

### G. Dashboard Sidebar Cards Not Actionable
- Birthday card shows names but no suggested action
- Hot leads show status badge but no "follow up" or "call" hint

### H. Contextual Empty Messages Still Missing
- Multiple DataTable instances still use generic `t('common.noData')` or search placeholder as empty message
- Need page-specific messages: "No check-ins today", "No classes scheduled", "No transactions found"

### I. Lobby Page Uses `(row as any).checkin_method`
- Type cast suggests `checkin_method` may not be in the query type

---

## Implementation Plan

### Phase 1: Status Label Polish (Quick Win)

**`src/pages/Finance.tsx`** (line 114)
- Replace `row.status?.replace('_', ' ')` with proper translated label using a local `getStatusLabel()` function mapping: `paid` → `t('transferSlips.paid')`, `pending` → `t('common.pending')`, `needs_review` → `t('transferSlips.needsReview')`, `voided` → `t('transferSlips.voided')`

**`src/pages/TransferSlips.tsx`** (line 77)
- Same pattern — add `getStatusLabel()` and use it instead of `replace('_', ' ')`

**`src/pages/PromotionDetails.tsx`** (line 231)
- Replace `promo.type?.replace('_', ' ')` with translated type label

**`src/pages/CreatePackage.tsx`** (line 864)
- Replace `watchAll.usageType.replace('_', ' ')` with `getUsageTypeLabel(watchAll.usageType)`

### Phase 2: Dashboard Onboarding & Empty States

**`src/pages/Dashboard.tsx`**
- Replace 3 identical "No data to show" empty messages with contextual positive messages:
  - High risk: "All members are in good standing" (positive framing)
  - Hot leads: "No hot leads right now" with CTA "Create a lead"
  - Birthdays: "No upcoming birthdays this week"
- Add a **Setup Checklist** card that appears when `stats.checkinsToday === 0 && stats.classesToday === 0`:
  - Check: location exists, class exists, package exists, member exists
  - Show as a compact card with progress indicator and links to create each
  - Dismissible via localStorage

**`src/i18n/locales/en.ts` & `th.ts`**
- Add keys: `dashboard.noHighRisk`, `dashboard.noHotLeads`, `dashboard.noBirthdays`, `dashboard.setupChecklist.*`

### Phase 3: Contextual Empty Messages Across Pages

Replace generic empty messages in these DataTable instances:
- **Lobby**: "No check-ins today" instead of "No data to show"
- **Schedule**: "No classes scheduled for this date"
- **Finance**: "No transactions found"
- **Transfer Slips**: "No transfer slips found"
- **Rooms**: "No rooms created yet"
- **Classes**: "No classes created yet"
- **Staff**: "No staff members found"

Add corresponding i18n keys to both locale files.

### Phase 4: Notifications Pill Filters

**`src/pages/Notifications.tsx`**
- Replace checkbox-based type filters with compact pill/tag toggle buttons (same pattern as the status filter buttons already on the page)
- Each type becomes a small `Button variant={selected ? 'default' : 'outline'} size="sm"` with the notification icon + label
- Removes visual heaviness of 5 checkbox rows

### Phase 5: Header Mobile Optimization

**`src/components/layout/Header.tsx`**
- Move language toggle into user dropdown menu on mobile (keep it in header on desktop)
- Add a separator between profile info and language/logout items
- This saves ~44px of header space on mobile

### Phase 6: Profile Page Enhancement

**`src/pages/Profile.tsx`**
- Add a "Change Password" section with current password + new password + confirm fields
- Add a "Language Preference" dropdown (EN/TH) that calls `setLanguage()`
- Add a "Danger Zone" section with account info (member since, role display)

---

## Files to Touch

| File | Change | Risk |
|------|--------|------|
| `src/pages/Finance.tsx` | Translated status labels | Low |
| `src/pages/TransferSlips.tsx` | Translated status labels | Low |
| `src/pages/PromotionDetails.tsx` | Translated type label | Low |
| `src/pages/CreatePackage.tsx` | Translated usage type label | Low |
| `src/pages/Dashboard.tsx` | Onboarding checklist + contextual empty states | Low |
| `src/pages/Notifications.tsx` | Pill filters instead of checkboxes | Low |
| `src/pages/Lobby.tsx` | Contextual empty message | Low |
| `src/pages/Schedule.tsx` | Contextual empty message | Low |
| `src/pages/Staff.tsx` | Contextual empty message | Low |
| `src/pages/Rooms.tsx` | Contextual empty message | Low |
| `src/pages/Profile.tsx` | Password change + language + danger zone | Medium |
| `src/components/layout/Header.tsx` | Mobile language toggle in user dropdown | Low |
| `src/i18n/locales/en.ts` | New contextual empty state keys | Low |
| `src/i18n/locales/th.ts` | Same | Low |

No DB changes. No security changes. All UI/UX improvements.

