import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Edit, MoreVertical } from 'lucide-react';
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
import { exportMembers } from '@/lib/exportCsv';
import { useMembers, useMemberStats } from '@/hooks/useMembers';
import { CreateMemberDialog } from '@/components/members/CreateMemberDialog';
import { EditMemberDialog } from '@/components/members/EditMemberDialog';
import type { Database } from '@/integrations/supabase/types';

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
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Fetch members and stats
  const { data: membersData, isLoading: membersLoading } = useMembers({
    status: activeTab,
    search,
    page,
    perPage: 50,
  });
  const { data: stats, isLoading: statsLoading } = useMemberStats();

  const members = membersData?.members || [];
  const total = membersData?.total || 0;

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

  const handleExport = () => {
    if (members.length > 0) {
      exportMembers(members);
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
            <Button variant="outline" onClick={handleExport} disabled={members.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              {t('common.export')}
            </Button>
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
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
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
          pagination={{
            page,
            perPage: 50,
            total,
          }}
          onPageChange={setPage}
        />
      )}

      <CreateMemberDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditMemberDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        member={selectedMember}
      />
    </div>
  );
};

export default Members;
