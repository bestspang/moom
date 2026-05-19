/**
 * BrandMark — render the gym's logo + name from runtime BrandContext.
 *
 * Replaces hardcoded "MOOM" strings across Sidebar / Header / Auth pages so
 * that updating the Brand Kit in Settings propagates everywhere automatically.
 */
import React from 'react';
import { useBrand } from '@/contexts/BrandContext';
import { LogoMark } from '@/components/branding/LogoMark';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg';

interface BrandMarkProps {
  size?: Size;
  showName?: boolean;
  nameClassName?: string;
  className?: string;
  /** Override displayed name (e.g. "MOOM Admin" while still using gym logo) */
  nameSuffix?: string;
}

const PX: Record<Size, number> = { sm: 24, md: 32, lg: 48 };

export const BrandMark: React.FC<BrandMarkProps> = ({
  size = 'md',
  showName = true,
  nameClassName,
  className,
  nameSuffix,
}) => {
  const { brand } = useBrand();
  const px = PX[size];
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LogoMark
        letter={brand.logoLetter}
        style={brand.logoStyle}
        color={brand.primary}
        radius={brand.radius}
        size={px}
        url={brand.logoUrl}
      />
      {showName && (
        <span className={cn('font-bold tracking-tight text-foreground', nameClassName)}>
          {brand.name}
          {nameSuffix ? ` ${nameSuffix}` : ''}
        </span>
      )}
    </div>
  );
};
