

# Shared Backend / API Platform Contract for MOOM

## Context

This is a design document, not an implementation task. Based on inspection of the existing Admin App codebase, I will produce the shared platform contract grounded in what already exists.

### Current Backend Reality
- **Database**: Supabase Postgres with 30+ tables, RLS policies using `has_min_access_level()` and `has_role()` security-definer functions
- **Edge Functions** (7): `approve-slip`, `auto-notifications`, `daily-briefing`, `invite-staff`, `line-auth`, `stripe-create-checkout`, `stripe-webhook`
- **Auth**: Supabase Auth with `user_roles` table (app_role enum: owner/admin/trainer/front_desk) mapped to access_level enum
- **CORS**: Currently hardcoded to `https://admin.moom.fit` and `https://moom.lovable.app` in edge functions
- **Business logic**: Split between client-side hooks and server-side edge functions; payment finalization is server-side, most CRUD is client-side via Supabase JS SDK

---

## SECTION 1 — Platform Principles

1. **Supabase-native architecture** — Both apps use the same Supabase project directly via `@supabase/supabase-js`. No separate API origin needed. Edge Functions serve as the "API layer" for complex operations.
2. **RLS as the permission boundary** — Row-Level Security is the single source of truth for data access. Both apps share the same RLS policies. No application-level filtering needed for security.
3. **Edge Functions for commands** — All multi-step mutations (payment finalization, slip approval, staff invitation) go through Edge Functions for atomicity and idempotency.
4. **Direct SDK for queries** — Both apps query Supabase tables directly via the JS SDK. RLS ensures data isolation by role.
5. **Shared types, separate UIs** — Both apps consume the same auto-generated `types.ts` from Supabase. Domain DTOs are defined in a shared package or copied via codegen.
6. **Audience-safe responses via RLS + select projection** — Admin sees all columns; Experience App selects only member-safe columns. RLS prevents unauthorized row access; column projection prevents field leakage.

---

## SECTION 2 — Shared Cross-Domain Standards

### Response Envelope (Edge Functions only)
```typescript
// Success
{ data: T, error: null }
// Error
{ data: null, error: { code: string, message: string, details?: Record<string, string[]> } }
```
Direct SDK calls use Supabase's native `{ data, error }` envelope.

### Pagination
```typescript
// Query params
{ page?: number, per_page?: number } // default: page=1, per_page=50, max=100
// Response includes count via Supabase head:true or exact count
```

### Filtering / Sorting / Search
- Filters: Supabase `.eq()`, `.in()`, `.ilike()` via SDK
- Sort: `.order(column, { ascending })` 
- Search: `.or()` with `ilike` across relevant text fields
- Convention: search param is applied across name/phone/email fields

### Date/Time
- **Storage**: UTC `timestamptz` in Postgres
- **Display timezone**: `Asia/Bangkok` (client-side conversion)
- **Date-only fields**: `date` type (no timezone)
- **Format**: ISO 8601 for API; localized for display

### Money
- **Currency**: THB (stored as `numeric`, not integer cents)
- **VAT**: 7% standard rate, stored as `vat_rate` decimal on transactions
- **Fields**: `amount`, `amount_gross`, `amount_ex_vat`, `amount_vat`, `discount_amount`

### IDs
- UUID v4 for all entity IDs
- Human-readable codes: `M-XXXXXXX` (members), `T-XXXXXXX` (transactions), `A-XXX` (staff)
- External refs: `source_ref` for Stripe session IDs, `idempotency_key` for dedup

### Error Format (Edge Functions)
```typescript
{ error: { code: "VALIDATION_ERROR" | "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "INTERNAL", message: string, details?: Record<string, string[]> } }
```
Generic messages only — never leak DB schema or SDK internals.

### Audit Event Format
```typescript
{ event_type: string, entity_type: string, entity_id: uuid, actor_id: uuid, old_value?: jsonb, new_value?: jsonb, metadata?: jsonb }
```
Stored in `activity_log` table. All mutations must log.

### Idempotency
- Edge Functions: `idempotency_key` column on `transactions` table
- Pattern: `slip:{slipId}`, `stripe:{eventId}`, `nonce:{clientNonce}`
- Check before insert; return existing result if duplicate

### Versioning
- No API versioning needed yet — both apps are first-party
- Breaking changes managed via migration + coordinated deploy
- Future: Edge Function path versioning (`/v2/approve-slip`) if needed

---

## SECTION 3 — App / Origin / Session Model

### Origins
| App | Origin | Purpose |
|-----|--------|---------|
| Admin | `https://admin.moom.fit` | Management, governance, analytics |
| Experience | `https://member.moom.fit` | Member booking, trainer workflows, staff check-in |
| Preview | `https://moom.lovable.app` | Development preview |

### CORS Strategy
Edge Functions must allow all three origins:
```typescript
const ALLOWED_ORIGINS = ['https://admin.moom.fit', 'https://member.moom.fit', 'https://moom.lovable.app'];
const origin = req.headers.get('origin') ?? '';
const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
```
Headers: `Access-Control-Allow-Origin: <matched origin>`, `Vary: Origin`

Direct Supabase SDK calls: CORS is handled by Supabase infrastructure (allows all origins for anon key).

### Auth / Session Strategy
- **Token-based** via Supabase Auth (JWT)
- Admin App: Email/password login → JWT stored in memory/localStorage by Supabase SDK
- Experience App: LINE LIFF login → `line-auth` Edge Function → Supabase custom token → JWT
- Both apps use the same `supabase.auth` session management
- Token audience: implicit (same Supabase project)
- Refresh: handled automatically by Supabase SDK `onAuthStateChange`

### App Identity (no separate client IDs needed)
- RLS determines what data each user can access based on `user_roles.role`
- Admin users have `owner`/`admin` roles → higher access levels
- Experience users have `trainer`/`front_desk` roles OR are members (authenticated via LINE with member-level access)
- Member access: Currently via LINE identity mapping (`line_users` → `member_id`). RLS policies on member-facing tables should allow `member_id = <resolved from line_users>`

### Redirect / Callback URLs
| Flow | Admin | Experience |
|------|-------|------------|
| Post-login | `https://admin.moom.fit/` | `https://member.moom.fit/` |
| Password reset | `https://admin.moom.fit/reset-password` | N/A (LINE-based) |
| Staff invite | `https://admin.moom.fit/login` | N/A |
| Stripe success | `https://admin.moom.fit/finance` | `https://member.moom.fit/payment-success` |
| Stripe cancel | `https://admin.moom.fit/finance` | `https://member.moom.fit/payment-cancelled` |
| LINE callback | N/A | `https://member.moom.fit/liff/callback` |
| Notification links | `https://admin.moom.fit/<entity>/<id>` | `https://member.moom.fit/<screen>` |

Strategy: Edge Functions receive `origin` header or explicit `app` param to determine redirect URLs.

### Shared File / Asset Access
- Both apps access the same Supabase Storage buckets
- Signed URLs for private assets; public URLs for public assets
- No cross-origin file access issues (Storage has its own CORS)

---

## SECTION 4 — Shared Enums and Lifecycle Definitions

All enums are already defined in the database. Key lifecycles:

### Member Status
`active` → `suspended` → `active` | `on_hold` → `active` | `inactive`
- `suspended`: triggered by suspension record creation
- `on_hold`: manual admin action
- `inactive`: manual or automated (no active package + no attendance for N days)

### Lead Status
`new` → `contacted` → `interested` → `converted` | `not_interested`
- `converted`: creates a member record, sets `converted_member_id`

### Package Status
`drafts` → `on_sale` | `scheduled` → `on_sale` → `archive`

### Transaction Status
`pending` → `paid` | `voided` | `failed` | `needs_review`
`paid` → `refunded` | `voided`

### Transfer Slip Status
`needs_review` → `approved` | `rejected`
`approved` → `voided`

### Booking Status
`booked` → `attended` | `cancelled` | `no_show`

### Schedule Status
`scheduled` → `completed` | `cancelled`

### Staff Status
`pending` → `active` → `terminated` | `inactive`

---

## SECTION 5 — Domain-by-Domain API Contract

### Architecture Pattern
- **Queries**: Direct Supabase SDK calls from both apps, filtered by RLS
- **Commands (simple CRUD)**: Direct Supabase SDK inserts/updates, enforced by RLS
- **Commands (complex/multi-step)**: Edge Functions

### Edge Functions (Shared Commands)

| Function | Purpose | Min Access | Used By |
|----------|---------|------------|---------|
| `approve-slip` | Approve transfer slip → create transaction + billing + package | level_3_manager | Admin |
| `stripe-create-checkout` | Create Stripe checkout session | level_3_manager | Admin, Experience (future) |
| `stripe-webhook` | Handle Stripe events | N/A (webhook) | Stripe |
| `invite-staff` | Send staff invitation email | level_3_manager | Admin |
| `line-auth` | LINE LIFF authentication | Public | Experience |
| `daily-briefing` | Generate AI daily briefing | level_2_operator | Admin |
| `auto-notifications` | Process notification outbox | System | System |

### New Edge Functions Needed for Experience App

| Function | Purpose | Access | Notes |
|----------|---------|--------|-------|
| `member-book-class` | Member books a class | Member (via LINE auth) | Idempotent on `(schedule_id, member_id)` |
| `member-cancel-booking` | Member cancels booking | Member | Only own bookings, before cutoff |
| `member-profile` | Get/update member profile | Member | Read own data only |
| `member-packages` | List member's active packages | Member | Read own data only |
| `member-schedule` | List available schedule | Member | Public read, filtered by package access |
| `trainer-attendance` | Mark attendance for class | Trainer (level_2) | Updates booking + attendance + package usage |
| `checkin-redeem` | Redeem QR check-in token | level_1_minimum | Already exists as page route |

### Direct SDK Access (Both Apps)

Both apps query tables directly. RLS controls visibility:

| Table | Admin (level_3+) | Staff (level_1-2) | Member |
|-------|-------------------|---------------------|--------|
| members | Full CRUD | Read | Own only (future RLS) |
| schedule | Full CRUD | Read + manage bookings | Read (public) |
| classes | Full CRUD | Read | Read (public) |
| packages | Full CRUD | Read | Read (public, on_sale only) |
| transactions | Full CRUD | No access | Own only (future) |
| member_packages | Full CRUD | Read | Own only (future) |
| class_bookings | Full CRUD | Manage | Own only (future) |

### Audit-Sensitive Actions (Must Log to activity_log)
- Member create/update/delete
- Package purchase/refund
- Booking create/cancel/attend
- Payment finalization (slip approve, Stripe webhook)
- Staff invite/activate/terminate
- Role create/update/delete
- Schedule create/cancel
- Promotion create/update

---

## SECTION 6 — Permission Matrix by Endpoint Group

| Domain | Admin Only | Staff/Trainer | Member Safe | Public |
|--------|-----------|---------------|-------------|--------|
| Members CRUD | Write/Delete | Read | Own profile | - |
| Leads CRUD | All | Read (operator+) | - | - |
| Finance/Transactions | All | - | Own billing | - |
| Transfer Slips | All | - | - | - |
| Staff CRUD | All (manager+) | Read own | - | - |
| Roles/Permissions | All (master) | - | - | - |
| Settings | All (manager+) | - | - | - |
| Schedule | Write (operator+) | Read + book | Read + book | - |
| Classes | Write (operator+) | Read | Read | - |
| Packages | Write (manager+) | Read | Read (on_sale) | - |
| Promotions | Write (manager+) | Read | Validate code | - |
| Rooms/Locations | Write (manager+) | Read | Read | - |
| Reports/Insights | Read (operator+) | Limited | - | - |
| Activity Log | Read | - | - | - |
| Notifications | All | Own | Own | - |
| Announcements | Write | Read | Read | - |
| Workouts | Write (operator+) | Read | Read | - |
| Check-in QR | Manage | Use | Present | - |
| LINE Auth | - | - | - | Public |

---

## SECTION 7 — Shared Typed Client / SDK Recommendation

### Approach: Shared Types Package

Since both apps are Lovable projects using the same Supabase backend, the most practical approach:

```text
shared-types/              (npm package or git submodule)
├── supabase/
│   └── types.ts           ← auto-generated from Supabase CLI
├── domain/
│   ├── member.ts          ← MemberSafe, MemberAdmin DTOs
│   ├── schedule.ts        ← ScheduleWithRelations
│   ├── package.ts         ← PackagePublic, PackageAdmin
│   ├── transaction.ts     ← TransactionAdmin (admin-only)
│   ├── booking.ts         ← BookingMember, BookingAdmin
│   └── enums.ts           ← re-exported canonical enums
├── api/
│   ├── edge-functions.ts  ← typed request/response for each Edge Function
│   └── errors.ts          ← shared error types
└── index.ts
```

### Practical Alternative (No Shared Package)

Since Lovable projects can't easily share npm packages, the pragmatic approach:

1. **Both projects import from the same Supabase project** → same auto-generated `types.ts`
2. **Each project defines its own domain types** in `src/types/domain.ts` (Admin already has this)
3. **Edge Function contracts are documented** in `docs/` and manually kept in sync
4. **Enums come from the database** — both projects use `Constants.public.Enums` from generated types

### Consumption Pattern
```typescript
// Both apps
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// Admin: full row access
const { data } = await supabase.from('members').select('*');

// Experience: projected columns only
const { data } = await supabase.from('members')
  .select('id, first_name, last_name, avatar_url, status')
  .eq('id', currentMemberId);
```

---

## SECTION 8 — Rollout / Migration Plan

### Phase 1: CORS + Edge Function Updates (Week 1)
- Update all 7 Edge Functions to accept `https://member.moom.fit` origin
- No behavior changes, just CORS allowlist expansion
- Deploy and verify

### Phase 2: Member-Facing RLS Policies (Week 2)
- Add RLS policies for member-level access on: `members` (own row), `member_packages` (own), `class_bookings` (own), `schedule` (read public), `classes` (read public), `packages` (read on_sale)
- Requires a strategy for member authentication (LINE → Supabase user mapping already exists via `line_users`)

### Phase 3: Experience App Edge Functions (Week 3-4)
- Create `member-book-class`, `member-cancel-booking`, `member-profile` Edge Functions
- These enforce business rules server-side (package eligibility, booking cutoff, capacity)

### Phase 4: Experience App Frontend (Week 4+)
- Build Experience App screens consuming the same Supabase project
- Use projected queries and member-safe Edge Functions

---

## SECTION 9 — Open Questions / Backend Dependencies

### Critical Unknowns

1. **Member authentication for Experience App**: LINE LIFF creates entries in `line_users` but doesn't create Supabase Auth users for members. Current `line-auth` function handles staff/trainer login. Need to decide: do members get Supabase Auth accounts, or do they access via a service-role proxy?

2. **Member-level RLS**: Currently no RLS policies exist for member-level access. All policies are staff-level (`level_1_minimum` and above). Adding member access requires either:
   - Creating Supabase Auth accounts for members (recommended)
   - Using a service-role Edge Function as a proxy (less secure, more work)

3. **Storage buckets**: No storage buckets exist yet. Needed for: member avatars, transfer slip images, contract PDFs, class images. Both apps would access the same buckets.

4. **Notification delivery to members**: `auto-notifications` and `event_outbox` exist but appear system-internal. Need LINE push notification integration for member-facing notifications.

5. **Package purchase from Experience App**: Currently `stripe-create-checkout` requires `level_3_manager`. If members can self-purchase, need a member-safe variant or a separate Edge Function.

6. **Booking engine business rules**: Not yet codified in Edge Functions — what are the cancellation cutoff rules, waitlist promotion rules, package-class eligibility matching rules? These need to be server-enforced before the Experience App can book.

### Schema Dependencies
- Member auth accounts (or proxy strategy decision)
- Storage bucket creation for file uploads
- Possible `member_preferences` table for Experience App settings
- Possible `notifications` table expansion for member-facing push

### Integration Dependencies
- LINE Messaging API credentials for push notifications
- LINE LIFF app IDs for member vs trainer shells
- Stripe Connect or additional Stripe products if members self-purchase

