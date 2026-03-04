

# Upgrade Announcements: Multi-Channel, Location Targeting & AI Draft Placeholder

## Current State
- `announcements` table has: `id`, `message`, `publish_date`, `end_date`, `status`, `created_by`, timestamps
- No `channels`, `target_locations`, or `location_ids` columns
- `announcements` is NOT in `supabase_realtime` publication
- CreateAnnouncementDialog has basic fields: message, publish/end date, status
- No edit capability, no channel toggles, no AI draft

## Plan

### 1. Database Migration

```sql
-- Add multi-channel + location targeting columns
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS channels jsonb DEFAULT '{"in_app": true, "line": false}'::jsonb,
  ADD COLUMN IF NOT EXISTS target_mode text DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS target_location_ids uuid[] DEFAULT '{}'::uuid[];

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
```

### 2. Update `useAnnouncements.ts`

- Add `channels`, `target_mode`, `target_location_ids` to `Announcement` interface and `AnnouncementFormData`
- Include new fields in select query and insert/update mutations

### 3. Update `CreateAnnouncementDialog.tsx`

- Add **Channels** section: Switch toggles for "In-App" (enabled) and "LINE" (disabled + tooltip "Coming soon")
- Add **Target Locations** section: Radio group "All locations" / "Specific locations" + multi-select location picker (using `useLocations`)
- Add **"AI Draft"** button (disabled, with tooltip "Coming soon") near the message field
- Add `pointer-events-auto` to Calendar components

### 4. Update `Announcements.tsx` (table)

- Add "Channels" column showing channel badges (in-app / LINE icons)
- Add "Target" column showing "All" or location count

### 5. Update `useRealtimeSync.ts`

- Add `'announcements'` to table union and invalidation map → `['announcements', 'announcement-stats']`

### 6. i18n Keys

Add under `announcements`: `channels`, `inApp`, `line`, `lineComingSoon`, `aiDraft`, `aiDraftComingSoon`, `targetLocations`, `allLocations`, `specificLocations`, `selectLocations`

## Files Summary

| Action | File |
|--------|------|
| Migration | Add `channels`, `target_mode`, `target_location_ids` + realtime |
| Modify | `src/hooks/useAnnouncements.ts` — extend types + queries |
| Modify | `src/components/announcements/CreateAnnouncementDialog.tsx` — channel toggles, location targeting, AI placeholder |
| Modify | `src/pages/Announcements.tsx` — new columns |
| Modify | `src/hooks/useRealtimeSync.ts` — add announcements table |
| Modify | `src/i18n/locales/en.ts` + `th.ts` — add keys |

No breaking changes. New columns have defaults so existing data is unaffected.

