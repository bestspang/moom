import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
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
import { useMembers, useMemberStats, useBulkDeleteMembers, useBulkUpdateMemberStatus, type MemberWithLocation } from '@/hooks/useMembers';
import { BulkActionBar } from '@/components/common/BulkActionBar';
import { toast } from 'sonner';
import { useMembersEnrichment } from '@/hooks/useMembersEnriched';
import { useEngagementScores } from '@/hooks/useEngagementScores';
import { CreateMemberDialog } from '@/components/members/CreateMemberDialog';
import { EditMemberDialog } from '@/components/members/EditMemberDialog';
import { ImportMembersDialog } from '@/components/members/ImportMembersDialog';
import { ImportCenterDialog } from '@/components/import/ImportCenterDialog';
import type { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';

type MemberStatus = Database['public']['Enums']['member_status'];

const Members = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<MemberStatus | 'all'>('active');
  const [page, setPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberWithLocation | null>(null);

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
  const { data: engagementScores } = useEngagementScores(memberIds);

  const statusTabs: StatusTab[] = useMemo(() => [
    { key: 'active', label: t('common.active'), count: stats?.active || 0, color: 'teal' },
    { key: 'suspended', label: t('members.suspended'), count: stats?.suspended || 0, color: 'orange' },
    { key: 'on_hold', label: t('members.onHold'), count: stats?.on_hold || 0, color: 'gray' },
    { key: 'inactive', label: t('common.inactive'), count: stats?.inactive || 0, color: 'gray' },
    { key: 'all', label: t('common.all'), count: stats?.total || 0 },
  ], [stats, t]);

  const handleEdit = (e: React.MouseEvent, member: MemberWithLocation) => {
    e.stopPropagation();
    setSelectedMember(member);
    setEditDialogOpen(true);
  };

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case 'active': return 'active';
      case 'suspended': return 'suspended';
      case 'on_hold': return 'pending';
      case 'inactive': return 'inactive';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'active': return t('common.active');
      case 'suspended': return t('members.suspended');
      case 'on_hold': return t('members.onHold');
      case 'inactive': return t('common.inactive');
      default: return t('common.active');
    }
  };

  const handleExport = () => {
    if (members.length === 0) return;
    const exportData: ExportableMember[] = members.map(m => ({
      member_id: m.member_id,
      first_name: m.first_name,
      last_name: m.last_name,
      nickname: m.nickname,
      gender: m.gender,
      date_of_birth: m.date_of_birth,
      phone: m.phone,
      email: m.email,
      line_id: (m as any).line_id ?? null,
      register_location_id: m.register_location_id,
      register_location_name: m.register_location?.name ?? null,
      status: m.status,
      member_since: m.member_since,
      address_1: m.address_1,
      address_2: m.address_2,
      subdistrict: m.subdistrict,
      district: m.district,
      province: m.province,
      postal_code: m.postal_code,
      emergency_first_name: (m as any).emergency_first_name ?? m.emergency_contact_name ?? null,
      emergency_last_name: (m as any).emergency_last_name ?? null,
      emergency_phone: (m as any).emergency_phone ?? m.emergency_contact_phone ?? null,
      emergency_relationship: m.emergency_relationship,
      has_medical_conditions: (m as any).has_medical_conditions ?? false,
      medical_notes: (m as any).medical_notes ?? null,
      allow_physical_contact: (m as any).allow_physical_contact ?? false,
      source: m.source,
      notes: m.notes,
      recent_package_name: enrichment?.[m.id]?.recent_package ?? null,
      last_attended: enrichment?.[m.id]?.last_attended ?? null,
      has_contract: enrichment?.[m.id]?.has_contract ?? false,
    }));
    exportMembers(exportData);
  };

  const columns: Column<MemberWithLocation>[] = [
    {
      key: 'name',
      header: t('common.name'),
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
    { key: 'phone', header: t('common.phone'), cell: (row) => row.phone || '-' },
    { key: 'email', header: t('common.email'), cell: (row) => row.email || '-' },
    {
      key: 'location',
      header: t('lobby.location'),
      cell: (row) => row.register_location?.name || '-',
    },
    {
      key: 'status',
      header: t('common.status'),
      cell: (row) => (
        <StatusBadge variant={getStatusVariant(row.status) as any}>
          {getStatusLabel(row.status)}
        </StatusBadge>
      ),
    },
    {
      key: 'engagement',
      header: t('members.engagement'),
      cell: (row) => {
        const score = engagementScores?.[row.id];
        if (!score) return '-';
        const colorClass = score.level === 'high'
          ? 'bg-green-500'
          : score.level === 'medium'
          ? 'bg-yellow-500'
          : 'bg-red-500';
        return (
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${colorClass}`} />
            <span className="text-sm">{score.score}</span>
          </div>
        );
      },
    },
    {
      key: 'memberSince',
      header: t('members.joinedDate'),
      cell: (row) => row.member_since ? format(new Date(row.member_since), 'dd MMM yyyy') : '-',
    },
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
      cell: (row) => enrichment?.[row.id]?.has_contract ? t('common.yes') : t('common.no'),
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => {
        if (!can('members', 'write')) return null;
        return (
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
        );
      },
    },
  ];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as MemberStatus | 'all');
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title={t('members.title')}
        breadcrumbs={[{ label: t('nav.people'), href: '/members' }, { label: t('members.title') }]}
        actions={
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-primary text-primary">
                  <FileText className="h-4 w-4 mr-2" />
                  {t('common.manage')}
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
                <DropdownMenuItem onClick={() => {
                  const headers = ['member_id','first_name','last_name','nickname','gender','date_of_birth','phone','email','register_location_id','address_1','address_2','subdistrict','district','province','postal_code','emergency_first_name','emergency_last_name','emergency_phone','emergency_relationship','has_medical_conditions','medical_notes','allow_physical_contact','line_id','joined_date','status','notes'];
                  const csv = headers.map(h => `"${h}"`).join(',') + '\n';
                  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'members-template.csv';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}>
                  <FileText className="h-4 w-4 mr-2" />
                  {t('common.downloadTemplate')}
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
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/members/${row.id}/detail`)}
          pagination={{ page, perPage: 50, total }}
          onPageChange={setPage}
          emptyMessage={t('common.noResults')}
        />
      )}

      <CreateMemberDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditMemberDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} member={selectedMember} />
      <ImportCenterDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} presetEntity="members" />
    </div>
  );
};

export default Members;
