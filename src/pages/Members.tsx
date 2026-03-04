import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Upload, Edit, MoreVertical, FileText, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, StatusTabs, DataTable, StatusBadge, type Column, type StatusTab } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getInitials } from '@/lib/formatters';
import { exportMembers, type ExportableMember } from '@/lib/exportCsv';
import { useMembers, useMemberStats } from '@/hooks/useMembers';
import { useMembersEnrichment } from '@/hooks/useMembersEnriched';
import { CreateMemberDialog } from '@/components/members/CreateMemberDialog';
import { EditMemberDialog } from '@/components/members/EditMemberDialog';
import { ImportMembersDialog } from '@/components/members/ImportMembersDialog';
import type { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';

type Member = Database['public']['Tables']['members']['Row'];
type MemberStatus = Database['public']['Enums']['member_status'];

const Members = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<MemberStatus | 'all'>('active');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const { data: membersData, isLoading: membersLoading } = useMembers({
    status: activeTab,
    search,
    page,
    perPage: 50,
  });
  const { data: stats, isLoading: statsLoading } = useMemberStats();

  const members = membersData?.members || [];
  const total = membersData?.total || 0;

  const memberIds = useMemo(() => members.map(m => m.id), [members]);
  const { data: enrichment } = useMembersEnrichment(memberIds);

  const statusTabs: StatusTab[] = useMemo(() => [
    { key: 'active', label: t('common.active'), count: stats?.active || 0, color: 'teal' },
    { key: 'suspended', label: t('members.suspended'), count: stats?.suspended || 0, color: 'orange' },
    { key: 'on_hold', label: t('members.onHold'), count: stats?.on_hold || 0, color: 'gray' },
    { key: 'inactive', label: t('common.inactive'), count: stats?.inactive || 0, color: 'gray' },
    { key: 'all', label: t('common.all'), count: stats?.total || 0 },
  ], [stats, t]);

  const handleEdit = (e: React.MouseEvent, member: Member) => {
    e.stopPropagation();
    setSelectedMember(member);
    setEditDialogOpen(true);
  };

  const handleExport = () => {
    if (members.length === 0) return;
    const exportData: ExportableMember[] = members.map(m => ({
      member_id: m.member_id,
      first_name: m.first_name,
      last_name: m.last_name,
      nickname: m.nickname,
      email: m.email,
      phone: m.phone,
      status: m.status,
      member_since: m.member_since,
      recent_package: enrichment?.[m.id]?.recent_package ?? null,
      last_attended: enrichment?.[m.id]?.last_attended ?? null,
      has_contract: enrichment?.[m.id]?.has_contract ?? false,
    }));
    exportMembers(exportData);
  };

  const columns: Column<Member>[] = [
    {
      key: 'name',
      header: t('lobby.name'),
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(row.first_name, row.last_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.first_name} {row.last_name}</p>
            {row.is_new && <StatusBadge variant="new">New</StatusBadge>}
          </div>
        </div>
      ),
    },
    { key: 'nickname', header: t('form.nickname'), cell: (row) => row.nickname || '-' },
    { key: 'memberId', header: t('locations.id'), cell: (row) => row.member_id },
    { key: 'phone', header: t('leads.contactNumber'), cell: (row) => row.phone || '-' },
    { key: 'email', header: t('leads.email'), cell: (row) => row.email || '-' },
    {
      key: 'recentPackage',
      header: t('members.recentPackage'),
      cell: (row) => enrichment?.[row.id]?.recent_package || '-',
    },
    {
      key: 'lastAttended',
      header: t('members.lastAttended'),
      cell: (row) => {
        const d = enrichment?.[row.id]?.last_attended;
        return d ? format(new Date(d), 'dd MMM yyyy') : '-';
      },
    },
    {
      key: 'contract',
      header: t('members.tabs.contract'),
      cell: (row) => enrichment?.[row.id]?.has_contract ? 'Yes' : 'No',
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => handleEdit(e as any, row)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === members.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(members.map((m) => m.id));
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as MemberStatus | 'all');
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title={t('members.title')}
        breadcrumbs={[{ label: t('nav.client') }, { label: t('members.title') }]}
        actions={
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-primary text-primary">
                  <FileText className="h-4 w-4 mr-2" />
                  {t('members.manage')}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background z-50">
                <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('members.import.importCsv')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport} disabled={members.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('common.export')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="bg-primary hover:bg-primary-hover" onClick={() => setCreateDialogOpen(true)}>
              {t('members.createMember')}
            </Button>
          </div>
        }
      />

      <div className="mb-6">
        <SearchBar
          placeholder={t('members.searchPlaceholder')}
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          className="max-w-md"
        />
      </div>

      {statsLoading ? (
        <Skeleton className="h-10 mb-4" />
      ) : (
        <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={handleTabChange} />
      )}

      {membersLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={members}
          selectable
          selectedRows={selectedRows}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/members/${row.id}/detail`)}
          pagination={{ page, perPage: 50, total }}
          onPageChange={setPage}
        />
      )}

      <CreateMemberDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditMemberDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} member={selectedMember} />
      <ImportMembersDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
    </div>
  );
};

export default Members;
