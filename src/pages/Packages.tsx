import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Package as PackageIcon, Users, DollarSign, TrendingUp, LayoutGrid, List } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { SearchBar, StatusTabs, DataTable, StatusBadge, ManageDropdown, BulkActionBar, type Column, type StatusTab } from '@/components/common';
import { AdminPageHeader, AdminKpiCard, AdminCard } from '@/components/admin-ds';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { usePackages, usePackageStats, useBulkUpdatePackageStatus, useBulkDeletePackages, useBulkDuplicatePackages } from '@/hooks/usePackages';
import { useLocations } from '@/hooks/useLocations';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { ImportCenterDialog } from '@/components/import/ImportCenterDialog';

type Package = Tables<'packages'>;

const TEMPLATE_HEADERS = ['ID', 'Name', 'Type', 'Term(D)', 'Sessions', 'Price', 'Categories', 'Access locations', 'Sold at', 'Date modified', 'Status'];


const VIEW_KEY = 'moom-pkg-view';
type ViewMode = 'grid' | 'table';

const Packages = () => {
  const { t, language } = useLanguage();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('on_sale');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'table';
    return (localStorage.getItem(VIEW_KEY) as ViewMode) || 'table';
  });
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      // ignore
    }
  }, [view]);

  const PACKAGE_STATUS_OPTIONS = [
    { value: 'on_sale', label: t('common.onSale') },
    { value: 'scheduled', label: t('common.scheduled') },
    { value: 'drafts', label: t('common.draft') },
    { value: 'archive', label: t('common.archive') },
  ];
  const [importOpen, setImportOpen] = useState(false);

  const { data: packages, isLoading } = usePackages(activeTab, search);
  const { data: stats } = usePackageStats();
  const { data: locations } = useLocations();

  const bulkStatus = useBulkUpdatePackageStatus();
  const bulkDelete = useBulkDeletePackages();
  const bulkDuplicate = useBulkDuplicatePackages();
  const isBulkLoading = bulkStatus.isPending || bulkDelete.isPending || bulkDuplicate.isPending;

  const handleSelectRow = useCallback((id: string) => {
    setSelectedRows((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!packages) return;
    setSelectedRows((prev) => prev.length === packages.length ? [] : packages.map((p) => p.id));
  }, [packages]);

  const clearSelection = useCallback(() => setSelectedRows([]), []);

  const statusTabs: StatusTab[] = [
    { key: 'on_sale', label: t('packages.onSale'), count: stats?.on_sale || 0, color: 'teal' },
    { key: 'scheduled', label: t('packages.scheduled'), count: stats?.scheduled || 0 },
    { key: 'drafts', label: t('packages.drafts'), count: stats?.drafts || 0, color: 'gray' },
    { key: 'archive', label: t('packages.archive'), count: stats?.archive || 0, color: 'gray' },
  ];

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'unlimited': return t('packages.unlimited');
      case 'session': return t('packages.session');
      case 'pt': return t('packages.pt');
      default: return type;
    }
  };

  const getUsageTypeLabel = (usageType: string | null) => {
    switch (usageType) {
      case 'class_only': return t('packages.create.classOnly');
      case 'gym_checkin_only': return t('packages.create.gymCheckinOnly');
      case 'both': return t('packages.create.both');
      default: return usageType || '-';
    }
  };

  const locationMap = new Map((locations || []).map((l) => [l.id, l.name]));

  const resolveLocations = (pkg: Package): string => {
    if (pkg.all_locations) return 'All';
    if (!pkg.access_locations?.length) return '-';
    return pkg.access_locations.map((id) => locationMap.get(id) || id).join(', ');
  };

  const resolveCategories = (pkg: Package): string => {
    if (pkg.all_categories) return 'All';
    if (!pkg.categories?.length) return '-';
    if (pkg.categories.length === 1) return pkg.categories[0];
    return 'Multiple';
  };

  const formatType = (type: string) => {
    switch (type) {
      case 'unlimited': return t('packages.unlimited');
      case 'session': return t('packages.session');
      case 'pt': return t('packages.pt');
      default: return type;
    }
  };

  const buildCsvColumns = (data: Package[]): CsvColumn<Package>[] => {
    const idMap = new Map(data.map((pkg, i) => [pkg.id, `PKG-${String(i + 1).padStart(5, '0')}`]));
    return [
      { key: 'id', header: 'ID', accessor: (r) => idMap.get(r.id) ?? r.id },
      { key: 'name', header: 'Name', accessor: (r) => (language === 'th' && r.name_th ? r.name_th : r.name_en) },
      { key: 'type', header: 'Type', accessor: (r) => formatType(r.type) },
      { key: 'term_days', header: 'Term(D)', accessor: (r) => r.term_days },
      { key: 'sessions', header: 'Sessions', accessor: (r) => r.sessions ?? '-' },
      { key: 'price', header: 'Price', accessor: (r) => r.price },
      { key: 'categories', header: 'Categories', accessor: (r) => resolveCategories(r) },
      { key: 'access_locations', header: 'Access locations', accessor: (r) => resolveLocations(r) },
      { key: 'sold_at', header: 'Sold at', accessor: (r) => resolveLocations(r) },
      { key: 'date_modified', header: 'Date modified', accessor: (r) => r.updated_at ? format(new Date(r.updated_at), 'd MMM yyyy').toUpperCase() : '-' },
      { key: 'status', header: 'Status', accessor: (r) => r.status ?? 'drafts' },
    ];
  };

  const handleExport = () => {
    if (!packages?.length) { toast.info(t('common.noData')); return; }
    exportToCsv(packages, buildCsvColumns(packages), 'packages');
    toast.success(t('common.export'));
  };

  const handleExportSelected = () => {
    if (!packages) return;
    const selected = packages.filter((p) => selectedRows.includes(p.id));
    if (!selected.length) return;
    exportToCsv(selected, buildCsvColumns(selected), 'packages-selected');
    toast.success(t('common.export'));
  };

  const handleDownloadTemplate = () => {
    const csv = TEMPLATE_HEADERS.join(',');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'packages-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloadTemplate'));
  };

  const columns: Column<Package>[] = [
    { key: 'name', header: t('common.name'), cell: (row) => language === 'th' && row.name_th ? row.name_th : row.name_en },
    { key: 'type', header: t('packages.type'), cell: (row) => (
      <StatusBadge variant={row.type === 'pt' ? 'pending' : 'default'}>{getTypeLabel(row.type)}</StatusBadge>
    )},
    { key: 'term', header: t('packages.term'), cell: (row) => row.term_days },
    { key: 'sessions', header: t('packages.sessions'), cell: (row) => row.sessions || '-' },
    { key: 'price', header: t('packages.priceInclVat'), cell: (row) => formatCurrency(row.price) },
    { key: 'categories', header: t('packages.categories'), cell: (row) => row.all_categories ? t('common.all') : (row.categories?.join(', ') || '-') },
    { key: 'access', header: t('packages.access'), cell: (row) => getUsageTypeLabel(row.usage_type) },
    { key: 'popular', header: t('packages.popular'), cell: (row) => row.is_popular ? <Star className="h-4 w-4 fill-warning text-warning" /> : null },
  ];

  const totalPackages = (stats?.on_sale || 0) + (stats?.scheduled || 0) + (stats?.drafts || 0) + (stats?.archive || 0);

  const kpis: Array<{ label: string; value: React.ReactNode; suffix?: React.ReactNode; icon: React.ReactNode; accent: 'orange' | 'teal' | 'info' | 'pink'; comingSoon?: boolean }> = [
    { label: t('packages.kpi.activePackages'), value: stats?.on_sale ?? '—', suffix: t('packages.kpi.ofTotal').replace('{{total}}', String(totalPackages)), icon: <PackageIcon />, accent: 'orange' },
    { label: t('packages.kpi.activeSubs'), value: '—', suffix: t('packages.kpi.comingSoon'), icon: <Users />, accent: 'teal', comingSoon: true },
    { label: t('packages.kpi.revenue30d'), value: '—', suffix: t('packages.kpi.comingSoon'), icon: <DollarSign />, accent: 'info', comingSoon: true },
    { label: t('packages.kpi.arpu'), value: '—', suffix: t('packages.kpi.comingSoon'), icon: <TrendingUp />, accent: 'pink', comingSoon: true },
  ];

  const renderGridCard = (row: Package) => {
    const name = language === 'th' && row.name_th ? row.name_th : row.name_en;
    return (
      <AdminCard
        key={row.id}
        onClick={() => navigate(`/package/${row.id}`)}
        className="cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 p-4 flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[14px] font-bold text-foreground truncate">{name}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{getTypeLabel(row.type)}</div>
          </div>
          {row.is_popular && <Star className="h-4 w-4 fill-warning text-warning shrink-0" />}
        </div>
        <div className="flex items-end justify-between gap-2 mt-auto">
          <div>
            <div className="text-[22px] font-extrabold text-foreground tabular-nums leading-none">{formatCurrency(row.price)}</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {row.term_days}d {row.sessions ? `· ${row.sessions} ${t('packages.sessions')}` : ''}
            </div>
          </div>
          <StatusBadge variant={row.type === 'pt' ? 'pending' : 'default'}>{getTypeLabel(row.type)}</StatusBadge>
        </div>
      </AdminCard>
    );
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={t('packages.title')}
        actions={
          can('packages', 'write') && (
            <>
              <ManageDropdown onExport={handleExport} onDownloadTemplate={handleDownloadTemplate} onImport={() => setImportOpen(true)} exportDisabled={!packages?.length} />
              <Button className="bg-primary hover:bg-primary-hover" onClick={() => navigate('/package/create')}>
                {t('packages.createPackage')}
              </Button>
            </>
          )
        }
      />

      {/* KPI strip — DS-aligned 4-up */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpis.map((k, i) => (
          <div key={i} className={cn(k.comingSoon && 'opacity-60 pointer-events-none')}>
            <AdminKpiCard label={k.label} value={k.value} suffix={k.suffix} icon={k.icon} accent={k.accent} />
          </div>
        ))}
      </div>

      {/* Toolbar card — search + view toggle */}
      <AdminCard className="p-3 flex items-center gap-2 flex-wrap">
        <SearchBar placeholder={t('packages.searchPlaceholder')} value={search} onChange={setSearch} className="max-w-md flex-1 min-w-[180px]" />
        <div className="flex-1" />
        <div className="flex p-0.5 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => setView('grid')}
            aria-label={t('packages.view.grid')}
            className={cn(
              'h-7 w-8 rounded-md flex items-center justify-center transition-colors',
              view === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setView('table')}
            aria-label={t('packages.view.table')}
            className={cn(
              'h-7 w-8 rounded-md flex items-center justify-center transition-colors',
              view === 'table' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </AdminCard>

      <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={(tab) => { setActiveTab(tab); clearSelection(); }} />

      {isLoading ? (
        <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5' : 'space-y-3'}>
          {[...Array(view === 'grid' ? 8 : 5)].map((_, i) => <Skeleton key={i} className={view === 'grid' ? 'h-36 w-full' : 'h-12 w-full'} />)}
        </div>
      ) : view === 'grid' ? (
        (packages || []).length === 0 ? (
          <AdminCard className="p-10 text-center text-sm text-muted-foreground">{t('common.noData')}</AdminCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {(packages || []).map(renderGridCard)}
          </div>
        )
      ) : (
        <DataTable
          columns={columns}
          data={packages || []}
          rowKey={(row) => row.id}
          emptyMessage={t('common.noData')}
          onRowClick={(row) => navigate(`/package/${row.id}`)}
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
          const selected = (packages || []).filter((p) => selectedRows.includes(p.id));
          bulkDuplicate.mutate(selected, { onSuccess: clearSelection });
        }}
        statusOptions={PACKAGE_STATUS_OPTIONS}
        onChangeStatus={(status) => { bulkStatus.mutate({ ids: selectedRows, status }, { onSuccess: clearSelection }); }}
        isLoading={isBulkLoading}
      />

      <ImportCenterDialog open={importOpen} onOpenChange={setImportOpen} presetEntity="packages" />
    </div>
  );
};

export default Packages;
