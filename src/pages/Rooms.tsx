import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, StatusTabs, DataTable, type Column, type StatusTab } from '@/components/common';
import { Button } from '@/components/ui/button';

const Rooms = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('open');

  const rooms = [{ id: '1', name: 'Main Studio', location: 'MOOM CLUB Main', categories: 'All', maxCapacity: 30, status: 'open' }];
  const statusTabs: StatusTab[] = [{ key: 'open', label: t('rooms.open'), count: 1, color: 'teal' }, { key: 'closed', label: t('rooms.closed'), count: 0 }];

  const columns: Column<typeof rooms[0]>[] = [
    { key: 'name', header: t('rooms.roomName'), cell: (row) => row.name },
    { key: 'location', header: t('lobby.location'), cell: (row) => row.location },
    { key: 'categories', header: t('rooms.categoriesAvailability'), cell: (row) => row.categories },
    { key: 'maxCapacity', header: t('rooms.maxCapacity'), cell: (row) => row.maxCapacity },
  ];

  return (
    <div>
      <PageHeader title={t('rooms.title')} breadcrumbs={[{ label: t('nav.class') }, { label: t('rooms.title') }]} actions={<Button className="bg-primary hover:bg-primary-hover">{t('rooms.createRoom')}</Button>} />
      <SearchBar placeholder={t('rooms.searchPlaceholder')} value={search} onChange={setSearch} className="max-w-md mb-6" />
      <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />
      <DataTable columns={columns} data={rooms} rowKey={(row) => row.id} />
    </div>
  );
};

export default Rooms;
