import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { PageHeader, SearchBar, DataTable, StatusBadge, ManageDropdown, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRoles, formatAccessLevel } from '@/hooks/useRoles';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';
import { toast } from 'sonner';
import type { RoleWithCount } from '@/hooks/useRoles';

const TEMPLATE_HEADERS = ['name', 'access_level', 'description'];

const Roles = () => {
  const { t } = useLanguage();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: roles, isLoading } = useRoles(search);

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'level_4_master': return 'paid';
      case 'level_3_manager': return 'pending';
      case 'level_2_operator': return 'default';
      case 'level_1_minimum': return 'default';
      default: return 'default';
    }
  };

  const handleExport = () => {
    if (!roles?.length) { toast.info(t('common.noData')); return; }
    const csvColumns: CsvColumn<RoleWithCount>[] = [
      { key: 'name', header: 'Name', accessor: (r) => r.name },
      { key: 'access_level', header: 'Access Level', accessor: (r) => formatAccessLevel(r.access_level) },
      { key: 'accounts_count', header: 'Accounts Assigned', accessor: (r) => r.accounts_count },
      { key: 'description', header: 'Description', accessor: (r) => r.description },
    ];
    exportToCsv(roles, csvColumns, 'roles');
    toast.success(t('common.export'));
  };

  const handleDownloadTemplate = () => {
    const csv = TEMPLATE_HEADERS.join(',');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'roles-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloadTemplate'));
  };

  const columns: Column<RoleWithCount>[] = [
    { key: 'name', header: t('roles.roleName'), cell: (row) => row.name },
    { 
      key: 'accessLevel', 
      header: t('roles.accessLevel'), 
      cell: (row) => (
        <StatusBadge variant={getAccessLevelColor(row.access_level) as any}>
          {formatAccessLevel(row.access_level)}
        </StatusBadge>
      )
    },
    { key: 'accounts', header: t('roles.accountsAssigned'), cell: (row) => row.accounts_count },
  ];

  return (
    <div>
      <PageHeader 
        title={t('roles.title')} 
        breadcrumbs={[{ label: t('nav.yourGym') }, { label: t('roles.title') }]} 
        actions={
          <div className="flex items-center gap-2">
            <ManageDropdown
              onExport={handleExport}
              onDownloadTemplate={handleDownloadTemplate}
              exportDisabled={!roles?.length}
            />
            <Button className="bg-primary hover:bg-primary-hover" onClick={() => navigate('/roles/create')}>
              {t('roles.createRole')}
            </Button>
          </div>
        } 
      />
      
      <SearchBar 
        placeholder={t('roles.searchPlaceholder')} 
        value={search} 
        onChange={setSearch} 
        className="max-w-md mb-6" 
      />
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={roles || []} 
          rowKey={(row) => row.id}
          emptyMessage={t('common.noData')}
          onRowClick={(row) => navigate(`/roles/${row.id}`)}
        />
      )}
    </div>
  );
};

export default Roles;
