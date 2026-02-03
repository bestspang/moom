import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, StatCard, DateRangePicker, SearchBar, EmptyState } from '@/components/common';
import { formatCurrency } from '@/lib/formatters';

const Finance = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  return (
    <div>
      <PageHeader title={t('finance.title')} breadcrumbs={[{ label: t('nav.finance') }, { label: t('finance.title') }]} />
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <DateRangePicker startDate={dateRange.start} endDate={dateRange.end} onChange={setDateRange} />
        <SearchBar placeholder={t('finance.searchPlaceholder')} value={search} onChange={setSearch} className="max-w-md" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title={t('finance.transactions')} value={43} color="blue" />
        <StatCard title={t('finance.totalSales')} value={formatCurrency(111520)} color="magenta" />
        <StatCard title={t('finance.netIncome')} value={formatCurrency(104224)} color="orange" />
        <StatCard title={t('finance.refundsGiven')} value={formatCurrency(0)} color="gray" />
      </div>
      <EmptyState message={t('common.noData')} />
    </div>
  );
};

export default Finance;
