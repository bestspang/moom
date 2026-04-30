import React, { useState } from 'react';
import { format } from 'date-fns';
import { usePermissions } from '@/hooks/usePermissions';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, DatePicker, DataTable, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { useCheckIns, type CheckInWithRelations } from '@/hooks/useLobby';
import { CheckInDialog } from '@/components/lobby/CheckInDialog';
import { CheckInQRCodeDialog } from '@/components/lobby/CheckInQRCodeDialog';
import { QrCode, Plus } from 'lucide-react';
import { useCommandListener } from '@/lib/commandEvents';

const Lobby = () => {
  const { t } = useLanguage();
  const { can } = usePermissions();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  const { data: checkInData = [], isLoading } = useCheckIns(selectedDate, search);

  useCommandListener('open-checkin', React.useCallback(() => setDialogOpen(true), []));

  const methodVariant = (method: string | null | undefined) => {
    switch (method) {
      case 'qr': return 'active' as const;
      case 'liff': return 'new' as const;
      default: return 'pending' as const;
    }
  };

  const methodLabel = (method: string | null | undefined) => {
    switch (method) {
      case 'qr': return 'QR';
      case 'liff': return 'LIFF';
      default: return t('lobby.manual');
    }
  };

  const columns: Column<CheckInWithRelations>[] = [
    {
      key: 'time',
      header: t('lobby.time'),
      cell: (row) => row.check_in_time ? format(new Date(row.check_in_time), 'HH:mm') : '-',
    },
    {
      key: 'name',
      header: t('common.name'),
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
      key: 'checkinMethod',
      header: t('lobby.checkinMethod'),
      cell: (row) => {
        const method = (row as any).checkin_method;
        return <StatusBadge variant={methodVariant(method)}>{methodLabel(method)}</StatusBadge>;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('lobby.title')}
        breadcrumbs={[{ label: t('lobby.title') }]}
      />

      {/* DS toolbar card — date + search + actions */}
      <div className="mb-6 rounded-xl border border-border bg-card shadow-sm p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <DatePicker
          date={selectedDate}
          onChange={setSelectedDate}
          showNavigation={false}
        />
        <SearchBar
          placeholder={t('lobby.searchPlaceholder')}
          value={search}
          onChange={setSearch}
          className="flex-1 min-w-[200px] max-w-md"
        />
        {can('lobby', 'write') && (
          <div className="flex items-center gap-2 sm:ml-auto">
            <Button variant="outline" size="sm" onClick={() => setQrDialogOpen(true)}>
              <QrCode className="h-4 w-4 mr-1" />
              {t('lobby.qrCode')}
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary-hover" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {t('lobby.checkIn')}
            </Button>
          </div>
        )}
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
          emptyMessage={t('lobby.noCheckins')}
        />
      )}

      <CheckInDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <CheckInQRCodeDialog open={qrDialogOpen} onOpenChange={setQrDialogOpen} />
    </div>
  );
};

export default Lobby;
