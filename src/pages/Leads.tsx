import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { PageHeader, SearchBar, DataTable, StatusBadge, StatusTabs, type StatusTab, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, getDateLocale } from '@/lib/formatters';
import { useLeads, type LeadWithLocation } from '@/hooks/useLeads';
import { format } from 'date-fns';
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
import { MoreHorizontal, UserPlus, Upload, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { exportLeads } from '@/lib/exportCsv';

type Lead = LeadWithLocation;

const Leads = () => {
  const { t, language } = useLanguage();
  const locale = getDateLocale(language);
  const { can } = usePermissions();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertLead, setConvertLead] = useState<Lead | null>(null);

  const { data: leads, isLoading } = useLeads(search, statusFilter);
  const { data: allLeads } = useLeads(search);
  const displayLeads = leads || [];

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
      case 'interested': return 'active';
      case 'not_interested': return 'inactive';
      case 'converted': return 'active';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'new': return t('leads.statusNew');
      case 'contacted': return t('leads.statusContacted');
      case 'interested': return t('leads.statusInterested');
      case 'not_interested': return t('leads.statusNotInterested');
      case 'converted': return t('leads.statusConverted');
      default: return t('leads.statusNew');
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
      header: t('common.name'),
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
    { key: 'phone', header: t('common.phone'), cell: (row) => row.phone || '-' },
    { key: 'email', header: t('common.email'), cell: (row) => row.email || '-' },
    {
      key: 'status',
      header: t('common.status'),
      cell: (row) => (
        <StatusBadge variant={getStatusVariant(row.status) as any}>
          {getStatusLabel(row.status)}
        </StatusBadge>
      ),
    },
    { key: 'source', header: t('leads.source'), cell: (row) => row.source ? t(`leads.sourceOptions.${row.source}` as any) || row.source : '-' },
    {
      key: 'location',
      header: t('lobby.location'),
      cell: (row) => row.register_location?.name || '-',
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
      cell: (row) => {
        if (!can('leads', 'write')) return null;
        return (
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
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('leads.title')}
        breadcrumbs={[{ label: t('nav.people'), href: '/members' }, { label: t('leads.title') }]}
        actions={
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
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
                <DropdownMenuItem onClick={() => {
                  const headers = ['first_name','last_name','nickname','gender','date_of_birth','phone','email','address_1','address_2','subdistrict','district','province','postal_code','emergency_first_name','emergency_last_name','emergency_phone','emergency_relationship','has_medical_conditions','medical_notes','allow_physical_contact','source','status','temperature','notes','internal_notes','register_location_id'];
                  const csv = headers.map(h => `"${h}"`).join(',') + '\n';
                  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'leads-template.csv';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}>
                  <FileText className="mr-2 h-4 w-4" />
                  {t('common.downloadTemplate')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="bg-primary hover:bg-primary-hover" onClick={() => setCreateDialogOpen(true)}>
              {t('leads.createLead')}
            </Button>
          </div>
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

      <StatusTabs tabs={tabsWithCounts} activeTab={statusFilter} onChange={setStatusFilter} />

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
          emptyMessage={t('leads.searchPlaceholder')}
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
