/* MOOM Admin — โปรแกรมฝึก (Training Programs)
   Multi-week structured workout plans that members enroll in.

   Design decisions:
   - Program = card with cover imagery (color + icon hero), duration, level, goal
   - Directory has filter chips (goal × level × duration) + search
   - KPI strip at top: active programs, total enrollees, avg completion
   - Drawer = week-by-week breakdown with expandable workout details
   - Each workout shows exercise list with sets × reps × rest
   - Editor: meta + visual week timeline; click a day to edit workout
   - Exercise picker with search from curated library
*/

const { useState: usePG, useMemo: useMemoPG, useEffect: useEffectPG, useRef: useRefPG } = React;

/* =============================================================
 *  DATA
 * =========================================================== */
const PG_LEVELS = [
  { id: 'beginner',     label: 'มือใหม่',   color: 'hsl(150 50% 45%)' },
  { id: 'intermediate', label: 'ปานกลาง',   color: 'hsl(38 92% 50%)'  },
  { id: 'advanced',     label: 'ก้าวหน้า',  color: 'hsl(0 72% 55%)'   },
];

const PG_GOALS = [
  { id: 'strength',   label: 'สร้างกล้าม',      icon: 'dumb' },
  { id: 'fatloss',    label: 'ลดไขมัน',         icon: 'fire' },
  { id: 'endurance',  label: 'ความอึด',          icon: 'run'  },
  { id: 'flexibility',label: 'ยืดหยุ่น',         icon: 'stretch' },
  { id: 'mind',       label: 'จิตใจ สมาธิ',     icon: 'moon' },
  { id: 'rehab',      label: 'ฟื้นฟู',           icon: 'heart' },
];

/* Exercise library — keyed by category */
const PG_EXERCISE_LIB = [
  // Strength
  { id: 'squat',     name: 'Back Squat',          cat: 'strength', unit: 'reps' },
  { id: 'deadlift',  name: 'Deadlift',            cat: 'strength', unit: 'reps' },
  { id: 'bench',     name: 'Bench Press',         cat: 'strength', unit: 'reps' },
  { id: 'row',       name: 'Barbell Row',         cat: 'strength', unit: 'reps' },
  { id: 'ohp',       name: 'Overhead Press',      cat: 'strength', unit: 'reps' },
  { id: 'pullup',    name: 'Pull-up',             cat: 'strength', unit: 'reps' },
  { id: 'lunge',     name: 'Walking Lunges',      cat: 'strength', unit: 'reps' },
  { id: 'rdl',       name: 'Romanian Deadlift',   cat: 'strength', unit: 'reps' },
  // Cardio
  { id: 'run',       name: 'วิ่ง',                 cat: 'cardio',   unit: 'min' },
  { id: 'bike',      name: 'ปั่นจักรยาน',         cat: 'cardio',   unit: 'min' },
  { id: 'burpee',    name: 'Burpees',             cat: 'cardio',   unit: 'reps' },
  { id: 'jumprope',  name: 'กระโดดเชือก',         cat: 'cardio',   unit: 'min' },
  { id: 'mtn',       name: 'Mountain Climbers',   cat: 'cardio',   unit: 'sec' },
  // Mobility
  { id: 'downdog',   name: 'Downward Dog',        cat: 'mobility', unit: 'sec' },
  { id: 'pigeon',    name: 'Pigeon Pose',         cat: 'mobility', unit: 'sec' },
  { id: 'catcow',    name: 'Cat-Cow',             cat: 'mobility', unit: 'reps' },
  { id: 'hipflex',   name: 'Hip Flexor Stretch',  cat: 'mobility', unit: 'sec' },
  { id: 'foamroll',  name: 'Foam Roll Quads',     cat: 'mobility', unit: 'min' },
  // Core
  { id: 'plank',     name: 'Plank',               cat: 'core',     unit: 'sec' },
  { id: 'situp',     name: 'Sit-ups',             cat: 'core',     unit: 'reps' },
  { id: 'leg-raise', name: 'Leg Raises',          cat: 'core',     unit: 'reps' },
  { id: 'russian',   name: 'Russian Twists',      cat: 'core',     unit: 'reps' },
  { id: 'deadbug',   name: 'Dead Bug',            cat: 'core',     unit: 'reps' },
];

const PG_EX_CATS = [
  { id: 'strength', label: 'ยกน้ำหนัก' },
  { id: 'cardio',   label: 'คาร์ดิโอ' },
  { id: 'mobility', label: 'ยืดหยุ่น' },
  { id: 'core',     label: 'แกนกลาง' },
];

/* Helper: build a week of workouts */
const pgMakeWorkout = (name, exercises) => ({
  name, rest: 0, notes: '',
  exercises: exercises.map(([exId, sets, reps, weight, rest]) => ({
    exId, sets, reps, weight: weight || '', rest: rest || 60,
  })),
});

const pgRestDay = { rest: true };

/* =============================================================
 *  PROGRAMS (seed) — 6 programs with real week schedules
 * =========================================================== */
const PG_PROGRAMS = [
  {
    id: 'strength-12w', name: '12-Week Strength Builder',
    subtitle: 'สร้างกล้ามเนื้อและความแข็งแรงอย่างเป็นระบบ',
    desc: 'โปรแกรมยกน้ำหนัก 12 สัปดาห์ เน้น compound lifts เพื่อสร้างฐานความแข็งแรงที่ยั่งยืน',
    color: 'hsl(150 50% 45%)', icon: 'dumb',
    level: 'intermediate', goal: 'strength', weeks: 12, sessionsPerWeek: 4,
    minsPerSession: 75, enrolled: 84, completed: 42, rating: 4.8,
    visible: true, featured: true,
    weeks_: Array.from({ length: 12 }, (_, wi) => ({
      week: wi + 1,
      days: [
        pgMakeWorkout('Upper Push', [['bench', 4, '8-10', '70kg', 90], ['ohp', 3, '8-10', '40kg', 90], ['pullup', 3, 'AMRAP', '', 90]]),
        pgRestDay,
        pgMakeWorkout('Lower Power', [['squat', 5, 5, '80kg', 120], ['rdl', 3, 8, '70kg', 90], ['lunge', 3, 12, '20kg', 60]]),
        pgRestDay,
        pgMakeWorkout('Upper Pull', [['row', 4, 8, '60kg', 90], ['pullup', 4, 'AMRAP', '', 90], ['deadbug', 3, 12, '', 45]]),
        pgMakeWorkout('Lower Volume', [['deadlift', 3, 5, '100kg', 180], ['lunge', 4, 10, '24kg', 60], ['plank', 3, 60, '', 45]]),
        pgRestDay,
      ],
    })),
  },
  {
    id: 'couch-5k', name: 'Couch to 5K',
    subtitle: 'เริ่มจากไม่เคยวิ่ง สู่การวิ่งต่อเนื่อง 5 กม.',
    desc: 'โปรแกรม 9 สัปดาห์สำหรับผู้เริ่มต้น วิ่ง 3 วัน/สัปดาห์ ค่อยๆเพิ่มระยะทาง',
    color: 'hsl(200 70% 55%)', icon: 'run',
    level: 'beginner', goal: 'endurance', weeks: 9, sessionsPerWeek: 3,
    minsPerSession: 30, enrolled: 132, completed: 89, rating: 4.9,
    visible: true, featured: true,
    weeks_: Array.from({ length: 9 }, (_, wi) => ({
      week: wi + 1,
      days: [
        pgMakeWorkout(`Run ${wi + 1}`, [['run', 1, `${20 + wi * 2}`, '', 0]]),
        pgRestDay,
        pgMakeWorkout(`Run ${wi + 1}`, [['run', 1, `${22 + wi * 2}`, '', 0]]),
        pgRestDay,
        pgMakeWorkout(`Long Run`,      [['run', 1, `${25 + wi * 3}`, '', 0]]),
        pgRestDay, pgRestDay,
      ],
    })),
  },
  {
    id: 'fat-burn-8w', name: '8-Week Fat Burn',
    subtitle: 'HIIT + strength ลดไขมันอย่างมีประสิทธิภาพ',
    desc: 'ผสม HIIT, คาร์ดิโอ และยกน้ำหนัก 5 วัน/สัปดาห์ เพื่อเร่งการเผาผลาญ',
    color: 'hsl(25 95% 55%)', icon: 'fire',
    level: 'intermediate', goal: 'fatloss', weeks: 8, sessionsPerWeek: 5,
    minsPerSession: 45, enrolled: 218, completed: 96, rating: 4.6,
    visible: true, featured: true,
    weeks_: Array.from({ length: 8 }, (_, wi) => ({
      week: wi + 1,
      days: [
        pgMakeWorkout('HIIT Circuit', [['burpee', 5, 15, '', 30], ['mtn', 5, 45, '', 30], ['jumprope', 5, 1, '', 30]]),
        pgMakeWorkout('Strength',      [['squat', 3, 10, '60kg', 60], ['row', 3, 10, '50kg', 60]]),
        pgRestDay,
        pgMakeWorkout('HIIT Cardio',   [['bike', 1, 25, '', 0], ['plank', 3, 45, '', 30]]),
        pgMakeWorkout('Full Body',     [['deadlift', 3, 8, '80kg', 90], ['bench', 3, 8, '60kg', 60], ['burpee', 3, 10, '', 60]]),
        pgMakeWorkout('Long Cardio',   [['run', 1, 35, '', 0]]),
        pgRestDay,
      ],
    })),
  },
  {
    id: 'yoga-journey', name: 'Yoga Foundations',
    subtitle: 'โยคะ 8 สัปดาห์ เริ่มจากศูนย์',
    desc: 'เริ่มต้นการฝึกโยคะอย่างมั่นใจ — ท่าพื้นฐาน การหายใจ และความยืดหยุ่น',
    color: 'hsl(270 60% 60%)', icon: 'yoga',
    level: 'beginner', goal: 'flexibility', weeks: 8, sessionsPerWeek: 3,
    minsPerSession: 45, enrolled: 74, completed: 44, rating: 4.9,
    visible: true, featured: false,
    weeks_: Array.from({ length: 8 }, (_, wi) => ({
      week: wi + 1,
      days: [
        pgMakeWorkout('Gentle Flow',   [['downdog', 3, 30, '', 15], ['catcow', 3, 10, '', 15]]),
        pgRestDay,
        pgMakeWorkout('Hip Opening',   [['pigeon', 3, 60, '', 30], ['hipflex', 3, 45, '', 20]]),
        pgRestDay,
        pgMakeWorkout('Full Flow',     [['downdog', 4, 45, '', 15], ['pigeon', 2, 60, '', 30]]),
        pgRestDay, pgRestDay,
      ],
    })),
  },
  {
    id: 'mind-body', name: 'Mind & Body Reset',
    subtitle: 'เมดิเทชั่น + ยืดกล้าม ผ่อนคลายความเครียด',
    desc: 'สำหรับคนทำงานเครียด — 15 นาที/วัน ผสมเมดิเทชั่นกับการยืดเหยียด',
    color: 'hsl(340 70% 60%)', icon: 'moon',
    level: 'beginner', goal: 'mind', weeks: 4, sessionsPerWeek: 5,
    minsPerSession: 15, enrolled: 58, completed: 32, rating: 4.7,
    visible: true, featured: false,
    weeks_: Array.from({ length: 4 }, (_, wi) => ({
      week: wi + 1,
      days: [
        pgMakeWorkout('Morning Reset', [['downdog', 2, 30, '', 10], ['catcow', 2, 8, '', 10]]),
        pgMakeWorkout('Hip Release',    [['pigeon', 3, 45, '', 20]]),
        pgRestDay,
        pgMakeWorkout('Breathing',      [['foamroll', 1, 5, '', 0]]),
        pgMakeWorkout('Full Body',      [['hipflex', 3, 30, '', 10], ['catcow', 2, 8, '', 10]]),
        pgRestDay, pgRestDay,
      ],
    })),
  },
  {
    id: 'powerlift-16w', name: 'Powerlifting 16',
    subtitle: 'เพิ่ม 1RM ของ 3 lifts หลัก',
    desc: 'สำหรับคนที่เคยยกแล้ว — โฟกัส squat/bench/deadlift 16 สัปดาห์',
    color: 'hsl(0 72% 55%)', icon: 'zap',
    level: 'advanced', goal: 'strength', weeks: 16, sessionsPerWeek: 4,
    minsPerSession: 90, enrolled: 22, completed: 8, rating: 5.0,
    visible: false, featured: false,
    weeks_: Array.from({ length: 16 }, (_, wi) => ({
      week: wi + 1,
      days: [
        pgMakeWorkout('Squat Day',    [['squat', 5, 3, '110kg', 180]]),
        pgRestDay,
        pgMakeWorkout('Bench Day',    [['bench', 5, 3, '90kg', 180]]),
        pgRestDay,
        pgMakeWorkout('Deadlift Day', [['deadlift', 5, 3, '140kg', 240]]),
        pgMakeWorkout('Accessory',    [['row', 4, 8, '65kg', 90], ['pullup', 4, 'AMRAP', '', 90]]),
        pgRestDay,
      ],
    })),
  },
];

/* =============================================================
 *  HELPERS
 * =========================================================== */
const PG_Icon = ({ d, size = 14, stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
       style={{ display: 'block', flexShrink: 0 }}>{d}</svg>
);

const pgIcons = {
  plus: ctIcons.plus, x: ctIcons.x, search: ctIcons.search, edit: ctIcons.edit,
  trash: ctIcons.trash, chev: ctIcons.chev, check: ctIcons.check, info: ctIcons.info,
  copy: ctIcons.copy, eye: ctIcons.eye, eyeOff: ctIcons.eyeOff, dots: ctIcons.dots,
  sparkle: ctIcons.sparkle,
  star:    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
  users:   <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
  clock:   <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  target:  <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  flame:   <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>,
  bolt:    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
  cal:     <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  dumbbell:<><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94"/></>,
  filter:  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>,
  bed:     <><path d="M2 9v9M22 9v9M2 13h20M2 9h20v4M6 13V9c0-1 1-2 2-2h2c1 0 2 1 2 2v4"/></>,
  arrow:   <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  chart:   <><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>,
  trend:   <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>,
};

const pgGetIcon = (id) => CT_ICON_PRESETS.find(i => i.id === id)?.path || pgIcons.dumbbell;
const pgLevel = (id) => PG_LEVELS.find(l => l.id === id) || PG_LEVELS[0];
const pgGoal  = (id) => PG_GOALS.find(g => g.id === id)  || PG_GOALS[0];
const pgExercise = (id) => PG_EXERCISE_LIB.find(e => e.id === id);

const PG_DAY_NAMES = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];

/* =============================================================
 *  PROGRAM CARD
 * =========================================================== */
const ProgramCard = ({ prog, onOpen, onEdit, active }) => {
  const [hover, setHover] = usePG(false);
  const lvl = pgLevel(prog.level);
  const goal = pgGoal(prog.goal);
  const completion = prog.enrolled > 0 ? Math.round(prog.completed / prog.enrolled * 100) : 0;

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: adminTokens.surface,
        border: `1px solid ${active || hover ? prog.color : adminTokens.border}`,
        boxShadow: (hover || active) ? adminTokens.shadowMd : adminTokens.shadowSm,
        borderRadius: adminTokens.r3, cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        transition: 'all .15s', position: 'relative', overflow: 'hidden',
        opacity: prog.visible ? 1 : 0.72,
      }}
    >
      {/* Cover */}
      <div style={{
        height: 130,
        background: `linear-gradient(135deg, ${prog.color} 0%, ${prog.color} 70%, color-mix(in oklab, ${prog.color} 70%, #000) 100%)`,
        position: 'relative', padding: 14, display: 'flex', flexDirection: 'column',
      }}>
        {/* Overlay pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.2,
          backgroundImage: `radial-gradient(circle at 85% 20%, rgba(255,255,255,.3) 0%, transparent 40%),
                            radial-gradient(circle at 15% 90%, rgba(0,0,0,.3) 0%, transparent 50%)`,
        }}/>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
          {prog.featured && (
            <span style={{
              fontSize: 9, fontWeight: 800, color: '#fff',
              background: 'rgba(0,0,0,.3)', padding: '3px 7px', borderRadius: 4,
              letterSpacing: '.08em', display: 'inline-flex', alignItems: 'center', gap: 3,
              backdropFilter: 'blur(4px)',
            }}>
              <PG_Icon d={pgIcons.star} size={9}/> FEATURED
            </span>
          )}
          {!prog.visible && (
            <span style={{
              fontSize: 9, fontWeight: 800, color: '#fff',
              background: 'rgba(0,0,0,.4)', padding: '3px 7px', borderRadius: 4,
              letterSpacing: '.04em', display: 'inline-flex', alignItems: 'center', gap: 3,
              backdropFilter: 'blur(4px)',
            }}>
              <PG_Icon d={pgIcons.eyeOff} size={9}/> ซ่อน
            </span>
          )}
          <div style={{ flex: 1 }}/>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#fff',
            background: 'rgba(0,0,0,.3)', padding: '3px 8px', borderRadius: 4,
            letterSpacing: '.04em', backdropFilter: 'blur(4px)',
          }}>
            {prog.weeks} สัปดาห์
          </span>
        </div>

        <div style={{ flex: 1 }}/>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,.25)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)', flexShrink: 0, border: '1px solid rgba(255,255,255,.3)',
          }}>
            <PG_Icon d={pgGetIcon(prog.icon)} size={26} stroke={2.2}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-.01em',
              lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              textShadow: '0 1px 3px rgba(0,0,0,.2)',
            }}>
              {prog.name}
            </div>
            <div style={{
              fontSize: 11, color: '#fff', opacity: .92, marginTop: 2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {prog.subtitle}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Tags */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <PgChip color={lvl.color} bg={`${lvl.color}20`}>{lvl.label}</PgChip>
          <PgChip color={adminTokens.black} bg={adminTokens.subtle}
                  icon={<PG_Icon d={pgGetIcon(goal.icon)} size={10}/>}>
            {goal.label}
          </PgChip>
          <PgChip color={adminTokens.muted} bg={adminTokens.subtle}
                  icon={<PG_Icon d={pgIcons.clock} size={10}/>}>
            {prog.minsPerSession} นาที
          </PgChip>
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
          background: adminTokens.subtle, borderRadius: 9, padding: '10px 0',
        }}>
          <PgStat label="ลงทะเบียน" value={prog.enrolled} color={adminTokens.black}/>
          <PgStat label="สำเร็จ" value={`${completion}%`} color={completion > 60 ? adminTokens.success : adminTokens.warn}/>
          <PgStat label="เรตติ้ง" value={prog.rating.toFixed(1)} color={adminTokens.orange}
                  iconAfter={<PG_Icon d={pgIcons.star} size={10}/>}/>
        </div>

        {/* Progress bar — completion ratio */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700,
                           textTransform: 'uppercase', letterSpacing: '.05em' }}>
              อัตราเสร็จสิ้น
            </span>
            <span style={{ fontSize: 10, color: adminTokens.black, fontWeight: 700,
                           fontVariantNumeric: 'tabular-nums' }}>
              {prog.completed}/{prog.enrolled}
            </span>
          </div>
          <div style={{
            height: 6, background: adminTokens.subtle, borderRadius: 3, overflow: 'hidden',
          }}>
            <div style={{
              width: `${completion}%`, height: '100%', background: prog.color,
              transition: 'width .3s',
            }}/>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          paddingTop: 8, borderTop: `1px dashed ${adminTokens.divider}`,
        }}>
          <span style={{
            fontSize: 10, color: adminTokens.muted, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <PG_Icon d={pgIcons.cal} size={10}/>
            {prog.sessionsPerWeek} วัน/สัปดาห์
          </span>
          <div style={{ flex: 1 }}/>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} style={{
            height: 26, padding: '0 10px', borderRadius: 6, cursor: 'pointer',
            border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
            color: adminTokens.black, fontFamily: 'inherit', fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <PG_Icon d={pgIcons.edit} size={10}/> แก้ไข
          </button>
        </div>
      </div>
    </div>
  );
};

const PgChip = ({ children, color, bg, icon }) => (
  <span style={{
    fontSize: 10, fontWeight: 700, color,
    background: bg, padding: '3px 7px', borderRadius: 4,
    display: 'inline-flex', alignItems: 'center', gap: 4, lineHeight: 1.3,
  }}>{icon}{children}</span>
);

const PgStat = ({ label, value, color, iconAfter }) => (
  <div style={{
    textAlign: 'center', padding: '0 4px',
    borderRight: `1px solid ${adminTokens.border}`,
  }} className="pg-stat">
    <div style={{
      fontSize: 14, fontWeight: 800, color,
      fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em', lineHeight: 1.1,
      display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      {value}{iconAfter}
    </div>
    <div style={{
      fontSize: 9, color: adminTokens.muted, fontWeight: 600, marginTop: 2,
      textTransform: 'uppercase', letterSpacing: '.04em',
    }}>
      {label}
    </div>
  </div>
);

/* =============================================================
 *  PROGRAM DRAWER — week-by-week detail
 * =========================================================== */
const ProgramDrawer = ({ prog, onClose, onEdit }) => {
  const [activeWeek, setActiveWeek] = usePG(0);
  const lvl = pgLevel(prog.level);
  const goal = pgGoal(prog.goal);
  const week = prog.weeks_?.[activeWeek];
  const completion = prog.enrolled > 0 ? Math.round(prog.completed / prog.enrolled * 100) : 0;

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.35)', zIndex: 90,
        animation: 'pg-fade .18s ease-out',
      }}/>
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 620, zIndex: 91,
        background: adminTokens.surface, boxShadow: '-20px 0 60px rgba(15,23,42,.15)',
        display: 'flex', flexDirection: 'column',
        animation: 'pg-slide .25s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Hero header */}
        <div style={{
          background: `linear-gradient(135deg, ${prog.color} 0%, color-mix(in oklab, ${prog.color} 75%, #000) 100%)`,
          color: '#fff', padding: '18px 22px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 54, height: 54, borderRadius: 14, background: 'rgba(255,255,255,.2)',
              backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <PG_Icon d={pgGetIcon(prog.icon)} size={28}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: .85, letterSpacing: '.06em',
                            textTransform: 'uppercase' }}>
                โปรแกรมฝึก · {prog.weeks} สัปดาห์
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em', marginTop: 2 }}>
                {prog.name}
              </div>
              <div style={{ fontSize: 12, opacity: .9, marginTop: 4, lineHeight: 1.45 }}>
                {prog.desc}
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8, border: 0, flexShrink: 0,
              background: 'rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PG_Icon d={pgIcons.x} size={14}/>
            </button>
          </div>

          {/* Tags row */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#fff',
              background: 'rgba(255,255,255,.2)', padding: '4px 10px', borderRadius: 5,
              backdropFilter: 'blur(4px)',
            }}>{lvl.label}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#fff',
              background: 'rgba(255,255,255,.2)', padding: '4px 10px', borderRadius: 5,
              backdropFilter: 'blur(4px)', display: 'inline-flex', alignItems: 'center', gap: 4,
            }}><PG_Icon d={pgGetIcon(goal.icon)} size={11}/> {goal.label}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#fff',
              background: 'rgba(255,255,255,.2)', padding: '4px 10px', borderRadius: 5,
              backdropFilter: 'blur(4px)', display: 'inline-flex', alignItems: 'center', gap: 4,
            }}><PG_Icon d={pgIcons.clock} size={11}/> {prog.minsPerSession} นาที/ครั้ง</span>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#fff',
              background: 'rgba(255,255,255,.2)', padding: '4px 10px', borderRadius: 5,
              backdropFilter: 'blur(4px)', display: 'inline-flex', alignItems: 'center', gap: 4,
            }}><PG_Icon d={pgIcons.cal} size={11}/> {prog.sessionsPerWeek} วัน/สัปดาห์</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex',
                      flexDirection: 'column', gap: 18 }}>
          {/* KPI grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            <PgDrawerStat label="ลงทะเบียน"     value={prog.enrolled}                        color={prog.color}/>
            <PgDrawerStat label="สำเร็จ"         value={`${completion}%`}                     color={adminTokens.success}/>
            <PgDrawerStat label="เรตติ้ง"        value={prog.rating.toFixed(1)} unit="★"      color={adminTokens.orange}/>
            <PgDrawerStat label="นาทีรวม"        value={prog.weeks * prog.sessionsPerWeek * prog.minsPerSession} color={adminTokens.ink2}/>
          </div>

          {/* Week picker */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <PgSectionLabel nom>ตารางรายสัปดาห์</PgSectionLabel>
              <span style={{ fontSize: 11, color: adminTokens.muted }}>
                สัปดาห์ {activeWeek + 1} / {prog.weeks}
              </span>
            </div>
            {/* Horizontal week scroller */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
              {prog.weeks_?.map((w, i) => (
                <button key={i} onClick={() => setActiveWeek(i)} style={{
                  minWidth: 54, height: 54, padding: 0, borderRadius: 10,
                  cursor: 'pointer', flexShrink: 0,
                  border: i === activeWeek ? `2px solid ${prog.color}` : `1px solid ${adminTokens.border}`,
                  background: i === activeWeek ? prog.color : adminTokens.surface,
                  color: i === activeWeek ? '#fff' : adminTokens.black,
                  fontFamily: 'inherit', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  boxShadow: i === activeWeek ? `0 4px 10px ${prog.color}50` : 'none',
                  transition: 'all .12s',
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, opacity: .8, textTransform: 'uppercase',
                                letterSpacing: '.04em' }}>สัปดาห์</div>
                  <div style={{ fontSize: 17, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                    {i + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Days grid */}
          {week && (
            <div>
              <PgSectionLabel>สัปดาห์ {activeWeek + 1} — 7 วัน</PgSectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {week.days.map((day, di) => (
                  <WorkoutDay key={di} day={day} dayLabel={PG_DAY_NAMES[di]} color={prog.color}/>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: `1px solid ${adminTokens.border}`,
          display: 'flex', gap: 8,
        }}>
          <button onClick={onClose} style={{
            flex: 1, height: 38, borderRadius: 9, cursor: 'pointer',
            border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
            color: adminTokens.black, fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
          }}>ปิด</button>
          <button onClick={onEdit} style={{
            flex: 1, height: 38, borderRadius: 9, cursor: 'pointer',
            border: 0, background: prog.color, color: '#fff',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: `0 4px 12px ${prog.color}60`,
          }}>
            <PG_Icon d={pgIcons.edit} size={12}/> แก้ไขโปรแกรม
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pg-fade  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pg-slide { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes pg-pop   { from { opacity: 0; transform: translate(-50%,-48%) scale(.96); }
                              to   { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
      `}</style>
    </>
  );
};

const PgSectionLabel = ({ children, nom }) => (
  <div style={{
    fontSize: 11, fontWeight: 800, color: adminTokens.muted,
    textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: nom ? 0 : 10,
  }}>{children}</div>
);

const PgDrawerStat = ({ label, value, unit, color }) => (
  <div style={{
    padding: 10, background: adminTokens.subtle, borderRadius: 9,
    border: `1px solid ${adminTokens.border}`, textAlign: 'center',
  }}>
    <div style={{
      fontSize: 16, fontWeight: 800, color, letterSpacing: '-.01em',
      fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
      display: 'inline-flex', alignItems: 'baseline', gap: 3,
    }}>
      {value}
      {unit && <span style={{ fontSize: 11 }}>{unit}</span>}
    </div>
    <div style={{ fontSize: 9, color: adminTokens.muted, fontWeight: 700, marginTop: 4,
                  textTransform: 'uppercase', letterSpacing: '.04em' }}>
      {label}
    </div>
  </div>
);

/* =============================================================
 *  WORKOUT DAY (expandable)
 * =========================================================== */
const WorkoutDay = ({ day, dayLabel, color }) => {
  const [open, setOpen] = usePG(false);

  if (day.rest) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 9,
        background: adminTokens.subtle, border: `1px dashed ${adminTokens.border}`,
      }}>
        <div style={{
          width: 34, textAlign: 'center', fontSize: 12, fontWeight: 800, color: adminTokens.muted,
        }}>{dayLabel}</div>
        <div style={{ flex: 1, fontSize: 12, color: adminTokens.muted, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 6 }}>
          <PG_Icon d={pgIcons.bed} size={13}/> วันพัก
        </div>
      </div>
    );
  }

  const totalEx = day.exercises.length;
  const totalSets = day.exercises.reduce((s, e) => s + e.sets, 0);

  return (
    <div style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: 9, overflow: 'hidden',
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '10px 12px', border: 0, background: 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit',
      }}>
        <div style={{
          width: 34, textAlign: 'center', fontSize: 12, fontWeight: 800, color: adminTokens.black,
        }}>{dayLabel}</div>
        <div style={{ width: 1, height: 26, background: adminTokens.border }}/>
        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {day.name}
          </div>
          <div style={{ fontSize: 10, color: adminTokens.muted, marginTop: 1 }}>
            {totalEx} ท่า · {totalSets} เซ็ต
          </div>
        </div>
        <div style={{
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform .15s', color: adminTokens.muted,
        }}>
          <PG_Icon d={pgIcons.chev} size={14}/>
        </div>
      </button>

      {open && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 0,
                      borderTop: `1px solid ${adminTokens.border}` }}>
          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 50px 60px 60px 50px', gap: 8,
            padding: '10px 6px 6px', fontSize: 9, fontWeight: 700,
            color: adminTokens.muted, textTransform: 'uppercase', letterSpacing: '.05em',
          }}>
            <div>ท่า</div>
            <div style={{ textAlign: 'center' }}>เซ็ต</div>
            <div style={{ textAlign: 'center' }}>ครั้ง</div>
            <div style={{ textAlign: 'center' }}>น้ำหนัก</div>
            <div style={{ textAlign: 'center' }}>พัก</div>
          </div>
          {day.exercises.map((ex, i) => {
            const exDef = pgExercise(ex.exId);
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 50px 60px 60px 50px', gap: 8,
                alignItems: 'center', padding: '8px 6px',
                borderTop: i > 0 ? `1px solid ${adminTokens.divider}` : 'none',
                fontSize: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 5, background: `${color}20`, color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <PG_Icon d={pgIcons.dumbbell} size={10}/>
                  </div>
                  <div style={{ fontWeight: 600, color: adminTokens.black,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {exDef?.name || ex.exId}
                  </div>
                </div>
                <div style={{ textAlign: 'center', fontWeight: 700, color: adminTokens.black,
                              fontVariantNumeric: 'tabular-nums' }}>{ex.sets}</div>
                <div style={{ textAlign: 'center', fontWeight: 700, color: adminTokens.black,
                              fontVariantNumeric: 'tabular-nums' }}>
                  {ex.reps}{exDef?.unit && exDef.unit !== 'reps' ? exDef.unit.slice(0,1) : ''}
                </div>
                <div style={{ textAlign: 'center', fontWeight: 600, color: adminTokens.muted,
                              fontSize: 11 }}>
                  {ex.weight || '—'}
                </div>
                <div style={{ textAlign: 'center', fontWeight: 600, color: adminTokens.muted,
                              fontVariantNumeric: 'tabular-nums', fontSize: 11 }}>
                  {ex.rest}s
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* =============================================================
 *  PROGRAM EDITOR MODAL
 * =========================================================== */
const ProgramEditor = ({ prog, onSave, onClose, onDelete }) => {
  const isNew = !prog.id;
  const [name, setName]           = usePG(prog.name || '');
  const [subtitle, setSubtitle]   = usePG(prog.subtitle || '');
  const [desc, setDesc]           = usePG(prog.desc || '');
  const [color, setColor]         = usePG(prog.color || CT_COLOR_PRESETS[0].hex);
  const [icon, setIcon]           = usePG(prog.icon || 'dumb');
  const [level, setLevel]         = usePG(prog.level || 'beginner');
  const [goal, setGoal]           = usePG(prog.goal || 'strength');
  const [weeks, setWeeks]         = usePG(prog.weeks || 8);
  const [sessions, setSessions]   = usePG(prog.sessionsPerWeek || 3);
  const [mins, setMins]           = usePG(prog.minsPerSession || 45);
  const [visible, setVisible]     = usePG(prog.visible !== false);
  const [featured, setFeatured]   = usePG(prog.featured || false);

  const nameRef = useRefPG();
  useEffectPG(() => nameRef.current?.focus(), []);
  const canSave = name.trim().length > 0;
  const lvl = pgLevel(level);
  const glObj = pgGoal(goal);

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.4)', zIndex: 100,
        animation: 'pg-fade .18s ease-out',
      }}/>
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 620, maxHeight: '90vh', zIndex: 101,
        background: adminTokens.surface, borderRadius: adminTokens.r4,
        boxShadow: '0 24px 60px rgba(15,23,42,.24)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: 'pg-pop .22s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Header with live preview */}
        <div style={{
          padding: '18px 22px',
          background: `linear-gradient(135deg, ${color} 0%, color-mix(in oklab, ${color} 75%, #000) 100%)`,
          color: '#fff', display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PG_Icon d={pgGetIcon(icon)} size={26}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: .85, letterSpacing: '.06em',
                          textTransform: 'uppercase' }}>
              {isNew ? 'สร้างโปรแกรมใหม่' : 'แก้ไขโปรแกรม'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', marginTop: 2,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {name.trim() || 'โปรแกรมใหม่'}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: 0,
            background: 'rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PG_Icon d={pgIcons.x} size={14}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex',
                      flexDirection: 'column', gap: 16 }}>
          <div>
            <CtLabel>ชื่อโปรแกรม <span style={{ color: adminTokens.destr }}>*</span></CtLabel>
            <input ref={nameRef} value={name} onChange={e => setName(e.target.value)}
                   placeholder="เช่น 12-Week Strength Builder" maxLength={50}
                   style={pgInputStyle}
                   onFocus={e => e.target.style.borderColor = color}
                   onBlur={e => e.target.style.borderColor = adminTokens.border}/>
          </div>

          <div>
            <CtLabel>Subtitle</CtLabel>
            <input value={subtitle} onChange={e => setSubtitle(e.target.value)}
                   placeholder="สั้นๆ · 1 บรรทัด" maxLength={60}
                   style={pgInputStyle}
                   onFocus={e => e.target.style.borderColor = color}
                   onBlur={e => e.target.style.borderColor = adminTokens.border}/>
          </div>

          <div>
            <CtLabel>คำอธิบาย</CtLabel>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
                      placeholder="อธิบายรายละเอียดเพิ่มเติม" rows={3} maxLength={200}
                      style={{ ...pgInputStyle, height: 'auto', padding: '10px 12px', resize: 'none',
                               lineHeight: 1.5 }}
                      onFocus={e => e.target.style.borderColor = color}
                      onBlur={e => e.target.style.borderColor = adminTokens.border}/>
          </div>

          {/* Level + Goal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <CtLabel>ระดับ</CtLabel>
              <div style={{ display: 'flex', gap: 4 }}>
                {PG_LEVELS.map(l => (
                  <button key={l.id} onClick={() => setLevel(l.id)} style={{
                    flex: 1, height: 34, borderRadius: 8, cursor: 'pointer',
                    border: level === l.id ? `2px solid ${l.color}` : `1px solid ${adminTokens.border}`,
                    background: level === l.id ? `${l.color}15` : adminTokens.surface,
                    color: level === l.id ? l.color : adminTokens.black,
                    fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
                  }}>{l.label}</button>
                ))}
              </div>
            </div>
            <div>
              <CtLabel>เป้าหมาย</CtLabel>
              <select value={goal} onChange={e => setGoal(e.target.value)}
                      style={{ ...pgInputStyle, height: 34, paddingRight: 24 }}>
                {PG_GOALS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
              </select>
            </div>
          </div>

          {/* Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div>
              <CtLabel>สัปดาห์</CtLabel>
              <input type="number" value={weeks} onChange={e => setWeeks(Number(e.target.value))}
                     min="1" max="52" style={pgInputStyle}
                     onFocus={e => e.target.style.borderColor = color}
                     onBlur={e => e.target.style.borderColor = adminTokens.border}/>
            </div>
            <div>
              <CtLabel>วัน/สัปดาห์</CtLabel>
              <input type="number" value={sessions} onChange={e => setSessions(Number(e.target.value))}
                     min="1" max="7" style={pgInputStyle}
                     onFocus={e => e.target.style.borderColor = color}
                     onBlur={e => e.target.style.borderColor = adminTokens.border}/>
            </div>
            <div>
              <CtLabel>นาที/ครั้ง</CtLabel>
              <input type="number" value={mins} onChange={e => setMins(Number(e.target.value))}
                     min="10" max="180" step="5" style={pgInputStyle}
                     onFocus={e => e.target.style.borderColor = color}
                     onBlur={e => e.target.style.borderColor = adminTokens.border}/>
            </div>
          </div>

          {/* Color */}
          <div>
            <CtLabel>สีประจำโปรแกรม</CtLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6 }}>
              {CT_COLOR_PRESETS.map(c => (
                <button key={c.hex} onClick={() => setColor(c.hex)} title={c.name} style={{
                  aspectRatio: '1', borderRadius: 8, cursor: 'pointer', padding: 0,
                  background: c.hex, border: color === c.hex
                    ? `3px solid ${adminTokens.surface}` : `1.5px solid ${adminTokens.border}`,
                  boxShadow: color === c.hex ? `0 0 0 2px ${c.hex}` : 'none',
                  position: 'relative',
                }}>
                  {color === c.hex && (
                    <span style={{ position: 'absolute', inset: 0, display: 'flex',
                                   alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <PG_Icon d={pgIcons.check} size={12} stroke={3}/>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <CtLabel>ไอคอน</CtLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
              {CT_ICON_PRESETS.slice(0, 20).map(i => (
                <button key={i.id} onClick={() => setIcon(i.id)} title={i.label} style={{
                  aspectRatio: '1', borderRadius: 8, cursor: 'pointer', padding: 0,
                  background: icon === i.id ? color : adminTokens.surface,
                  color: icon === i.id ? '#fff' : adminTokens.muted,
                  border: `1.5px solid ${icon === i.id ? color : adminTokens.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <PG_Icon d={i.path} size={15}/>
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <PgToggleCard
              label="แสดงในแอป" sub="ลูกค้าเห็นและลงทะเบียนได้"
              on={visible} onToggle={() => setVisible(v => !v)} color={color}
              icon={visible ? pgIcons.eye : pgIcons.eyeOff}
            />
            <PgToggleCard
              label="Featured" sub="แสดงเด่นในหน้าแรกของแอป"
              on={featured} onToggle={() => setFeatured(f => !f)} color={adminTokens.orange}
              icon={pgIcons.star}
            />
          </div>

          {!isNew && (
            <div style={{
              padding: '12px 14px', borderRadius: 10, background: adminTokens.subtle,
              border: `1px solid ${adminTokens.border}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <PG_Icon d={pgIcons.info} size={14}/>
              <div style={{ fontSize: 11, color: adminTokens.muted, flex: 1 }}>
                ตารางรายสัปดาห์ยังไม่แก้ไขจากตัวแก้ไขนี้ — ปิดแล้วใช้{' '}
                <b>ตัวสร้างตารางสัปดาห์</b> ในหน้ารายละเอียดโปรแกรม
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: `1px solid ${adminTokens.border}`,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          {!isNew && onDelete && (
            <button onClick={onDelete} style={{
              height: 36, padding: '0 12px', borderRadius: 9, cursor: 'pointer',
              border: `1px solid ${adminTokens.destr}50`, background: adminTokens.destrSoft,
              color: adminTokens.destr, fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <PG_Icon d={pgIcons.trash} size={12}/> ลบ
            </button>
          )}
          <div style={{ flex: 1 }}/>
          <button onClick={onClose} style={{
            height: 36, padding: '0 14px', borderRadius: 9, cursor: 'pointer',
            border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
            color: adminTokens.black, fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
          }}>ยกเลิก</button>
          <button
            onClick={() => canSave && onSave({
              ...prog, name: name.trim(), subtitle, desc, color, icon, level, goal,
              weeks, sessionsPerWeek: sessions, minsPerSession: mins, visible, featured,
            })}
            disabled={!canSave}
            style={{
              height: 36, padding: '0 18px', borderRadius: 9, cursor: canSave ? 'pointer' : 'not-allowed',
              border: 0, background: canSave ? color : adminTokens.border,
              color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
              boxShadow: canSave ? `0 4px 12px ${color}60` : 'none',
              display: 'flex', alignItems: 'center', gap: 6, opacity: canSave ? 1 : 0.6,
            }}>
            <PG_Icon d={pgIcons.check} size={12} stroke={3}/>
            {isNew ? 'สร้างโปรแกรม' : 'บันทึก'}
          </button>
        </div>
      </div>
    </>
  );
};

const PgToggleCard = ({ label, sub, on, onToggle, color, icon }) => (
  <button onClick={onToggle} style={{
    padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
    background: on ? `${color}12` : adminTokens.subtle,
    border: `1.5px solid ${on ? color : adminTokens.border}`,
    display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit',
  }}>
    <div style={{
      width: 30, height: 30, borderRadius: 8,
      background: on ? color : adminTokens.border,
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <PG_Icon d={icon} size={13}/>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black }}>{label}</div>
      <div style={{ fontSize: 10, color: adminTokens.muted, marginTop: 1 }}>{sub}</div>
    </div>
    <div style={{
      width: 28, height: 16, borderRadius: 9999, padding: 2, flexShrink: 0,
      background: on ? color : adminTokens.borderStrong,
      display: 'flex', alignItems: 'center',
      justifyContent: on ? 'flex-end' : 'flex-start',
    }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff' }}/>
    </div>
  </button>
);

const pgInputStyle = {
  width: '100%', height: 38, padding: '0 12px', borderRadius: 9,
  border: `1.5px solid ${adminTokens.border}`,
  background: adminTokens.surface, outline: 'none',
  fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: adminTokens.black,
};

/* =============================================================
 *  MAIN PAGE
 * =========================================================== */
const ProgramsPage = () => {
  const [progs, setProgs] = usePG(PG_PROGRAMS);
  const [openProg, setOpenProg] = usePG(null);
  const [editProg, setEditProg] = usePG(null);
  const [query, setQuery] = usePG('');
  const [fGoal, setFGoal] = usePG('all');
  const [fLevel, setFLevel] = usePG('all');
  const [showHidden, setShowHidden] = usePG(true);

  const filtered = useMemoPG(() => {
    let list = progs;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.subtitle || '').toLowerCase().includes(q) ||
        (p.desc || '').toLowerCase().includes(q)
      );
    }
    if (fGoal !== 'all')  list = list.filter(p => p.goal === fGoal);
    if (fLevel !== 'all') list = list.filter(p => p.level === fLevel);
    if (!showHidden)      list = list.filter(p => p.visible);
    return list;
  }, [progs, query, fGoal, fLevel, showHidden]);

  const totalEnrolled = progs.reduce((s, p) => s + p.enrolled, 0);
  const totalCompleted = progs.reduce((s, p) => s + p.completed, 0);
  const avgCompletion = totalEnrolled ? Math.round(totalCompleted / totalEnrolled * 100) : 0;
  const visible = progs.filter(p => p.visible).length;
  const featured = progs.filter(p => p.featured).length;
  const avgRating = progs.reduce((s, p) => s + p.rating, 0) / progs.length;

  const save = (prog) => {
    if (prog.id) {
      setProgs(p => p.map(x => x.id === prog.id ? { ...x, ...prog } : x));
    } else {
      const id = (prog.name || 'prog').toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
      setProgs(p => [...p, { ...prog, id, enrolled: 0, completed: 0, rating: 0,
        weeks_: Array.from({ length: prog.weeks }, (_, wi) => ({ week: wi + 1,
          days: Array.from({ length: 7 }, () => pgRestDay) })) }]);
    }
    setEditProg(null);
  };
  const del = (id) => {
    if (confirm('ลบโปรแกรมนี้? สมาชิกที่ลงทะเบียนจะถูกยกเลิก')) {
      setProgs(p => p.filter(x => x.id !== id));
      setEditProg(null); setOpenProg(null);
    }
  };

  return (
    <div style={{ padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: 14,
                  maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: adminTokens.black, letterSpacing: '-.02em' }}>
            โปรแกรมฝึก
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: adminTokens.muted }}>
            โปรแกรมฝึกหลายสัปดาห์ที่ลูกค้าลงทะเบียนและติดตามความก้าวหน้า ·{' '}
            {progs.length} โปรแกรม · แสดง {visible} · Featured {featured}
          </p>
        </div>
        <button onClick={() => setEditProg({})} style={{
          height: 38, padding: '0 16px', borderRadius: 10, cursor: 'pointer',
          background: adminTokens.orange, color: '#fff', border: 0,
          fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6, boxShadow: adminTokens.shadowOrange,
        }}>
          <PG_Icon d={pgIcons.plus} size={14}/> โปรแกรมใหม่
        </button>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <PgKpi label="ลงทะเบียนทั้งหมด" value={totalEnrolled} sub="ตลอดการ" color={adminTokens.orange}
               icon={pgIcons.users}/>
        <PgKpi label="เสร็จสิ้นเฉลี่ย" value={`${avgCompletion}%`}
               sub={`${totalCompleted} คน จบ`} color={adminTokens.success} icon={pgIcons.trend}/>
        <PgKpi label="เรตติ้งเฉลี่ย" value={avgRating.toFixed(1)} unit="★"
               sub="จากผู้เรียน" color={adminTokens.info} icon={pgIcons.star}/>
        <PgKpi label="Featured" value={featured} sub={`จาก ${progs.length} โปรแกรม`}
               color={adminTokens.pink} icon={pgIcons.sparkle}/>
      </div>

      {/* Toolbar */}
      <div style={{
        background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
        borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, padding: 10,
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{
          flex: 1, minWidth: 200, height: 34,
          background: adminTokens.subtle, border: `1px solid ${adminTokens.border}`,
          borderRadius: 9, padding: '0 11px', display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <PG_Icon d={pgIcons.search} size={13}/>
          <input value={query} onChange={e => setQuery(e.target.value)}
                 placeholder="ค้นหาโปรแกรม"
                 style={{
                   flex: 1, height: 32, border: 0, background: 'transparent', outline: 'none',
                   fontFamily: 'inherit', fontSize: 13, color: adminTokens.black,
                 }}/>
        </div>

        {/* Goal filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          <PgFilterChip active={fGoal === 'all'} onClick={() => setFGoal('all')}>ทั้งหมด</PgFilterChip>
          {PG_GOALS.map(g => (
            <PgFilterChip key={g.id} active={fGoal === g.id} onClick={() => setFGoal(g.id)}
                          icon={<PG_Icon d={pgGetIcon(g.icon)} size={11}/>}>
              {g.label}
            </PgFilterChip>
          ))}
        </div>

        {/* Level filter */}
        <div style={{ display: 'flex', gap: 4, paddingLeft: 6, borderLeft: `1px solid ${adminTokens.border}` }}>
          <PgFilterChip active={fLevel === 'all'} onClick={() => setFLevel('all')}>ทุกระดับ</PgFilterChip>
          {PG_LEVELS.map(l => (
            <PgFilterChip key={l.id} active={fLevel === l.id} onClick={() => setFLevel(l.id)}
                          activeColor={l.color}>
              {l.label}
            </PgFilterChip>
          ))}
        </div>

        <button onClick={() => setShowHidden(s => !s)} style={{
          height: 30, padding: '0 10px', borderRadius: 7, cursor: 'pointer',
          border: `1px solid ${showHidden ? adminTokens.border : adminTokens.orange}`,
          background: showHidden ? adminTokens.surface : adminTokens.orangeSoft,
          color: showHidden ? adminTokens.muted : adminTokens.orange,
          fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <PG_Icon d={showHidden ? pgIcons.eye : pgIcons.eyeOff} size={11}/>
          {showHidden ? 'ทั้งหมด' : 'เปิดเท่านั้น'}
        </button>
      </div>

      {/* Programs grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {filtered.map(p => (
          <ProgramCard key={p.id} prog={p} active={openProg?.id === p.id}
                       onOpen={() => setOpenProg(p)} onEdit={() => setEditProg(p)}/>
        ))}
        {!query && fGoal === 'all' && fLevel === 'all' && (
          <button onClick={() => setEditProg({})} style={{
            background: 'transparent', border: `2px dashed ${adminTokens.border}`,
            borderRadius: adminTokens.r3, padding: 16, minHeight: 340, cursor: 'pointer',
            fontFamily: 'inherit', color: adminTokens.muted,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = adminTokens.orange; e.currentTarget.style.color = adminTokens.orange; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = adminTokens.border; e.currentTarget.style.color = adminTokens.muted; }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: adminTokens.subtle,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PG_Icon d={pgIcons.plus} size={20} stroke={2.2}/>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>สร้างโปรแกรมใหม่</div>
            <div style={{ fontSize: 11, textAlign: 'center', maxWidth: 200, lineHeight: 1.4 }}>
              ตั้งชื่อ เป้าหมาย ระยะเวลา แล้วสร้างตารางรายสัปดาห์
            </div>
          </button>
        )}
        {filtered.length === 0 && (query || fGoal !== 'all' || fLevel !== 'all') && (
          <div style={{
            gridColumn: '1 / -1', padding: 60, textAlign: 'center',
            background: adminTokens.surface, border: `1px dashed ${adminTokens.border}`,
            borderRadius: adminTokens.r3,
          }}>
            <div style={{ fontSize: 14, color: adminTokens.muted, fontWeight: 600 }}>
              ไม่พบโปรแกรมที่ตรงกับเกณฑ์
            </div>
            <button onClick={() => { setQuery(''); setFGoal('all'); setFLevel('all'); }}
                    style={{
                      marginTop: 12, height: 32, padding: '0 14px', borderRadius: 8,
                      border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
                      color: adminTokens.black, fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                      cursor: 'pointer',
                    }}>ล้างตัวกรอง</button>
          </div>
        )}
      </div>

      {openProg && <ProgramDrawer prog={openProg} onClose={() => setOpenProg(null)}
                                  onEdit={() => { setEditProg(openProg); setOpenProg(null); }}/>}
      {editProg && <ProgramEditor prog={editProg} onSave={save} onClose={() => setEditProg(null)}
                                  onDelete={editProg.id ? () => del(editProg.id) : null}/>}
    </div>
  );
};

const PgKpi = ({ label, value, unit, sub, color, icon }) => (
  <div style={{
    background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
    borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, padding: 14,
    display: 'flex', alignItems: 'center', gap: 12,
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 10, background: `${color}20`, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <PG_Icon d={icon} size={18} stroke={2.2}/>
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: adminTokens.black,
                    letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.1, display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
        {value}
        {unit && <span style={{ fontSize: 13, color }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 10, color: adminTokens.muted, marginTop: 1 }}>{sub}</div>
    </div>
  </div>
);

const PgFilterChip = ({ active, onClick, children, icon, activeColor }) => (
  <button onClick={onClick} style={{
    height: 30, padding: '0 10px', borderRadius: 7, cursor: 'pointer',
    border: `1px solid ${active ? (activeColor || adminTokens.black) : adminTokens.border}`,
    background: active ? (activeColor ? `${activeColor}15` : adminTokens.black) : adminTokens.surface,
    color: active ? (activeColor || '#fff') : adminTokens.muted,
    fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
    display: 'flex', alignItems: 'center', gap: 4,
    transition: 'all .1s',
  }}>{icon}{children}</button>
);

Object.assign(window, {
  PG_LEVELS, PG_GOALS, PG_EXERCISE_LIB, PG_EX_CATS, PG_PROGRAMS,
  PG_Icon, pgIcons, pgGetIcon, pgLevel, pgGoal, pgExercise, PG_DAY_NAMES,
  ProgramCard, PgChip, PgStat, ProgramDrawer, PgSectionLabel, PgDrawerStat,
  WorkoutDay, ProgramEditor, PgToggleCard, pgInputStyle, ProgramsPage,
  PgKpi, PgFilterChip,
});
