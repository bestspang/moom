import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, DateRangePicker, SearchBar, StatusTabs, EmptyState, type StatusTab } from '@/components/common';

const TransferSlips = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('needs_review');
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  const statusTabs: StatusTab[] = [
    { key: 'needs_review', label: t('transferSlips.needsReview'), count: 0, color: 'red' },
    { key: 'paid', label: t('transferSlips.paid'), count: 0, color: 'teal' },
    { key: 'voided', label: t('transferSlips.voided'), count: 0, color: 'gray' },
  ];

  return (
    <div>
      <PageHeader title={t('transferSlips.title')} breadcrumbs={[{ label: t('nav.finance') }, { label: t('transferSlips.title') }]} />
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <DateRangePicker startDate={dateRange.start} endDate={dateRange.end} onChange={setDateRange} />
        <SearchBar placeholder={t('transferSlips.searchPlaceholder')} value={search} onChange={setSearch} className="max-w-md" />
      </div>
      <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />
      <EmptyState message={t('common.noData')} />
    </div>
  );
};

export default TransferSlips;
