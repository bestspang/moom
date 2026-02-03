import React, { useState } from 'react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, DatePicker, DataTable, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { useCheckIns, type CheckInWithRelations } from '@/hooks/useLobby';
import { CheckInDialog } from '@/components/lobby/CheckInDialog';

const Lobby = () => {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: checkInData = [], isLoading } = useCheckIns(selectedDate, search);

  const columns: Column<CheckInWithRelations>[] = [
    {
      key: 'time',
      header: t('lobby.time'),
      cell: (row) => row.check_in_time ? format(new Date(row.check_in_time), 'HH:mm') : '-',
    },
    {
      key: 'name',
      header: t('lobby.name'),
      cell: (row) => row.member ? `${row.member.first_name} ${row.member.last_name}` : '-',
    },
    {
      key: 'packageUsed',
      header: t('lobby.packageUsed'),
      cell: (row) => row.member_package?.package?.name_en || '-',
    },
    {
      key: 'usage',
      header: t('lobby.usage'),
      cell: (row) => {
        if (!row.member_package) return '-';
        const remaining = row.member_package.sessions_remaining;
        const used = row.member_package.sessions_used || 0;
        return remaining !== null ? `${used}/${used + remaining}` : t('packages.unlimited');
      },
    },
    {
      key: 'location',
      header: t('lobby.location'),
      cell: (row) => row.location?.name || '-',
    },
    {
      key: 'checkedIn',
      header: t('lobby.checkedIn'),
      cell: () => (
        <StatusBadge variant="paid">Yes</StatusBadge>
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
          <Button className="bg-primary hover:bg-primary-hover" onClick={() => setDialogOpen(true)}>
            {t('lobby.checkIn')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={checkInData}
          rowKey={(row) => row.id}
          emptyMessage={t('common.noData')}
        />
      )}

      {/* Check-in Dialog */}
      <CheckInDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

export default Lobby;
