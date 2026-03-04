import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, StatusTabs, DataTable, StatusBadge, type Column, type StatusTab } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useStaff, useStaffStats } from '@/hooks/useStaff';
import { useLocations } from '@/hooks/useLocations';
import { CreateStaffDialog } from '@/components/staff/CreateStaffDialog';
import { getInitials } from '@/lib/formatters';

const Staff = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: staff, isLoading } = useStaff(activeTab, search);
  const { data: stats } = useStaffStats();
  const { data: locations } = useLocations();

  const locationMap = new Map(locations?.map(l => [l.id, l.name]) || []);

  const statusTabs: StatusTab[] = [
    { key: 'active', label: t('common.active'), count: stats?.active || 0, color: 'teal' },
    { key: 'pending', label: t('common.pending'), count: stats?.pending || 0 },
    { key: 'terminated', label: t('staff.terminated'), count: stats?.terminated || 0 },
  ];

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case 'active': return 'active';
      case 'pending': return 'pending';
      case 'terminated': return 'inactive';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'active': return t('common.active');
      case 'pending': return t('common.pending');
      case 'terminated': return t('staff.terminated');
      default: return status || '';
    }
  };

  const getLocationScopeLabel = (row: any): string => {
    const positions = row.staff_positions;
    if (!positions?.length) return '-';
    const allScope = positions.every((p: any) => p.scope_all_locations);
    if (allScope) return t('staff.allLocations');
    const ids = new Set<string>();
    positions.forEach((p: any) => {
      if (!p.scope_all_locations && p.location_ids) {
        p.location_ids.forEach((id: string) => ids.add(id));
      }
    });
    if (ids.size === 0) return t('staff.allLocations');
    return Array.from(ids).map(id => locationMap.get(id) || id).join(', ');
  };

  const columns: Column<any>[] = [
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
          <span className="font-medium">{row.first_name} {row.last_name}</span>
        </div>
      )
    },
    { key: 'phone', header: t('common.phone'), cell: (row) => row.phone || '-' },
    { key: 'email', header: t('common.email'), cell: (row) => row.email || '-' },
    { 
      key: 'roles', 
      header: t('staff.positions'), 
      cell: (row) => {
        const positions = row.staff_positions;
        if (positions?.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {positions.map((p: any) => (
                <Badge key={p.id} variant="secondary" className="text-xs">
                  {p.role?.name || '-'}
                </Badge>
              ))}
            </div>
          );
        }
        return (
          <Badge variant="outline" className="text-xs">
            {row.role?.name || '-'}
          </Badge>
        );
      }
    },
    {
      key: 'location_scope',
      header: t('staff.locationScope'),
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{getLocationScopeLabel(row)}</span>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      cell: (row) => (
        <StatusBadge variant={getStatusVariant(row.status)}>
          {getStatusLabel(row.status)}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader 
        title={t('staff.title')} 
        breadcrumbs={[{ label: t('nav.yourGym') }, { label: t('staff.title') }]} 
        actions={
          <Button className="bg-primary hover:bg-primary-hover" onClick={() => setCreateOpen(true)}>
            {t('staff.createStaff')}
          </Button>
        } 
      />
      
      <SearchBar 
        placeholder={t('staff.searchPlaceholder')} 
        value={search} 
        onChange={setSearch} 
        className="max-w-md mb-6" 
      />
      
      <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={staff || []} 
          rowKey={(row) => row.id}
          emptyMessage={t('staff.noStaff')}
          onRowClick={(row) => navigate(`/admin/${row.id}`)}
        />
      )}

      <CreateStaffDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};

export default Staff;
