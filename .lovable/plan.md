

# LINE Linking Architecture — Implementation Plan

## Current State

- **`line_users` table** already exists with: `id`, `user_id`, `member_id`, `line_user_id` (unique), `line_display_name`, `line_picture_url`, `linked_at`, `last_login_at`. No `owner_type` or `lead_id` support — it only links to members.
- **`members` table** has `line_user_id`, `line_display_name`, `line_picture_url`, `line_link_status` columns (denormalized).
- **`leads` table** has the same LINE columns.
- **`useLineUsers.ts`** hook exists with member-focused queries only.
- **MemberDetails page** has no LINE section in the sidebar.
- **Leads page** has no detail view (only table rows).

## Problem

The `line_users` table only supports member linking (`member_id`). To support leads and staff, we need to extend it with a polymorphic owner pattern OR add a `lead_id` column. The request asks for `owner_type` enum + `owner_id` — but that breaks FK integrity. A simpler approach: add `lead_id` and `staff_id` nullable columns to `line_users`, matching the existing `member_id` pattern.

## Plan

### 1. Database Migration — Extend `line_users`

```sql
ALTER TABLE line_users ADD COLUMN lead_id uuid REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE line_users ADD COLUMN staff_id uuid REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE line_users ADD COLUMN status text DEFAULT 'unlinked';
-- Add RLS for managers to link/unlink
```

Add RLS policy: managers+ can manage all LINE identity records (already partially covered by existing policies, but we add explicit manager-level for link/unlink operations).

### 2. Create `src/hooks/useLineIdentity.ts`

New hook file with:
- **`useLineIdentity(ownerType: 'member'|'lead'|'staff', ownerId: string)`** — fetches from `line_users` where the matching `_id` column equals `ownerId`
- **`useRequestLineLink(ownerType, ownerId)`** — mutation that upserts a `line_users` row with `status: 'pending'` (stub — no actual LINE OAuth yet, just sets the status)
- **`useUnlinkLineIdentity(ownerType, ownerId)`** — deletes the `line_users` row

### 3. Create `src/components/common/LineIdentityCard.tsx`

Reusable card component:
- Props: `ownerType`, `ownerId`
- Uses `useLineIdentity` to fetch status
- Shows: status badge (unlinked/pending/linked), display name + picture if linked, "Link LINE" button (sets to pending), "Unlink" if linked
- Disabled state with tooltip for future OAuth flow

### 4. Add LINE section to MemberDetails sidebar

In `src/pages/MemberDetails.tsx`, after the Contact card (~line 296), add `<LineIdentityCard ownerType="member" ownerId={member.id} />`.

### 5. Leads page — no detail page exists

Since there's no Lead detail page, we skip adding LINE UI to leads for now. The data model supports it via `lead_id` on `line_users`.

### 6. i18n keys

Add to both `en.ts` and `th.ts`:
- `line.status`, `line.linked`, `line.pending`, `line.unlinked`, `line.linkLine`, `line.unlinkLine`, `line.linkRequested`, `line.displayName`, `line.comingSoon`

---

## Files Summary

| Action | File |
|--------|------|
| Migration | Add `lead_id`, `staff_id`, `status` to `line_users` + manager RLS |
| Create | `src/hooks/useLineIdentity.ts` |
| Create | `src/components/common/LineIdentityCard.tsx` |
| Modify | `src/pages/MemberDetails.tsx` — add LINE card to sidebar |
| Modify | `src/i18n/locales/en.ts` — LINE keys |
| Modify | `src/i18n/locales/th.ts` — LINE keys |

No breaking changes. Existing `line_users` data preserved. All new columns nullable.

