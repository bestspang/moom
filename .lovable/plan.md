

# Announcements Data Complete (`announcements_data_complete_01`)

## Current State

| Area | Status |
|------|--------|
| DB table `announcements` | ✅ Exists |
| CRUD hooks + activity logging | ✅ Working |
| Realtime sync | ✅ Wired in `useRealtimeSync` |
| Create dialog (channels, target, dates) | ✅ Working |
| List page with tabs + search + delete | ✅ Working |

## Gaps

### GAP 1: Missing auth guard
Same empty-list bug. `useAnnouncements` and `useAnnouncementStats` have no `enabled: !!user`.

### GAP 2: No bilingual messages
DB has single `message` column. Requirement: `message_en` (required) + `message_th` (optional). Need migration to add columns and update form + list.

### GAP 3: Status manually set instead of computed from dates
Currently status is a manual dropdown. Requirement: status should be derived from `publish_date`/`end_date` vs `now()`. Two options:
- **Option A**: DB view — complex, requires changing all queries
- **Option B**: Client-side computation — simple, compute status from dates when reading. Remove status dropdown from create form.

**Recommendation**: Option B (client-side). Compute status on read. Remove the manual status selector from the create dialog. Keep the DB `status` column for indexing/filtering but auto-set it on insert based on dates.

### GAP 4: Stats use full-row fetch (1000-row limit)
`useAnnouncementStats` fetches all rows to count. Should use `head: true` with status filter — but since status should be computed, we need to count differently. Will compute stats client-side from the full list, or use 3 separate count queries with date-based WHERE.

**Recommendation**: 3 separate head-count queries using date comparisons instead of status column.

### GAP 5: No `announcement_locations` join table
Currently uses `target_location_ids uuid[]` array. The requirement asks for a proper join table. However, the current array approach works and is simpler. The join table is only needed if we want to query "all announcements for location X" efficiently.

**Recommendation**: Keep the array approach (already working). Skip the join table — it's unnecessary complexity for this use case.

### GAP 6: No LINE broadcast status field
Need to add `line_broadcast_status jsonb` column for future LINE integration.

### GAP 7: Missing DB indexes
No indexes on `status`, `publish_date`, `end_date`.

---

## Implementation Plan

### Step 1: DB migration
- Add `message_en text`, `message_th text` columns
- Add `line_broadcast_status jsonb` column
- Add indexes on `status`, `publish_date`, `end_date`
- Backfill: `UPDATE announcements SET message_en = message WHERE message_en IS NULL`

### Step 2: Fix `useAnnouncements.ts`
- Add `enabled: !!user` auth guard to all queries
- Update select to include `message_en`, `message_th`, `line_broadcast_status`
- Replace `useAnnouncementStats` with 3 head-count queries using date comparisons:
  - `scheduled`: `publish_date > now`
  - `active`: `publish_date <= now AND end_date >= now`
  - `completed`: `end_date < now`
- Update `AnnouncementFormData` to use `message_en`/`message_th` instead of `message`
- Auto-compute status on insert based on dates (no manual status)

### Step 3: Update `CreateAnnouncementDialog.tsx`
- Replace single `message` textarea with `message_en` (required) + `message_th` (optional)
- Remove manual status dropdown (auto-computed from dates)
- Keep channels + target location sections as-is

### Step 4: Update `Announcements.tsx` list page
- Show `message_en` or `message_th` based on current language
- Compute display status from dates client-side for badge rendering
- Tab filtering uses date-based queries (not status column)

### Step 5: i18n updates
- Add `announcements.messageEn`, `announcements.messageTh` keys

### Files to Touch

| File | Change |
|------|--------|
| DB migration | Add columns + indexes |
| `src/hooks/useAnnouncements.ts` | Auth guard, bilingual fields, date-based stats |
| `src/components/announcements/CreateAnnouncementDialog.tsx` | Bilingual message fields, remove status dropdown |
| `src/pages/Announcements.tsx` | Language-aware message display, date-based status |
| `src/i18n/locales/en.ts` | New keys |
| `src/i18n/locales/th.ts` | New keys |

No breaking changes. All additive (new columns nullable, old `message` column preserved).

