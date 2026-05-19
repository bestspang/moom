import React from 'react';
import { stripHsl, type BrandKit } from './brandDefaults';

interface LogoMarkProps {
  brand: BrandKit;
  size?: number;
  inverse?: boolean;
}

/**
 * LogoMark — square/circle/wordmark logo rendered from the brand kit.
 */
export const LogoMark: React.FC<LogoMarkProps> = ({ brand, size = 56, inverse }) => {
  const bg = inverse ? brand.surface : brand.primary;
  const fg = inverse ? brand.primary : brand.surface;

  if (brand.logoStyle === 'wordmark') {
    return (
      <div
        style={{
          fontFamily: `"${brand.font}", sans-serif`,
          fontWeight: brand.fontWeight,
          fontSize: size * 0.42,
          letterSpacing: '-0.02em',
          color: bg,
          lineHeight: 1,
        }}
      >
        {brand.name}
      </div>
    );
  }

  const isCircle = brand.logoStyle === 'circle';
  const radius = isCircle ? '50%' : `${brand.radius}px`;

  if (brand.logoUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: bg,
          borderRadius: radius,
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={brand.logoUrl}
          alt={brand.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        borderRadius: radius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: `"${brand.font}", sans-serif`,
        fontWeight: brand.fontWeight,
        fontSize: size * 0.5,
        letterSpacing: '-0.02em',
        flexShrink: 0,
      }}
    >
      {brand.logoLetter || brand.name.slice(0, 1)}
    </div>
  );
};

/** Tiny photo preview block — uses photoStyle filter over a gradient placeholder. */
export const PhotoBlock: React.FC<{ brand: BrandKit; w?: number; h?: number }> = ({
  brand,
  w = 100,
  h = 64,
}) => {
  const filterMap: Record<BrandKit['photoStyle'], string> = {
    warm: 'saturate(1.1) hue-rotate(-5deg) brightness(1.02)',
    cool: 'saturate(.9) hue-rotate(15deg) brightness(.98)',
    mono: 'saturate(0) contrast(1.1)',
    vibrant: 'saturate(1.4) contrast(1.05)',
  };
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 8,
        background: brand.photoUrl
          ? `url(${brand.photoUrl}) center/cover no-repeat`
          : `linear-gradient(135deg, ${brand.primary}, ${brand.accent})`,
        filter: filterMap[brand.photoStyle],
      }}
    />
  );
};

/** Strip helper re-exported for preview surfaces that build inline styles. */
export { stripHsl };
