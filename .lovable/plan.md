

# Fix: Cannot Delete Members (Foreign Key Constraint Violation)

## Problem (Verified)
Deleting a member fails silently because several child tables have **NO ACTION** foreign key constraints that block deletion when related records exist:

| Child Table | FK Column | Delete Rule | Impact |
|---|---|---|---|
| `activity_log` | `member_id` | NO ACTION | **Blocks** |
| `promotion_redemptions` | `member_id` | NO ACTION | **Blocks** |
| `leads` | `converted_member_id` | NO ACTION | **Blocks** |
| `transfer_slips` | `member_id` | NO ACTION | **Blocks** |

Other tables like `member_packages`, `member_notes`, `class_bookings`, etc. already have CASCADE — those are fine.

## Solution
Create a database function `delete_member_cascade` (SECURITY DEFINER) that:
1. Sets `member_id` to NULL in `activity_log`, `transfer_slips`, `promotion_redemptions`
2. Sets `converted_member_id` to NULL in `leads`
3. Sets `member_id` to NULL in `line_users`, `line_message_log`
4. Deletes the member (CASCADE handles the rest)

Then update `useMembers.ts` to call `supabase.rpc('delete_member_cascade', { p_member_id: id })` instead of direct `.delete()`.

## Files to Modify
- **DB migration**: Create `delete_member_cascade` function
- `src/hooks/useMembers.ts`: Update `useDeleteMember` and `useBulkDeleteMembers` to use RPC

## Risk
- Low: The function nullifies references (preserving audit trail) then deletes
- Activity log entries are preserved with `member_id = NULL` (audit integrity maintained)
- No existing behavior changes — just makes delete actually work

