

# Implementation Plan

## Summary
Four items: (1-3) already completed in previous rounds. Two new features to implement:
- **A.** Tier change notifications — auto-insert notification when `evaluate_member_tier` detects a tier change
- **B.** Daily tier evaluation cron — new edge function that evaluates all active members daily

---

## A. Tier Change Notifications

### A1. Database Migration
Add `tier_change` to the `notification_type` enum and update the `evaluate_member_tier` function to insert a notification when tier changes.

**Enum addition:**
```sql
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'tier_change';
```

**Function modification** — after the `ON CONFLICT ... DO UPDATE SET` block in `evaluate_member_tier`, add:
```sql
-- If tier changed, insert notification
IF v_current_row IS NOT NULL AND v_current_row.current_tier != v_best_tier THEN
  DECLARE
    v_user_id uuid;
    v_direction text;
    v_title text;
    v_message text;
  BEGIN
    SELECT experience_user_id INTO v_user_id
    FROM identity_map
    WHERE admin_entity_id = p_member_id AND entity_type = 'member' AND is_verified = true
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
      v_direction := CASE WHEN v_best_order > (SELECT tier_order FROM status_tier_rules WHERE tier_code = v_current_row.current_tier)
        THEN 'upgraded' ELSE 'downgraded' END;

      v_title := CASE WHEN v_direction = 'upgraded'
        THEN 'Status Tier Upgraded!'
        ELSE 'Status Tier Changed' END;

      v_message := 'Your status tier has changed from ' || initcap(v_current_row.current_tier) || ' to ' || initcap(v_best_tier) || '.';

      INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id)
      VALUES (v_user_id, 'tier_change', v_title, v_message, 'member_status_tier', p_member_id);
    END IF;
  END;
END IF;
```

This is safe — it only fires when tier actually changes, uses the existing `identity_map` to find the auth user_id, and silently skips if no user mapping found.

### A2. Frontend — Add `tier_change` to notification UI maps

**`src/hooks/useNotifications.ts`** — add to `getNotificationTypeConfig`:
```typescript
tier_change: { icon: 'ShieldCheck', color: 'text-indigo-500' },
```

**`src/pages/Notifications.tsx`** — add to:
- `notificationTypes` array: `'tier_change'`
- `getNotificationIcon`: `tier_change: <ShieldCheck className="h-5 w-5 text-indigo-500" />`
- `getTypeLabel`: `tier_change: 'Tier Change'`

**`src/apps/member/pages/MemberNotificationsPage.tsx`** — add to `NOTIFICATION_ICON_MAP`:
```typescript
tier_change: ShieldCheck,
```

### A3. i18n — Add tier_change label
Add `notifications.types.tier_change` key to EN and TH locale files.

---

## B. Daily Tier Evaluation Cron

### B1. New Edge Function: `supabase/functions/evaluate-tiers-daily/index.ts`

A simple function that:
1. Fetches all active members (`members.status = 'active'`)
2. Calls `evaluate_member_tier` RPC for each in batches of 50
3. Returns summary `{ ok, total_members, evaluated, errors }`

Uses standard CORS pattern + Lovable preview wildcard. Uses `SUPABASE_SERVICE_ROLE_KEY` (already set).

### B2. Config: `supabase/config.toml`
Add:
```toml
[functions.evaluate-tiers-daily]
verify_jwt = false
```

### B3. Cron Job Setup
After deploying, set up a daily cron job at 3:00 AM Bangkok time (20:00 UTC) using `pg_cron` + `pg_net`:
```sql
SELECT cron.schedule(
  'evaluate-tiers-daily',
  '0 20 * * *',
  $$
  SELECT net.http_post(
    url:='https://qedxqilmnkbjncpnopty.supabase.co/functions/v1/evaluate-tiers-daily',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer <anon_key>"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
```

---

## Files Changed

| File | Change | Risk |
|------|--------|------|
| Migration SQL | Add `tier_change` enum + update `evaluate_member_tier` with notification insert | Low — additive; notification is fire-and-forget inside function |
| `supabase/functions/evaluate-tiers-daily/index.ts` | New file — daily cron edge function | Zero — new file |
| `supabase/config.toml` | Add `evaluate-tiers-daily` entry | Zero — additive |
| `src/hooks/useNotifications.ts` | Add `tier_change` to config map | Zero — additive fallback already exists |
| `src/pages/Notifications.tsx` | Add `tier_change` to types array, icon map, label map | Zero — additive |
| `src/apps/member/pages/MemberNotificationsPage.tsx` | Add `tier_change` to icon map | Zero — additive |
| `src/i18n/locales/en.ts` | Add `tier_change` label | Zero — additive |
| `src/i18n/locales/th.ts` | Add `tier_change` label | Zero — additive |
| `docs/PLATFORM_CONTRACT.md` | Add `evaluate-tiers-daily` to edge functions list | Zero — doc only |

