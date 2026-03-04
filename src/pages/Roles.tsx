import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, DataTable, StatusBadge, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRoles, formatAccessLevel } from '@/hooks/useRoles';
import type { RoleWithCount } from '@/hooks/useRoles';

const Roles = () => {
  const { t } = useLanguage();
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
          <Button className="bg-primary hover:bg-primary-hover" onClick={() => navigate('/roles/create')}>
            {t('roles.createRole')}
          </Button>
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
