import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, StatusTabs, DataTable, type Column, type StatusTab } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocations, useLocationStats } from '@/hooks/useLocations';
import type { Tables } from '@/integrations/supabase/types';

type Location = Tables<'locations'>;

const Locations = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('open');

  const { data: locations, isLoading } = useLocations(activeTab, search);
  const { data: stats } = useLocationStats();

  const statusTabs: StatusTab[] = [
    { key: 'open', label: t('rooms.open'), count: stats?.open || 0, color: 'teal' }, 
    { key: 'closed', label: t('rooms.closed'), count: stats?.closed || 0 }
  ];

  const columns: Column<Location>[] = [
    { key: 'locationId', header: t('locations.id'), cell: (row) => row.location_id },
    { key: 'name', header: t('locations.locationName'), cell: (row) => row.name },
    { key: 'phone', header: t('leads.contactNumber'), cell: (row) => row.contact_number || '-' },
    { key: 'categories', header: t('packages.categories'), cell: (row) => row.categories?.join(', ') || '-' },
  ];

  return (
    <div>
      <PageHeader 
        title={t('locations.title')} 
        breadcrumbs={[{ label: t('nav.yourGym') }, { label: t('locations.title') }]} 
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
        />
      )}
    </div>
  );
};

export default Locations;
