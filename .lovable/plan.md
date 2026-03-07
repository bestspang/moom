

# Fix: "Purchase package for this member" Button

## Problem
The "Purchase package for this member" button on `MemberDetails.tsx` (line 656) has **no `onClick` handler** — it's a dead button. No dialog, no navigation, no action.

## Solution
Create a **Purchase Package Dialog** that lets staff:
1. Search and select a package from the `packages` table (on_sale only)
2. Assign it to the current member by inserting into `member_packages`
3. Set initial values: `status = 'ready_to_use'`, `sessions_remaining = package.sessions`, `purchase_date = today`

This is an **internal assignment flow** (staff assigns package to member), not a Stripe checkout. The existing Stripe flow is for external payment processing — this is for manually recording a purchase or comp.

## Files to Create
- **`src/components/members/PurchasePackageDialog.tsx`** — Dialog with:
  - Searchable package list (using `usePackages('on_sale', search)`)
  - Shows package name, price, sessions, type
  - Select → Confirm → Insert into `member_packages`
  - Activity log entry on success

## Files to Modify
- **`src/hooks/useMemberDetails.ts`** — Add `useAssignPackageToMember` mutation hook:
  - Inserts into `member_packages` with `member_id`, `package_id`, sessions from package, `purchase_date = now`, `status = 'ready_to_use'`
  - Invalidates `['member-packages']`, `['members-enrichment']`
  - Logs `package_assigned` activity
- **`src/pages/MemberDetails.tsx`** — Import dialog, add state, wire button's `onClick` to open dialog

## No DB Changes Needed
`member_packages` table already supports direct inserts with the required fields.

