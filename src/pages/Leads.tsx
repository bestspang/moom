import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, DataTable, StatusBadge, StatusTabs, type StatusTab, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, getDateLocale } from '@/lib/formatters';
import { useLeads } from '@/hooks/useLeads';
import { useLocations } from '@/hooks/useLocations';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { CreateLeadDialog } from '@/components/leads/CreateLeadDialog';
import { ImportLeadsDialog } from '@/components/leads/ImportLeadsDialog';
import { CreateMemberDialog } from '@/components/members/CreateMemberDialog';
import type { MemberWizardFormData } from '@/components/members/wizard/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserPlus, Upload, Download, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { exportLeads } from '@/lib/exportCsv';

type Lead = Tables<'leads'>;

const Leads = () => {
  const { t, language } = useLanguage();
  const locale = getDateLocale(language);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertLead, setConvertLead] = useState<Lead | null>(null);

  const { data: leads, isLoading } = useLeads(search, statusFilter);
  const { data: locations } = useLocations();
  const { data: allLeads } = useLeads(search);
  const displayLeads = leads || [];

  const locationMap = useMemo(() => {
    const map = new Map<string, string>();
    locations?.forEach(l => map.set(l.id, l.name));
    return map;
  }, [locations]);

  const tabsWithCounts: StatusTab[] = useMemo(() => {
    const all = allLeads || [];
    return [
      { key: 'all', label: t('common.all'), count: all.length, color: 'default' },
      { key: 'new', label: t('leads.statusNew'), count: all.filter(l => l.status === 'new').length, color: 'teal' },
      { key: 'contacted', label: t('leads.statusContacted'), count: all.filter(l => l.status === 'contacted').length, color: 'orange' },
      { key: 'interested', label: t('leads.statusInterested'), count: all.filter(l => l.status === 'interested').length, color: 'teal' },
      { key: 'not_interested', label: t('leads.statusNotInterested'), count: all.filter(l => l.status === 'not_interested').length, color: 'red' },
      { key: 'converted', label: t('leads.statusConverted'), count: all.filter(l => l.status === 'converted').length, color: 'teal' },
    ];
  }, [allLeads, t]);

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

  const handleConvert = (lead: Lead) => {
    if (lead.status === 'converted') {
      toast.info(t('leads.alreadyConverted'));
      return;
    }
    setConvertLead(lead);
    setConvertDialogOpen(true);
  };

  const handleExport = () => {
    if (!displayLeads.length) {
      toast.info(t('common.noData'));
      return;
    }
    exportLeads(displayLeads as any);
    toast.success(t('leads.exportSuccess'));
  };

  const convertInitialData: Partial<MemberWizardFormData> | undefined = convertLead
    ? {
        firstName: convertLead.first_name,
        lastName: convertLead.last_name || '',
        nickname: convertLead.nickname || '',
        phone: convertLead.phone || '',
        email: convertLead.email || '',
        gender: (convertLead.gender as 'male' | 'female' | 'other') || undefined,
        dateOfBirth: convertLead.date_of_birth || '',
        address: (convertLead as any).address_1 || convertLead.address || '',
        source: convertLead.source || '',
        notes: convertLead.notes || '',
      }
    : undefined;

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
    { key: 'source', header: t('leads.source'), cell: (row) => row.source ? t(`leads.sourceOptions.${row.source}` as any) || row.source : '-' },
    {
      key: 'location',
      header: t('lobby.location'),
      cell: (row) => row.register_location_id ? locationMap.get(row.register_location_id) || '-' : '-',
    },
    { key: 'timesContacted', header: t('leads.timesContacted'), cell: (row) => row.times_contacted || 0 },
    { 
      key: 'lastContacted', 
      header: t('leads.lastContacted'), 
      cell: (row) => row.last_contacted ? format(new Date(row.last_contacted), 'd MMM yyyy', { locale }) : '-' 
    },
    { 
      key: 'lastAttended', 
      header: t('leads.lastAttended'), 
      cell: (row) => row.last_attended ? format(new Date(row.last_attended), 'd MMM yyyy', { locale }) : '-' 
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleConvert(row)}
              disabled={row.status === 'converted'}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {t('leads.convertToMember')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('leads.title')}
        breadcrumbs={[{ label: t('nav.client') }, { label: t('leads.title') }]}
        actions={
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  {t('common.manage')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('leads.importCsv')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  {t('leads.exportCsv')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="bg-primary hover:bg-primary-hover" onClick={() => setCreateDialogOpen(true)}>
              {t('leads.createLead')}
            </Button>
          </div>
        }
      />

      <StatusTabs tabs={tabsWithCounts} activeTab={statusFilter} onChange={setStatusFilter} />

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
          data={displayLeads}
          rowKey={(row) => row.id}
          emptyMessage={t('common.noData')}
        />
      )}

      <CreateLeadDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <ImportLeadsDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />

      <CreateMemberDialog
        open={convertDialogOpen}
        onOpenChange={(open) => {
          setConvertDialogOpen(open);
          if (!open) setConvertLead(null);
        }}
        initialData={convertInitialData}
        convertLeadId={convertLead?.id}
      />
    </div>
  );
};

export default Leads;
