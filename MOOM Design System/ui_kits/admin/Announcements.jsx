/* MOOM Admin — ประกาศ (Announcements)
   Broadcast communication to members (and/or staff) with scheduling, targeting, analytics.

   Design choices:
   - Tabs: ทั้งหมด / กำลังส่ง / ตั้งเวลา / ฉบับร่าง / เสร็จสิ้น
   - Each announcement = card with channels, target audience, schedule, read rate
   - Compose flow in full-screen modal with 4 steps: content → audience → channels → schedule
   - Live preview of in-app banner + LINE bubble + SMS
   - Analytics drawer shows reach, read rate, channel breakdown, per-member delivery
   - Priority levels: ข้อมูล / สำคัญ / ด่วน (color-coded)
*/

const { useState: useAN, useMemo: useMemoAN, useEffect: useEffectAN, useRef: useRefAN } = React;

/* =============================================================
 *  DATA
 * =========================================================== */
const AN_PRIORITIES = [
  { id: 'info',    label: 'ข้อมูล',   color: 'hsl(212 80% 55%)', soft: 'hsl(212 90% 96%)' },
  { id: 'notice',  label: 'สำคัญ',    color: 'hsl(38 92% 50%)',  soft: 'hsl(38 95% 95%)'  },
  { id: 'urgent',  label: 'ด่วน',     color: 'hsl(0 72% 55%)',   soft: 'hsl(0 95% 96%)'   },
];

const AN_SCOPES = [
  { id: 'member', label: 'สมาชิก',  icon: 'users' },
  { id: 'staff',  label: 'พนักงาน', icon: 'userOne' },
];

const AN_CHANNELS = [
  { id: 'inapp', label: 'ในแอป',   color: 'hsl(25 95% 55%)', icon: 'bell',  cost: 0,    desc: 'Banner + push' },
  { id: 'line',  label: 'LINE',    color: 'hsl(150 60% 45%)', icon: 'line',  cost: 0.5,  desc: 'ส่งผ่าน LINE OA' },
  { id: 'sms',   label: 'SMS',     color: 'hsl(270 60% 60%)', icon: 'phone', cost: 1.5,  desc: 'ข้อความสั้น' },
];

const AN_AUDIENCES = [
  { id: 'all',      label: 'ทุกคน',         count: 247, icon: 'users' },
  { id: 'active',   label: 'Active สมาชิก', count: 198, icon: 'check' },
  { id: 'trial',    label: 'ทดลอง',         count: 18,  icon: 'star'  },
  { id: 'expired',  label: 'หมดอายุ',        count: 31,  icon: 'clock' },
  { id: 'gold',     label: 'Gold/Platinum', count: 64,  icon: 'crown' },
  { id: 'staff',    label: 'พนักงานทั้งหมด', count: 14,  icon: 'userOne' },
  { id: 'trainers', label: 'เทรนเนอร์',      count: 8,   icon: 'dumbbell' },
];

/* Seed announcements */
const AN_DATA = [
  {
    id: 'an1', status: 'sending', priority: 'urgent', scope: 'member',
    title: 'ปิดสาขาอโศกชั่วคราว 22 เม.ย.',
    body: 'เนื่องจากระบบไฟฟ้าขัดข้อง ยิมสาขาอโศกจะปิดทำการ 22 เม.ย. ตั้งแต่ 06:00 - 18:00 น. คลาสทั้งหมดในวันดังกล่าวจะถูกเลื่อน ทีมงานจะติดต่อกลับภายใน 2 ชม.',
    audiences: ['all'], channels: ['inapp', 'line', 'sms'],
    scheduledAt: null, sentAt: '2026-04-21 14:32', createdBy: 'Kongphop',
    reach: 247, delivered: 223, read: 189, tapped: 64,
  },
  {
    id: 'an2', status: 'scheduled', priority: 'notice', scope: 'member',
    title: 'คลาส HIIT พิเศษ วันเสาร์ ลดพิเศษ 50%',
    body: 'เฉพาะวันเสาร์ที่ 26 เม.ย. คลาส HIIT ทุกรอบลดราคา 50% จองล่วงหน้าผ่านแอป เพื่อรับสิทธิ์',
    audiences: ['active', 'gold'], channels: ['inapp', 'line'],
    scheduledAt: '2026-04-23 09:00', sentAt: null, createdBy: 'Priya',
    reach: 262, delivered: 0, read: 0, tapped: 0,
  },
  {
    id: 'an3', status: 'sent', priority: 'info', scope: 'member',
    title: 'เปิดคลาสใหม่ Yoga Flow ทุกเช้าวันอาทิตย์',
    body: 'คลาสโยคะใหม่ ทุกวันอาทิตย์ 07:00 - 08:00 น. กับครูเมย์ ที่สตูดิโอ 3 เริ่ม 4 พ.ค. นี้',
    audiences: ['all'], channels: ['inapp'],
    scheduledAt: null, sentAt: '2026-04-18 10:00', createdBy: 'Kongphop',
    reach: 247, delivered: 247, read: 198, tapped: 42,
  },
  {
    id: 'an4', status: 'sent', priority: 'notice', scope: 'member',
    title: 'สมาชิกภาพจะหมดอายุใน 7 วัน',
    body: 'ต่ออายุสมาชิกภาพของคุณก่อนหมดอายุ และรับส่วนลด 10% สำหรับการต่ออายุครั้งถัดไป',
    audiences: ['expired'], channels: ['inapp', 'line', 'sms'],
    scheduledAt: null, sentAt: '2026-04-17 08:00', createdBy: 'Priya',
    reach: 31, delivered: 31, read: 28, tapped: 14,
  },
  {
    id: 'an5', status: 'draft', priority: 'info', scope: 'member',
    title: 'ขอบคุณที่อยู่กับเรา — กำลังเขียน...',
    body: 'ขอบคุณทุกท่านที่อยู่กับ MOOM GYM มาตลอด...',
    audiences: ['gold'], channels: ['inapp', 'line'],
    scheduledAt: null, sentAt: null, createdBy: 'Kongphop',
    reach: 64, delivered: 0, read: 0, tapped: 0,
  },
  {
    id: 'an6', status: 'sent', priority: 'info', scope: 'staff',
    title: 'ประชุมทีมประจำสัปดาห์',
    body: 'ประชุมทีมทุกวันจันทร์ 09:00 น. ที่ห้องประชุม 2 กรุณาเตรียมรายงานผลประจำสัปดาห์',
    audiences: ['staff'], channels: ['inapp'],
    scheduledAt: null, sentAt: '2026-04-14 17:00', createdBy: 'Kongphop',
    reach: 14, delivered: 14, read: 13, tapped: 0,
  },
];

/* =============================================================
 *  HELPERS / ICONS
 * =========================================================== */
const AN_Icon = ({ d, size = 14, stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
       style={{ display: 'block', flexShrink: 0 }}>{d}</svg>
);

const anIcons = {
  plus: ctIcons.plus, x: ctIcons.x, search: ctIcons.search, edit: ctIcons.edit,
  trash: ctIcons.trash, chev: ctIcons.chev, check: ctIcons.check, info: ctIcons.info,
  copy: ctIcons.copy, dots: ctIcons.dots, warn: ctIcons.warn,
  users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
  userOne: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  bell:  <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
  line:  <><circle cx="12" cy="12" r="10"/><path d="M7 11h2v3M11 14V11M13 14V11l2 3V11M16 14V11"/></>,
  phone: <><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></>,
  mega:  <><path d="M3 11l18-8v18L3 13z"/><path d="M11.6 16.8a3 3 0 11-5.8-1.6"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  cal:   <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  send:  <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
  eye:   <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  bolt:  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
  draft: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  check2:<polyline points="20 6 9 17 4 12"/>,
  star:  <polygon points="12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8 12 2"/>,
  crown: <path d="M2 17h20l-2-12-5 4-3-5-3 5-5-4-2 12z"/>,
  dumbbell: <><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94"/></>,
  chart: <><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>,
  pause: <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
  arrow: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  filter:<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>,
  radio: <><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14M16.24 7.76a5 5 0 010 7.07M7.76 16.24a5 5 0 010-7.07"/></>,
  sparkle: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
};

const anStatusMeta = (s) => ({
  sending:   { label: 'กำลังส่ง',  color: 'hsl(212 80% 55%)', pulse: true },
  scheduled: { label: 'ตั้งเวลา',   color: 'hsl(270 60% 60%)' },
  sent:      { label: 'ส่งแล้ว',   color: 'hsl(150 50% 45%)' },
  draft:     { label: 'ฉบับร่าง',  color: 'hsl(220 14% 50%)' },
}[s] || { label: s, color: adminTokens.muted });

const anPriority = (id) => AN_PRIORITIES.find(p => p.id === id) || AN_PRIORITIES[0];
const anChannel  = (id) => AN_CHANNELS.find(c => c.id === id)  || AN_CHANNELS[0];
const anAudience = (id) => AN_AUDIENCES.find(a => a.id === id) || AN_AUDIENCES[0];

const anFmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date('2026-04-21 18:00');
  const diff = (now - d) / 1000;
  if (diff < 60) return 'เมื่อกี้';
  if (diff < 3600) return `${Math.round(diff/60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.round(diff/3600)} ชั่วโมงที่แล้ว`;
  return iso.slice(5, 16).replace(' ', ' · ');
};

/* =============================================================
 *  ANNOUNCEMENT CARD
 * =========================================================== */
const AnnouncementCard = ({ an, onOpen, onEdit }) => {
  const [hover, setHover] = useAN(false);
  const pri = anPriority(an.priority);
  const st = anStatusMeta(an.status);
  const readRate = an.delivered ? Math.round(an.read / an.delivered * 100) : 0;
  const totalAudience = an.audiences.reduce((s, id) => s + (anAudience(id)?.count || 0), 0);

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: adminTokens.surface,
        border: `1px solid ${hover ? pri.color : adminTokens.border}`,
        boxShadow: hover ? adminTokens.shadowMd : adminTokens.shadowSm,
        borderRadius: adminTokens.r3, padding: 0, cursor: 'pointer',
        overflow: 'hidden', position: 'relative',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Priority strip */}
      <div style={{ height: 3, background: pri.color }}/>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Top row: priority badge + status + menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, color: pri.color,
            background: pri.soft, padding: '3px 7px', borderRadius: 4,
            letterSpacing: '.06em', textTransform: 'uppercase',
          }}>{pri.label}</span>
          <span style={{
            fontSize: 9, fontWeight: 800, color: st.color,
            background: `${st.color}15`, padding: '3px 7px', borderRadius: 4,
            letterSpacing: '.04em', display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            {st.pulse && <span style={{
              width: 6, height: 6, borderRadius: '50%', background: st.color,
              animation: 'admin-pulse 1.2s ease-in-out infinite',
            }}/>}
            {st.label}
          </span>
          {an.scope === 'staff' && (
            <span style={{
              fontSize: 9, fontWeight: 800, color: adminTokens.muted,
              background: adminTokens.subtle, padding: '3px 7px', borderRadius: 4,
              letterSpacing: '.04em', display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <AN_Icon d={anIcons.userOne} size={9}/> ภายใน
            </span>
          )}
          <div style={{ flex: 1 }}/>
          <span style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600 }}>
            {an.sentAt ? anFmtDate(an.sentAt)
              : an.scheduledAt ? `📅 ${an.scheduledAt.slice(5,16).replace(' ', ' · ')}`
              : 'ยังไม่ได้ส่ง'}
          </span>
        </div>

        {/* Title + body */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: adminTokens.black,
                        letterSpacing: '-.01em', lineHeight: 1.3, marginBottom: 4 }}>
            {an.title}
          </div>
          <div style={{
            fontSize: 12, color: adminTokens.muted, lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {an.body}
          </div>
        </div>

        {/* Channels + audience */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8,
          borderTop: `1px dashed ${adminTokens.divider}`,
        }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {an.channels.map(cid => {
              const ch = anChannel(cid);
              return (
                <div key={cid} title={ch.label} style={{
                  width: 22, height: 22, borderRadius: 5, background: `${ch.color}20`, color: ch.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <AN_Icon d={anIcons[ch.icon]} size={11}/>
                </div>
              );
            })}
          </div>
          <div style={{ height: 16, width: 1, background: adminTokens.border }}/>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, color: adminTokens.black, fontWeight: 600,
          }}>
            <AN_Icon d={anIcons.users} size={11}/>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{totalAudience}</span>
            <span style={{ color: adminTokens.muted, fontWeight: 500 }}>
              · {an.audiences.map(id => anAudience(id)?.label).filter(Boolean).join(', ')}
            </span>
          </div>
        </div>

        {/* Stats — for sent only */}
        {an.status === 'sent' && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
            padding: '8px 10px', background: adminTokens.subtle, borderRadius: 8,
          }}>
            <AnMiniStat label="ส่งถึง" value={an.delivered} color={adminTokens.black}/>
            <AnMiniStat label="อ่าน" value={`${readRate}%`} color={pri.color}/>
            <AnMiniStat label="คลิก" value={an.tapped} color={adminTokens.success}/>
          </div>
        )}

        {an.status === 'sending' && (
          <div style={{
            padding: 8, background: `${st.color}10`, borderRadius: 8,
            border: `1px solid ${st.color}30`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ display: 'flex', gap: 3 }}>
              <AnDot c={st.color} delay={0}/><AnDot c={st.color} delay={.2}/><AnDot c={st.color} delay={.4}/>
            </div>
            <div style={{ fontSize: 11, color: st.color, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              ส่งแล้ว {an.delivered}/{an.reach} · {Math.round(an.delivered/an.reach*100)}%
            </div>
          </div>
        )}

        {an.status === 'scheduled' && (
          <div style={{
            padding: 8, background: `${st.color}10`, borderRadius: 8,
            border: `1px solid ${st.color}30`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AN_Icon d={anIcons.cal} size={12} stroke={2.2}/>
            <div style={{ fontSize: 11, color: st.color, fontWeight: 700 }}>
              จะส่งวันที่ {an.scheduledAt?.slice(0, 10)} เวลา {an.scheduledAt?.slice(11, 16)}
            </div>
          </div>
        )}

        {an.status === 'draft' && (
          <div style={{
            display: 'flex', gap: 6, paddingTop: 8,
            borderTop: `1px dashed ${adminTokens.divider}`,
          }}>
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} style={{
              flex: 1, height: 30, borderRadius: 7, cursor: 'pointer',
              border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
              color: adminTokens.black, fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
              <AN_Icon d={anIcons.edit} size={11}/> ทำต่อ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AnMiniStat = ({ label, value, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 13, fontWeight: 800, color,
                  fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>{value}</div>
    <div style={{ fontSize: 9, color: adminTokens.muted, fontWeight: 700, marginTop: 1,
                  textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
  </div>
);

const AnDot = ({ c, delay }) => (
  <div style={{
    width: 5, height: 5, borderRadius: '50%', background: c,
    animation: `admin-pulse 1s ease-in-out ${delay}s infinite`,
  }}/>
);

/* =============================================================
 *  DETAIL DRAWER — analytics
 * =========================================================== */
const AnnouncementDrawer = ({ an, onClose, onEdit, onDuplicate }) => {
  const pri = anPriority(an.priority);
  const st = anStatusMeta(an.status);
  const readRate = an.delivered ? Math.round(an.read / an.delivered * 100) : 0;
  const tapRate = an.delivered ? Math.round(an.tapped / an.delivered * 100) : 0;

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.35)', zIndex: 90,
        animation: 'an-fade .18s ease-out',
      }}/>
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 600, zIndex: 91,
        background: adminTokens.surface, boxShadow: '-20px 0 60px rgba(15,23,42,.15)',
        display: 'flex', flexDirection: 'column',
        animation: 'an-slide .25s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${pri.color} 0%, color-mix(in oklab, ${pri.color} 75%, #000) 100%)`,
          color: '#fff', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,.2)',
              backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <AN_Icon d={anIcons.mega} size={24}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: .85, letterSpacing: '.06em',
                            textTransform: 'uppercase' }}>
                {pri.label} · {st.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', marginTop: 2 }}>
                {an.title}
              </div>
              <div style={{ fontSize: 11, opacity: .88, marginTop: 6 }}>
                {an.sentAt ? `ส่งเมื่อ ${an.sentAt}` : an.scheduledAt ? `ตั้งเวลา ${an.scheduledAt}` : `สร้างโดย ${an.createdBy}`}
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8, border: 0,
              background: 'rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <AN_Icon d={anIcons.x} size={14}/>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex',
                      flexDirection: 'column', gap: 18 }}>
          {/* Body text */}
          <div>
            <AnLabel>เนื้อหา</AnLabel>
            <div style={{
              padding: 12, background: adminTokens.subtle, borderRadius: 9,
              border: `1px solid ${adminTokens.border}`,
              fontSize: 13, color: adminTokens.black, lineHeight: 1.6,
            }}>{an.body}</div>
          </div>

          {/* Analytics */}
          {an.status === 'sent' && (
            <div>
              <AnLabel>ประสิทธิภาพ</AnLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                <AnDrawerStat label="ผู้รับ" value={an.reach} color={adminTokens.black}/>
                <AnDrawerStat label="ส่งถึง" value={an.delivered} color={adminTokens.success}/>
                <AnDrawerStat label="อ่าน" value={`${readRate}%`} sub={`${an.read} คน`} color={pri.color}/>
                <AnDrawerStat label="คลิก" value={`${tapRate}%`} sub={`${an.tapped} ครั้ง`} color={adminTokens.orange}/>
              </div>

              {/* Funnel */}
              <div style={{ marginTop: 12, padding: 12, background: adminTokens.subtle,
                            borderRadius: 9, border: `1px solid ${adminTokens.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: adminTokens.muted,
                              textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
                  Funnel การมีปฏิสัมพันธ์
                </div>
                <AnFunnelBar label="ผู้รับ" value={an.reach} total={an.reach} color={adminTokens.ink2}/>
                <AnFunnelBar label="ส่งถึง" value={an.delivered} total={an.reach} color={adminTokens.success}/>
                <AnFunnelBar label="เปิดอ่าน" value={an.read} total={an.reach} color={pri.color}/>
                <AnFunnelBar label="คลิก" value={an.tapped} total={an.reach} color={adminTokens.orange} last/>
              </div>
            </div>
          )}

          {/* Audience */}
          <div>
            <AnLabel>ผู้รับ</AnLabel>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {an.audiences.map(id => {
                const a = anAudience(id);
                return (
                  <div key={id} style={{
                    padding: '8px 12px', borderRadius: 9,
                    background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 6, background: adminTokens.orangeSoft,
                      color: adminTokens.orange, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <AN_Icon d={anIcons[a.icon]} size={12}/>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black }}>
                        {a.label}
                      </div>
                      <div style={{ fontSize: 10, color: adminTokens.muted,
                                    fontVariantNumeric: 'tabular-nums' }}>
                        {a.count} คน
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Channels breakdown */}
          <div>
            <AnLabel>ช่องทาง</AnLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {an.channels.map(cid => {
                const ch = anChannel(cid);
                const delivered = an.status === 'sent' ? Math.round(an.delivered / an.channels.length) : 0;
                const channelRead = an.status === 'sent' ? Math.round(delivered * (readRate / 100) * (0.8 + Math.random() * 0.4)) : 0;
                return (
                  <div key={cid} style={{
                    padding: '10px 12px', borderRadius: 9,
                    background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: `${ch.color}20`, color: ch.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <AN_Icon d={anIcons[ch.icon]} size={15}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black }}>
                        {ch.label}
                      </div>
                      <div style={{ fontSize: 10, color: adminTokens.muted }}>
                        {ch.desc} · ค่าส่ง ฿{ch.cost}/ข้อความ
                      </div>
                    </div>
                    {an.status === 'sent' && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black,
                                      fontVariantNumeric: 'tabular-nums' }}>
                          {delivered}
                        </div>
                        <div style={{ fontSize: 10, color: adminTokens.muted }}>
                          อ่าน {channelRead}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {an.status === 'sent' && (
              <div style={{
                marginTop: 8, padding: '8px 12px', background: adminTokens.subtle,
                borderRadius: 8, fontSize: 11, color: adminTokens.muted, fontWeight: 600,
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>ค่าใช้จ่ายทั้งหมด</span>
                <span style={{ color: adminTokens.black, fontWeight: 800,
                               fontVariantNumeric: 'tabular-nums' }}>
                  ฿{an.channels.reduce((s, cid) => s + anChannel(cid).cost * (an.delivered / an.channels.length), 0).toFixed(0)}
                </span>
              </div>
            )}
          </div>

          {/* Meta */}
          <div style={{ padding: '10px 12px', background: adminTokens.subtle, borderRadius: 9,
                        display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
            <AnMetaRow label="สร้างโดย" value={an.createdBy}/>
            <AnMetaRow label="ID" value={an.id.toUpperCase()} mono/>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: `1px solid ${adminTokens.border}`,
          display: 'flex', gap: 8,
        }}>
          <button onClick={onDuplicate} style={{
            height: 38, padding: '0 14px', borderRadius: 9, cursor: 'pointer',
            border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
            color: adminTokens.black, fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <AN_Icon d={anIcons.copy} size={12}/> ทำสำเนา
          </button>
          <div style={{ flex: 1 }}/>
          <button onClick={onClose} style={{
            height: 38, padding: '0 14px', borderRadius: 9, cursor: 'pointer',
            border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
            color: adminTokens.black, fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
          }}>ปิด</button>
          {(an.status === 'draft' || an.status === 'scheduled') && (
            <button onClick={onEdit} style={{
              height: 38, padding: '0 18px', borderRadius: 9, cursor: 'pointer',
              border: 0, background: pri.color, color: '#fff',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: `0 4px 12px ${pri.color}60`,
            }}>
              <AN_Icon d={anIcons.edit} size={12}/> แก้ไข
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes an-fade  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes an-slide { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes an-pop   { from { opacity: 0; transform: translate(-50%,-48%) scale(.97); }
                              to   { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
      `}</style>
    </>
  );
};

const AnLabel = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 800, color: adminTokens.muted,
    textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8,
  }}>{children}</div>
);

const AnDrawerStat = ({ label, value, sub, color }) => (
  <div style={{
    padding: 10, background: adminTokens.subtle, borderRadius: 9,
    border: `1px solid ${adminTokens.border}`, textAlign: 'center',
  }}>
    <div style={{
      fontSize: 17, fontWeight: 800, color, letterSpacing: '-.01em',
      fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
    }}>{value}</div>
    <div style={{ fontSize: 9, color: adminTokens.muted, fontWeight: 700, marginTop: 3,
                  textTransform: 'uppercase', letterSpacing: '.04em' }}>
      {label}
    </div>
    {sub && <div style={{ fontSize: 10, color: adminTokens.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const AnMetaRow = ({ label, value, mono }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <span style={{ color: adminTokens.muted }}>{label}</span>
    <span style={{ color: adminTokens.black, fontWeight: 700,
                   fontFamily: mono ? 'monospace' : 'inherit' }}>
      {value}
    </span>
  </div>
);

const AnFunnelBar = ({ label, value, total, color, last }) => {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div style={{ marginBottom: last ? 0 : 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: adminTokens.black, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 700,
                       fontVariantNumeric: 'tabular-nums' }}>
          {value} <span style={{ opacity: .6 }}>· {Math.round(pct)}%</span>
        </span>
      </div>
      <div style={{ height: 6, background: adminTokens.surface, borderRadius: 3, overflow: 'hidden',
                    border: `1px solid ${adminTokens.border}` }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width .4s' }}/>
      </div>
    </div>
  );
};

/* =============================================================
 *  COMPOSE MODAL — 4-step flow
 * =========================================================== */
const ComposeModal = ({ draft, onSave, onSend, onClose }) => {
  const [step, setStep] = useAN(0);
  const [title, setTitle]         = useAN(draft.title || '');
  const [body, setBody]           = useAN(draft.body || '');
  const [priority, setPriority]   = useAN(draft.priority || 'info');
  const [scope, setScope]         = useAN(draft.scope || 'member');
  const [audiences, setAudiences] = useAN(draft.audiences || ['all']);
  const [channels, setChannels]   = useAN(draft.channels || ['inapp']);
  const [when, setWhen]           = useAN(draft.scheduledAt ? 'schedule' : 'now');
  const [schedDate, setSchedDate] = useAN(draft.scheduledAt?.slice(0, 10) || '2026-04-22');
  const [schedTime, setSchedTime] = useAN(draft.scheduledAt?.slice(11, 16) || '09:00');

  const pri = anPriority(priority);
  const totalReach = audiences.reduce((s, id) => s + (anAudience(id)?.count || 0), 0);
  const totalCost = channels.reduce((s, cid) => s + anChannel(cid).cost * totalReach, 0);

  const toggle = (arr, setArr, id) =>
    setArr(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);

  const step1Valid = title.trim() && body.trim();
  const step2Valid = audiences.length > 0;
  const step3Valid = channels.length > 0;
  const canProceed = [step1Valid, step2Valid, step3Valid, true][step];

  const build = () => ({
    ...draft,
    title: title.trim(), body: body.trim(), priority, scope, audiences, channels,
    scheduledAt: when === 'schedule' ? `${schedDate} ${schedTime}:00` : null,
  });

  const steps = [
    { n: 1, label: 'เนื้อหา',    icon: anIcons.draft },
    { n: 2, label: 'ผู้รับ',      icon: anIcons.users },
    { n: 3, label: 'ช่องทาง',    icon: anIcons.radio },
    { n: 4, label: 'กำหนดเวลา', icon: anIcons.cal   },
  ];

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 100,
        animation: 'an-fade .18s ease-out',
      }}/>
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 820, maxHeight: '92vh', zIndex: 101,
        background: adminTokens.surface, borderRadius: adminTokens.r4,
        boxShadow: '0 24px 60px rgba(15,23,42,.24)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: 'an-pop .22s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 22px',
          background: `linear-gradient(135deg, ${pri.color} 0%, color-mix(in oklab, ${pri.color} 75%, #000) 100%)`,
          color: '#fff', display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AN_Icon d={anIcons.mega} size={20}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: .85, letterSpacing: '.06em',
                          textTransform: 'uppercase' }}>
              {draft.id ? 'แก้ไขประกาศ' : 'สร้างประกาศใหม่'}
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.02em', marginTop: 2,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {title.trim() || 'หัวข้อประกาศ'}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: 0,
            background: 'rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AN_Icon d={anIcons.x} size={14}/>
          </button>
        </div>

        {/* Steps bar */}
        <div style={{
          padding: '14px 22px', background: adminTokens.subtle,
          borderBottom: `1px solid ${adminTokens.border}`,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <button onClick={() => setStep(i)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                border: i === step ? `1.5px solid ${pri.color}` : `1px solid transparent`,
                background: i === step ? adminTokens.surface : 'transparent',
                color: i === step ? pri.color : (i < step ? adminTokens.success : adminTokens.muted),
                fontFamily: 'inherit', fontSize: 12, fontWeight: i === step ? 800 : 600,
                boxShadow: i === step ? adminTokens.shadowSm : 'none',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: i < step ? adminTokens.success : (i === step ? pri.color : adminTokens.border),
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800,
                }}>
                  {i < step ? <AN_Icon d={anIcons.check2} size={10} stroke={3}/> : s.n}
                </div>
                {s.label}
              </button>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: adminTokens.border }}/>}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 22, display: 'grid',
                      gridTemplateColumns: step === 0 ? '1fr 300px' : '1fr', gap: 20 }}>
          {/* STEP 0: Content */}
          {step === 0 && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <AnLabel>หัวข้อ <span style={{ color: adminTokens.destr }}>*</span></AnLabel>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                         placeholder="สั้น ชัดเจน" maxLength={60}
                         style={anInputStyle}
                         onFocus={e => e.target.style.borderColor = pri.color}
                         onBlur={e => e.target.style.borderColor = adminTokens.border}/>
                  <div style={{ textAlign: 'right', fontSize: 10, color: adminTokens.muted, marginTop: 3,
                                fontVariantNumeric: 'tabular-nums' }}>{title.length}/60</div>
                </div>
                <div>
                  <AnLabel>เนื้อหา <span style={{ color: adminTokens.destr }}>*</span></AnLabel>
                  <textarea value={body} onChange={e => setBody(e.target.value)}
                            placeholder="เนื้อหาประกาศ — ข้อมูลสำคัญที่ผู้รับต้องรู้"
                            rows={5} maxLength={500}
                            style={{ ...anInputStyle, height: 'auto', padding: '10px 12px',
                                     resize: 'vertical', minHeight: 100, lineHeight: 1.6 }}
                            onFocus={e => e.target.style.borderColor = pri.color}
                            onBlur={e => e.target.style.borderColor = adminTokens.border}/>
                  <div style={{ textAlign: 'right', fontSize: 10, color: adminTokens.muted, marginTop: 3,
                                fontVariantNumeric: 'tabular-nums' }}>{body.length}/500</div>
                </div>
                <div>
                  <AnLabel>ระดับความสำคัญ</AnLabel>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {AN_PRIORITIES.map(p => (
                      <button key={p.id} onClick={() => setPriority(p.id)} style={{
                        flex: 1, padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
                        border: priority === p.id ? `2px solid ${p.color}` : `1px solid ${adminTokens.border}`,
                        background: priority === p.id ? p.soft : adminTokens.surface,
                        color: priority === p.id ? p.color : adminTokens.black,
                        fontFamily: 'inherit', fontSize: 12, fontWeight: 700, textAlign: 'left',
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-.01em' }}>{p.label}</div>
                        <div style={{ fontSize: 10, marginTop: 2, opacity: .8 }}>
                          {p.id === 'info'   && 'ข้อมูลทั่วไป'}
                          {p.id === 'notice' && 'แจ้งเตือนสำคัญ'}
                          {p.id === 'urgent' && 'ต้องรู้ทันที'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <AnLabel>ประเภทผู้รับ</AnLabel>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {AN_SCOPES.map(s => (
                      <button key={s.id} onClick={() => setScope(s.id)} style={{
                        flex: 1, height: 38, borderRadius: 9, cursor: 'pointer',
                        border: scope === s.id ? `2px solid ${pri.color}` : `1px solid ${adminTokens.border}`,
                        background: scope === s.id ? `${pri.color}10` : adminTokens.surface,
                        color: scope === s.id ? pri.color : adminTokens.black,
                        fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        <AN_Icon d={anIcons[s.icon]} size={12}/> {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <AnLabel>ตัวอย่างในแอป</AnLabel>
                <PreviewInApp title={title} body={body} priority={priority}/>
              </div>
            </>
          )}

          {/* STEP 1: Audience */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <AnLabel>เลือกกลุ่มผู้รับ</AnLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {AN_AUDIENCES.filter(a => scope === 'staff'
                    ? ['staff','trainers'].includes(a.id)
                    : !['staff','trainers'].includes(a.id)).map(a => {
                    const selected = audiences.includes(a.id);
                    return (
                      <button key={a.id} onClick={() => toggle(audiences, setAudiences, a.id)} style={{
                        padding: 12, borderRadius: 10, cursor: 'pointer',
                        border: selected ? `2px solid ${pri.color}` : `1px solid ${adminTokens.border}`,
                        background: selected ? `${pri.color}10` : adminTokens.surface,
                        display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit', textAlign: 'left',
                      }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 8,
                          background: selected ? pri.color : adminTokens.orangeSoft,
                          color: selected ? '#fff' : adminTokens.orange,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <AN_Icon d={anIcons[a.icon]} size={14}/>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black }}>
                            {a.label}
                          </div>
                          <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 1,
                                        fontVariantNumeric: 'tabular-nums' }}>
                            {a.count} คน
                          </div>
                        </div>
                        {selected && (
                          <div style={{ color: pri.color }}>
                            <AN_Icon d={anIcons.check2} size={14} stroke={3}/>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div style={{
                padding: 14, background: adminTokens.subtle, borderRadius: 10,
                border: `1px solid ${adminTokens.border}`,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: pri.color, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <AN_Icon d={anIcons.users} size={18}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: adminTokens.muted, fontWeight: 600 }}>
                    จะส่งถึงผู้รับทั้งหมด
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: adminTokens.black,
                                letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>
                    {totalReach} <span style={{ fontSize: 13, color: adminTokens.muted }}>คน</span>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600,
                              textAlign: 'right', maxWidth: 200 }}>
                  {audiences.map(id => anAudience(id)?.label).join(' · ') || '(ไม่ได้เลือก)'}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Channels */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <AnLabel>เลือกช่องทางส่ง</AnLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {AN_CHANNELS.map(ch => {
                    const selected = channels.includes(ch.id);
                    const thisCost = ch.cost * totalReach;
                    return (
                      <button key={ch.id} onClick={() => toggle(channels, setChannels, ch.id)} style={{
                        padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                        border: selected ? `2px solid ${ch.color}` : `1px solid ${adminTokens.border}`,
                        background: selected ? `${ch.color}10` : adminTokens.surface,
                        display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit', textAlign: 'left',
                      }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: selected ? ch.color : `${ch.color}20`,
                          color: selected ? '#fff' : ch.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <AN_Icon d={anIcons[ch.icon]} size={18}/>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black,
                                        letterSpacing: '-.01em' }}>
                            {ch.label}
                          </div>
                          <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 2 }}>
                            {ch.desc} · {ch.cost === 0 ? 'ฟรี' : `฿${ch.cost}/ข้อความ`}
                          </div>
                        </div>
                        {ch.cost > 0 && selected && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600 }}>
                              ค่าใช้จ่าย
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: ch.color,
                                          fontVariantNumeric: 'tabular-nums' }}>
                              ฿{thisCost.toLocaleString('th-TH')}
                            </div>
                          </div>
                        )}
                        {selected && (
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%', background: ch.color, color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <AN_Icon d={anIcons.check2} size={12} stroke={3}/>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cost summary */}
              <div style={{
                padding: 14, background: totalCost > 0 ? 'hsl(38 95% 95%)' : adminTokens.subtle,
                borderRadius: 10, border: `1px solid ${totalCost > 0 ? 'hsl(38 92% 60%)' : adminTokens.border}`,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <AN_Icon d={totalCost > 0 ? anIcons.warn : anIcons.info} size={16}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black }}>
                    ค่าใช้จ่ายโดยประมาณ
                  </div>
                  <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 2 }}>
                    {totalReach} ผู้รับ × {channels.length} ช่องทาง
                  </div>
                </div>
                <div style={{
                  fontSize: 22, fontWeight: 800, color: totalCost > 0 ? 'hsl(38 90% 40%)' : adminTokens.success,
                  letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums',
                }}>
                  {totalCost === 0 ? 'ฟรี' : `฿${totalCost.toLocaleString('th-TH')}`}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Schedule */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <AnLabel>เมื่อไหร่</AnLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button onClick={() => setWhen('now')} style={{
                    padding: '16px 14px', borderRadius: 10, cursor: 'pointer',
                    border: when === 'now' ? `2px solid ${pri.color}` : `1px solid ${adminTokens.border}`,
                    background: when === 'now' ? `${pri.color}10` : adminTokens.surface,
                    display: 'flex', flexDirection: 'column', gap: 8,
                    fontFamily: 'inherit', textAlign: 'left',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, background: pri.color, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <AN_Icon d={anIcons.bolt} size={16}/>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: adminTokens.black,
                                    letterSpacing: '-.01em' }}>ส่งเดี๋ยวนี้</div>
                      <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 2 }}>
                        ผู้รับได้รับทันทีหลังยืนยัน
                      </div>
                    </div>
                  </button>
                  <button onClick={() => setWhen('schedule')} style={{
                    padding: '16px 14px', borderRadius: 10, cursor: 'pointer',
                    border: when === 'schedule' ? `2px solid ${pri.color}` : `1px solid ${adminTokens.border}`,
                    background: when === 'schedule' ? `${pri.color}10` : adminTokens.surface,
                    display: 'flex', flexDirection: 'column', gap: 8,
                    fontFamily: 'inherit', textAlign: 'left',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, background: 'hsl(270 60% 60%)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <AN_Icon d={anIcons.cal} size={16}/>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: adminTokens.black,
                                    letterSpacing: '-.01em' }}>ตั้งเวลา</div>
                      <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 2 }}>
                        เลือกวันและเวลาที่ต้องการ
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {when === 'schedule' && (
                <div style={{
                  padding: 14, background: adminTokens.subtle, borderRadius: 10,
                  border: `1px solid ${adminTokens.border}`,
                }}>
                  <AnLabel>วันและเวลาที่ต้องการส่ง</AnLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 8 }}>
                    <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                           style={anInputStyle}/>
                    <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                           style={anInputStyle}/>
                  </div>
                </div>
              )}

              {/* Final summary */}
              <div style={{
                padding: 16, background: pri.soft, borderRadius: 10,
                border: `1px solid ${pri.color}40`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: pri.color, letterSpacing: '.05em',
                              textTransform: 'uppercase', marginBottom: 10 }}>
                  สรุปก่อนส่ง
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <AnSummaryRow label="หัวข้อ" value={title.trim() || '(ยังไม่ได้ตั้ง)'}/>
                  <AnSummaryRow label="ระดับ" value={pri.label}/>
                  <AnSummaryRow label="ผู้รับ" value={`${totalReach} คน · ${audiences.map(id => anAudience(id)?.label).join(', ')}`}/>
                  <AnSummaryRow label="ช่องทาง" value={channels.map(id => anChannel(id).label).join(' · ')}/>
                  <AnSummaryRow label="เมื่อ" value={when === 'now' ? 'เดี๋ยวนี้' : `${schedDate} ${schedTime}`}/>
                  <AnSummaryRow label="ค่าใช้จ่าย" value={totalCost === 0 ? 'ฟรี' : `฿${totalCost.toLocaleString('th-TH')}`} bold/>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 22px', borderTop: `1px solid ${adminTokens.border}`,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <button onClick={() => onSave(build())} style={{
            height: 38, padding: '0 14px', borderRadius: 9, cursor: 'pointer',
            border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
            color: adminTokens.black, fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <AN_Icon d={anIcons.draft} size={12}/> บันทึกฉบับร่าง
          </button>
          <div style={{ flex: 1 }}/>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} style={{
              height: 38, padding: '0 14px', borderRadius: 9, cursor: 'pointer',
              border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
              color: adminTokens.black, fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
            }}>ย้อนกลับ</button>
          )}
          {step < 3 ? (
            <button onClick={() => canProceed && setStep(step + 1)} disabled={!canProceed} style={{
              height: 38, padding: '0 20px', borderRadius: 9, cursor: canProceed ? 'pointer' : 'not-allowed',
              border: 0, background: canProceed ? pri.color : adminTokens.border, color: '#fff',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: canProceed ? `0 4px 12px ${pri.color}60` : 'none',
              opacity: canProceed ? 1 : 0.6,
            }}>
              ต่อไป <AN_Icon d={anIcons.arrow} size={12}/>
            </button>
          ) : (
            <button onClick={() => onSend(build())} style={{
              height: 38, padding: '0 22px', borderRadius: 9, cursor: 'pointer',
              border: 0, background: pri.color, color: '#fff',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 800, letterSpacing: '-.01em',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: `0 4px 12px ${pri.color}70`,
            }}>
              <AN_Icon d={when === 'now' ? anIcons.send : anIcons.cal} size={13}/>
              {when === 'now' ? `ส่งถึง ${totalReach} คน` : `ตั้งเวลาส่ง`}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

const AnSummaryRow = ({ label, value, bold }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
    <span style={{ color: adminTokens.muted, fontWeight: 600 }}>{label}</span>
    <span style={{ color: adminTokens.black, fontWeight: bold ? 800 : 700,
                   fontSize: bold ? 14 : 12, letterSpacing: bold ? '-.01em' : 0,
                   maxWidth: '70%', textAlign: 'right' }}>
      {value}
    </span>
  </div>
);

const anInputStyle = {
  width: '100%', height: 40, padding: '0 12px', borderRadius: 9,
  border: `1.5px solid ${adminTokens.border}`,
  background: adminTokens.surface, outline: 'none',
  fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: adminTokens.black,
  transition: 'border-color .12s',
};

/* In-app phone preview */
const PreviewInApp = ({ title, body, priority }) => {
  const pri = anPriority(priority);
  return (
    <div style={{
      background: '#000', borderRadius: 24, padding: 10, width: 240,
      boxShadow: '0 8px 24px rgba(0,0,0,.2)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 18, height: 380, padding: 12,
        display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10,
                      color: '#888', fontWeight: 600 }}>
          <span>18:42</span>
          <span>● ●●● 5G</span>
        </div>
        {/* Banner */}
        <div style={{
          padding: 10, borderRadius: 10,
          background: `linear-gradient(135deg, ${pri.color}, color-mix(in oklab, ${pri.color} 75%, #000))`,
          color: '#fff', display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <AN_Icon d={anIcons.mega} size={11}/>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em',
                           textTransform: 'uppercase', opacity: .9 }}>
              {pri.label}
            </span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '-.01em', lineHeight: 1.3 }}>
            {title || 'หัวข้อประกาศ'}
          </div>
          <div style={{
            fontSize: 9, opacity: .95, lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {body || 'เนื้อหาประกาศ...'}
          </div>
        </div>
        {/* Dummy content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#333', marginTop: 4 }}>คลาสวันนี้</div>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 38, background: '#f5f5f5', borderRadius: 7,
                                  padding: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 26, height: 26, borderRadius: 5, background: '#e5e5e5' }}/>
              <div style={{ flex: 1 }}>
                <div style={{ height: 6, background: '#ddd', borderRadius: 3, marginBottom: 3, width: '70%' }}/>
                <div style={{ height: 5, background: '#eee', borderRadius: 3, width: '40%' }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* =============================================================
 *  MAIN PAGE
 * =========================================================== */
const AnnouncementsPage = () => {
  const [items, setItems] = useAN(AN_DATA);
  const [tab, setTab] = useAN('all');
  const [query, setQuery] = useAN('');
  const [open, setOpen] = useAN(null);
  const [editDraft, setEditDraft] = useAN(null);

  const filtered = useMemoAN(() => {
    let list = items;
    if (tab !== 'all') list = list.filter(a => a.status === tab);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q));
    }
    return list.sort((a,b) => {
      const order = { sending: 0, scheduled: 1, draft: 2, sent: 3 };
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      return (b.sentAt || b.scheduledAt || '').localeCompare(a.sentAt || a.scheduledAt || '');
    });
  }, [items, tab, query]);

  const counts = useMemoAN(() => ({
    all:       items.length,
    sending:   items.filter(a => a.status === 'sending').length,
    scheduled: items.filter(a => a.status === 'scheduled').length,
    draft:     items.filter(a => a.status === 'draft').length,
    sent:      items.filter(a => a.status === 'sent').length,
  }), [items]);

  const totalReach = items.filter(a => a.status === 'sent')
    .reduce((s, a) => s + a.delivered, 0);
  const totalRead = items.filter(a => a.status === 'sent').reduce((s, a) => s + a.read, 0);
  const avgReadRate = totalReach ? Math.round(totalRead / totalReach * 100) : 0;

  const saveDraft = (draft) => {
    if (draft.id) {
      setItems(p => p.map(x => x.id === draft.id ? { ...x, ...draft, status: 'draft' } : x));
    } else {
      const id = 'an' + Date.now();
      setItems(p => [{ ...draft, id, status: 'draft', createdBy: 'Kongphop',
                       reach: 0, delivered: 0, read: 0, tapped: 0 }, ...p]);
    }
    setEditDraft(null);
  };
  const send = (draft) => {
    const isSchedule = !!draft.scheduledAt;
    if (draft.id) {
      setItems(p => p.map(x => x.id === draft.id ? {
        ...x, ...draft,
        status: isSchedule ? 'scheduled' : 'sending',
        sentAt: isSchedule ? null : new Date().toISOString().slice(0, 16).replace('T', ' '),
      } : x));
    } else {
      const id = 'an' + Date.now();
      setItems(p => [{ ...draft, id, createdBy: 'Kongphop',
        reach: draft.audiences.reduce((s, aid) => s + (anAudience(aid)?.count || 0), 0),
        delivered: 0, read: 0, tapped: 0,
        status: isSchedule ? 'scheduled' : 'sending',
        sentAt: isSchedule ? null : new Date().toISOString().slice(0, 16).replace('T', ' '),
      }, ...p]);
    }
    setEditDraft(null);
  };

  return (
    <div style={{ padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: 14,
                  maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: adminTokens.black,
                       letterSpacing: '-.02em' }}>
            ประกาศ
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: adminTokens.muted }}>
            ส่งข้อความถึงสมาชิกและพนักงาน ผ่าน In-app · LINE · SMS ·{' '}
            {items.length} ทั้งหมด · ส่งสำเร็จ {counts.sent}
          </p>
        </div>
        <button onClick={() => setEditDraft({})} style={{
          height: 38, padding: '0 16px', borderRadius: 10, cursor: 'pointer',
          background: adminTokens.orange, color: '#fff', border: 0,
          fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6, boxShadow: adminTokens.shadowOrange,
        }}>
          <AN_Icon d={anIcons.plus} size={14}/> ประกาศใหม่
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <AnKpi label="ผู้รับรวม 30 วัน" value={totalReach.toLocaleString('th-TH')}
               icon={anIcons.users} color={adminTokens.orange}/>
        <AnKpi label="อัตราเปิดอ่าน" value={`${avgReadRate}%`}
               icon={anIcons.eye} color={adminTokens.success}/>
        <AnKpi label="กำลังส่ง" value={counts.sending + counts.scheduled}
               sub={`${counts.sending} กำลังส่ง · ${counts.scheduled} ตั้งเวลา`}
               icon={anIcons.send} color={adminTokens.info}/>
        <AnKpi label="ฉบับร่าง" value={counts.draft}
               sub="ยังไม่ได้ส่ง" icon={anIcons.draft} color={adminTokens.muted}/>
      </div>

      {/* Tab bar + search */}
      <div style={{
        background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
        borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, padding: 10,
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            ['all',       'ทั้งหมด',   null],
            ['sending',   'กำลังส่ง',   'hsl(212 80% 55%)'],
            ['scheduled', 'ตั้งเวลา',   'hsl(270 60% 60%)'],
            ['draft',     'ฉบับร่าง',  'hsl(220 14% 50%)'],
            ['sent',      'ส่งแล้ว',   'hsl(150 50% 45%)'],
          ].map(([id, label, color]) => {
            const active = tab === id;
            const count = counts[id];
            return (
              <button key={id} onClick={() => setTab(id)} style={{
                height: 32, padding: '0 12px', borderRadius: 8, cursor: 'pointer',
                border: active ? `1.5px solid ${color || adminTokens.black}` : `1px solid ${adminTokens.border}`,
                background: active ? (color ? `${color}10` : adminTokens.black) : adminTokens.surface,
                color: active ? (color || '#fff') : adminTokens.muted,
                fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {label}
                <span style={{
                  minWidth: 18, padding: '0 4px', height: 16, borderRadius: 8,
                  background: active ? (color || '#fff') : adminTokens.subtle,
                  color: active ? '#fff' : adminTokens.muted,
                  fontSize: 10, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1 }}/>

        <div style={{
          height: 32, minWidth: 220, padding: '0 11px',
          background: adminTokens.subtle, border: `1px solid ${adminTokens.border}`,
          borderRadius: 8, display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <AN_Icon d={anIcons.search} size={12}/>
          <input value={query} onChange={e => setQuery(e.target.value)}
                 placeholder="ค้นหาประกาศ"
                 style={{
                   flex: 1, height: 30, border: 0, background: 'transparent', outline: 'none',
                   fontFamily: 'inherit', fontSize: 12, color: adminTokens.black,
                 }}/>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                    gap: 12 }}>
        {filtered.map(an => (
          <AnnouncementCard key={an.id} an={an}
                            onOpen={() => setOpen(an)}
                            onEdit={() => setEditDraft(an)}/>
        ))}
        {filtered.length === 0 && (
          <div style={{
            gridColumn: '1 / -1', padding: 60, textAlign: 'center',
            background: adminTokens.surface, border: `1px dashed ${adminTokens.border}`,
            borderRadius: adminTokens.r3,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: adminTokens.orangeSoft,
              color: adminTokens.orange, margin: '0 auto 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AN_Icon d={anIcons.mega} size={22}/>
            </div>
            <div style={{ fontSize: 14, color: adminTokens.black, fontWeight: 700 }}>
              ยังไม่มีประกาศในหมวดนี้
            </div>
            <div style={{ fontSize: 12, color: adminTokens.muted, marginTop: 4 }}>
              สร้างประกาศใหม่เพื่อสื่อสารกับสมาชิกของคุณ
            </div>
          </div>
        )}
      </div>

      {open && <AnnouncementDrawer
        an={open} onClose={() => setOpen(null)}
        onEdit={() => { setEditDraft(open); setOpen(null); }}
        onDuplicate={() => { setEditDraft({ ...open, id: null, status: 'draft' }); setOpen(null); }}/>}
      {editDraft && <ComposeModal
        draft={editDraft} onSave={saveDraft} onSend={send}
        onClose={() => setEditDraft(null)}/>}
    </div>
  );
};

const AnKpi = ({ label, value, sub, icon, color }) => (
  <div style={{
    background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
    borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, padding: 14,
    display: 'flex', alignItems: 'center', gap: 12,
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 10, background: `${color}20`, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <AN_Icon d={icon} size={18} stroke={2.2}/>
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: adminTokens.black,
                    letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: adminTokens.muted, marginTop: 1 }}>{sub}</div>}
    </div>
  </div>
);

Object.assign(window, {
  AN_PRIORITIES, AN_SCOPES, AN_CHANNELS, AN_AUDIENCES, AN_DATA,
  AN_Icon, anIcons, anStatusMeta, anPriority, anChannel, anAudience, anFmtDate,
  AnnouncementCard, AnMiniStat, AnDot,
  AnnouncementDrawer, AnLabel, AnDrawerStat, AnMetaRow, AnFunnelBar,
  ComposeModal, AnSummaryRow, anInputStyle, PreviewInApp,
  AnnouncementsPage, AnKpi,
});
