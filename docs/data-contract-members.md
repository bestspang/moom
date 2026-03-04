# Data Contract: Members

## Table: `members`

### Core Fields
| UI Field | DB Column | Type | Required | Notes |
|----------|-----------|------|----------|-------|
| First name | `first_name` | text | ✅ | |
| Last name | `last_name` | text | ✅ | |
| Nickname | `nickname` | text | | |
| Gender | `gender` | enum(male,female,other) | | |
| Date of birth | `date_of_birth` | date | | |
| Phone | `phone` | text | ✅* | *phone OR email required |
| Email | `email` | text | ✅* | *phone OR email required |
| Member ID | `member_id` | text | ✅ | Auto-generated M-NNNNNNN |
| Register location | `register_location_id` | uuid FK→locations | ✅ | |
| Status | `status` | enum(active,on_hold,suspended,inactive) | | Default: active |
| Is new | `is_new` | boolean | | Default: true |
| Member since | `member_since` | timestamptz | | |

### Address Fields
| UI Field | DB Column | Type | Required |
|----------|-----------|------|----------|
| Address (legacy) | `address` | text | |
| Address line 1 | `address_1` | text | |
| Address line 2 | `address_2` | text | |
| Sub-district | `subdistrict` | text | |
| District | `district` | text | |
| Province | `province` | text | |
| Postal code | `postal_code` | text | |

### Emergency Contact
| UI Field | DB Column | Type | Required |
|----------|-----------|------|----------|
| Contact name | `emergency_contact_name` | text | |
| Contact phone | `emergency_contact_phone` | text | |
| Relationship | `emergency_relationship` | text | |

### Medical & Consent (jsonb)
| UI Field | DB Path | Type | Required |
|----------|---------|------|----------|
| Has conditions | `medical.has_conditions` | boolean | |
| Medical notes | `medical.notes` | text | |
| Allow physical contact | `consents.allow_physical_contact` | boolean | |
| Physical contact notes | `consents.physical_contact_notes` | text | |

### Other
| UI Field | DB Column | Type | Required |
|----------|-----------|------|----------|
| Source | `source` | text | |
| Package interest | `package_interest_id` | uuid FK→packages | |
| Notes | `notes` | text | |

## Derived Columns (Members List)

| Column | Source | Query |
|--------|--------|-------|
| Recent package | `member_packages` + `packages` | Latest where status in (active, ready_to_use), join packages.name_en |
| Last attended | `member_attendance` | MAX(check_in_time) for member |
| Contract | `member_contracts` | EXISTS where is_signed = true |

Hook: `useMembersEnrichment` — query key `['members-enrichment', memberIds]`

## Activity Log Events

| Event Type | Trigger |
|------------|---------|
| `member_created` | Create member |
| `member_updated` | Update member |
| `member_deleted` | Delete member |

## Query Keys to Invalidate

| Change | Keys |
|--------|------|
| Member CRUD | `['members']`, `['member-stats']`, `['member', id]` |
| Package purchase | `['members-enrichment']`, `['member-packages']` |
| Check-in | `['members-enrichment']`, `['member-attendance']` |
| Contract upload | `['members-enrichment']`, `['member-contracts']` |

## Realtime

Table `members` is subscribed via `useRealtimeSync`. Changes invalidate `['members', 'member', 'member-stats', 'high-risk-members', 'upcoming-birthdays']`.

Tables `member_packages`, `member_attendance`, `member_contracts` also invalidate `['members-enrichment']`.
