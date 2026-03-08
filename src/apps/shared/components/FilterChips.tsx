import { cn } from '@/lib/utils';

interface FilterChipsProps<T extends string> {
  options: { value: T; label: string }[];
  selected: T;
  onChange: (value: T) => void;
  className?: string;
}

export function FilterChips<T extends string>({ options, selected, onChange, className }: FilterChipsProps<T>) {
  return (
    <div className={cn('relative', className)}>
      <div
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
        style={{ maskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent)' }}
      >
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
              selected === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
        <div className="flex-shrink-0 w-6" aria-hidden />
      </div>
    </div>
  );
}
