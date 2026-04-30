/**
 * MascotIllustration — "Leo" the MOOM lion mascot.
 *
 * Ported 1:1 from the MOOM Design System (ui_kits/member/Gamify.jsx).
 * Flat sticker-style cartoon lion with a continuous gentle bob animation.
 *
 * API preserved (do not change without updating callers):
 *   - size (number, default 80)
 *   - mood: 'cheer' | 'fire' | 'chill' | 'sleep'
 *   - className (string, optional)
 *
 * Decorative only (aria-hidden). Respects prefers-reduced-motion.
 */
import { useEffect, useState } from 'react';

interface MascotIllustrationProps {
  size?: number;
  mood?: 'cheer' | 'fire' | 'chill' | 'sleep';
  className?: string;
}

// Flat palette — kept as inline DS hex values (decorative illustration,
// intentionally outside the semantic token system, identical to DS source).
const COLORS = {
  maneOuter: '#F5A55C',
  maneInner: '#E8823B',
  face: '#F6C98A',
  faceLight: '#FBE4BD',
  pawShade: '#D9A866',
  nose: '#1F1A17',
  ink: '#3B2A1F',
  blush: '#E88A7A',
  earInner: '#E88A7A',
  flameOuter: '#F5A55C',
  flameInner: '#FFD36B',
} as const;

export function MascotIllustration({
  size = 80,
  mood = 'cheer',
  className,
}: MascotIllustrationProps) {
  const [bob, setBob] = useState(0);
  const [tilt, setTilt] = useState(0);

  useEffect(() => {
    // Respect reduced motion — skip rAF loop entirely.
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const dt = (t - t0) / 700;
      setBob(Math.sin(dt) * 2.5);
      setTilt(Math.sin(dt * 0.6) * 1.5);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const sleeping = mood === 'sleep';
  const fire = mood === 'fire';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 140"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* soft ground shadow */}
      <ellipse cx="60" cy="132" rx="30" ry="3" fill="#000" opacity="0.10" />

      <style>{`
        @keyframes mascot-flame-flicker {
          0%, 100% { transform: scale(1) rotate(-2deg); opacity: 1; }
          50% { transform: scale(1.1) rotate(2deg); opacity: 0.88; }
        }
        @keyframes mascot-tail-wag {
          0%, 100% { transform: rotate(-6deg); }
          50% { transform: rotate(8deg); }
        }
        @keyframes mascot-zzz-float {
          0% { transform: translate(0, 4px); opacity: 0; }
          30% { opacity: 0.9; }
          100% { transform: translate(4px, -8px); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mascot-flame, .mascot-tail, .mascot-zzz { animation: none !important; }
        }
      `}</style>
      <g transform={`translate(0 ${bob}) rotate(${tilt} 60 70)`}>
        {/* --- BODY (sitting) --- */}
        <g>
          <ellipse cx="60" cy="118" rx="22" ry="12" fill={COLORS.face} />
          <ellipse cx="48" cy="124" rx="7" ry="5" fill={COLORS.face} />
          <ellipse cx="72" cy="124" rx="7" ry="5" fill={COLORS.face} />
          <path
            d="M45 124 v3 M48 124 v3 M51 124 v3"
            stroke={COLORS.pawShade}
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path
            d="M69 124 v3 M72 124 v3 M75 124 v3"
            stroke={COLORS.pawShade}
            strokeWidth="1"
            strokeLinecap="round"
          />
          {/* tail (wags when not sleeping) */}
          <g
            className={sleeping ? undefined : 'mascot-tail'}
            style={
              sleeping
                ? undefined
                : {
                    transformOrigin: '82px 116px',
                    animation: 'mascot-tail-wag 2.4s ease-in-out infinite',
                  }
            }
          >
            <path
              d="M82 116 q16 -2 18 8"
              stroke={COLORS.face}
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="101" cy="126" r="4.5" fill={COLORS.maneInner} />
            <circle cx="103" cy="123" r="2.8" fill={COLORS.maneOuter} />
          </g>
        </g>

        {/* --- EARS --- */}
        <g>
          <ellipse cx="36" cy="40" rx="7" ry="8" fill={COLORS.face} />
          <ellipse cx="36" cy="41" rx="3.5" ry="4.5" fill={COLORS.earInner} opacity="0.75" />
          <ellipse cx="84" cy="40" rx="7" ry="8" fill={COLORS.face} />
          <ellipse cx="84" cy="41" rx="3.5" ry="4.5" fill={COLORS.earInner} opacity="0.75" />
        </g>

        {/* --- MANE (two-tone scalloped) --- */}
        <g>
          {Array.from({ length: 11 }).map((_, i) => {
            const a = (i / 11) * Math.PI * 2 - Math.PI / 2;
            const cx = 60 + Math.cos(a) * 34;
            const cy = 60 + Math.sin(a) * 34;
            return <circle key={`o${i}`} cx={cx} cy={cy} r="13" fill={COLORS.maneOuter} />;
          })}
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i / 10) * Math.PI * 2 - Math.PI / 2 + 0.3;
            const cx = 60 + Math.cos(a) * 28;
            const cy = 60 + Math.sin(a) * 28;
            return <circle key={`i${i}`} cx={cx} cy={cy} r="11" fill={COLORS.maneInner} />;
          })}
          <circle cx="60" cy="60" r="30" fill={COLORS.maneInner} />
        </g>

        {/* --- FACE --- */}
        <g>
          <circle cx="60" cy="62" r="24" fill={COLORS.face} />
          {/* cream forehead/muzzle stripe */}
          <path d="M60 38 L52 70 Q60 76 68 70 Z" fill={COLORS.faceLight} />

          {/* cheek blush */}
          <ellipse cx="42" cy="70" rx="5.5" ry="3.2" fill={COLORS.blush} opacity="0.7" />
          <ellipse cx="78" cy="70" rx="5.5" ry="3.2" fill={COLORS.blush} opacity="0.7" />

          {/* EYES */}
          {fire ? (
            <g fill="none" stroke={COLORS.ink} strokeWidth="2.2" strokeLinecap="round">
              <path d="M44 60 l5 -4 l5 4" />
              <path d="M66 60 l5 -4 l5 4" />
            </g>
          ) : (
            <g fill="none" stroke={COLORS.ink} strokeWidth="2.2" strokeLinecap="round">
              <path d="M44 62 q5 -5 10 0" />
              <path d="M66 62 q5 -5 10 0" />
              <path d="M54.2 61.5 l1.6 1.2" />
              <path d="M76.2 61.5 l1.6 1.2" />
            </g>
          )}

          {/* NOSE — rounded triangle */}
          <path
            d="M54 66 Q60 64 66 66 Q66 72 60 75 Q54 72 54 66 Z"
            fill={COLORS.nose}
          />
          <path
            d="M60 75 v4"
            stroke={COLORS.nose}
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />

          {/* WHISKERS */}
          <g
            fill="none"
            stroke={COLORS.nose}
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.55"
          >
            <path d="M48 74 l-10 -2" />
            <path d="M48 76 l-11 1" />
            <path d="M48 78 l-10 3.5" />
            <path d="M72 74 l10 -2" />
            <path d="M72 76 l11 1" />
            <path d="M72 78 l10 3.5" />
          </g>

          {/* MOUTH */}
          {fire ? (
            <g>
              <path d="M52 80 Q60 90 68 80 Q60 86 52 80 Z" fill={COLORS.nose} />
              <path d="M55 82 Q60 86 65 82 Q60 85 55 82 Z" fill={COLORS.blush} />
            </g>
          ) : sleeping ? (
            <path
              d="M56 81 q4 2 8 0"
              stroke={COLORS.nose}
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
          ) : (
            <g fill="none" stroke={COLORS.nose} strokeWidth="1.8" strokeLinecap="round">
              <path d="M60 79 q-3 3 -5 2" />
              <path d="M60 79 q3 3 5 2" />
            </g>
          )}
        </g>

        {/* --- FIRE: little flame above head (flickers) --- */}
        {fire && (
          <g
            transform="translate(60 16)"
            className="mascot-flame"
            style={{
              transformOrigin: '4px 13px',
              animation: 'mascot-flame-flicker 1.4s ease-in-out infinite',
            }}
          >
            <path
              d="M0 0 c-5 5 -6 9 -2 13 c3 -1 4 -4 4 -7 c1.5 3 3 5 6 6 c3 -3 1 -8 -4 -11 c-1.5 -1 -3 -1 -4 -1 z"
              fill={COLORS.flameOuter}
            />
            <path
              d="M1 3 c-2.5 3 -3 5 -1 7 c1.5 -.7 2 -2 2 -4 z"
              fill={COLORS.flameInner}
            />
          </g>
        )}

        {/* --- SLEEP: Zzz (floats up) --- */}
        {sleeping && (
          <g fill={COLORS.ink} fontFamily="system-ui" fontWeight="800">
            <text
              x="92"
              y="40"
              fontSize="11"
              opacity="0.5"
              className="mascot-zzz"
              style={{ animation: 'mascot-zzz-float 2.5s ease-out infinite' }}
            >
              z
            </text>
            <text
              x="99"
              y="30"
              fontSize="14"
              className="mascot-zzz"
              style={{ animation: 'mascot-zzz-float 2.5s ease-out 0.8s infinite' }}
            >
              Z
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}
