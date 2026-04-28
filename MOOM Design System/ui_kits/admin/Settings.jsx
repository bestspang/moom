/* MOOM Admin — Settings cluster
   Four pages: Roles / Branches / Activity Log / Settings
   All share adminTokens, aIcons, SectionHeaderA, PageHeader, etc. from Components.jsx
*/

const { useState: useSC, useMemo: useMemoSC } = React;

/* =============================================================
 *  Shared UI
 * =========================================================== */
const SC_Icon = ({ d, size = 14, stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
       style={{ display: 'block', flexShrink: 0 }}>{d}</svg>
);

const scIcons = {
  plus: aIcons.plus, x: aIcons.x, check: aIcons.check, edit: aIcons.edit,
  trash: aIcons.trash, search: aIcons.search, chev: aIcons.chev, dots: aIcons.dots,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
  users:  <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
  lock:   <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
  key:    <><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>,
  build:  <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  pin:    <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
  globe:  <><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20 15 15 0 010-20z"/></>,
  clock:  <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  log:    <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></>,
  filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>,
  gear:   <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
  bell:   <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
  cash:   <><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></>,
  user:   <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  userPlus: <><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></>,
  login:  <><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></>,
  logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></>,
  pack:   <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
  card:   <><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
  eye:    <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  copy:   <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
  warn:   <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></>,
  palette: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="7" r="1"/><circle cx="7" cy="12" r="1"/><circle cx="17" cy="12" r="1"/><circle cx="12" cy="17" r="1"/></>,
  mail:   <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></>,
  phone:  <><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></>,
  line:   <><circle cx="12" cy="12" r="10"/><path d="M7 11h2v3M11 14V11M13 14V11l2 3V11M16 14V11"/></>,
};

/* =============================================================
 *  ROLES & PERMISSIONS
 * =========================================================== */
const ROLE_DATA = [
  { id: 'owner', label: 'เจ้าของ', color: 'hsl(22 95% 55%)', count: 1,
    desc: 'สิทธิ์เต็ม · จัดการได้ทุกอย่าง', system: true,
    perms: ['view_all','edit_all','delete_all','finance','users','settings','branches'] },
  { id: 'manager', label: 'ผู้จัดการ', color: 'hsl(270 60% 60%)', count: 3,
    desc: 'จัดการยิมประจำวัน · ยกเว้นการเงินและผู้ใช้ระดับสูง',
    perms: ['view_all','edit_all','finance','users'] },
  { id: 'reception', label: 'รีเซ็ปชั่น', color: 'hsl(212 80% 55%)', count: 5,
    desc: 'เช็คอิน · ลงทะเบียนสมาชิก · ขายแพ็คเกจ',
    perms: ['checkin','members_create','members_edit','packages_sell'] },
  { id: 'trainer', label: 'เทรนเนอร์', color: 'hsl(150 50% 45%)', count: 8,
    desc: 'ดูคลาสและสมาชิกที่ดูแล · บันทึกโปรแกรม',
    perms: ['classes_view','members_view','workouts_edit'] },
  { id: 'cleaner', label: 'แม่บ้าน', color: 'hsl(180 40% 50%)', count: 2,
    desc: 'ดูตารางทำความสะอาด',
    perms: ['schedule_view'] },
];

const PERM_GROUPS = [
  { label: 'สมาชิก', perms: [
    { id: 'members_view', label: 'ดูสมาชิกทั้งหมด' },
    { id: 'members_create', label: 'เพิ่มสมาชิกใหม่' },
    { id: 'members_edit', label: 'แก้ไขข้อมูลสมาชิก' },
    { id: 'members_delete', label: 'ลบสมาชิก' },
  ]},
  { label: 'การเงิน', perms: [
    { id: 'finance', label: 'ดูรายงานการเงิน' },
    { id: 'invoices', label: 'ออกใบแจ้งหนี้' },
    { id: 'refunds', label: 'ทำการคืนเงิน' },
  ]},
  { label: 'คลาสและตารางเรียน', perms: [
    { id: 'classes_view', label: 'ดูคลาส' },
    { id: 'classes_edit', label: 'แก้ไขคลาส' },
    { id: 'schedule_view', label: 'ดูตารางเรียน' },
  ]},
  { label: 'ระบบ', perms: [
    { id: 'checkin', label: 'เช็คอิน/เช็คเอาท์' },
    { id: 'packages_sell', label: 'ขายแพ็คเกจ' },
    { id: 'settings', label: 'ตั้งค่าระบบ' },
    { id: 'users', label: 'จัดการผู้ใช้' },
    { id: 'branches', label: 'จัดการสาขา' },
  ]},
];

const RolesPage = () => {
  const [selected, setSelected] = useSC('manager');
  const role = ROLE_DATA.find(r => r.id === selected) || ROLE_DATA[0];

  return (
    <div style={{ padding: '20px 28px 28px', maxWidth: 1400, margin: '0 auto',
                  display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: adminTokens.black,
                       letterSpacing: '-.02em' }}>บทบาท</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: adminTokens.muted }}>
            กำหนดสิทธิ์การเข้าถึงสำหรับทีมงานแต่ละคน · {ROLE_DATA.length} บทบาท · 19 คน
          </p>
        </div>
        <button style={{
          height: 38, padding: '0 16px', borderRadius: 10, cursor: 'pointer',
          background: adminTokens.orange, color: '#fff', border: 0,
          fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6, boxShadow: adminTokens.shadowOrange,
        }}>
          <SC_Icon d={scIcons.plus} size={14}/> บทบาทใหม่
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14 }}>
        {/* Left — role list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ROLE_DATA.map(r => {
            const active = r.id === selected;
            return (
              <button key={r.id} onClick={() => setSelected(r.id)} style={{
                padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                border: active ? `2px solid ${r.color}` : `1px solid ${adminTokens.border}`,
                background: active ? `${r.color}10` : adminTokens.surface,
                display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                fontFamily: 'inherit',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, background: r.color, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <SC_Icon d={scIcons.shield} size={16}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black,
                                letterSpacing: '-.01em', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {r.label}
                    {r.system && <span style={{
                      fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 3,
                      background: adminTokens.subtle, color: adminTokens.muted,
                      letterSpacing: '.05em',
                    }}>ระบบ</span>}
                  </div>
                  <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 2,
                                fontVariantNumeric: 'tabular-nums' }}>
                    {r.count} คน · {r.perms.length} สิทธิ์
                  </div>
                </div>
                {active && <div style={{ color: r.color }}><SC_Icon d={scIcons.chev} size={14}/></div>}
              </button>
            );
          })}
        </div>

        {/* Right — detail */}
        <div style={{
          background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
          borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, overflow: 'hidden',
        }}>
          <div style={{
            padding: 16, borderBottom: `1px solid ${adminTokens.border}`,
            background: `linear-gradient(135deg, ${role.color}10, transparent)`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 11, background: role.color, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SC_Icon d={scIcons.shield} size={20}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: adminTokens.black,
                            letterSpacing: '-.02em' }}>{role.label}</div>
              <div style={{ fontSize: 12, color: adminTokens.muted, marginTop: 2 }}>{role.desc}</div>
            </div>
            {!role.system && (
              <button style={{
                height: 32, padding: '0 12px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
                color: adminTokens.black, fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <SC_Icon d={scIcons.edit} size={11}/> แก้ไข
              </button>
            )}
          </div>

          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PERM_GROUPS.map(g => (
              <div key={g.label}>
                <div style={{ fontSize: 11, fontWeight: 800, color: adminTokens.muted,
                              textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                  {g.label}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                  {g.perms.map(p => {
                    const has = role.perms.includes(p.id) || role.perms.includes('edit_all') || role.perms.includes('view_all') && p.id.endsWith('_view');
                    return (
                      <div key={p.id} style={{
                        padding: '9px 12px', borderRadius: 8, border: `1px solid ${adminTokens.border}`,
                        background: has ? `${role.color}08` : adminTokens.subtle,
                        display: 'flex', alignItems: 'center', gap: 8,
                        fontSize: 12, fontWeight: 500,
                        color: has ? adminTokens.black : adminTokens.muted,
                      }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: 4,
                          background: has ? role.color : adminTokens.border,
                          color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {has && <SC_Icon d={scIcons.check} size={10} stroke={3}/>}
                        </div>
                        {p.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* =============================================================
 *  BRANCHES
 * =========================================================== */
const BRANCH_DATA = [
  {
    id: 'asok', name: 'สาขาอโศก', badge: 'HQ',
    address: '123 ถ.สุขุมวิท 21 อโศก คลองเตย กรุงเทพฯ 10110',
    phone: '02-555-1234', hours: '06:00 – 23:00',
    manager: 'คุณประภา สุขุม', managerAvatar: 'PS',
    members: 247, activeNow: 42, classesToday: 5, revenue: 18420,
    status: 'open', color: 'hsl(22 95% 55%)',
    occupancy: 78,
  },
  {
    id: 'thonglor', name: 'สาขาทองหล่อ',
    address: '55 ซอยทองหล่อ 10 วัฒนา กรุงเทพฯ 10110',
    phone: '02-555-5678', hours: '06:00 – 23:00',
    manager: 'คุณวิชัย เจริญสุข', managerAvatar: 'WJ',
    members: 189, activeNow: 28, classesToday: 4, revenue: 14210,
    status: 'open', color: 'hsl(212 80% 55%)',
    occupancy: 65,
  },
  {
    id: 'silom', name: 'สาขาสีลม',
    address: '88 ถ.สีลม บางรัก กรุงเทพฯ 10500',
    phone: '02-555-9012', hours: '06:00 – 22:00',
    manager: 'คุณนภา ทองดี', managerAvatar: 'NT',
    members: 156, activeNow: 19, classesToday: 3, revenue: 9840,
    status: 'open', color: 'hsl(150 50% 45%)',
    occupancy: 52,
  },
  {
    id: 'phuket', name: 'สาขาภูเก็ต',
    address: '12/3 ถ.เชิงทะเล กะทู้ ภูเก็ต 83150',
    phone: '076-555-3456', hours: '06:00 – 22:00',
    manager: '—', managerAvatar: '—',
    members: 0, activeNow: 0, classesToday: 0, revenue: 0,
    status: 'setup', color: 'hsl(270 60% 60%)',
    occupancy: 0,
  },
];

const BranchesPage = () => {
  return (
    <div style={{ padding: '20px 28px 28px', maxWidth: 1400, margin: '0 auto',
                  display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: adminTokens.black,
                       letterSpacing: '-.02em' }}>สาขา</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: adminTokens.muted }}>
            {BRANCH_DATA.length} สาขา · {BRANCH_DATA.reduce((s,b) => s+b.members, 0)} สมาชิกทั้งหมด · {BRANCH_DATA.reduce((s,b) => s+b.activeNow, 0)} อยู่ในยิมตอนนี้
          </p>
        </div>
        <button style={{
          height: 38, padding: '0 16px', borderRadius: 10, cursor: 'pointer',
          background: adminTokens.orange, color: '#fff', border: 0,
          fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6, boxShadow: adminTokens.shadowOrange,
        }}>
          <SC_Icon d={scIcons.plus} size={14}/> เปิดสาขาใหม่
        </button>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <ScKpi label="รายได้รวมวันนี้"
               value={`฿${BRANCH_DATA.reduce((s,b) => s+b.revenue, 0).toLocaleString('th-TH')}`}
               color={adminTokens.orange} icon={scIcons.cash}/>
        <ScKpi label="อยู่ในยิม"
               value={BRANCH_DATA.reduce((s,b) => s+b.activeNow, 0)}
               color={adminTokens.success} icon={scIcons.users}/>
        <ScKpi label="คลาสวันนี้"
               value={BRANCH_DATA.reduce((s,b) => s+b.classesToday, 0)}
               color={adminTokens.info} icon={aIcons.cal}/>
        <ScKpi label="สมาชิกทั้งหมด"
               value={BRANCH_DATA.reduce((s,b) => s+b.members, 0)}
               color={'hsl(270 60% 60%)'} icon={scIcons.user}/>
      </div>

      {/* Branch cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
        {BRANCH_DATA.map(b => <BranchCard key={b.id} b={b}/>)}
      </div>
    </div>
  );
};

const ScKpi = ({ label, value, color, icon }) => (
  <div style={{
    background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
    borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, padding: 14,
    display: 'flex', alignItems: 'center', gap: 12,
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 10, background: `${color}20`, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <SC_Icon d={icon} size={18}/>
    </div>
    <div>
      <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: adminTokens.black,
                    letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
        {value}
      </div>
    </div>
  </div>
);

const BranchCard = ({ b }) => {
  const isSetup = b.status === 'setup';
  return (
    <div style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ height: 4, background: b.color }}/>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 11,
            background: `linear-gradient(135deg, ${b.color}, color-mix(in oklab, ${b.color} 70%, #000))`,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SC_Icon d={scIcons.build} size={19}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: adminTokens.black,
                             letterSpacing: '-.01em' }}>{b.name}</span>
              {b.badge && <span style={{
                fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                background: adminTokens.black, color: '#fff', letterSpacing: '.05em',
              }}>{b.badge}</span>}
            </div>
            <div style={{ fontSize: 11, color: isSetup ? 'hsl(270 60% 60%)' : adminTokens.success,
                          fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%',
                             background: 'currentColor' }}/>
              {isSetup ? 'กำลังเตรียมเปิด' : `เปิดอยู่ · ${b.hours}`}
            </div>
          </div>
          <button style={{
            width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
            border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
            color: adminTokens.muted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SC_Icon d={scIcons.dots} size={13}/>
          </button>
        </div>

        {/* Info list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
          <BrInfo icon={scIcons.pin}   label={b.address} muted/>
          <BrInfo icon={scIcons.phone} label={b.phone}/>
        </div>

        {/* Manager */}
        <div style={{
          padding: 10, background: adminTokens.subtle, borderRadius: 9,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: b.color, color: '#fff',
            fontSize: 11, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{b.managerAvatar}</div>
          <div>
            <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '.05em' }}>ผู้จัดการสาขา</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black }}>{b.manager}</div>
          </div>
        </div>

        {/* Stats */}
        {!isSetup ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <BrStat label="อยู่ในยิม" value={b.activeNow} color={adminTokens.success}/>
              <BrStat label="คลาสวันนี้" value={b.classesToday} color={adminTokens.info}/>
              <BrStat label="รายได้วันนี้" value={`฿${(b.revenue/1000).toFixed(1)}k`} color={adminTokens.orange}/>
            </div>
            {/* Occupancy */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: adminTokens.muted,
                               textTransform: 'uppercase', letterSpacing: '.05em' }}>การใช้งาน</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: adminTokens.black,
                               fontVariantNumeric: 'tabular-nums' }}>{b.occupancy}%</span>
              </div>
              <div style={{ height: 6, background: adminTokens.subtle, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${b.occupancy}%`, height: '100%',
                              background: b.color, transition: 'width .4s' }}/>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            padding: 12, background: 'hsl(270 90% 97%)', borderRadius: 9,
            border: '1px dashed hsl(270 60% 80%)',
            fontSize: 11, color: 'hsl(270 60% 40%)', fontWeight: 600, textAlign: 'center',
          }}>
            📅 เปิดตัวคาดการณ์ พ.ค. 2026 · กำลังตั้งค่าระบบ
          </div>
        )}
      </div>
    </div>
  );
};

const BrInfo = ({ icon, label, muted }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 7,
                color: muted ? adminTokens.muted : adminTokens.black,
                fontWeight: 500 }}>
    <span style={{ color: adminTokens.muted }}><SC_Icon d={icon} size={11}/></span>
    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
      {label}
    </span>
  </div>
);

const BrStat = ({ label, value, color }) => (
  <div style={{ padding: '8px 10px', background: adminTokens.subtle, borderRadius: 8, textAlign: 'center' }}>
    <div style={{ fontSize: 14, fontWeight: 800, color, letterSpacing: '-.01em',
                  fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 9, color: adminTokens.muted, fontWeight: 700, marginTop: 2,
                  textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
  </div>
);

/* =============================================================
 *  ACTIVITY LOG
 * =========================================================== */
const LOG_TYPES = {
  login:     { label: 'เข้าสู่ระบบ', color: 'hsl(212 80% 55%)', icon: scIcons.login },
  checkin:   { label: 'เช็คอิน',     color: 'hsl(150 50% 45%)', icon: scIcons.user },
  member:    { label: 'สมาชิก',      color: 'hsl(22 95% 55%)',  icon: scIcons.userPlus },
  payment:   { label: 'ชำระเงิน',    color: 'hsl(38 92% 50%)',  icon: scIcons.cash },
  package:   { label: 'แพ็คเกจ',    color: 'hsl(270 60% 60%)', icon: scIcons.pack },
  class:     { label: 'คลาส',        color: 'hsl(180 50% 50%)', icon: aIcons.cal },
  settings:  { label: 'ตั้งค่า',      color: 'hsl(220 14% 50%)', icon: scIcons.gear },
  announce:  { label: 'ประกาศ',      color: 'hsl(0 72% 55%)',   icon: scIcons.bell },
};

const LOG_DATA = [
  { id: 1, type: 'checkin',  actor: 'อ.สมชาย',     action: 'เช็คอินที่สาขาอโศก',                     time: '18:42', date: '2026-04-21', ip: '103.xxx' },
  { id: 2, type: 'payment',  actor: 'ระบบอัตโนมัติ', action: 'รับชำระ ฿3,500 จาก คุณมณี ใจดี',        time: '18:38', date: '2026-04-21', meta: 'Package: Gold' },
  { id: 3, type: 'announce', actor: 'Kongphop',     action: 'ส่งประกาศด่วน "ปิดสาขาอโศกชั่วคราว"',     time: '14:32', date: '2026-04-21', meta: '247 ผู้รับ' },
  { id: 4, type: 'member',   actor: 'Priya',         action: 'สร้างโปรไฟล์สมาชิกใหม่ คุณอัจฉรา สุข',  time: '11:18', date: '2026-04-21' },
  { id: 5, type: 'class',    actor: 'ครูเมย์',        action: 'จบคลาส HIIT รอบ 10:00 · 18 คน',        time: '10:58', date: '2026-04-21' },
  { id: 6, type: 'settings', actor: 'Kongphop',     action: 'แก้ไขราคาแพ็คเกจ Gold (฿3,500 → ฿3,800)', time: '09:42', date: '2026-04-21', meta: 'Critical' },
  { id: 7, type: 'login',    actor: 'Kongphop',     action: 'เข้าสู่ระบบจาก Chrome/macOS',             time: '09:15', date: '2026-04-21', ip: '103.xxx' },
  { id: 8, type: 'package',  actor: 'รีเซ็ปชั่น',    action: 'ขายแพ็คเกจ Silver ให้ คุณวิชัย ทอง',     time: '18:24', date: '2026-04-20', meta: '฿2,200' },
  { id: 9, type: 'member',   actor: 'Priya',         action: 'อัปเดตข้อมูลติดต่อ คุณเมย์ สดใส',        time: '16:02', date: '2026-04-20' },
  { id: 10, type: 'payment', actor: 'ระบบอัตโนมัติ', action: 'การชำระล้มเหลว · คุณสมศักดิ์ สมบูรณ์',    time: '12:38', date: '2026-04-20', meta: 'Card declined', warn: true },
  { id: 11, type: 'checkin', actor: 'ระบบ QR',        action: '28 เช็คอินในชั่วโมงที่ผ่านมา',           time: '12:00', date: '2026-04-20' },
  { id: 12, type: 'settings',actor: 'Kongphop',     action: 'เพิ่มผู้ใช้ใหม่ "คุณวริศรา" บทบาทรีเซ็ปชั่น',time: '10:15', date: '2026-04-20' },
  { id: 13, type: 'class',   actor: 'ครูบอส',        action: 'ยกเลิกคลาส Yoga Flow รอบ 07:00',          time: '06:45', date: '2026-04-20', warn: true },
  { id: 14, type: 'login',   actor: 'Priya',         action: 'เข้าสู่ระบบจาก Safari/iOS',               time: '08:30', date: '2026-04-19', ip: '103.xxx' },
];

const ActivityLogPage = () => {
  const [filter, setFilter] = useSC('all');
  const [query, setQuery] = useSC('');

  const filtered = useMemoSC(() => {
    let list = LOG_DATA;
    if (filter !== 'all') list = list.filter(l => l.type === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(l => (l.actor + l.action).toLowerCase().includes(q));
    }
    return list;
  }, [filter, query]);

  // group by date
  const grouped = useMemoSC(() => {
    const g = {};
    filtered.forEach(l => { (g[l.date] = g[l.date] || []).push(l); });
    return Object.entries(g);
  }, [filtered]);

  return (
    <div style={{ padding: '20px 28px 28px', maxWidth: 1400, margin: '0 auto',
                  display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: adminTokens.black,
                       letterSpacing: '-.02em' }}>บันทึกกิจกรรม</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: adminTokens.muted }}>
            {LOG_DATA.length} รายการ · 7 วันล่าสุด · เก็บข้อมูล 90 วัน
          </p>
        </div>
        <button style={{
          height: 38, padding: '0 16px', borderRadius: 10, cursor: 'pointer',
          border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
          color: adminTokens.black,
          fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <SC_Icon d={scIcons.download} size={13}/> ส่งออก CSV
        </button>
      </div>

      {/* Filter bar */}
      <div style={{
        background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
        borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, padding: 10,
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[['all','ทั้งหมด', null], ...Object.entries(LOG_TYPES).map(([k,v]) => [k, v.label, v.color])].map(([id, label, color]) => {
            const active = filter === id;
            return (
              <button key={id} onClick={() => setFilter(id)} style={{
                height: 30, padding: '0 11px', borderRadius: 7, cursor: 'pointer',
                border: active ? `1.5px solid ${color || adminTokens.black}` : `1px solid ${adminTokens.border}`,
                background: active ? (color ? `${color}12` : adminTokens.black) : adminTokens.surface,
                color: active ? (color || '#fff') : adminTokens.muted,
                fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
              }}>
                {label}
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
          <SC_Icon d={scIcons.search} size={12}/>
          <input value={query} onChange={e => setQuery(e.target.value)}
                 placeholder="ค้นหาผู้ใช้ หรือ การกระทำ"
                 style={{ flex: 1, height: 30, border: 0, background: 'transparent', outline: 'none',
                          fontFamily: 'inherit', fontSize: 12 }}/>
        </div>
      </div>

      {/* Timeline */}
      <div style={{
        background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
        borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, overflow: 'hidden',
      }}>
        {grouped.map(([date, entries], gi) => (
          <div key={date}>
            <div style={{
              padding: '10px 18px', background: adminTokens.subtle,
              borderTop: gi > 0 ? `1px solid ${adminTokens.border}` : 0,
              borderBottom: `1px solid ${adminTokens.border}`,
              fontSize: 11, fontWeight: 800, color: adminTokens.muted,
              textTransform: 'uppercase', letterSpacing: '.06em',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <SC_Icon d={scIcons.clock} size={11}/>
              {date === '2026-04-21' ? 'วันนี้' : date === '2026-04-20' ? 'เมื่อวาน' : date}
              <span style={{ color: adminTokens.muted, opacity: .7, fontWeight: 600 }}>
                · {entries.length} รายการ
              </span>
            </div>
            {entries.map((l, i) => {
              const t = LOG_TYPES[l.type];
              return (
                <div key={l.id} style={{
                  padding: '12px 18px',
                  borderBottom: i < entries.length - 1 ? `1px solid ${adminTokens.divider}` : 0,
                  display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'background .12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = adminTokens.subtle}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, background: `${t.color}18`, color: t.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <SC_Icon d={t.icon} size={15}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: adminTokens.black, fontWeight: 500,
                                  display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800 }}>{l.actor}</span>
                      <span>{l.action}</span>
                      {l.warn && <span style={{
                        fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 3,
                        background: 'hsl(0 95% 96%)', color: 'hsl(0 72% 45%)',
                        letterSpacing: '.05em', display: 'inline-flex', alignItems: 'center', gap: 3,
                      }}>
                        <SC_Icon d={scIcons.warn} size={8}/>ต้องตรวจสอบ
                      </span>}
                    </div>
                    <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 3,
                                  display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 3,
                        background: `${t.color}15`, color: t.color, letterSpacing: '.05em',
                        textTransform: 'uppercase',
                      }}>{t.label}</span>
                      {l.meta && <span>{l.meta}</span>}
                      {l.ip && <span style={{ fontFamily: 'monospace' }}>IP {l.ip}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 700,
                                fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {l.time}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 50, textAlign: 'center', fontSize: 13, color: adminTokens.muted }}>
            ไม่พบรายการที่ตรงกับการค้นหา
          </div>
        )}
      </div>
    </div>
  );
};

/* =============================================================
 *  SETTINGS
 * =========================================================== */
const SettingsPage = () => {
  const [tab, setTab] = useSC('general');

  const tabs = [
    { id: 'general',  label: 'ทั่วไป',       icon: scIcons.gear },
    { id: 'notif',    label: 'การแจ้งเตือน', icon: scIcons.bell },
    { id: 'billing',  label: 'การชำระเงิน',  icon: scIcons.card },
    { id: 'integr',   label: 'การเชื่อมต่อ',  icon: scIcons.globe },
    { id: 'security', label: 'ความปลอดภัย',  icon: scIcons.lock },
  ];

  return (
    <div style={{ padding: '20px 28px 28px', maxWidth: 1200, margin: '0 auto',
                  display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: adminTokens.black,
                     letterSpacing: '-.02em' }}>ตั้งค่า</h1>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: adminTokens.muted }}>
          ตั้งค่าระบบ · การแจ้งเตือน · การชำระเงิน · ความปลอดภัย
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tabs.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                height: 38, padding: '0 12px', borderRadius: 9, cursor: 'pointer',
                border: 0, background: active ? adminTokens.orangeSoft : 'transparent',
                color: active ? adminTokens.orange : adminTokens.black,
                fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 500,
                display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
              }}>
                <span style={{ color: active ? adminTokens.orange : adminTokens.muted }}>
                  <SC_Icon d={t.icon} size={15}/>
                </span>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'general'  && <GeneralSettings/>}
          {tab === 'notif'    && <NotifSettings/>}
          {tab === 'billing'  && <BillingSettings/>}
          {tab === 'integr'   && <IntegrSettings/>}
          {tab === 'security' && <SecuritySettings/>}
        </div>
      </div>
    </div>
  );
};

const SettingsCard = ({ title, desc, children }) => (
  <div style={{
    background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
    borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, overflow: 'hidden',
  }}>
    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${adminTokens.border}` }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: adminTokens.black,
                    letterSpacing: '-.01em' }}>{title}</div>
      {desc && <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 3 }}>{desc}</div>}
    </div>
    <div style={{ padding: 18 }}>{children}</div>
  </div>
);

const SettingsRow = ({ label, desc, children, last }) => (
  <div style={{
    padding: '12px 0',
    borderBottom: last ? 0 : `1px solid ${adminTokens.divider}`,
    display: 'flex', alignItems: 'center', gap: 16,
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black }}>{label}</div>
      {desc && <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 2 }}>{desc}</div>}
    </div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
);

const Toggle = ({ on: initial = false }) => {
  const [on, setOn] = useSC(initial);
  return (
    <button onClick={() => setOn(!on)} style={{
      width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
      border: 0, background: on ? adminTokens.orange : adminTokens.border,
      position: 'relative', transition: 'background .2s',
    }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 20 : 2,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }}/>
    </button>
  );
};

const SInput = ({ value, suffix }) => (
  <div style={{
    height: 36, padding: '0 12px', minWidth: 220, maxWidth: 300,
    border: `1px solid ${adminTokens.border}`, borderRadius: 9,
    background: adminTokens.surface, display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 13, fontWeight: 500, color: adminTokens.black,
  }}>
    <input defaultValue={value} style={{
      flex: 1, border: 0, background: 'transparent', outline: 'none',
      fontFamily: 'inherit', fontSize: 13, color: adminTokens.black,
    }}/>
    {suffix && <span style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>{suffix}</span>}
  </div>
);

const GeneralSettings = () => (
  <>
    <SettingsCard title="ข้อมูลธุรกิจ">
      <SettingsRow label="ชื่อธุรกิจ">     <SInput value="MOOM Gym"/></SettingsRow>
      <SettingsRow label="อีเมลติดต่อ">    <SInput value="hello@moomgym.co"/></SettingsRow>
      <SettingsRow label="เบอร์โทร">       <SInput value="02-555-1234"/></SettingsRow>
      <SettingsRow label="เลขประจำตัวภาษี" last><SInput value="0105560099876"/></SettingsRow>
    </SettingsCard>
    <SettingsCard title="การแสดงผล" desc="ตั้งค่าภาษา เขตเวลา และสกุลเงิน">
      <SettingsRow label="ภาษา">     <SInput value="ไทย"/></SettingsRow>
      <SettingsRow label="เขตเวลา">  <SInput value="Asia/Bangkok (UTC+7)"/></SettingsRow>
      <SettingsRow label="สกุลเงิน"  last><SInput value="THB (฿)"/></SettingsRow>
    </SettingsCard>
  </>
);

const NotifSettings = () => (
  <>
    <SettingsCard title="อีเมล" desc="การแจ้งเตือนที่ส่งให้ลูกค้าผ่านอีเมล">
      <SettingsRow label="ยืนยันการจองคลาส" desc="ส่งอีเมลเมื่อสมาชิกจองคลาสสำเร็จ"><Toggle on/></SettingsRow>
      <SettingsRow label="เตือนก่อนคลาส 1 ชม." desc="ส่งก่อนเริ่มคลาส 60 นาที"><Toggle on/></SettingsRow>
      <SettingsRow label="ใบเสร็จรับเงิน" desc="ส่งอัตโนมัติเมื่อมีการชำระเงิน"><Toggle on/></SettingsRow>
      <SettingsRow label="โปรโมชั่น"    desc="การตลาดและโปรพิเศษ"                last><Toggle/></SettingsRow>
    </SettingsCard>
    <SettingsCard title="SMS / LINE" desc="การแจ้งเตือนผ่านข้อความและ LINE Official">
      <SettingsRow label="ยืนยันการเช็คอิน" desc="ส่ง SMS เมื่อเช็คอินสำเร็จ"><Toggle/></SettingsRow>
      <SettingsRow label="LINE OA"           desc="เชื่อมต่อแล้ว · @moomgym"         last><Toggle on/></SettingsRow>
    </SettingsCard>
  </>
);

const BillingSettings = () => (
  <>
    <SettingsCard title="แพ็คเกจระบบปัจจุบัน" desc="คุณใช้แผน Pro">
      <div style={{
        padding: 16, borderRadius: 11,
        background: `linear-gradient(135deg, ${adminTokens.orange}, color-mix(in oklab, ${adminTokens.orange} 70%, #000))`,
        color: '#fff', display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 11, background: 'rgba(255,255,255,.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <SC_Icon d={scIcons.shield} size={22}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, opacity: .9, fontWeight: 700, letterSpacing: '.05em',
                        textTransform: 'uppercase' }}>แผนปัจจุบัน</div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em' }}>
            Pro · ฿2,900/เดือน
          </div>
          <div style={{ fontSize: 11, opacity: .85, marginTop: 4 }}>
            สมาชิกไม่จำกัด · 4 สาขา · สนับสนุน 24/7 · ต่ออายุ 15 พ.ค. 2026
          </div>
        </div>
        <button style={{
          height: 36, padding: '0 14px', borderRadius: 9, cursor: 'pointer',
          border: `1px solid rgba(255,255,255,.4)`, background: 'rgba(255,255,255,.15)',
          color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
        }}>เปลี่ยนแผน</button>
      </div>
    </SettingsCard>
    <SettingsCard title="วิธีชำระเงิน">
      <div style={{
        padding: 14, border: `1px solid ${adminTokens.border}`, borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 28, borderRadius: 5,
          background: 'linear-gradient(135deg, #1a1f71, #3755d3)', color: '#fff',
          fontSize: 10, fontWeight: 800, letterSpacing: '.05em',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>VISA</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black,
                        fontFamily: 'monospace' }}>•••• •••• •••• 4242</div>
          <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 2 }}>หมดอายุ 08/27</div>
        </div>
        <button style={{
          height: 32, padding: '0 12px', borderRadius: 8, cursor: 'pointer',
          border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
          fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
        }}>เปลี่ยน</button>
      </div>
    </SettingsCard>
  </>
);

const IntegrSettings = () => {
  const apps = [
    { name: 'LINE Official',  icon: scIcons.line, color: 'hsl(150 60% 45%)', status: 'connected', meta: '@moomgym' },
    { name: 'Google Calendar', icon: aIcons.cal,  color: 'hsl(212 80% 55%)', status: 'connected', meta: 'Sync ตารางเรียน' },
    { name: 'Stripe',         icon: scIcons.card, color: 'hsl(260 60% 55%)', status: 'connected', meta: 'รับชำระด้วยบัตร' },
    { name: 'PromptPay',      icon: scIcons.cash, color: 'hsl(22 95% 55%)',  status: 'connected', meta: 'QR พร้อมเพย์' },
    { name: 'Mailchimp',      icon: scIcons.mail, color: 'hsl(38 92% 50%)',  status: 'available', meta: 'การตลาดทางอีเมล' },
    { name: 'Zapier',         icon: scIcons.globe,color: 'hsl(12 90% 50%)',  status: 'available', meta: 'เชื่อมต่อ 5000+ แอป' },
  ];
  return (
    <SettingsCard title="แอปที่เชื่อมต่อ" desc="เชื่อมต่อ MOOM กับเครื่องมือที่คุณใช้ประจำ">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {apps.map(a => (
          <div key={a.name} style={{
            padding: 12, border: `1px solid ${adminTokens.border}`, borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, background: `${a.color}20`, color: a.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SC_Icon d={a.icon} size={17}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black }}>{a.name}</div>
              <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 1 }}>{a.meta}</div>
            </div>
            {a.status === 'connected' ? (
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 5,
                background: 'hsl(150 50% 94%)', color: adminTokens.success,
                display: 'inline-flex', alignItems: 'center', gap: 3,
              }}>
                <SC_Icon d={scIcons.check} size={9} stroke={3}/>เชื่อมต่อแล้ว
              </span>
            ) : (
              <button style={{
                height: 28, padding: '0 10px', borderRadius: 7, cursor: 'pointer',
                border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
                color: adminTokens.black, fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
              }}>เชื่อมต่อ</button>
            )}
          </div>
        ))}
      </div>
    </SettingsCard>
  );
};

const SecuritySettings = () => (
  <>
    <SettingsCard title="การยืนยันตัวตน" desc="ความปลอดภัยบัญชีของคุณ">
      <SettingsRow label="รหัสผ่าน" desc="เปลี่ยนครั้งล่าสุด 2 เดือนที่แล้ว">
        <button style={{
          height: 32, padding: '0 12px', borderRadius: 8, cursor: 'pointer',
          border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
          fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
        }}>เปลี่ยนรหัสผ่าน</button>
      </SettingsRow>
      <SettingsRow label="ยืนยัน 2 ขั้นตอน" desc="เพิ่มความปลอดภัยอีก 1 ขั้น (SMS)"><Toggle on/></SettingsRow>
      <SettingsRow label="Session หมดอายุอัตโนมัติ" desc="ออกจากระบบเมื่อไม่มีการใช้งาน" last>
        <SInput value="8" suffix="ชั่วโมง"/>
      </SettingsRow>
    </SettingsCard>
    <SettingsCard title="เขตอันตราย">
      <div style={{
        padding: 14, background: 'hsl(0 95% 97%)', border: '1px solid hsl(0 70% 85%)',
        borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ color: 'hsl(0 72% 55%)' }}><SC_Icon d={scIcons.warn} size={18}/></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'hsl(0 72% 35%)' }}>ลบบัญชี MOOM</div>
          <div style={{ fontSize: 11, color: 'hsl(0 50% 40%)', marginTop: 2 }}>
            ข้อมูลทั้งหมดจะถูกลบถาวรและไม่สามารถกู้คืนได้
          </div>
        </div>
        <button style={{
          height: 32, padding: '0 14px', borderRadius: 8, cursor: 'pointer',
          border: `1.5px solid hsl(0 72% 55%)`, background: 'transparent',
          color: 'hsl(0 72% 45%)', fontFamily: 'inherit', fontSize: 12, fontWeight: 800,
        }}>ลบบัญชี</button>
      </div>
    </SettingsCard>
  </>
);

Object.assign(window, {
  ROLE_DATA, PERM_GROUPS, RolesPage,
  BRANCH_DATA, BranchesPage, BranchCard, ScKpi, BrInfo, BrStat,
  LOG_TYPES, LOG_DATA, ActivityLogPage,
  SettingsPage, SettingsCard, SettingsRow, Toggle, SInput,
  GeneralSettings, NotifSettings, BillingSettings, IntegrSettings, SecuritySettings,
  SC_Icon, scIcons,
});
