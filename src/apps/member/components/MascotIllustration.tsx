/**
 * MascotIllustration — "Moomu" mascot SVG.
 *
 * Per MOOM Design System (member-fun.png mockup):
 * Moomu is a soft orange BLOB / droplet shape (NOT a lion). Round body
 * with a small pointed crown at the top, friendly dot eyes, tiny smile,
 * rosy cheeks. No mane, no ears. Decorative only.
 *
 * Moods: cheer (default smile) / fire (determined ^^) / chill (relaxed) / sleep (closed eyes).
 */

interface MascotIllustrationProps {
  size?: number;
  mood?: 'cheer' | 'fire' | 'chill' | 'sleep';
  className?: string;
}

export function MascotIllustration({ size = 80, mood = 'cheer', className }: MascotIllustrationProps) {
  const isFire = mood === 'fire';
  const isSleep = mood === 'sleep';
  const isChill = mood === 'chill';

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
        {/* body — warm MOOM orange, top-left highlight */}
        <radialGradient id="moomu-body" cx="0.4" cy="0.32" r="0.85">
          <stop offset="0" stopColor="hsl(32 100% 68%)" />
          <stop offset="0.55" stopColor="hsl(28 95% 58%)" />
          <stop offset="1" stopColor="hsl(22 90% 48%)" />
        </radialGradient>
        {/* shine */}
        <radialGradient id="moomu-shine" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="white" stopOpacity="0.55" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        {/* cheek blush */}
        <radialGradient id="moomu-cheek" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="hsl(0 80% 65%)" stopOpacity="0.6" />
          <stop offset="1" stopColor="hsl(0 80% 65%)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* fire aura ring on 'fire' mood */}
      {isFire && (
        <circle cx="48" cy="52" r="44" fill="hsl(20 95% 60%)" opacity="0.16" />
      )}

      {/* Moomu body — droplet/blob: round bottom with a soft pointed crown at top. */}
      <path
        d="
          M48 8
          C 42 10, 38 18, 36 26
          C 22 30, 14 44, 14 58
          C 14 76, 30 88, 48 88
          C 66 88, 82 76, 82 58
          C 82 44, 74 30, 60 26
          C 58 18, 54 10, 48 8 Z
        "
        fill="url(#moomu-body)"
      />

      {/* top-left highlight */}
      <ellipse cx="36" cy="38" rx="12" ry="9" fill="url(#moomu-shine)" />

      {/* eyes */}
      {isSleep ? (
        <>
          <path d="M34 54 q5 -4 10 0" stroke="hsl(220 25% 15%)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M52 54 q5 -4 10 0" stroke="hsl(220 25% 15%)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </>
      ) : isFire ? (
        // determined ^ ^
        <>
          <path d="M34 56 l5 -5 l5 5" stroke="hsl(220 25% 15%)" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M52 56 l5 -5 l5 5" stroke="hsl(220 25% 15%)" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <ellipse cx="39" cy="54" rx="3" ry="3.6" fill="hsl(220 25% 15%)" />
          <ellipse cx="57" cy="54" rx="3" ry="3.6" fill="hsl(220 25% 15%)" />
          <circle cx="40" cy="52.5" r="1" fill="white" />
          <circle cx="58" cy="52.5" r="1" fill="white" />
        </>
      )}

      {/* cheeks */}
      <circle cx="30" cy="64" r="4.5" fill="url(#moomu-cheek)" />
      <circle cx="66" cy="64" r="4.5" fill="url(#moomu-cheek)" />

      {/* mouth */}
      {isFire ? (
        <ellipse cx="48" cy="68" rx="3.5" ry="2.5" fill="hsl(220 25% 15%)" />
      ) : isChill ? (
        <path d="M44 67 q4 2 8 0" stroke="hsl(220 25% 15%)" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M43 66 q5 4 10 0" stroke="hsl(220 25% 15%)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}
