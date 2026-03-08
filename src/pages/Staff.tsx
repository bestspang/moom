import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, StatusTabs, DataTable, StatusBadge, ManageDropdown, BulkActionBar, type Column, type StatusTab } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useStaff, useStaffStats, useBulkUpdateStaffStatus, useBulkDeleteStaff, useBulkDuplicateStaff } from '@/hooks/useStaff';
import { useLocations } from '@/hooks/useLocations';
import { CreateStaffDialog } from '@/components/staff/CreateStaffDialog';
import { ImportCenterDialog } from '@/components/import/ImportCenterDialog';
import { getInitials } from '@/lib/formatters';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

const TEMPLATE_HEADERS = ['Firstname', 'Lastname', 'Nickname', 'Role', 'Gender', 'Birthdate', 'Email', 'Phone', 'Address', 'Branch', 'Status'];

// Status options moved inside component for i18n access

const Staff = () => {
  const { t } = useLanguage();
  const { can } = usePermissions();

  const staffStatusOptions = [
    { value: 'active', label: t('common.active') },
    { value: 'pending', label: t('common.pending') },
    { value: 'inactive', label: t('staff.inactive') },
    { value: 'terminated', label: t('staff.terminated') },
  ];
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const { data: staff, isLoading } = useStaff(activeTab, search);
  const { data: stats } = useStaffStats();
  const { data: locations } = useLocations();

  const bulkStatus = useBulkUpdateStaffStatus();
  const bulkDelete = useBulkDeleteStaff();
  const bulkDuplicate = useBulkDuplicateStaff();
  const isBulkLoading = bulkStatus.isPending || bulkDelete.isPending || bulkDuplicate.isPending;

  const locationMap = new Map(locations?.map(l => [l.id, l.name]) || []);

  const handleSelectRow = useCallback((id: string) => {
    setSelectedRows((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!staff) return;
    setSelectedRows((prev) => prev.length === staff.length ? [] : staff.map((s) => s.id));
  }, [staff]);

  const clearSelection = useCallback(() => setSelectedRows([]), []);

  const statusTabs: StatusTab[] = [
    { key: 'active', label: t('common.active'), count: stats?.active || 0, color: 'teal' },
    { key: 'pending', label: t('common.pending'), count: stats?.pending || 0 },
    { key: 'inactive', label: t('staff.inactive'), count: stats?.inactive || 0 },
    { key: 'terminated', label: t('staff.terminated'), count: stats?.terminated || 0 },
  ];

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case 'active': return 'active';
      case 'pending': return 'pending';
      case 'inactive': return 'suspended';
      case 'terminated': return 'inactive';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'active': return t('common.active');
      case 'pending': return t('common.pending');
      case 'inactive': return t('staff.inactive');
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

  const getRoleNames = (row: any): string => {
    const positions = row.staff_positions;
    if (positions?.length > 0) {
      return positions.map((p: any) => p.role?.name || '-').join(', ');
    }
    return row.role?.name || '-';
  };

  const getAddress = (row: any): string => {
    const parts = [row.address_1, row.address_2, row.subdistrict, row.district, row.province, row.postal_code].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '-';
  };

  const buildCsvColumns = (): CsvColumn<any>[] => [
    { key: 'first_name', header: 'Firstname', accessor: (r) => r.first_name },
    { key: 'last_name', header: 'Lastname', accessor: (r) => r.last_name },
    { key: 'nickname', header: 'Nickname', accessor: (r) => r.nickname || '-' },
    { key: 'role', header: 'Role', accessor: (r) => getRoleNames(r) },
    { key: 'gender', header: 'Gender', accessor: (r) => r.gender || '-' },
    { key: 'birthdate', header: 'Birthdate', accessor: (r) => r.date_of_birth || '-' },
    { key: 'email', header: 'Email', accessor: (r) => r.email || '-' },
    { key: 'phone', header: 'Phone', accessor: (r) => r.phone || '-' },
    { key: 'address', header: 'Address', accessor: (r) => getAddress(r) },
    { key: 'branch', header: 'Branch', accessor: (r) => getLocationScopeLabel(r) },
    { key: 'status', header: 'Status', accessor: (r) => r.status || '-' },
  ];

  const handleExport = () => {
    if (!staff?.length) { toast.info(t('common.noData')); return; }
    exportToCsv(staff, buildCsvColumns(), 'staff');
    toast.success(t('common.export'));
  };

  const handleExportSelected = () => {
    if (!staff) return;
    const selected = staff.filter((s) => selectedRows.includes(s.id));
    if (!selected.length) return;
    exportToCsv(selected, buildCsvColumns(), 'staff-selected');
    toast.success(t('common.export'));
  };

  const handleDownloadTemplate = () => {
    const csv = TEMPLATE_HEADERS.join(',');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'staff-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloadTemplate'));
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
          <div className="flex items-center gap-2">
            {can('staff', 'write') && (
              <>
                <ManageDropdown
                  onExport={handleExport}
                  onDownloadTemplate={handleDownloadTemplate}
                  onImport={() => setImportOpen(true)}
                  exportDisabled={!staff?.length}
                />
                <Button className="bg-primary hover:bg-primary-hover" onClick={() => setCreateOpen(true)}>
                  {t('staff.createStaff')}
                </Button>
              </>
            )}
          </div>
        } 
      />
      
      <SearchBar 
        placeholder={t('staff.searchPlaceholder')} 
        value={search} 
        onChange={(v) => { setSearch(v); clearSelection(); }}
        className="max-w-md mb-6" 
      />
      
      <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={(tab) => { setActiveTab(tab); clearSelection(); }} />
      
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
          selectable
          selectedRows={selectedRows}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
        />
      )}

      <BulkActionBar
        selectedCount={selectedRows.length}
        onClearSelection={clearSelection}
        onDelete={() => { bulkDelete.mutate(selectedRows, { onSuccess: clearSelection }); }}
        onExport={handleExportSelected}
        onDuplicate={() => {
          const selected = (staff || []).filter((s) => selectedRows.includes(s.id));
          bulkDuplicate.mutate(selected, { onSuccess: clearSelection });
        }}
        statusOptions={staffStatusOptions}
        onChangeStatus={(status) => { bulkStatus.mutate({ ids: selectedRows, status }, { onSuccess: clearSelection }); }}
        isLoading={isBulkLoading}
      />

      <CreateStaffDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ImportCenterDialog open={importOpen} onOpenChange={setImportOpen} presetEntity="staff" />
    </div>
  );
};

export default Staff;
