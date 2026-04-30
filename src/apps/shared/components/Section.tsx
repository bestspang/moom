import { cn } from '@/lib/utils';

interface SectionProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** DS-aligned mobile-first section wrapper.
 * Section title uses the eyebrow style (10px / 600 / uppercase / tracking 0.08em). */
export function Section({ title, action, children, className }: SectionProps) {
  return (
    <section className={cn('px-4', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-2">
          {title && <h2 className="text-eyebrow">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
