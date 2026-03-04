

# Member Details Data Completion Plan

## Current State Analysis

**What works:**
- All 8 DB tables exist with correct schemas (members, member_attendance, member_packages, member_billing, member_notes, member_injuries, member_suspensions, member_contracts)
- All query hooks load data correctly from DB
- Notes tab has create mutation
- Profile tab displays data (read-only)
- Package filtering by status works

**Gaps found:**

| Area | Gap |
|------|-----|
| **Mutations** | Only `createNote` and `updateMember` exist. No create injury, mark recovered, create/end suspension, upload contract. None call `logActivity`. |
| **Realtime** | `useRealtimeSync` doesn't invalidate `member-attendance`, `member-billing`, `member-injuries`, `member-notes`, `member-suspensions`, `member-contracts` |
| **Summary cards** | `total_spent` and `most_attended_category` use static member columns instead of computing from actual billing/attendance data |
| **Profile tab** | All fields are `readOnly` — no inline edit capability |
| **Action buttons** | "Purchase package", "Add billing", "Add injury", "Suspend", "Upload contract" buttons are either missing or non-functional stubs |
| **Activity logging** | Zero `logActivity` calls in any member detail mutation |

## Implementation Plan

### 1. Add all missing mutations + activity logging to `useMemberDetails.ts`

Add these mutation hooks (all with `logActivity` calls):
- `useCreateMemberInjury` — insert into `member_injuries`
- `useMarkInjuryRecovered` — update `is_active=false`, set `recovery_date`
- `useCreateMemberSuspension` — insert into `member_suspensions`, update `members.status='suspended'`
- `useEndMemberSuspension` — update `is_active=false`, set `end_date`
- `useCreateMemberContract` — insert into `member_contracts`
- Add `logActivity` to existing `useCreateMemberNote` and `useUpdateMember`

Each mutation invalidates its specific query key + `['member', id]`.

### 2. Update realtime sync to cover member detail tables

Add to `TABLE_INVALIDATION_MAP` in `useRealtimeSync.ts`:
- `member_notes` → `['member-notes']`
- `member_injuries` → `['member-injuries']`
- `member_suspensions` → `['member-suspensions']`
- `member_contracts` → `['member-contracts']`
- `member_billing` → `['member-billing']`

Also add `member-attendance` to the existing `member_attendance` entry.

### 3. Compute summary cards from actual data

Add a `useMemberSummaryStats` hook that computes:
- **Amount spent**: `SUM(amount)` from `member_billing` where `member_id = X`
- **Most attended category**: join `member_attendance` → `schedule` → `classes` → `class_categories`, group by category, pick top
- **Days until expiry**: already computed correctly from `member_packages`
- **Member since**: already from `member.member_since` / `created_at`

### 4. Add action buttons and dialogs on each tab

In `MemberDetails.tsx`, wire up existing stub buttons:
- **Injuries tab**: Add "Add injury" button + inline form (description, date, notes)
- **Suspensions tab**: Add "Suspend member" button + inline form (reason, start/end date)
- **Contract tab**: Add "Upload contract" button (file input → stores URL in `member_contracts`)
- **Profile tab**: Make fields editable with a "Save" button using `useUpdateMember`

### 5. Add i18n keys for new actions

Add translation keys for injury/suspension/contract action labels.

## Files Summary

| Action | File | Why |
|--------|------|-----|
| Modify | `src/hooks/useMemberDetails.ts` | Add 5 new mutation hooks + logActivity to all mutations |
| Modify | `src/hooks/useRealtimeSync.ts` | Add member detail tables to invalidation map |
| Modify | `src/pages/MemberDetails.tsx` | Wire action buttons, make profile editable, use computed stats |
| Modify | `src/i18n/locales/en.ts` | Add action labels |
| Modify | `src/i18n/locales/th.ts` | Add action labels |

No DB migrations needed — all tables and columns already exist.

