import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterOption {
  value: string;
  label: string;
}

interface ReportFiltersProps {
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  onDateRangeChange?: (range: { start?: Date; end?: Date }) => void;
  filters?: Array<{
    id: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }>;
  className?: string;
}

export const ReportFilters = ({
  dateRange,
  onDateRangeChange,
  filters = [],
  className,
}: ReportFiltersProps) => {
  const { t } = useLanguage();

  return (
    <div className={`flex flex-wrap gap-3 mb-6 ${className || ''}`}>
      {onDateRangeChange && (
        <DateRangePicker
          startDate={dateRange?.start}
          endDate={dateRange?.end}
          onChange={onDateRangeChange}
        />
      )}
      {filters.map((filter) => (
        <Select
          key={filter.id}
          value={filter.value}
          onValueChange={filter.onChange}
        >
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
};
