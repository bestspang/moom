import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, DateRangePicker, DataTable, EmptyState, type Column } from '@/components/common';

const ActivityLog = () => {
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({ start: new Date(), end: new Date() });

  return (
    <div>
      <PageHeader title={t('activityLog.title')} breadcrumbs={[{ label: t('nav.yourGym') }, { label: t('activityLog.title') }]} />
      <div className="mb-6"><DateRangePicker startDate={dateRange.start} endDate={dateRange.end} onChange={setDateRange} /></div>
      <EmptyState message={t('common.noData')} />
    </div>
  );
};

export default ActivityLog;
