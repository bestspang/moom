# Data Contract — Full System

> Source of truth for every entity's UI fields → DB storage mapping.
> Last updated: 2026-03-04

---

## 1. Members

**Table:** `members`

| UI Field | Column | Type | Required | Notes |
|----------|--------|------|----------|-------|
| First name | `first_name` | text | ✅ | |
| Last name | `last_name` | text | ✅ | |
| Member ID | `member_id` | text | ✅ | Human-readable, unique |
| Nickname | `nickname` | text | | |
| Email | `email` | text | | |
| Phone | `phone` | text | | |
| Date of birth | `date_of_birth` | date | | |
| Gender | `gender` | enum | | male/female/other |
| Address | `address` | text | | Legacy single field |
| Status | `status` | enum | | active/inactive/suspended |
| Risk level | `risk_level` | enum | | low/medium/high |
| Member since | `member_since` | timestamptz | | |
| Total spent | `total_spent` | numeric | | |
| Avatar | `avatar_url` | text | | |
| Tax ID | `tax_id` | text | | |
| Notes | `notes` | text | | |
| Source | `source` | text | | walk_in/referral/social_media/website/other |
| Register location | `register_location_id` | uuid FK | | → locations |
| Package interest | `package_interest_id` | uuid FK | | → packages |
| Emergency name | `emergency_contact_name` | text | | |
| Emergency phone | `emergency_contact_phone` | text | | |
| Emergency relationship | `emergency_relationship` | text | | |
| Medical | `medical` | jsonb | | { has_conditions, notes, allow_physical_contact, physical_contact_notes } |
| Consents | `consents` | jsonb | | |
| LINE fields | `line_user_id`, `line_display_name`, `line_picture_url`, `line_link_status` | text | | Denormalized; canonical in `line_users` |
| AI fields | `ai_profile_summary`, `ai_risk_signals`, `ai_tags` | jsonb/text | | |

**Sub-resources (separate tables):**
- `member_packages` — purchased packages
- `member_attendance` — check-in history
- `member_billing` — billing records
- `member_injuries` — injury records
- `member_notes` — staff notes
- `member_suspensions` — suspension periods
- `member_contracts` — contracts & documents

**Activity log events:** `member_created`, `member_updated`, `member_deleted`
**Realtime keys:** `['members']`, `['member', id]`

---

## 2. Leads

**Table:** `leads`

| UI Field | Column | Type | Required |
|----------|--------|------|----------|
| First name | `first_name` | text | ✅ |
| Last name | `last_name` | text | |
| Nickname | `nickname` | text | |
| Phone | `phone` | text | |
| Email | `email` | text | |
| Gender | `gender` | text | |
| Date of birth | `date_of_birth` | date | |
| Address | `address` | text | |
| Status | `status` | enum | | new/contacted/interested/not_interested/converted |
| Source | `source` | text | |
| Notes | `notes` | text | |
| Times contacted | `times_contacted` | int | |
| Last contacted | `last_contacted` | timestamptz | |
| Register location | `register_location_id` | uuid FK | |
| Package interest | `package_interest_id` | uuid FK | |
| Converted member | `converted_member_id` | uuid FK | |
| LINE fields | `line_*` | text | |
| AI fields | `ai_summary`, `ai_tags` | jsonb/text | |

**Activity log events:** `lead_created`, `lead_updated`, `lead_deleted`, `lead_converted`

---

## 3. Staff

**Table:** `staff`

| UI Field | Column | Type | Required |
|----------|--------|------|----------|
| First name | `first_name` | text | ✅ |
| Last name | `last_name` | text | ✅ |
| Nickname | `nickname` | text | |
| Phone | `phone` | text | |
| Email | `email` | text | |
| Date of birth | `date_of_birth` | date | |
| Gender | `gender` | text | |
| Status | `status` | enum | | pending/active/terminated |
| Address fields | `address_1`, `address_2`, `subdistrict`, `district`, `province`, `postal_code` | text | |
| Avatar | `avatar_url` | text | |
| Role (legacy) | `role_id` | uuid FK | | → roles |

**Positions:** `staff_positions` table
- `staff_id` → staff
- `role_id` → roles
- `scope_all_locations` (bool)
- `location_ids` (uuid[])

**Activity log events:** `staff_created`, `staff_updated`, `staff_deleted`, `staff_invited`

---

## 4. Locations

**Table:** `locations`

| UI Field | Column | Type | Required |
|----------|--------|------|----------|
| Location ID | `location_id` | text | ✅ |
| Name | `name` | text | ✅ |
| Contact number | `contact_number` | text | |
| Status | `status` | enum | | open/closed |
| Categories | `categories` | text[] | |
| Opening hours | `opening_hours` | jsonb | |

**Activity log events:** `location_created`, `location_updated`

---

## 5. Classes

**Table:** `classes`

| UI Field | Column | Type | Required |
|----------|--------|------|----------|
| Name | `name` | text | ✅ |
| Description | `description` | text | |
| Type | `type` | enum | | class/pt |
| Category | `category_id` | uuid FK | | → class_categories |
| Level | `level` | enum | | all_levels/beginner/intermediate/advanced |
| Duration | `duration` | int | | minutes |
| Status | `status` | text | | active/drafts/archive |

**Activity log events:** `class_created`, `class_updated`, `class_deleted`

---

## 6. Class Categories

**Table:** `class_categories`

| UI Field | Column | Type | Required |
|----------|--------|------|----------|
| Name | `name` | text | ✅ |
| Description | `description` | text | |

**Activity log events:** `class_category_created`, `class_category_updated`, `class_category_deleted`

---

## 7. Rooms

**Table:** `rooms`

| UI Field | Column | Type | Required |
|----------|--------|------|----------|
| Name | `name` | text | ✅ |
| Name (TH) | `name_th` | text | |
| Location | `location_id` | uuid FK | |
| Max capacity | `max_capacity` | int | |
| Status | `status` | enum | | open/closed |
| Layout type | `layout_type` | enum | | open/fixed |
| Categories | `categories` | text[] | |

**Activity log events:** `room_created`, `room_updated`, `room_deleted`

---

## 8. Schedule

**Table:** `schedule`

| UI Field | Column | Type | Required |
|----------|--------|------|----------|
| Class | `class_id` | uuid FK | ✅ |
| Trainer | `trainer_id` | uuid FK | |
| Room | `room_id` | uuid FK | |
| Location | `location_id` | uuid FK | |
| Date | `scheduled_date` | date | ✅ |
| Start time | `start_time` | time | ✅ |
| End time | `end_time` | time | ✅ |
| Capacity | `capacity` | int | |
| Checked in | `checked_in` | int | |
| Status | `status` | enum | | scheduled/in_progress/completed/cancelled |

**Activity log events:** `schedule_created`, `schedule_updated`, `schedule_deleted`

---

## 9. Packages

**Table:** `packages`

| UI Field | Column | Type | Required |
|----------|--------|------|----------|
| Name (EN) | `name_en` | text | ✅ |
| Name (TH) | `name_th` | text | |
| Type | `type` | enum | ✅ | unlimited/session/pt |
| Price | `price` | numeric | ✅ |
| Term days | `term_days` | int | ✅ |
| Expiration days | `expiration_days` | int | ✅ |
| Sessions | `sessions` | int | |
| Status | `status` | enum | | on_sale/scheduled/drafts/archive |
| ... (20+ fields) | see types.ts | | |

**Activity log events:** `package_created`, `package_updated`, `package_deleted`, `package_archived`

---

## 10. Promotions

**Table:** `promotions`

| UI Field | Column | Type | Required |
|----------|--------|------|----------|
| Name | `name` | text | ✅ |
| Discount value | `discount_value` | numeric | ✅ |
| Discount type | `discount_type` | text | |
| Promo code | `promo_code` | text | |
| Status | `status` | enum | |
| Applicable packages | `applicable_packages` | uuid[] | |

**Activity log events:** `promotion_created`, `promotion_updated`

---

## 11. Finance / Transactions

**Table:** `transactions`

| UI Field | Column | Type | Required |
|----------|--------|------|----------|
| Transaction ID | `transaction_id` | text | ✅ |
| Order name | `order_name` | text | ✅ |
| Amount | `amount` | numeric | ✅ |
| Status | `status` | enum | | pending/paid/voided/needs_review |
| Payment method | `payment_method` | enum | |
| Transfer slip URL | `transfer_slip_url` | text | |

**Activity log events:** `transaction_status_updated`

---

## 12. Announcements

**Table:** `announcements`

| UI Field | Column | Type | Required |
|----------|--------|------|----------|
| Message | `message` | text | ✅ |
| Status | `status` | enum | |
| Publish date | `publish_date` | timestamptz | |
| End date | `end_date` | timestamptz | |
| Channels | `channels` | jsonb | | { in_app, line } |
| Target mode | `target_mode` | text | |
| Target locations | `target_location_ids` | uuid[] | |

**Activity log events:** `announcement_created`, `announcement_updated`, `announcement_deleted`

---

## 13. Workouts

**Tables:** `training_templates` + `workout_items`

**training_templates:**
- `name` (text, required)
- `is_active` (bool)
- `ai_tags` (jsonb)

**workout_items:**
- `training_id` (uuid FK)
- `name` (text, required)
- `track_metric`, `unit`, `goal_type`, `description` (text)
- `sort_order` (int)
- `ai_cues` (jsonb)

**Activity log events:** `training_created`, `training_updated`

---

## 14. Roles & Permissions

**Tables:** `roles` + `role_permissions`

**roles:** `name`, `access_level`, `description`, `permissions` (jsonb), `ai_policy` (jsonb)
**role_permissions:** `role_id`, `resource`, `can_read`, `can_write`, `can_delete`

**Activity log events:** `role_updated`

---

## 15. Settings

**Table:** `settings`

Sections: `general`, `class`, `client`, `package`, `contracts`
Each row: `section` + `key` + `value` (jsonb)

**Activity log events:** `setting_updated`

---

## 16. Bookings & Waitlist

**Tables:** `class_bookings`, `class_waitlist`

**Activity log events:** `booking_created`, `booking_cancelled`, `attendance_marked`

---

## 17. LINE Identity

**Table:** `line_users` (normalized)
Links via `member_id`, `lead_id`, `staff_id`, `user_id`

---

## 18. Notifications

**Table:** `notifications`
User-scoped, no activity log needed.

---

## Realtime Subscriptions

All covered in `useRealtimeSync.ts`:
members, leads, staff, staff_positions, roles, role_permissions, locations, schedule, rooms, classes, class_categories, class_bookings, member_attendance, packages, promotions, transactions, training_templates, workout_items, announcements, activity_log, notifications, settings
