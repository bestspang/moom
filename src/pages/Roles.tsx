import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, DataTable, StatusBadge, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';

const Roles = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const roles = [
    { id: '1', name: 'Owner', accessLevel: t('roles.levels.master'), accounts: 1 },
    { id: '2', name: 'Admin', accessLevel: t('roles.levels.manager'), accounts: 2 },
    { id: '3', name: 'Finance officer', accessLevel: t('roles.levels.operator'), accounts: 1 },
    { id: '4', name: 'Senior Trainer', accessLevel: t('roles.levels.operator'), accounts: 2 },
    { id: '5', name: 'Trainer', accessLevel: t('roles.levels.minimum'), accounts: 4 },
    { id: '6', name: 'Housekeeper', accessLevel: t('roles.levels.minimum'), accounts: 2 },
  ];

  const columns: Column<typeof roles[0]>[] = [
    { key: 'name', header: t('roles.roleName'), cell: (row) => row.name },
    { key: 'accessLevel', header: t('roles.accessLevel'), cell: (row) => <StatusBadge variant="default">{row.accessLevel}</StatusBadge> },
    { key: 'accounts', header: t('roles.accountsAssigned'), cell: (row) => row.accounts },
  ];

  return (
    <div>
      <PageHeader title={t('roles.title')} breadcrumbs={[{ label: t('nav.yourGym') }, { label: t('roles.title') }]} actions={<Button className="bg-primary hover:bg-primary-hover">{t('roles.createRole')}</Button>} />
      <SearchBar placeholder={t('roles.searchPlaceholder')} value={search} onChange={setSearch} className="max-w-md mb-6" />
      <DataTable columns={columns} data={roles} rowKey={(row) => row.id} />
    </div>
  );
};

export default Roles;
