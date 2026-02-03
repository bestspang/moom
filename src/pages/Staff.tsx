import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, StatusTabs, DataTable, StatusBadge, type Column, type StatusTab } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Staff = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  const staff = [
    { id: '1', name: 'Admin User', phone: '081-234-5678', email: 'admin@moomclub.com', roles: 'Admin', status: 'active' },
    { id: '2', name: 'John Trainer', phone: '089-876-5432', email: 'john@moomclub.com', roles: 'Trainer', status: 'active' },
  ];

  const statusTabs: StatusTab[] = [
    { key: 'active', label: t('common.active'), count: 10, color: 'teal' },
    { key: 'terminated', label: t('staff.terminated'), count: 0 },
  ];

  const columns: Column<typeof staff[0]>[] = [
    { key: 'name', header: t('lobby.name'), cell: (row) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{row.name.charAt(0)}</AvatarFallback></Avatar>
        <span>{row.name}</span>
      </div>
    )},
    { key: 'phone', header: t('staff.contactNumber'), cell: (row) => row.phone },
    { key: 'email', header: t('leads.email'), cell: (row) => row.email },
    { key: 'roles', header: t('nav.roles'), cell: (row) => <StatusBadge variant="default">{row.roles}</StatusBadge> },
  ];

  return (
    <div>
      <PageHeader title={t('staff.title')} breadcrumbs={[{ label: t('nav.yourGym') }, { label: t('staff.title') }]} actions={<Button className="bg-primary hover:bg-primary-hover">{t('staff.createStaff')}</Button>} />
      <SearchBar placeholder={t('staff.searchPlaceholder')} value={search} onChange={setSearch} className="max-w-md mb-6" />
      <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />
      <DataTable columns={columns} data={staff} rowKey={(row) => row.id} />
    </div>
  );
};

export default Staff;
