import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, StatusTabs, EmptyState, type StatusTab } from '@/components/common';
import { Button } from '@/components/ui/button';

const Announcements = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  const statusTabs: StatusTab[] = [
    { key: 'active', label: t('common.active'), count: 0, color: 'teal' },
    { key: 'scheduled', label: t('packages.scheduled'), count: 0 },
    { key: 'completed', label: t('announcements.completed'), count: 0 },
  ];

  return (
    <div>
      <PageHeader title={t('announcements.title')} breadcrumbs={[{ label: t('nav.yourGym') }, { label: t('announcements.title') }]} actions={<Button className="bg-primary hover:bg-primary-hover">{t('common.create')}</Button>} />
      <SearchBar placeholder={t('announcements.searchPlaceholder')} value={search} onChange={setSearch} className="max-w-md mb-6" />
      <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />
      <EmptyState message={t('common.noData')} />
    </div>
  );
};

export default Announcements;
