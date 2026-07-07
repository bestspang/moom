import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3';

const ALLOWED_ORIGINS = ['https://admin.moom.fit', 'https://member.moom.fit', 'https://moom.lovable.app'];

const corsBase = {
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';

type OutboxRow = {
  id: string;
  member_id: string | null;
  line_user_id: string;
  template: string;
  payload: Record<string, unknown>;
  attempts: number;
};

function fmtDate(d: string | undefined) {
  if (!d) return '';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', timeZone: 'Asia/Bangkok' });
  } catch {
    return String(d);
  }
}

function fmtTime(t: string | undefined) {
  if (!t) return '';
  // HH:MM:SS -> HH:MM
  return String(t).slice(0, 5);
}

function renderTemplate(template: string, p: Record<string, any>): { type: 'text'; text: string }[] {
  const cls = p.class_name || 'คลาส';
  const when = `${fmtDate(p.scheduled_date)} ${fmtTime(p.start_time)}`.trim();
  const loc = p.location_name ? ` @ ${p.location_name}` : '';
  const trainer = p.trainer_name ? ` · ครูผู้สอน ${String(p.trainer_name).trim()}` : '';

  switch (template) {
    case 'booking_confirmed':
      return [{
        type: 'text',
        text: `✅ ยืนยันการจองคลาสของคุณแล้ว\n${cls}\n🗓 ${when}${loc}${trainer}\n\nแล้วเจอกันที่ MOOM! 💪\n\nBooking confirmed — see you at ${when}${loc}.`,
      }];
    case 'class_reminder':
      return [{
        type: 'text',
        text: `⏰ อีก 2 ชั่วโมงคลาสของคุณจะเริ่มแล้ว!\n${cls}\n🗓 ${when}${loc}${trainer}\n\nอย่าลืมมาตรงเวลานะคะ 🔥\n\nReminder: your class starts in ~2 hours.`,
      }];
    case 'booking_cancelled':
      return [{
        type: 'text',
        text: `❎ การจองคลาสของคุณถูกยกเลิกแล้ว\n${cls}\n🗓 ${when}${p.reason ? `\nเหตุผล: ${p.reason}` : ''}\n\nBooking cancelled.`,
      }];
    case 'package_expiring': {
      const days = p.days_until_expiry ?? p.bucket_days ?? '';
      const pkgName = p.package_name || 'แพ็กเกจของคุณ';
      return [{
        type: 'text',
        text: `📋 แพ็กเกจ "${pkgName}" ของคุณจะหมดอายุในอีก ${days} วัน (${fmtDate(p.expiry_date)})\n\nต่ออายุตอนนี้เพื่อไม่ให้ขาดช่วงการฝึกซ้อม 💪\n\nYour package expires in ${days} day(s).`,
      }];
    }
    case 'slip_approved':
      return [{
        type: 'text',
        text: `✅ การชำระเงินของคุณได้รับการยืนยันแล้ว\n${p.package_name ? `แพ็กเกจ: ${p.package_name}\n` : ''}${p.amount ? `จำนวน: ${p.amount} บาท\n` : ''}\nขอบคุณที่ใช้บริการ MOOM 🙏\n\nYour payment has been approved.`,
      }];
    case 'slip_rejected':
      return [{
        type: 'text',
        text: `⚠️ สลิปการโอนเงินของคุณไม่ผ่านการตรวจสอบ\n${p.reason ? `เหตุผล: ${p.reason}\n` : ''}\nกรุณาติดต่อทีมงานหรืออัปโหลดสลิปใหม่อีกครั้งค่ะ\n\nYour transfer slip was rejected. Please re-upload or contact staff.`,
      }];
    default:
      return [{ type: 'text', text: `MOOM: ${template}` }];
  }
}

Deno.serve(async (req) => {
  const reqOrigin = req.headers.get('origin') || '';
  const responseOrigin = ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0];
  const dynamicCors = { ...corsBase, 'Access-Control-Allow-Origin': responseOrigin };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: dynamicCors });
  }

  // Auth: CRON_SECRET (Bearer or x-cron-secret) OR service-role
  const cronSecret = Deno.env.get('CRON_SECRET');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const lineToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
  const authHeader = req.headers.get('Authorization');
  const bearer = authHeader?.replace('Bearer ', '');
  const xCronSecret = req.headers.get('x-cron-secret');

  const okCron = cronSecret && (authHeader === `Bearer ${cronSecret}` || xCronSecret === cronSecret);
  const okService = serviceRoleKey && bearer === serviceRoleKey;

  if (!okCron && !okService) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...dynamicCors, 'Content-Type': 'application/json' },
    });
  }

  if (!lineToken) {
    return new Response(JSON.stringify({ error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' }), {
      status: 500,
      headers: { ...dynamicCors, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceRoleKey!,
  );

  const { data: batch, error: claimErr } = await supabase.rpc('claim_line_push_batch', { _limit: 100 });
  if (claimErr) {
    console.error('[line-push-worker] claim failed', claimErr);
    return new Response(JSON.stringify({ error: 'claim_failed', details: claimErr.message }), {
      status: 500,
      headers: { ...dynamicCors, 'Content-Type': 'application/json' },
    });
  }

  const rows = (batch || []) as OutboxRow[];
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let rateLimited = false;

  for (const row of rows) {
    if (!row.line_user_id) {
      await supabase.rpc('mark_line_push_result', { _id: row.id, _ok: false, _err: 'no_line_user_id' });
      skipped++;
      continue;
    }

    try {
      const messages = renderTemplate(row.template, row.payload || {});
      const resp = await fetch(LINE_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lineToken}`,
        },
        body: JSON.stringify({ to: row.line_user_id, messages }),
      });

      if (resp.ok) {
        await supabase.rpc('mark_line_push_result', { _id: row.id, _ok: true });
        sent++;
      } else {
        const body = (await resp.text()).slice(0, 500);
        const errMsg = `HTTP ${resp.status}: ${body}`;
        await supabase.rpc('mark_line_push_result', { _id: row.id, _ok: false, _err: errMsg });
        failed++;
        if (resp.status === 429) {
          rateLimited = true;
          break;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await supabase.rpc('mark_line_push_result', { _id: row.id, _ok: false, _err: msg.slice(0, 500) });
      failed++;
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      processed: rows.length,
      sent,
      failed,
      skipped,
      rate_limited: rateLimited,
    }),
    { headers: { ...dynamicCors, 'Content-Type': 'application/json' } },
  );
});
