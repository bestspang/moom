

# Merge Bookings into Schedule + Add Shop (Coming Soon)

## Current State
- `MemberSchedulePage` shows upcoming classes only
- `MemberBookingsPage` is a separate page at `/member/bookings`
- Bottom nav: Home, Schedule, Check In, Coupons, Profile (no Bookings/Shop)
- Bookings are linked from MemberHomePage ("Next Up" section)

## Plan

### 1. Add "My Bookings" tab to MemberSchedulePage
Add tabs at the top: **Schedule** | **My Bookings**
- Schedule tab = current schedule view (unchanged)
- My Bookings tab = current bookings content (filter chips + booking list)
- This merges both views into one page

### 2. Create MemberShopPage (Coming Soon)
New file `src/apps/member/pages/MemberShopPage.tsx` — simple coming soon with a Shop icon and friendly message.

### 3. Update routes in App.tsx
- Add `/member/shop` route → `MemberShopPage`
- Redirect `/member/bookings` → `/member/schedule` (backward compat)

### 4. Update bottom nav
Replace **Coupons** with **Shop** (using `ShoppingBag` icon) pointing to `/member/shop`.
Move Coupons access to profile or momentum page instead.

### 5. Update MemberHomePage links
Change any "View all bookings" links to point to `/member/schedule` instead of `/member/bookings`.

## Files
| File | Change |
|------|--------|
| `MemberSchedulePage.tsx` | Add tabs with embedded bookings view |
| `MemberShopPage.tsx` | New — Coming Soon |
| `MemberBottomNav.tsx` | Coupons → Shop |
| `App.tsx` | Add shop route, redirect bookings |
| `MemberHomePage.tsx` | Update booking links to schedule |

