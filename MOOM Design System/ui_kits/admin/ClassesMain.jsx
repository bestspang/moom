/* MOOM Admin — Classes page: drawer + main wrapper */

const { useState: useStateCM, useMemo: useMemoCM, useEffect: useEffectCM, useRef: useRefCM } = React;

/* Upcoming sessions for a class template */
const MOCK_SESSIONS = [
  { day: 'พรุ่งนี้',  time: '07:00', coach: 'arm',  filled: 18, total: 20, wait: 2 },
  { day: 'พรุ่งนี้',  time: '18:30', coach: 'best', filled: 12, total: 20, wait: 0 },
  { day: 'พ.',       time: '07:00', coach: 'arm',  filled: 15, total: 20, wait: 0 },
  { day: 'พ.',       time: '18:30', coach: 'best', filled: 20, total: 20, wait: 4 },
  { day: 'พฤ.',      time: '07:00', coach: 'arm',  filled: 11, total: 20, wait: 0 },
  { day: 'ศ.',       time: '18:30', coach: 'best', filled: 20, total: 20, wait: 6 },
];

const MOCK_ROSTER = [
  { n: 'Ploy Chanakarn',  v: 24, tier: 'gold',     t: '2h' },
  { n: 'Arm Siriwat',     v: 18, tier: 'platinum', t: 'เมื่อวาน' },
  { n: 'Eve Kwan',        v: 14, tier: 'gold',     t: '2 วัน' },
  { n: 'Mook Thana',      v: 12, tier: 'gold',     t: '3 วัน' },
  { n: 'Natty Prach',     v: 9,  tier: 'silver',   t: '5 วัน' },
  { n: 'Joe L.',          v: 6,  tier: 'bronze',   t: '1 สัปดาห์' },
];
const TIER_ICONS = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💠' };

/* =============================================================
 *  DRAWER
 * =========================================================== */
const ClDrawer = ({ cls, onClose, onToggleStatus }) => {
  const [tab, setTab] = useStateCM('overview');
  useEffectCM(() => { setTab('overview'); }, [cls?.id]);
  if (!cls) return null;
  const t = CL_TYPES[cls.type];
  const level = CL_LEVELS[cls.level];
  const fill = cFillTone(cls.fillPct);

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.3)', zIndex: 100,
        animation: 'cl-fade 0.18s ease-out',
      }}/>
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, zIndex: 101,
        background: adminTokens.surface, boxShadow: '-8px 0 32px rgba(15,23,42,.12)',
        display: 'flex', flexDirection: 'column',
        animation: 'cl-slide .22s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Header band */}
        <div style={{
          padding: '20px 22px 16px',
          background: `linear-gradient(135deg, ${t.color}, ${t.color.replace(/(\d+%)\)$/, '45%)')})`,
          color: '#fff', position: 'relative',
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 8,
            border: 0, background: 'rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.2)'}>
            <CL_Icon d={cIcons.x} size={14}/>
          </button>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase',
            background: 'rgba(255,255,255,.25)', padding: '3px 9px', borderRadius: 9999,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: '#fff' }}/>
            {t.label}
            {cls.featured && <>
              <span style={{ opacity: .5 }}>·</span>
              <CL_Icon d={cIcons.sparkle} size={10}/>
              HOT
            </>}
          </div>

          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em', marginTop: 8, paddingRight: 40 }}>
            {cls.name}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, marginTop: 10,
            fontSize: 12, fontWeight: 600, opacity: .95,
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <CL_Icon d={cIcons.clock} size={12}/> {cls.duration} นาที
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <CL_Icon d={cIcons.users} size={12}/> {cls.capacity} ที่นั่ง
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: '#fff', opacity: .8 }}/>
              {level.label}
            </span>
            {cls.rating > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CL_Icon d={cIcons.star} size={12} stroke={2.4}/>
                {cls.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', padding: '0 22px', gap: 4,
          borderBottom: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
        }}>
          {[
            { id: 'overview', label: 'ภาพรวม' },
            { id: 'sessions', label: 'รอบถัดไป' },
            { id: 'roster',   label: 'ลูกค้าประจำ' },
            { id: 'edit',     label: 'ตั้งค่า' },
          ].map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)} style={{
              padding: '11px 12px', border: 0, cursor: 'pointer', fontFamily: 'inherit',
              background: 'transparent',
              color: tab === tb.id ? adminTokens.black : adminTokens.muted,
              fontSize: 12, fontWeight: tab === tb.id ? 800 : 600,
              borderBottom: `2px solid ${tab === tb.id ? t.color : 'transparent'}`,
              marginBottom: -1,
            }}>
              {tb.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tab === 'overview' && <DrawerOverview cls={cls} t={t} fill={fill}/>}
          {tab === 'sessions' && <DrawerSessions cls={cls} t={t}/>}
          {tab === 'roster'   && <DrawerRoster   cls={cls} t={t}/>}
          {tab === 'edit'     && <DrawerEdit     cls={cls} t={t}/>}
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '12px 20px', borderTop: `1px solid ${adminTokens.border}`,
          background: adminTokens.surface, display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <button onClick={() => onToggleStatus(cls.id)} style={{
            height: 36, padding: '0 14px', borderRadius: 9, cursor: 'pointer',
            border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
            color: adminTokens.black, fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <CL_Icon d={cls.status === 'active' ? cIcons.pause : cIcons.play} size={13}/>
            {cls.status === 'active' ? 'พักคลาส' : 'เปิดใช้งาน'}
          </button>
          <div style={{ flex: 1 }}/>
          <button style={{
            height: 36, padding: '0 14px', borderRadius: 9, cursor: 'pointer',
            border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
            color: adminTokens.black, fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <CL_Icon d={cIcons.copy} size={13}/> ทำสำเนา
          </button>
          <button style={{
            height: 36, padding: '0 16px', borderRadius: 9, cursor: 'pointer',
            border: 0, background: adminTokens.orange, color: '#fff',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: adminTokens.shadowOrange,
          }}>
            <CL_Icon d={cIcons.cal} size={13}/> เพิ่มในตาราง
          </button>
        </div>
      </div>

      <style>{`
        @keyframes cl-slide { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes cl-fade  { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
};

/* ---------- Drawer: Overview ---------- */
const DrawerOverview = ({ cls, t, fill }) => {
  const revenueAvg = cls.sessions30 > 0 ? Math.round(cls.revenue / cls.sessions30) : 0;
  const bookingsAvg = cls.sessions30 > 0 ? Math.round(cls.booked30 / cls.sessions30) : 0;
  return (
    <>
      {/* Big stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        <BigStat label="จอง 30 วัน"  value={cls.booked30} sub={`${cls.sessions30} รอบ`} color={adminTokens.black}/>
        <BigStat label="ความจุเฉลี่ย" value={`${cls.fillPct}%`} sub={fill.label} color={fill.fg}/>
        <BigStat label="รายได้ 30 วัน" value={cFmtMoney(cls.revenue)} sub={`${cFmtMoney(revenueAvg)}/รอบ`} color={adminTokens.black} small/>
      </div>

      {/* Trend chart */}
      <div style={{
        background: adminTokens.subtle, borderRadius: 12, padding: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: adminTokens.muted,
                        textTransform: 'uppercase', letterSpacing: '.06em' }}>
            จอง 8 สัปดาห์ล่าสุด
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.color,
                        display: 'flex', alignItems: 'center', gap: 4 }}>
            <CL_Icon d={cIcons.sparkle} size={10}/>
            เฉลี่ย {bookingsAvg}/รอบ
          </div>
        </div>
        <Spark data={cls.trend} color={t.color} w={436} h={60}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6,
                      fontSize: 9, color: adminTokens.mutedLight, fontVariantNumeric: 'tabular-nums' }}>
          <span>8 wk</span><span>6 wk</span><span>4 wk</span><span>2 wk</span><span>now</span>
        </div>
      </div>

      {/* Coaches */}
      <div>
        <SectionLabel>เทรนเนอร์ที่สอนคลาสนี้ ({cls.coaches.length})</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {cls.coaches.map(id => {
            const c = CL_COACHES.find(x => x.id === id);
            if (!c) return null;
            return (
              <div key={id} style={{
                padding: '10px 12px', border: `1px solid ${adminTokens.border}`,
                borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <CoachDot coach={c} size={32} ring={false}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black }}>
                    Coach {c.name}
                  </div>
                  <div style={{ fontSize: 10, color: adminTokens.muted, fontVariantNumeric: 'tabular-nums' }}>
                    ★ {(4.6 + Math.random() * 0.3).toFixed(1)} · 142 คลาส/เดือน
                  </div>
                </div>
                <button style={{
                  fontSize: 11, fontWeight: 700, color: adminTokens.muted,
                  background: 'transparent', border: `1px solid ${adminTokens.border}`,
                  padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit',
                }}>ดูโปรไฟล์</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Equipment */}
      <div>
        <SectionLabel>อุปกรณ์ที่ต้องใช้</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {cls.equip.split(/\s*·\s*/).map((e, i) => (
            <span key={i} style={{
              fontSize: 11, fontWeight: 600, color: adminTokens.ink2,
              background: adminTokens.subtle, border: `1px solid ${adminTokens.border}`,
              padding: '5px 10px', borderRadius: 9999,
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <CL_Icon d={cIcons.dumb} size={11}/>{e}
            </span>
          ))}
        </div>
      </div>

      {/* Meta */}
      <div style={{
        padding: '12px 14px', background: adminTokens.subtle, borderRadius: 10,
        display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10,
      }}>
        <Meta label="สร้างเมื่อ" value={cls.created}/>
        <Meta label="ID" value={`CLS-${String(cls.id).padStart(4, '0')}`}/>
        <Meta label="รอบ/สัปดาห์" value={`~${Math.round(cls.sessions30 / 4)}`}/>
        <Meta label="รายได้ต่อที่นั่ง" value={cls.booked30 ? cFmtMoney(Math.round(cls.revenue / cls.booked30)) : '—'}/>
      </div>
    </>
  );
};

const BigStat = ({ label, value, sub, color, small }) => (
  <div style={{
    padding: '12px 10px', background: adminTokens.subtle, borderRadius: 10,
    textAlign: 'center',
  }}>
    <div style={{
      fontSize: small ? 14 : 18, fontWeight: 800, color,
      letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.15,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>{value}</div>
    <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700, marginTop: 3,
                  textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
    <div style={{ fontSize: 10, color: adminTokens.mutedLight, marginTop: 2, fontWeight: 500 }}>{sub}</div>
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 800, color: adminTokens.muted,
    textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8,
  }}>{children}</div>
);

const Meta = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black, marginTop: 2 }}>{value}</div>
  </div>
);

/* ---------- Drawer: Sessions ---------- */
const DrawerSessions = ({ cls, t }) => {
  if (cls.status === 'draft') {
    return (
      <div style={{
        padding: 40, textAlign: 'center', background: adminTokens.subtle,
        borderRadius: 12, color: adminTokens.muted,
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: adminTokens.black }}>ยังไม่มีรอบในตาราง</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>คลาสนี้ยังอยู่ในสถานะแบบร่าง</div>
        <button style={{
          marginTop: 14, height: 34, padding: '0 14px', borderRadius: 9,
          border: 0, background: adminTokens.orange, color: '#fff', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <CL_Icon d={cIcons.cal} size={12}/> เพิ่มในตาราง
        </button>
      </div>
    );
  }
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionLabel>รอบถัดไป ({MOCK_SESSIONS.length})</SectionLabel>
        <button style={{
          fontSize: 11, fontWeight: 700, color: adminTokens.orange,
          background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center', gap: 3,
        }}>
          <CL_Icon d={cIcons.plus} size={11}/> เพิ่มรอบ
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: -6 }}>
        {MOCK_SESSIONS.map((s, i) => {
          const coach = CL_COACHES.find(c => c.id === s.coach);
          const pct = s.filled / s.total * 100;
          const isFull = pct >= 100;
          return (
            <div key={i} style={{
              padding: '10px 12px', border: `1px solid ${adminTokens.border}`,
              borderLeft: `3px solid ${t.color}`,
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ minWidth: 58 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: adminTokens.muted }}>{s.day}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: adminTokens.black,
                              fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>
                  {s.time}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: adminTokens.muted, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CoachDot coach={coach} size={18} ring={false}/>
                  Coach {coach?.short}
                </div>
                <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 4, background: adminTokens.divider, borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%',
                                   background: isFull ? adminTokens.destr : t.color }}/>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: adminTokens.black,
                                 fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {s.filled}/{s.total}
                  </span>
                </div>
              </div>
              {s.wait > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 800, color: adminTokens.orange,
                  background: adminTokens.orangeSoft, padding: '3px 7px', borderRadius: 9999,
                  whiteSpace: 'nowrap',
                }}>+{s.wait} รอคิว</span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

/* ---------- Drawer: Roster ---------- */
const DrawerRoster = ({ cls, t }) => {
  if (cls.booked30 === 0) {
    return (
      <div style={{
        padding: 40, textAlign: 'center', background: adminTokens.subtle,
        borderRadius: 12, color: adminTokens.muted, fontSize: 12,
      }}>ยังไม่มีประวัติการจอง</div>
    );
  }
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionLabel>ลูกค้าประจำ — จองคลาสนี้บ่อย 30 วัน</SectionLabel>
        <button style={{
          fontSize: 11, fontWeight: 700, color: adminTokens.orange,
          background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'inherit',
        }}>Export CSV</button>
      </div>
      <div style={{ border: `1px solid ${adminTokens.border}`, borderRadius: 10, overflow: 'hidden', marginTop: -6 }}>
        {MOCK_ROSTER.map((r, i) => {
          const coach = CL_COACHES[i % CL_COACHES.length];
          return (
            <div key={i} style={{
              padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
              borderBottom: i < MOCK_ROSTER.length - 1 ? `1px solid ${adminTokens.divider}` : 0,
            }}>
              <CoachDot coach={{ ...coach, short: r.n }} size={30} ring={false}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black,
                              display: 'flex', alignItems: 'center', gap: 5 }}>
                  {r.n} <span style={{ fontSize: 11 }}>{TIER_ICONS[r.tier]}</span>
                </div>
                <div style={{ fontSize: 10, color: adminTokens.muted }}>มาล่าสุด {r.t}ที่แล้ว</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: t.color,
                              fontVariantNumeric: 'tabular-nums' }}>{r.v}</div>
                <div style={{ fontSize: 9, color: adminTokens.muted, fontWeight: 600 }}>ครั้ง</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

/* ---------- Drawer: Edit ---------- */
const DrawerEdit = ({ cls, t }) => (
  <>
    <Field label="ชื่อคลาส" value={cls.name}/>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <Field label="ระยะเวลา (นาที)" value={cls.duration}/>
      <Field label="ความจุ (คน)" value={cls.capacity}/>
    </div>
    <Field label="อุปกรณ์ที่ต้องใช้" value={cls.equip}/>
    <div>
      <SectionLabel>ประเภทคลาส</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {Object.entries(CL_TYPES).map(([k, tt]) => (
          <button key={k} style={{
            padding: '8px 4px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
            border: `1.5px solid ${k === cls.type ? tt.color : adminTokens.border}`,
            background: k === cls.type ? tt.soft : adminTokens.surface,
            color: k === cls.type ? tt.color : adminTokens.black,
            fontSize: 11, fontWeight: 700,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: tt.color }}/>
            {tt.label}
          </button>
        ))}
      </div>
    </div>
    <div>
      <SectionLabel>ระดับผู้เรียน</SectionLabel>
      <div style={{ display: 'flex', gap: 6 }}>
        {Object.entries(CL_LEVELS).map(([k, lv]) => (
          <button key={k} style={{
            flex: 1, padding: '8px 6px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
            border: `1.5px solid ${k === cls.level ? lv.color : adminTokens.border}`,
            background: k === cls.level ? lv.color + '20' : adminTokens.surface,
            color: k === cls.level ? lv.color : adminTokens.black,
            fontSize: 11, fontWeight: 700,
          }}>{lv.label}</button>
        ))}
      </div>
    </div>
    <div style={{ padding: '10px 12px', background: adminTokens.subtle, borderRadius: 8,
                  fontSize: 11, color: adminTokens.muted, lineHeight: 1.5 }}>
      ฟิลด์ในแท็บนี้ยังเป็น mock — แสดงโครงสร้างฟอร์มจริงที่ควรเชื่อมต่อกับ API
    </div>
  </>
);

const Field = ({ label, value }) => (
  <div>
    <SectionLabel>{label}</SectionLabel>
    <input defaultValue={value} style={{
      width: '100%', height: 38, padding: '0 12px', borderRadius: 9,
      border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
      fontFamily: 'inherit', fontSize: 13, color: adminTokens.black, outline: 'none',
      marginTop: -6,
    }}/>
  </div>
);

/* =============================================================
 *  BULK ACTION BAR
 * =========================================================== */
const BulkBar = ({ count, onClear, onBulkPause, onBulkActivate, onDelete }) => (
  <div style={{
    position: 'sticky', bottom: 16, zIndex: 20,
    background: adminTokens.black, color: '#fff',
    borderRadius: adminTokens.r3, padding: '10px 14px',
    boxShadow: '0 10px 30px rgba(15,23,42,.25)',
    display: 'flex', alignItems: 'center', gap: 12,
    animation: 'cl-pop .18s cubic-bezier(.4,0,.2,1)',
  }}>
    <div style={{
      width: 26, height: 26, borderRadius: 7, background: adminTokens.orange,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
    }}>{count}</div>
    <div style={{ fontSize: 13, fontWeight: 700 }}>เลือก {count} คลาส</div>
    <div style={{ flex: 1 }}/>
    <BulkBtn icon={cIcons.pause} onClick={onBulkPause}>พัก</BulkBtn>
    <BulkBtn icon={cIcons.play} onClick={onBulkActivate}>เปิดใช้</BulkBtn>
    <BulkBtn icon={cIcons.copy}>ทำสำเนา</BulkBtn>
    <BulkBtn icon={cIcons.trash} danger onClick={onDelete}>ลบ</BulkBtn>
    <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.2)' }}/>
    <button onClick={onClear} style={{
      height: 30, padding: '0 10px', borderRadius: 7, border: 0,
      background: 'rgba(255,255,255,.12)', color: '#fff', cursor: 'pointer',
      fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 5,
    }}>
      <CL_Icon d={cIcons.x} size={12}/> ล้าง
    </button>
    <style>{`
      @keyframes cl-pop { from { opacity: 0; transform: translateY(10px) scale(.96); } to { opacity: 1; transform: none; } }
    `}</style>
  </div>
);

const BulkBtn = ({ icon, children, danger, onClick }) => (
  <button onClick={onClick} style={{
    height: 30, padding: '0 11px', borderRadius: 7, border: 0, cursor: 'pointer',
    background: danger ? 'rgba(239,80,80,.18)' : 'rgba(255,255,255,.12)',
    color: danger ? 'hsl(0 90% 75%)' : '#fff',
    fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
    display: 'flex', alignItems: 'center', gap: 6,
    transition: 'background .12s',
  }}
  onMouseEnter={e => e.currentTarget.style.background = danger ? 'rgba(239,80,80,.3)' : 'rgba(255,255,255,.22)'}
  onMouseLeave={e => e.currentTarget.style.background = danger ? 'rgba(239,80,80,.18)' : 'rgba(255,255,255,.12)'}>
    <CL_Icon d={icon} size={12}/>{children}
  </button>
);

/* =============================================================
 *  MAIN PAGE
 * =========================================================== */
const ClassesPage = () => {
  const [classes, setClasses] = useStateCM(CL_CLASSES);
  const [query, setQuery] = useStateCM('');
  const [typeFilter, setTypeFilter] = useStateCM('all');
  const [statusFilter, setStatusFilter] = useStateCM('all');
  const [coachFilter, setCoachFilter] = useStateCM('all');
  const [durationFilter, setDurationFilter] = useStateCM('all');
  const [sort, setSort] = useStateCM('popular');
  const [view, setView] = useStateCM(() => localStorage.getItem('moom-classes-view') || 'grid');
  const [selected, setSelected] = useStateCM(new Set());
  const [openId, setOpenId] = useStateCM(null);
  const searchRef = useRefCM(null);

  useEffectCM(() => { localStorage.setItem('moom-classes-view', view); }, [view]);

  /* ⌘K focuses search; Esc closes drawer / clears selection */
  useEffectCM(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (e.target.tagName === 'INPUT') return;
        if (openId) setOpenId(null);
        else if (selected.size) setSelected(new Set());
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openId, selected]);

  /* filter + sort pipeline */
  const filtered = useMemoCM(() => {
    let list = classes;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        CL_TYPES[c.type].label.toLowerCase().includes(q) ||
        c.coaches.some(id => CL_COACHES.find(co => co.id === id)?.name.toLowerCase().includes(q))
      );
    }
    if (typeFilter !== 'all')     list = list.filter(c => c.type === typeFilter);
    if (statusFilter !== 'all')   list = list.filter(c => c.status === statusFilter);
    if (coachFilter !== 'all')    list = list.filter(c => c.coaches.includes(coachFilter));
    if (durationFilter === 'short') list = list.filter(c => c.duration <= 30);
    if (durationFilter === 'mid')   list = list.filter(c => c.duration > 30 && c.duration <= 60);
    if (durationFilter === 'long')  list = list.filter(c => c.duration > 60);

    switch (sort) {
      case 'popular': list = [...list].sort((a,b) => b.booked30 - a.booked30); break;
      case 'revenue': list = [...list].sort((a,b) => b.revenue - a.revenue); break;
      case 'fill':    list = [...list].sort((a,b) => b.fillPct - a.fillPct); break;
      case 'newest':  list = [...list].sort((a,b) => b.id - a.id); break;
      case 'name':    list = [...list].sort((a,b) => a.name.localeCompare(b.name)); break;
    }
    return list;
  }, [classes, query, typeFilter, statusFilter, coachFilter, durationFilter, sort]);

  const openCls = classes.find(c => c.id === openId);
  const hasActiveFilter = query || typeFilter !== 'all' || statusFilter !== 'all' ||
                          coachFilter !== 'all' || durationFilter !== 'all';

  const toggleStatus = (id) => {
    setClasses(prev => prev.map(c => c.id === id
      ? { ...c, status: c.status === 'active' ? 'paused' : 'active' }
      : c));
  };
  const bulkSetStatus = (status) => {
    setClasses(prev => prev.map(c => selected.has(c.id) ? { ...c, status } : c));
    setSelected(new Set());
  };
  const bulkDelete = () => {
    setClasses(prev => prev.filter(c => !selected.has(c.id)));
    setSelected(new Set());
  };

  return (
    <div style={{
      padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: 14,
      maxWidth: 1400, margin: '0 auto',
    }}>
      <ClPageHeader
        total={classes.length}
        activeCnt={classes.filter(c => c.status === 'active').length}
        onNew={() => {}}
      />

      <ClKpiStrip classes={classes}/>

      {!hasActiveFilter && (
        <ClFeaturedRow classes={classes} onOpen={id => setOpenId(id)}/>
      )}

      <ClToolbar
        query={query} setQuery={setQuery}
        typeFilter={typeFilter} setTypeFilter={setTypeFilter}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        coachFilter={coachFilter} setCoachFilter={setCoachFilter}
        durationFilter={durationFilter} setDurationFilter={setDurationFilter}
        sort={sort} setSort={setSort}
        view={view} setView={setView}
        searchRef={searchRef}
        resultCount={filtered.length}
      />

      {view === 'grid'
        ? <ClGrid   classes={filtered} selected={selected} setSelected={setSelected}
                    onOpen={id => setOpenId(id)} onToggleStatus={toggleStatus}/>
        : <ClTable  classes={filtered} selected={selected} setSelected={setSelected}
                    onOpen={id => setOpenId(id)} onToggleStatus={toggleStatus}/>}

      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          onBulkPause={() => bulkSetStatus('paused')}
          onBulkActivate={() => bulkSetStatus('active')}
          onDelete={bulkDelete}
        />
      )}

      {openCls && <ClDrawer cls={openCls} onClose={() => setOpenId(null)} onToggleStatus={toggleStatus}/>}
    </div>
  );
};

Object.assign(window, {
  ClDrawer, DrawerOverview, DrawerSessions, DrawerRoster, DrawerEdit,
  BigStat, SectionLabel, Meta, Field, BulkBar, BulkBtn,
  ClassesPage, MOCK_SESSIONS, MOCK_ROSTER, TIER_ICONS,
});
