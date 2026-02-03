import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, DataTable, StatusBadge, EmptyState, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/formatters';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  status: string;
  timesContacted: number;
  lastContacted: string | null;
  lastAttended: string | null;
}

const Leads = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  // Sample data - empty for now
  const leads: Lead[] = [];

  const columns: Column<Lead>[] = [
    {
      key: 'name',
      header: t('lobby.name'),
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(row.firstName, row.lastName)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.firstName} {row.lastName}</span>
        </div>
      ),
    },
    { key: 'phone', header: t('leads.contactNumber'), cell: (row) => row.phone },
    { key: 'email', header: t('leads.email'), cell: (row) => row.email },
    {
      key: 'status',
      header: t('common.status'),
      cell: (row) => <StatusBadge variant="pending">{row.status}</StatusBadge>,
    },
    { key: 'timesContacted', header: t('leads.timesContacted'), cell: (row) => row.timesContacted },
    { key: 'lastContacted', header: t('leads.lastContacted'), cell: (row) => row.lastContacted || '-' },
    { key: 'lastAttended', header: t('leads.lastAttended'), cell: (row) => row.lastAttended || '-' },
  ];

  return (
    <div>
      <PageHeader
        title={t('leads.title')}
        breadcrumbs={[{ label: t('nav.client') }, { label: t('leads.title') }]}
        actions={
          <Button className="bg-primary hover:bg-primary-hover">
            {t('leads.createLead')}
          </Button>
        }
      />

      <div className="mb-6">
        <SearchBar
          placeholder={t('leads.searchPlaceholder')}
          value={search}
          onChange={setSearch}
          className="max-w-md"
        />
      </div>

      <DataTable
        columns={columns}
        data={leads}
        rowKey={(row) => row.id}
        emptyMessage={t('common.noData')}
      />
    </div>
  );
};

export default Leads;
