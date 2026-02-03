import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, StatusTabs, DataTable, type Column, type StatusTab } from '@/components/common';

const Locations = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('open');

  const locations = [{ id: '1', locationId: 'BR-0001', name: 'MOOM CLUB Main', phone: '099-616-3666', categories: 'Standard, Premium' }];
  const statusTabs: StatusTab[] = [{ key: 'open', label: t('rooms.open'), count: 1, color: 'teal' }, { key: 'closed', label: t('rooms.closed'), count: 0 }];

  const columns: Column<typeof locations[0]>[] = [
    { key: 'locationId', header: t('locations.id'), cell: (row) => row.locationId },
    { key: 'name', header: t('locations.locationName'), cell: (row) => row.name },
    { key: 'phone', header: t('leads.contactNumber'), cell: (row) => row.phone },
    { key: 'categories', header: t('packages.categories'), cell: (row) => row.categories },
  ];

  return (
    <div>
      <PageHeader title={t('locations.title')} breadcrumbs={[{ label: t('nav.yourGym') }, { label: t('locations.title') }]} />
      <SearchBar placeholder={t('locations.searchPlaceholder')} value={search} onChange={setSearch} className="max-w-md mb-6" />
      <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />
      <DataTable columns={columns} data={locations} rowKey={(row) => row.id} />
    </div>
  );
};

export default Locations;
