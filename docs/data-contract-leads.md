# Lead Data Contract

## Table: `leads`

### Profile Fields
| UI Field | DB Column | Type | Required | Validation |
|----------|-----------|------|----------|------------|
| First name | `first_name` | text | Yes | min 1, max 100 |
| Last name | `last_name` | text | No | max 100 |
| Nickname | `nickname` | text | No | max 50 |
| Gender | `gender` | text | No | enum: male/female/other |
| Date of birth | `date_of_birth` | date | No | valid date |

### Contact Fields
| UI Field | DB Column | Type | Required | Validation |
|----------|-----------|------|----------|------------|
| Phone | `phone` | text | phone OR email required | max 20 |
| Email | `email` | text | phone OR email required | valid email |

### Source/Location
| UI Field | DB Column | Type | Required | Validation |
|----------|-----------|------|----------|------------|
| Source | `source` | text | No | enum: walk_in/referral/social_media/website/other |
| Register location | `register_location_id` | uuid FK→locations | No | valid location id |

### Address Fields
| UI Field | DB Column | Type | Required |
|----------|-----------|------|----------|
| Address line 1 | `address_1` | text | No |
| Address line 2 | `address_2` | text | No |
| Subdistrict | `subdistrict` | text | No |
| District | `district` | text | No |
| Province | `province` | text | No |
| Postal code | `postal_code` | text | No |
| Address (legacy) | `address` | text | No (backward compat) |

### Emergency Contact
| UI Field | DB Column | Type | Required |
|----------|-----------|------|----------|
| Emergency name | `emergency_first_name` | text | No |
| Emergency last name | `emergency_last_name` | text | No |
| Emergency phone | `emergency_phone` | text | No |
| Relationship | `emergency_relationship` | text | No |

### Medical
| UI Field | DB Column | Type | Default |
|----------|-----------|------|---------|
| Has medical conditions | `has_medical_conditions` | boolean | false |
| Medical notes | `medical_notes` | text | null |

### Consent
| UI Field | DB Column | Type | Default |
|----------|-----------|------|---------|
| Allow physical contact | `allow_physical_contact` | boolean | false |
| Physical contact notes | `physical_contact_notes` | text | null |

### Other
| UI Field | DB Column | Type | Required |
|----------|-----------|------|----------|
| Package interest | `package_interest_id` | uuid FK→packages | No |
| Internal notes | `internal_notes` | text | No |
| Notes | `notes` | text | No |
| Temperature | `temperature` | text | No (hot/cold) |

### Sales Tracking (system-managed)
| Field | DB Column | Type | Default |
|-------|-----------|------|---------|
| Status | `status` | lead_status enum | 'new' |
| Times contacted | `times_contacted` | integer | 0 |
| Last contacted | `last_contacted` | timestamptz | null |
| Last attended | `last_attended` | timestamptz | null |
| Converted member ID | `converted_member_id` | uuid FK→members | null |
| Created at | `created_at` | timestamptz | now() |
| Updated at | `updated_at` | timestamptz | now() |

## Activity Log Event Types
| Action | event_type | entity_type |
|--------|-----------|-------------|
| Create lead | `lead_created` | lead |
| Update lead | `lead_updated` | lead |
| Delete lead | `lead_deleted` | lead |
| Bulk import | `lead_bulk_import` | lead |
| Convert to member | `lead_converted` | lead |

## Query Keys
- `leads` — list query
- `hot-leads` — dashboard widget

## Realtime
- Table `leads` is in realtime publication
- Invalidates: `leads`, `hot-leads`

## CSV Import
- Upsert: match by phone → email
- Required: first_name, phone OR email
- Supported date formats: YYYY-MM-DD, DD/MM/YYYY

## CSV Export
- Columns: first_name, last_name, nickname, phone, email, status, temperature, times_contacted, last_contacted, last_attended, source
