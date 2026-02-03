import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, StatusTabs, DataTable, StatusBadge, type Column, type StatusTab } from '@/components/common';
import { Button } from '@/components/ui/button';

const Classes = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const classes = [
    { id: '1', name: 'Yoga Flow', type: 'class', categories: 'Group Class', level: 'All levels', duration: 60, dateModified: '3 FEB 2026' },
    { id: '2', name: 'HIIT Training', type: 'class', categories: 'Group Class', level: 'Intermediate', duration: 45, dateModified: '2 FEB 2026' },
  ];

  const statusTabs: StatusTab[] = [
    { key: 'all', label: t('classes.allClasses'), count: 8, color: 'teal' },
    { key: 'drafts', label: t('packages.drafts'), count: 0 },
    { key: 'archive', label: t('packages.archive'), count: 0 },
  ];

  const columns: Column<typeof classes[0]>[] = [
    { key: 'name', header: t('classes.className'), cell: (row) => row.name },
    { key: 'type', header: t('packages.type'), cell: (row) => <StatusBadge variant="default">{row.type}</StatusBadge> },
    { key: 'categories', header: t('packages.categories'), cell: (row) => row.categories },
    { key: 'level', header: t('classes.level'), cell: (row) => row.level },
    { key: 'duration', header: t('classes.duration'), cell: (row) => row.duration },
    { key: 'dateModified', header: t('classes.dateModified'), cell: (row) => row.dateModified },
  ];

  return (
    <div>
      <PageHeader title={t('classes.title')} breadcrumbs={[{ label: t('nav.class') }, { label: t('classes.title') }]} actions={<Button className="bg-primary hover:bg-primary-hover">{t('classes.createClass')}</Button>} />
      <SearchBar placeholder={t('classes.searchPlaceholder')} value={search} onChange={setSearch} className="max-w-md mb-6" />
      <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />
      <DataTable columns={columns} data={classes} rowKey={(row) => row.id} />
    </div>
  );
};

export default Classes;
