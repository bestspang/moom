/**
 * MascotIllustration — "Moomu" decorative SVG character
 * Pure SVG (no image asset), 4 moods: cheer / fire / chill / sleep
 * Uses semantic design tokens via CSS vars.
 *
 * Decorative only — does not represent live data.
 */

interface MascotIllustrationProps {
  size?: number;
  mood?: 'cheer' | 'fire' | 'chill' | 'sleep';
  className?: string;
}

export function MascotIllustration({ size = 64, mood = 'cheer', className }: MascotIllustrationProps) {
  // body/eye/cheek positions vary slightly by mood
  const isFire = mood === 'fire';
  const isSleep = mood === 'sleep';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mascot-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="hsl(var(--primary))" />
          <stop offset="1" stopColor="hsl(var(--primary-hover))" />
        </linearGradient>
        <radialGradient id="mascot-cheek" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="hsl(0 80% 70%)" stopOpacity="0.65" />
          <stop offset="1" stopColor="hsl(0 80% 70%)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* fire aura behind body */}
      {isFire && (
        <g opacity="0.85">
          <path
            d="M32 4c-3 5-8 7-8 14 0 4 3 6 3 9-3-1-5-3-5-3 0 5 4 9 10 9s10-4 10-9c0 0-2 2-5 3 0-3 3-5 3-9 0-7-5-9-8-14z"
            fill="hsl(var(--momentum-flame-glow))"
            transform="translate(0 -2) scale(1.05) translate(-1.6 -1)"
          />
        </g>
      )}

      {/* body */}
      <ellipse cx="32" cy="38" rx="22" ry="20" fill="url(#mascot-body)" />

      {/* belly */}
      <ellipse cx="32" cy="42" rx="14" ry="11" fill="hsl(30 30% 96%)" opacity="0.9" />

      {/* ears */}
      <circle cx="14" cy="22" r="6" fill="url(#mascot-body)" />
      <circle cx="50" cy="22" r="6" fill="url(#mascot-body)" />
      <circle cx="14" cy="22" r="2.5" fill="hsl(0 60% 65%)" opacity="0.7" />
      <circle cx="50" cy="22" r="2.5" fill="hsl(0 60% 65%)" opacity="0.7" />

      {/* eyes */}
      {isSleep ? (
        <>
          <path d="M22 32q3 -3 6 0" stroke="hsl(220 20% 15%)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M36 32q3 -3 6 0" stroke="hsl(220 20% 15%)" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="25" cy="32" rx="2.2" ry="2.8" fill="hsl(220 20% 15%)" />
          <ellipse cx="39" cy="32" rx="2.2" ry="2.8" fill="hsl(220 20% 15%)" />
          {/* sparkle */}
          <circle cx="25.7" cy="31" r="0.8" fill="white" />
          <circle cx="39.7" cy="31" r="0.8" fill="white" />
        </>
      )}

      {/* cheeks */}
      <circle cx="20" cy="38" r="3.2" fill="url(#mascot-cheek)" />
      <circle cx="44" cy="38" r="3.2" fill="url(#mascot-cheek)" />

      {/* mouth */}
      {isFire ? (
        <path d="M28 41q4 4 8 0" stroke="hsl(220 20% 15%)" strokeWidth="2" fill="hsl(0 70% 50%)" strokeLinecap="round" strokeLinejoin="round" />
      ) : isSleep ? (
        <circle cx="32" cy="42" r="1.5" fill="hsl(220 20% 15%)" />
      ) : (
        <path d="M28 40q4 3 8 0" stroke="hsl(220 20% 15%)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}
