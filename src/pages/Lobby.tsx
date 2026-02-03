import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, DatePicker, DataTable, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common';

interface CheckInRecord {
  id: string;
  time: string;
  name: string;
  packageUsed: string;
  usage: string;
  location: string;
  checkedIn: boolean;
}

const Lobby = () => {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [search, setSearch] = useState('');

  // Sample data - empty for now
  const checkInData: CheckInRecord[] = [];

  const columns: Column<CheckInRecord>[] = [
    { key: 'time', header: t('lobby.time'), cell: (row) => row.time },
    { key: 'name', header: t('lobby.name'), cell: (row) => row.name },
    { key: 'packageUsed', header: t('lobby.packageUsed'), cell: (row) => row.packageUsed },
    { key: 'usage', header: t('lobby.usage'), cell: (row) => row.usage },
    { key: 'location', header: t('lobby.location'), cell: (row) => row.location },
    {
      key: 'checkedIn',
      header: t('lobby.checkedIn'),
      cell: (row) => (
        <StatusBadge variant={row.checkedIn ? 'paid' : 'pending'}>
          {row.checkedIn ? 'Yes' : 'No'}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('lobby.title')}
        breadcrumbs={[{ label: t('lobby.title') }]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <DatePicker
          date={selectedDate}
          onChange={setSelectedDate}
          showNavigation={false}
        />
        <div className="flex items-center gap-4">
          <SearchBar
            placeholder={t('lobby.searchName')}
            value={search}
            onChange={setSearch}
            className="w-64"
          />
          <Button className="bg-primary hover:bg-primary-hover">
            {t('lobby.checkIn')}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={checkInData}
        rowKey={(row) => row.id}
        emptyMessage={t('common.noData')}
      />
    </div>
  );
};

export default Lobby;
