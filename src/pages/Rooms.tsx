import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, StatusTabs, DataTable, type Column, type StatusTab } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRooms, useRoomStats } from '@/hooks/useRooms';

const Rooms = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('open');

  const { data: rooms, isLoading } = useRooms(activeTab, search);
  const { data: stats } = useRoomStats();

  const statusTabs: StatusTab[] = [
    { key: 'open', label: t('rooms.open'), count: stats?.open || 0, color: 'teal' }, 
    { key: 'closed', label: t('rooms.closed'), count: stats?.closed || 0 }
  ];

  const columns: Column<any>[] = [
    { key: 'name', header: t('rooms.roomName'), cell: (row) => row.name },
    { key: 'location', header: t('lobby.location'), cell: (row) => row.location?.name || '-' },
    { key: 'categories', header: t('rooms.categoriesAvailability'), cell: (row) => row.categories?.join(', ') || 'All' },
    { key: 'maxCapacity', header: t('rooms.maxCapacity'), cell: (row) => row.max_capacity || 20 },
  ];

  return (
    <div>
      <PageHeader 
        title={t('rooms.title')} 
        breadcrumbs={[{ label: t('nav.class') }, { label: t('rooms.title') }]} 
        actions={
          <Button className="bg-primary hover:bg-primary-hover">
            {t('rooms.createRoom')}
          </Button>
        } 
      />
      
      <SearchBar 
        placeholder={t('rooms.searchPlaceholder')} 
        value={search} 
        onChange={setSearch} 
        className="max-w-md mb-6" 
      />
      
      <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={rooms || []} 
          rowKey={(row) => row.id}
          emptyMessage={t('common.noData')}
        />
      )}
    </div>
  );
};

export default Rooms;
