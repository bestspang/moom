## Feature: Public Support / Complaint Form + Admin Inbox

หน้าให้ลูกค้าส่งเรื่องร้องเรียน/ขอความช่วยเหลือได้ที่ `moom.fit/support` (ไม่ต้อง login) พร้อมหน้า admin ใหม่สำหรับดูและจัดการเรื่องร้องเรียน

---

### 1. Database (new migration)

New table `public.support_tickets`:
- `id` uuid PK
- `ticket_no` text unique — auto-generated `SUP-XXXXXX`
- `name` text nullable (ว่าง = ไม่ประสงค์ออกนาม)
- `is_anonymous` boolean default false
- `phone` text nullable
- `email` text nullable (lowercased/trimmed)
- `category` text not null — CHECK in (`complaint`, `facility`, `trainer`, `class`, `billing`, `membership`, `cleanliness`, `suggestion`, `other`)
- `subject` text not null (≤200)
- `message` text not null (≤2000)
- `status` text default `'new'` — CHECK in (`new`, `in_progress`, `resolved`, `closed`)
- `admin_note` text nullable
- `handled_by` uuid nullable (references staff.user_id path via `auth.uid()`)
- `handled_at` timestamptz nullable
- `source` text default `'web_public'`
- `created_at`, `updated_at` timestamptz + `handle_updated_at` trigger

GRANTs:
- `GRANT INSERT ON public.support_tickets TO anon, authenticated`
- `GRANT SELECT, UPDATE ON public.support_tickets TO authenticated`
- `GRANT ALL ON public.support_tickets TO service_role`

RLS policies:
- INSERT — anon+authenticated `WITH CHECK (true)` (public submissions)
- SELECT — `has_min_access_level(auth.uid(),'level_3_manager')`
- UPDATE — `has_min_access_level(auth.uid(),'level_3_manager')`

Add table to `supabase_realtime` publication for live admin updates.

### 2. Public submission page — `/support`

New file `src/pages/support/PublicSupportPage.tsx`. Route `/support` added **outside** `MaintenanceGate` and outside auth (public), so it stays reachable even in maintenance mode.

Form (react-hook-form + Zod):
- **Anonymous toggle** → hides + clears name
- Name (optional, ≤100)
- Phone (optional, TH phone regex)
- Email (optional, email format, auto lowercase/trim)
- **Category dropdown (required)** — ร้องเรียนทั่วไป / อุปกรณ์ / เทรนเนอร์ / คลาส / การชำระเงิน & แพ็คเกจ / สมาชิก / ความสะอาด / ข้อเสนอแนะ / อื่นๆ
- **Subject (required, ≤200)**
- **Message (required, 10–2000, textarea)**

Required = category, subject, message. Others optional.

Submit: direct `supabase.from('support_tickets').insert(...)` with anon key. Show success screen with `ticket_no` for reference. Client throttle "1 submit / 60s" via localStorage (no CAPTCHA in v1).

Design: centered card, brand logo, mobile-first, shadcn primitives, TH default with EN i18n.

### 3. Admin inbox — `/support-ticket`

New file `src/pages/SupportTickets.tsx` under admin `MainLayout` with `minAccessLevel="level_3_manager"`.

- List table: date · ticket_no · category badge · subject · name (or "ไม่ประสงค์ออกนาม") · status badge
- Filter chips: status (all/new/in_progress/resolved/closed) + category
- Search: ticket_no / subject / email / phone
- Row click → Sheet with full details, contact info, message, admin_note textarea, status dropdown, "Assign to me" button
- Save writes `handled_by=auth.uid()`, `handled_at=now()`, `status`, `admin_note` + `logActivity({ event_type: 'support_ticket.updated' })`

New hook `src/hooks/useSupportTickets.ts`:
- `useSupportTickets(filters)` — TanStack Query
- `useUpdateSupportTicket()` — mutation with activity log
- Query key `supportTickets` in `src/lib/queryKeys.ts`
- `support_tickets` added to `TABLE_INVALIDATION_MAP` in `useRealtimeSync.ts`

Admin sidebar: add "Support Tickets" nav entry (will locate correct sidebar file during build; likely near Notifications / Activity Log).

### 4. i18n

Add keys in both `src/i18n/locales/en.ts` and `th.ts`:
- `support.public.*` (form labels, category labels, success screen, throttle message)
- `support.admin.*` (list, filters, statuses, drawer, actions)

### 5. Files touched

Create:
- `supabase/migrations/<ts>_support_tickets.sql`
- `src/pages/support/PublicSupportPage.tsx`
- `src/pages/SupportTickets.tsx`
- `src/hooks/useSupportTickets.ts`

Edit:
- `src/App.tsx` — add `/support` public route (outside MaintenanceGate) + `/support-ticket` admin route
- `src/components/auth/MaintenanceGate.tsx` — allowlist `/support`
- `src/lib/queryKeys.ts`
- `src/hooks/useRealtimeSync.ts`
- admin sidebar file (nav entry)
- `src/i18n/locales/en.ts`, `th.ts`
- `docs/DEVLOG.md`

### 6. Regression / safety

- Additive only — no changes to auth, RLS helpers, or existing tables
- Public insert only into new table; other tables unaffected
- No `service_role` in client
- `logActivity` on admin updates (audit)
- `bun run test` + `bun run build` must pass
- Maintenance mode ON still allows `/support` (support during outage is desirable)

### 7. Notes / defaults chosen

- **Spam control:** required fields + length limits + localStorage 60s throttle. No CAPTCHA in v1 (say the word and I'll wire hCaptcha).
- **Notifications:** not sending LINE/email notify on new ticket in v1 — admin sees realtime badge instead. Add later if needed.
