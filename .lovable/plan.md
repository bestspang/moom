
## Goal
Upgrade the admin support-ticket inbox into a full workflow tool: statuses with tracked transitions, assignee, priority, powerful filtering + pagination, and a dedicated detail page with a timeline of updates and threaded internal notes.

## 1. Database (new migration)

Additive changes to `support_tickets`, plus two new tables. No breaking changes to the public submission form.

**Alter `support_tickets`:**
- Add `priority text NOT NULL DEFAULT 'normal'` with CHECK (`low`, `normal`, `high`, `urgent`).
- Add `assigned_to uuid REFERENCES staff(id) ON DELETE SET NULL`.
- Add `resolved_at timestamptz`, `closed_at timestamptz` (auto-stamped by trigger when status flips).
- Index: `(status, priority)`, `(assigned_to)`, `(created_at DESC)` (last one already exists — skip).
- Keep existing `admin_note` column for backward compat (drawer keeps working) but hide it in the new UI in favor of the notes thread.

**New `support_ticket_events` (activity timeline):**
Columns: `id`, `ticket_id (fk cascade)`, `actor_user_id`, `actor_name` (snapshot), `event_type` (`status_changed | priority_changed | assigned | note_added | reopened | created`), `from_value`, `to_value`, `metadata jsonb`, `created_at`.
- GRANT `SELECT, INSERT` to authenticated; ALL to service_role.
- RLS: SELECT/INSERT only for `has_min_access_level(auth.uid(),'level_3_manager')`.
- Trigger on `support_tickets` AFTER UPDATE auto-inserts `status_changed` / `priority_changed` / `assigned` events using `auth.uid()`.

**New `support_ticket_notes` (threaded internal notes):**
Columns: `id`, `ticket_id (fk cascade)`, `author_user_id`, `author_name`, `body text NOT NULL`, `created_at`.
- GRANT `SELECT, INSERT, DELETE` to authenticated; ALL to service_role.
- RLS: manager-only. DELETE only by author within 15 min (or admin).
- After-insert trigger writes a `note_added` event into `support_ticket_events`.

Both new tables added to `supabase_realtime` publication.

## 2. Hooks

Edit `src/hooks/useSupportTickets.ts`:
- Extend `SupportTicketFilters` with `priority`, `assigned_to` (`'me' | 'unassigned' | staff_id | 'all'`), `date_from`, `date_to`, `page`, `pageSize` (default 25).
- Switch list query to `count: 'exact'` and `range(from, to)` for pagination; return `{ rows, total }`.
- Add mutations: `useAssignTicket`, `useUpdatePriority`, `useAddInternalNote`, `useReopenTicket`.
- Add queries: `useSupportTicket(id)`, `useSupportTicketEvents(id)`, `useSupportTicketNotes(id)`.
- All mutations call `logActivity()` + toast + invalidate `queryKeys.supportTicket(id)` and list.

Update `src/lib/queryKeys.ts` and `src/hooks/useRealtimeSync.ts` `TABLE_INVALIDATION_MAP` for the two new tables.

## 3. Inbox list page (`/support-ticket`)

Rewrite `src/pages/SupportTickets.tsx` (keep file path, drop the Sheet-based detail):

- Header + Status tabs unchanged (New / In Progress / Resolved / Closed / All) — status transitions available inline: Open → In Progress → Resolved → Closed, with a "Reopen" action on resolved/closed rows.
- Filter bar row: Category, Priority, Assignee (`Me / Unassigned / any staff / All`), Date range (from/to via shadcn Popover + Calendar), Search.
- Table columns: Date · Ticket# · Priority (colored dot) · Category · Subject · From · Assignee (avatar + name or "—") · Status. Row click → navigate to `/support-ticket/:id`.
- Pagination footer: page size 25, prev/next, total count. Persist page in URL query (`?page=`, `?status=`, etc.) so links share state.
- Uses existing `DataTable`-style layout; no changes to shared components.

## 4. Detail page (new)

Add route `/support-ticket/:id` → new file `src/pages/SupportTicketDetail.tsx`, guarded by same `minAccessLevel="level_3_manager"`. Added to `App.tsx` and to the sidebar breadcrumb chain.

Layout (2-column on md+, stacked on mobile):

**Left / main:**
- Header: ticket_no, subject, status badge, priority badge, "Back to inbox" button.
- Requester card: name (or Anonymous), phone/email with quick tap-to-call/mail.
- Original message (read-only bubble, first item in timeline).
- **Timeline feed** (chronological, oldest → newest): merges `support_ticket_events` + `support_ticket_notes`. Each item shows actor avatar + name, action label ("Set status to Resolved", "Assigned to X", "Changed priority: normal → high", "Added a note"), relative time + tooltip absolute, note body when applicable. Uses shared `formatters` + `useDateLocale()`.
- Internal note composer at bottom: textarea + "Post note" button; posts to `support_ticket_notes`. Notes stay internal (not exposed to submitter — there is no submitter surface).

**Right / sidebar:**
- Status selector (Select with transitions), Priority selector, Assignee selector (staff dropdown, includes "Unassigned" and "Assign to me"). Each change triggers its own mutation + event.
- Metadata: submitted at, source, last updated, resolved/closed timestamps.

## 5. i18n

Add keys under `support.admin.*` and `support.timeline.*` in both `en.ts` and `th.ts`: `priority.{low,normal,high,urgent}`, `assignee.{me,unassigned,all}`, filter labels, date range labels, `timeline.event.{status_changed,priority_changed,assigned,note_added,reopened,created}`, `notes.{composerPlaceholder,post,empty}`, `detail.{back,requester,metadata,internalNotes,addNote}`.

## 6. Sidebar & routing

- `src/App.tsx`: register `/support-ticket/:id` route inside `MainLayout` with `ProtectedRoute minAccessLevel="level_3_manager"`.
- Sidebar entry unchanged (list page). Detail is deep-linked from rows.

## 7. Files touched

Create:
- `supabase/migrations/<new>.sql`
- `src/pages/SupportTicketDetail.tsx`
- `src/components/support/TicketTimeline.tsx`
- `src/components/support/TicketFilters.tsx`

Edit:
- `src/hooks/useSupportTickets.ts`
- `src/pages/SupportTickets.tsx`
- `src/App.tsx`
- `src/lib/queryKeys.ts`
- `src/hooks/useRealtimeSync.ts`
- `src/i18n/locales/{en,th}.ts`
- `docs/DEVLOG.md`

No changes to: public `/support` form, `MaintenanceGate`, auth, existing RLS on `support_tickets`.

## 8. Regression checklist

- Public submission still works (no schema break; new columns nullable/defaulted).
- Existing tickets render with `priority='normal'`, `assigned_to=null` — visible immediately.
- `logActivity()` called on every mutation.
- `bun run build` + `bun run test` pass.
- Realtime updates flow into both the list and the open detail page.

## Technical notes

- Assignee dropdown loads active staff via existing `useStaff()` hook — no new API.
- Timeline merges two sources client-side, sorted by `created_at`; both queried with a single ticket_id filter.
- Date range filter uses `getBangkokDayRange()` for correct boundaries.
- URL-driven filter state via `useSearchParams` — keeps back/forward + shareable links working.
