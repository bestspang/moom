

# Remove Attendance & Referral from QuickMenuStrip + Fix Missing Translation Keys

## Problem
1. User wants to remove "การเข้าร่วม" (Attendance) and "ชวนเพื่อน" (Invite Friends) from the quick menu strip
2. Some labels show raw i18n keys (e.g. `member.couponsTitle`, `member.attendanceTitle`) because those keys don't exist in the translation files

## Changes

### `src/apps/member/components/QuickMenuStrip.tsx`
- Remove the Attendance item (`/member/attendance`) and Referral item (`/member/referral`) from `quickItems`
- Fix `t('member.couponsTitle')` → `t('member.myCoupons')` (correct existing key: "คูปองของฉัน")
- Remove unused imports: `ClipboardList`, `Share2`

**Resulting `quickItems`:**
| Icon | Label key | Route |
|------|-----------|-------|
| PersonStanding | `member.runClub` | `/member/run-club` |
| Ticket | `member.myCoupons` | `/member/coupons` |
| Package | `member.packages` | `/member/packages` |

Attendance and Referral remain in `allPages` (More dialog) with corrected keys:
- Attendance label: `t('member.attendanceHistory')` (existing key: "ประวัติการเข้าร่วม")
- Referral label: `t('member.inviteFriendsTitle')` stays (exists: "ชวนเพื่อน")

