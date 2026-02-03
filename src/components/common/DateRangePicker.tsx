import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDateLocale } from '@/lib/formatters';
import type { DateRange } from 'react-day-picker';

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onChange: (range: { start?: Date; end?: Date }) => void;
  className?: string;
}

export const DateRangePicker = ({
  startDate,
  endDate,
  onChange,
  className,
}: DateRangePickerProps) => {
  const { t, language } = useLanguage();
  const locale = getDateLocale(language);

  const [range, setRange] = React.useState<DateRange | undefined>({
    from: startDate,
    to: endDate,
  });

  const handleSelect = (newRange: DateRange | undefined) => {
    setRange(newRange);
    onChange({ start: newRange?.from, end: newRange?.to });
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start text-left font-normal min-w-[280px]',
              !range && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {range?.from ? (
              range.to ? (
                <>
                  {format(range.from, 'd MMM yyyy', { locale }).toUpperCase()} -{' '}
                  {format(range.to, 'd MMM yyyy', { locale }).toUpperCase()}
                </>
              ) : (
                format(range.from, 'd MMM yyyy', { locale }).toUpperCase()
              )
            ) : (
              t('dateTime.pickDateRange')
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={range?.from}
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={locale}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
