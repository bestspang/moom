/**
 * MascotIllustration — "Moomu" lion mascot SVG.
 *
 * Pure SVG (no asset). 4 moods: cheer / fire / chill / sleep.
 * Refresh per V2 mockup: friendly cartoon lion (round head, orange mane,
 * small ears, smiling face). Decorative only.
 */

interface MascotIllustrationProps {
  size?: number;
  mood?: 'cheer' | 'fire' | 'chill' | 'sleep';
  className?: string;
}

export function MascotIllustration({ size = 80, mood = 'cheer', className }: MascotIllustrationProps) {
  const isFire = mood === 'fire';
  const isSleep = mood === 'sleep';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* mane — warm orange/amber */}
        <radialGradient id="mascot-mane" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="hsl(32 95% 65%)" />
          <stop offset="0.7" stopColor="hsl(28 90% 55%)" />
          <stop offset="1" stopColor="hsl(22 85% 45%)" />
        </radialGradient>
        {/* face — light cream */}
        <radialGradient id="mascot-face" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="hsl(38 90% 92%)" />
          <stop offset="1" stopColor="hsl(34 80% 80%)" />
        </radialGradient>
        <radialGradient id="mascot-cheek" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="hsl(0 80% 70%)" stopOpacity="0.55" />
          <stop offset="1" stopColor="hsl(0 80% 70%)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* fire aura behind mane */}
      {isFire && (
        <g opacity="0.85">
          <circle cx="48" cy="48" r="44" fill="hsl(20 95% 60%)" opacity="0.18" />
          <path
            d="M48 6c-4 7-10 10-10 18 0 5 3 8 3 11-3-1-5-3-5-3 0 6 5 11 12 11s12-5 12-11c0 0-2 2-5 3 0-3 3-6 3-11 0-8-6-11-10-18z"
            fill="hsl(20 95% 60%)"
            opacity="0.4"
          />
        </g>
      )}

      {/* mane (big fluffy ring with bumps) */}
      <g>
        {/* outer mane bumps — 12 around */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * Math.PI * 2) / 12;
          const cx = 48 + Math.cos(angle) * 32;
          const cy = 50 + Math.sin(angle) * 32;
          return <circle key={i} cx={cx} cy={cy} r="11" fill="url(#mascot-mane)" />;
        })}
        {/* mane base */}
        <circle cx="48" cy="50" r="32" fill="url(#mascot-mane)" />
      </g>

      {/* ears */}
      <circle cx="26" cy="32" r="7" fill="url(#mascot-mane)" />
      <circle cx="70" cy="32" r="7" fill="url(#mascot-mane)" />
      <circle cx="26" cy="32" r="3" fill="hsl(0 60% 55%)" opacity="0.6" />
      <circle cx="70" cy="32" r="3" fill="hsl(0 60% 55%)" opacity="0.6" />

      {/* face */}
      <ellipse cx="48" cy="52" rx="22" ry="20" fill="url(#mascot-face)" />

      {/* muzzle */}
      <ellipse cx="48" cy="60" rx="11" ry="8" fill="hsl(38 70% 96%)" />

      {/* eyes */}
      {isSleep ? (
        <>
          <path d="M37 47q4 -3 8 0" stroke="hsl(220 25% 18%)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M51 47q4 -3 8 0" stroke="hsl(220 25% 18%)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      ) : isFire ? (
        <>
          <path d="M37 47q4 -3 8 0" stroke="hsl(220 25% 18%)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M51 47q4 -3 8 0" stroke="hsl(220 25% 18%)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="41" cy="48" rx="2.6" ry="3.2" fill="hsl(220 25% 18%)" />
          <ellipse cx="55" cy="48" rx="2.6" ry="3.2" fill="hsl(220 25% 18%)" />
          <circle cx="41.8" cy="47" r="0.9" fill="white" />
          <circle cx="55.8" cy="47" r="0.9" fill="white" />
        </>
      )}

      {/* nose */}
      <path d="M46 56 L50 56 L48 58.5 Z" fill="hsl(220 25% 18%)" />

      {/* mouth */}
      <path
        d="M48 58.5 V61 M44 63 q4 3 8 0"
        stroke="hsl(220 25% 18%)"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />

      {/* cheeks */}
      <circle cx="34" cy="56" r="3.5" fill="url(#mascot-cheek)" />
      <circle cx="62" cy="56" r="3.5" fill="url(#mascot-cheek)" />
    </svg>
  );
}
