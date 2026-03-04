# Data Contract — Rooms (Room Layouts)

## Table: `rooms`

| UI Field | DB Column | Type | Required | Default | Notes |
|---|---|---|---|---|---|
| Room name (EN) | `name` | text | ✅ | — | Primary display name |
| Room name (TH) | `name_th` | text | ❌ | null | Thai name, searched via `or` filter |
| Location | `location_id` | uuid FK→locations | ❌ (nullable) | null | Must match schedule location |
| Layout type | `layout_type` | enum `room_layout_type` | ❌ | `'open'` | Values: `open`, `fixed` |
| Max capacity | `max_capacity` | integer | ❌ | 20 | Schedule defaults to this |
| Categories | `categories` | text[] | ❌ | `'{}'` | Empty = all categories allowed |
| Status | `status` | enum `room_status` | ❌ | `'open'` | Values: `open`, `closed` |
| Created at | `created_at` | timestamptz | — | `now()` | Auto |
| Updated at | `updated_at` | timestamptz | — | `now()` | Auto |

## Categories Availability Logic

- `categories = '{}'` (empty array) → **All categories** allowed
- `categories = '{CrossFit,Yoga}'` → Only listed category names allowed
- Schedule validation RPC (`create_schedule_with_validation`) checks compatibility

## Queries & Cache Keys

| Query | Key | Hook |
|---|---|---|
| Room list (filtered) | `['rooms', status, search, categoryFilter]` | `useRooms(status, search, categoryFilter)` |
| Room stats | `['room-stats']` | `useRoomStats()` |
| Single room | `['rooms', id]` | `useRoom(id)` |

## Activity Log Events

| Event | `event_type` | `entity_type` | Logged Values |
|---|---|---|---|
| Create | `room_created` | `room` | `new_value`: name, name_th, location_id, layout_type, max_capacity, categories |
| Update | `room_updated` | `room` | `new_value`: changed fields |
| Delete | `room_deleted` | `room` | — |

## Schedule Integration

- `create_schedule_with_validation` RPC enforces:
  1. Room belongs to selected location (`room.location_id = schedule.location_id`)
  2. Category compatibility (class category must be in `room.categories` or categories is empty)
  3. No time overlap for same room on same date
  4. Capacity defaults to `room.max_capacity` when not explicitly set

## Realtime

- `useRealtimeSync` listens to `rooms` table changes → invalidates `['rooms']`, `['room-stats']`

## RLS Policies

- **SELECT**: All authenticated users can read rooms
- **ALL**: Managers (level_3+) can manage rooms
