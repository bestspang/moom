import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
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

interface DatePickerProps {
  date: Date;
  onChange: (date: Date) => void;
  showNavigation?: boolean;
  className?: string;
}

export const DatePicker = ({
  date,
  onChange,
  showNavigation = true,
  className,
}: DatePickerProps) => {
  const { t, language } = useLanguage();
  const locale = getDateLocale(language);

  const goToPreviousDay = () => {
    const prevDay = new Date(date);
    prevDay.setDate(prevDay.getDate() - 1);
    onChange(prevDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    onChange(nextDay);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showNavigation && (
        <Button variant="outline" size="icon" onClick={goToPreviousDay}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start text-left font-normal min-w-[200px]',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'EEE, d MMM yyyy', { locale }).toUpperCase() : t('dateTime.pickDate')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && onChange(d)}
            initialFocus
            locale={locale}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {showNavigation && (
        <Button variant="outline" size="icon" onClick={goToNextDay}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
