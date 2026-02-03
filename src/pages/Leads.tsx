import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, DataTable, StatusBadge, EmptyState, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/formatters';
import { useLeads } from '@/hooks/useLeads';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Lead = Tables<'leads'>;

const Leads = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const { data: leads, isLoading } = useLeads(search);

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case 'new': return 'new';
      case 'contacted': return 'pending';
      case 'interested': return 'paid';
      case 'not_interested': return 'voided';
      case 'converted': return 'paid';
      default: return 'default';
    }
  };

  const columns: Column<Lead>[] = [
    {
      key: 'name',
      header: t('lobby.name'),
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(row.first_name, row.last_name || '')}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.first_name} {row.last_name}</span>
        </div>
      ),
    },
    { key: 'phone', header: t('leads.contactNumber'), cell: (row) => row.phone || '-' },
    { key: 'email', header: t('leads.email'), cell: (row) => row.email || '-' },
    {
      key: 'status',
      header: t('common.status'),
      cell: (row) => (
        <StatusBadge variant={getStatusVariant(row.status) as any}>
          {row.status?.replace('_', ' ') || 'new'}
        </StatusBadge>
      ),
    },
    { key: 'timesContacted', header: t('leads.timesContacted'), cell: (row) => row.times_contacted || 0 },
    { 
      key: 'lastContacted', 
      header: t('leads.lastContacted'), 
      cell: (row) => row.last_contacted ? format(new Date(row.last_contacted), 'd MMM yyyy') : '-' 
    },
    { 
      key: 'lastAttended', 
      header: t('leads.lastAttended'), 
      cell: (row) => row.last_attended ? format(new Date(row.last_attended), 'd MMM yyyy') : '-' 
    },
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

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={leads || []}
          rowKey={(row) => row.id}
          emptyMessage={t('common.noData')}
        />
      )}
    </div>
  );
};

export default Leads;
