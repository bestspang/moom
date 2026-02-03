import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, StatusTabs, DataTable, StatusBadge, type Column, type StatusTab } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, formatMemberId } from '@/lib/formatters';

interface Member {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  nickname: string;
  phone: string;
  email: string;
  status: 'active' | 'suspended' | 'on_hold' | 'inactive';
  isNew: boolean;
}

const Members = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Sample data
  const members: Member[] = [
    {
      id: '1',
      memberId: 'M-0000048',
      firstName: 'Somchai',
      lastName: 'Prasert',
      nickname: 'Chai',
      phone: '081-234-5678',
      email: 'somchai@email.com',
      status: 'active',
      isNew: true,
    },
    {
      id: '2',
      memberId: 'M-0000047',
      firstName: 'Pranee',
      lastName: 'Kanjana',
      nickname: 'Nee',
      phone: '089-876-5432',
      email: 'pranee@email.com',
      status: 'active',
      isNew: false,
    },
  ];

  const statusTabs: StatusTab[] = [
    { key: 'active', label: t('common.active'), count: 48, color: 'teal' },
    { key: 'suspended', label: t('members.suspended'), count: 0, color: 'orange' },
    { key: 'on_hold', label: t('members.onHold'), count: 0, color: 'gray' },
    { key: 'inactive', label: t('common.inactive'), count: 0, color: 'gray' },
    { key: 'all', label: t('common.all'), count: 48 },
  ];

  const columns: Column<Member>[] = [
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
          <div>
            <p className="font-medium">{row.firstName} {row.lastName}</p>
            {row.isNew && <StatusBadge variant="new">New</StatusBadge>}
          </div>
        </div>
      ),
    },
    { key: 'nickname', header: 'Nickname', cell: (row) => row.nickname },
    { key: 'memberId', header: 'ID', cell: (row) => row.memberId },
    { key: 'phone', header: t('leads.contactNumber'), cell: (row) => row.phone },
    { key: 'email', header: t('leads.email'), cell: (row) => row.email },
  ];

  const filteredMembers = members.filter((member) => {
    if (activeTab !== 'all' && member.status !== activeTab) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        member.firstName.toLowerCase().includes(searchLower) ||
        member.lastName.toLowerCase().includes(searchLower) ||
        member.nickname.toLowerCase().includes(searchLower) ||
        member.memberId.toLowerCase().includes(searchLower) ||
        member.phone.includes(search)
      );
    }
    return true;
  });

  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === filteredMembers.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredMembers.map((m) => m.id));
    }
  };

  return (
    <div>
      <PageHeader
        title={t('members.title')}
        breadcrumbs={[{ label: t('nav.client') }, { label: t('members.title') }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {t('common.export')}
            </Button>
            <Button className="bg-primary hover:bg-primary-hover">
              {t('members.createMember')}
            </Button>
          </div>
        }
      />

      <div className="mb-6">
        <SearchBar
          placeholder={t('members.searchPlaceholder')}
          value={search}
          onChange={setSearch}
          className="max-w-md"
        />
      </div>

      <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />

      <DataTable
        columns={columns}
        data={filteredMembers}
        selectable
        selectedRows={selectedRows}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        rowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/members/${row.id}/detail`)}
        pagination={{ page: 1, perPage: 50, total: filteredMembers.length }}
      />
    </div>
  );
};

export default Members;
