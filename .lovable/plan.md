## Goal
Deliver real LINE push notifications for members via an outbox + worker pattern, without touching RLS invariants or existing safe RPCs' business logic.

## 1. Database (single migration, append-only)

New table `public.line_push_outbox`:
- `id uuid pk default gen_random_uuid()`
- `member_id uuid references public.members(id) on delete cascade`
- `line_user_id text not null` (may be `''` when skipped)
- `template text not null` — allowed values enforced by CHECK: `booking_confirmed | booking_cancelled | class_reminder | package_expiring | slip_approved | slip_rejected`
- `payload jsonb not null default '{}'::jsonb`
- `status text not null default 'pending'` CHECK in `pending|sent|failed|skipped`
- `attempts int not null default 0`
- `last_error text`
- `scheduled_at timestamptz not null default now()`
- `sent_at timestamptz`
- `dedupe_key text` (unique, nullable) — used by `package_expiring` and reminder dedupe
- `created_at timestamptz not null default now()`
- `related_booking_id uuid` (nullable, no FK to keep migration additive; used to skip pending reminders on cancel)

Indexes:
- `idx_line_push_outbox_ready (status, scheduled_at)` partial `where status = 'pending'`
- `unique idx_line_push_outbox_dedupe (dedupe_key) where dedupe_key is not null`
- `idx_line_push_outbox_member (member_id)`

RLS:
- `enable row level security`
- Policy `line_push_outbox_read_manager` `for select using (public.has_min_access_level(auth.uid(), 'level_3_manager'))`
- No insert/update/delete policies → writes only via `service_role` and `SECURITY DEFINER` RPCs.

Helper `SECURITY DEFINER` functions (all `search_path = public`):

1. `enqueue_line_push(_member_id uuid, _template text, _payload jsonb, _scheduled_at timestamptz default now(), _dedupe_key text default null, _related_booking_id uuid default null) returns uuid`
   - Resolves `line_user_id` from `line_users where member_id = _member_id and status = 'linked' order by linked_at desc limit 1`.
   - If none → insert row with `status='skipped'`, `line_user_id=''`, `last_error='no_linked_line_account'`.
   - Else insert `pending`. On dedupe conflict, do nothing and return existing id.

2. `claim_line_push_batch(_limit int default 100) returns setof line_push_outbox`
   - `select ... from line_push_outbox where status='pending' and scheduled_at <= now() order by scheduled_at for update skip locked limit _limit` and immediately `update ... set attempts = attempts + 1` on the claimed rows (return the pre-update view for rendering). Called only by service_role.

3. `mark_line_push_result(_id uuid, _ok boolean, _err text default null) returns void`
   - On success: `status='sent', sent_at=now(), last_error=null`.
   - On failure: keep `pending` unless `attempts >= 3` then `status='failed'`; store `last_error`.

4. `skip_pending_reminders_for_booking(_booking_id uuid) returns int`
   - `update ... set status='skipped', last_error='booking_cancelled' where status='pending' and template='class_reminder' and related_booking_id=_booking_id`.

`GRANT SELECT ON public.line_push_outbox TO authenticated;` (RLS still limits to managers).
`GRANT ALL ON public.line_push_outbox TO service_role;`
`GRANT EXECUTE ON FUNCTION ... TO service_role;` for the four helpers.

## 2. Producer wiring (atomic where possible)

- `create_booking_safe` — extend the existing function to, after insert succeeds, look up `schedule.start_time/scheduled_date` and call `enqueue_line_push` twice:
  - `booking_confirmed` immediate, `dedupe_key = 'confirm:' || booking_id`, `related_booking_id = booking_id`.
  - `class_reminder` scheduled_at = `(scheduled_date + start_time at time zone 'Asia/Bangkok') - interval '2 hours'`, `dedupe_key = 'reminder:' || booking_id`, `related_booking_id = booking_id`. Skip enqueue if the computed time is already in the past.
  - Payload includes: class name, trainer name, start local time, location name, booking_id.

- `cancel_booking_safe` — after cancel, call `enqueue_line_push('booking_cancelled', ...)` and `skip_pending_reminders_for_booking(booking_id)`.

- `approve-slip` edge function — after successful approve/reject, call the enqueue RPC with `slip_approved` / `slip_rejected` and payload `{ amount, package_name, slip_id, reason? }`.

- `auto-notifications` edge function — where it already flags packages expiring in 7 days (add checks for 3d and 1d buckets), also enqueue member-facing `package_expiring` with `dedupe_key = 'pkgexp:' || member_package_id || ':' || bucket_days`. Staff notification behavior unchanged.

All RPC-side enqueues run inside the existing transactions, so they stay atomic with the booking write. Slip approval enqueues are best-effort after the atomic DB write, wrapped in try/catch and logged (no rollback on push-enqueue failure).

## 3. Worker edge function `line-push-worker`

- Auth guard cloned from `auto-notifications`: require `Bearer CRON_SECRET` OR `x-cron-secret` OR service-role token; reject 401 otherwise; reject 500 if `LINE_CHANNEL_ACCESS_TOKEN` missing.
- CORS: reuse existing allowlist (`admin.moom.fit`, `member.moom.fit`, `moom.lovable.app`).
- Loop:
  1. `supabase.rpc('claim_line_push_batch', { _limit: 100 })`.
  2. For each row: if `status` would be `skipped` (shouldn't happen since RPC returns pending only) skip; otherwise render message per `template` from a local TH-first renderer with optional short EN line.
  3. `POST https://api.line.me/v2/bot/message/push` with `{ to: line_user_id, messages: [...] }` + `Authorization: Bearer <token>`.
  4. On 200 → `mark_line_push_result(id, true)`. On non-2xx → `mark_line_push_result(id, false, <status+body-truncated>)`. On 429 → mark failure and break out of the loop early (respect rate limit).
- Return JSON summary `{ ok, processed, sent, failed, skipped, rate_limited }`.

Templates live in one `renderTemplate(template, payload)` map in the function file; TH primary strings, EN one-liner appended when useful. No i18n dependency in edge function.

## 4. Frontend (read-only diagnostics only)

- `src/lib/queryKeys.ts`: add `linePushOutboxStats: () => ['line-push-outbox-stats'] as const`.
- `src/hooks/useLinePushOutboxStats.ts`: new hook, queries `line_push_outbox` grouped by status for `created_at >= now() - 24h` (four `count: 'exact', head: true` queries).
- `src/hooks/useRealtimeSync.ts`: add `line_push_outbox` to `TABLE_INVALIDATION_MAP` → invalidate `['line-push-outbox-stats']`.
- Diagnostics page (existing `DiagnosticsSurfacePage` or Settings diagnostics section — will confirm on build): add a read-only card "LINE Push Outbox (24h)" with pending/sent/failed/skipped counts + last error tooltip. Manager+ only (RLS enforces).
- i18n: add `diagnostics.linePushOutbox.*` keys (title, pending, sent, failed, skipped, empty) to BOTH `src/i18n/locales/en.ts` and `th.ts`.

No changes to Member/Trainer/Staff UI.

## 5. Secrets & Cron (manual steps you run)

Secrets required in Edge Function Secrets:
- `LINE_CHANNEL_ACCESS_TOKEN` — LINE Messaging API long-lived channel access token (Provider console → Messaging API channel → "Channel access token"). I will request it via `add_secret` in build mode if not already present.
- `CRON_SECRET` — already used by `auto-notifications`; reuse the same value.

Cron (pg_cron, run once in SQL editor — not in a migration since it embeds URL + anon key):

```sql
-- every 5 minutes: LINE push worker
select cron.schedule(
  'line-push-worker-5m',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://qedxqilmnkbjncpnopty.supabase.co/functions/v1/line-push-worker',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- daily 08:00 Asia/Bangkok = 01:00 UTC: auto-notifications
select cron.schedule(
  'auto-notifications-daily',
  '0 1 * * *',
  $$
  select net.http_post(
    url := 'https://qedxqilmnkbjncpnopty.supabase.co/functions/v1/auto-notifications',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Enable extensions first: `create extension if not exists pg_cron; create extension if not exists pg_net;`
Store the cron secret once: `alter database postgres set app.cron_secret = '<your-cron-secret>';` — or hardcode the header value if you prefer.

## 6. Regression checklist

- Booking a class as LINE-linked member → row in `line_push_outbox` (confirm) + row (reminder, scheduled_at = start − 2h).
- Booking as non-linked member → single `skipped` row, worker returns clean.
- Cancel booking → cancel row inserted, any pending reminder for that booking flipped to `skipped`.
- Approve slip → `slip_approved` row; reject → `slip_rejected` row.
- `auto-notifications` re-run on same day → no duplicate `package_expiring` rows (dedupe_key unique).
- Worker with correct secret sends and marks `sent`; with bad secret returns 401.
- Replayed webhook / duplicate call to `create_booking_safe` cannot create duplicate outbox rows (dedupe_key unique).
- No RLS disabled; `bun run test` + `bun run build` green.

## 7. Files touched

- New migration: `supabase/migrations/<ts>_<uuid>.sql` (table + policies + 4 RPCs + amendments to `create_booking_safe` and `cancel_booking_safe`).
- New edge fn: `supabase/functions/line-push-worker/index.ts`.
- Edited: `supabase/functions/approve-slip/index.ts`, `supabase/functions/auto-notifications/index.ts`.
- Edited: `src/lib/queryKeys.ts`, `src/hooks/useRealtimeSync.ts`, diagnostics page (TBD exact file in build mode), `src/i18n/locales/en.ts`, `src/i18n/locales/th.ts`.
- New: `src/hooks/useLinePushOutboxStats.ts`.
- `docs/DEVLOG.md` entry.

Not touched: RLS on any existing table, `create_booking_safe`/`cancel_booking_safe` core logic (only additive enqueue calls at end), slip approval business logic, `line-auth`, `SurfaceGuard`, auto-generated supabase types/client.