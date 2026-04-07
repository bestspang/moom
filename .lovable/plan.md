

# Enhanced Member Package Management + Purchase with Promotions/Coupons/Discounts

## Current State

**MemberPackagesTab**: Read-only DataTable showing packages with status filter + "Purchase Package" button. No edit/delete actions.

**PurchasePackageDialog**: 3-step wizard (Select Package → Payment Details → Summary). No promotion, coupon, or manual discount support. Transaction records `discount_amount: 0` always.

**DB Schema supports it all**:
- `member_packages` has `activation_date`, `expiry_date`, `sessions_remaining`, `status` — all updatable
- `transactions` has `discount_amount` field
- `promotions` table has `discount_type`, `discount_value`, `percentage_discount`, `flat_rate_discount`, `promo_code`, `status`
- `promotion_redemptions` table tracks usage (discount_amount, gross_amount, net_amount, promo_code_used)
- `coupon_wallet` + `coupon_templates` for member coupons
- RLS: Operators can manage member_packages (UPDATE, DELETE allowed)

**Missing mutations**: No `useUpdateMemberPackage` or `useDeleteMemberPackage` hooks exist.

## Implementation Plan

### Part 1: Package Edit/Delete in MemberPackagesTab

| # | File | Change |
|---|------|--------|
| 1 | `src/hooks/useMemberDetails.ts` | Add `useUpdateMemberPackage` mutation (update activation_date, expiry_date, sessions_remaining, status) + `useDeleteMemberPackage` mutation |
| 2 | `src/components/members/tabs/MemberPackagesTab.tsx` | Add row actions column (Edit / Delete dropdown). Add `EditMemberPackageDialog` inline — form with: activation date, expiry date, sessions remaining, status. Add delete confirmation dialog. |

**Edit dialog fields**:
- วันเริ่มใช้ (Activation Date) — DatePicker
- วันหมดอายุ (Expiry Date) — DatePicker
- จำนวนครั้งคงเหลือ (Sessions Remaining) — number input
- สถานะ (Status) — select: active / ready_to_use / on_hold / completed / expired

**Delete**: Confirm dialog → delete from `member_packages` → activity log

### Part 2: Promotions + Coupons + Manual Discount in PurchasePackageDialog

Add a new section in **Step 2 (Payment Details)** with 3 discount options:

| # | File | Change |
|---|------|--------|
| 3 | `src/components/members/PurchasePackageDialog.tsx` | Add discount section in Step 2 with: (A) Promotion selector, (B) Coupon selector, (C) Manual discount input. Update VAT calculation in Step 3 to reflect discounts. Update `handleConfirm` to record discount in transaction + create `promotion_redemptions` row if promotion used |

**A) Promotion Selector**:
- Fetch active promotions that apply to selected package (`promotions` where status='active' + check `applicable_packages` or `promotion_packages` join table)
- Show dropdown with promotion name + discount info
- Calculate discount: percentage → `price * percentage_discount / 100` (capped by `max_redemption_value`), flat → `flat_rate_discount`

**B) Coupon Selector**:
- Fetch member's active coupons from `coupon_wallet` joined with `coupon_templates` where `status='active'` and `expires_at > now()`
- Show dropdown with coupon name + discount value
- Calculate: fixed → `discount_value`, percentage → `price * discount_value / 100` (capped by `max_discount`)

**C) Manual Discount**:
- Simple number input "ส่วนลดเพิ่มเติม (฿)" — direct baht amount

**Discount stacking**: promotion + coupon + manual → total discount. Cap at package price.

**Step 3 Summary update**: Show original price, promotion discount, coupon discount, manual discount, net price, VAT breakdown on net.

**On confirm**:
- Transaction: `discount_amount = totalDiscount`, `amount = netPrice`
- If promotion used: insert `promotion_redemptions` row + increment `usage_count`
- If coupon used: update `coupon_wallet` status → 'used', set `used_at`

### Part 3: i18n Keys

| # | File | Change |
|---|------|--------|
| 4 | `src/i18n/locales/en.ts` | Add keys: members.editPackage, members.deletePackage, members.confirmDeletePackage, members.activationDate, members.selectPromotion, members.selectCoupon, members.manualDiscount, members.discountSection, members.promotionDiscount, members.couponDiscount, members.originalPrice, members.netPrice |
| 5 | `src/i18n/locales/th.ts` | Thai translations for all above |

### Part 4: Docs

| # | File | Change |
|---|------|--------|
| 6 | `docs/DEVLOG.md` | Log changes |

## What stays the same
- All existing purchase logic (just extended, not rewritten)
- Member app purchase flow (separate page, unaffected)
- Promotions CRUD pages
- Coupon templates CRUD
- DB schema (no migrations needed — all fields already exist)
- RLS policies (operators already have full access)

## Smoke Test
1. Open Member Detail → Packages tab → see Edit/Delete actions per row
2. Edit a package: change expiry date → save → date updated in table
3. Edit a package: change sessions remaining → save → reflected
4. Delete a package → confirm → removed from list
5. Purchase Package → Step 2 → see promotion dropdown with active promotions
6. Select a promotion → discount reflected in Step 3 summary
7. Select a member coupon → additional discount shown
8. Enter manual discount → reflected in total
9. Confirm purchase → transaction has correct discount_amount
10. Confirm purchase with coupon → coupon status changes to 'used'
11. Existing purchase flow (no discount) still works unchanged

