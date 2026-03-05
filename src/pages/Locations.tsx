import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, StatusTabs, DataTable, StatusBadge, ManageDropdown, type Column, type StatusTab } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useLocations, useLocationStats } from '@/hooks/useLocations';
import { CreateLocationDialog } from '@/components/locations/CreateLocationDialog';
import { EditLocationDialog } from '@/components/locations/EditLocationDialog';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Location = Tables<'locations'>;

const TEMPLATE_HEADERS = ['location_id', 'name', 'contact_number', 'categories', 'status'];

const formatOpeningHoursSummary = (hours: Record<string, { open: string; close: string }> | null | undefined): string => {
  if (!hours || Object.keys(hours).length === 0) return '-';
  const entries = Object.entries(hours);
  if (entries.length === 0) return '-';
  return `${entries.length}/7 days`;
};

const Locations = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('open');
  const [createOpen, setCreateOpen] = useState(false);
  const [editLocation, setEditLocation] = useState<Location | null>(null);

  const { data: locations, isLoading } = useLocations(activeTab, search);
  const { data: stats } = useLocationStats();

  const statusTabs: StatusTab[] = [
    { key: 'open', label: t('locations.open'), count: stats?.open || 0, color: 'teal' },
    { key: 'closed', label: t('locations.closed'), count: stats?.closed || 0 },
  ];

  const handleExport = () => {
    if (!locations?.length) { toast.info(t('common.noData')); return; }
    const csvColumns: CsvColumn<Location>[] = [
      { key: 'location_id', header: 'Location ID', accessor: (r) => r.location_id },
      { key: 'name', header: 'Name', accessor: (r) => r.name },
      { key: 'contact_number', header: 'Contact Number', accessor: (r) => r.contact_number },
      { key: 'categories', header: 'Categories', accessor: (r) => r.categories?.join(', ') },
      { key: 'status', header: 'Status', accessor: (r) => r.status },
    ];
    exportToCsv(locations, csvColumns, 'locations');
    toast.success(t('common.export'));
  };

  const handleDownloadTemplate = () => {
    const csv = TEMPLATE_HEADERS.join(',');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'locations-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloadTemplate'));
  };

  const columns: Column<Location>[] = [
    { key: 'locationId', header: t('locations.id'), cell: (row) => row.location_id },
    { key: 'name', header: t('locations.locationName'), cell: (row) => row.name },
    { key: 'phone', header: t('locations.contactNumber'), cell: (row) => row.contact_number || '-' },
    { key: 'categories', header: t('locations.categories'), cell: (row) => row.categories?.join(', ') || '-' },
    {
      key: 'openingHours',
      header: t('locations.openingHours'),
      cell: (row) => formatOpeningHoursSummary((row as any).opening_hours),
    },
    {
      key: 'status',
      header: t('locations.status'),
      cell: (row) => (
        <StatusBadge variant={row.status === 'open' ? 'active' : 'inactive'}>
          {row.status === 'open' ? t('locations.open') : t('locations.closed')}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('locations.title')}
        breadcrumbs={[{ label: t('nav.yourGym') }, { label: t('locations.title') }]}
        actions={
          <div className="flex items-center gap-2">
            <ManageDropdown
              onExport={handleExport}
              onDownloadTemplate={handleDownloadTemplate}
              exportDisabled={!locations?.length}
            />
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {t('locations.createLocation')}
            </Button>
          </div>
        }
      />

      <SearchBar
        placeholder={t('locations.searchPlaceholder')}
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
          data={locations || []}
          rowKey={(row) => row.id}
          emptyMessage={t('common.noData')}
          onRowClick={(row) => setEditLocation(row)}
        />
      )}

      <CreateLocationDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditLocationDialog
        open={!!editLocation}
        onOpenChange={(open) => { if (!open) setEditLocation(null); }}
        location={editLocation}
      />
    </div>
  );
};

export default Locations;
