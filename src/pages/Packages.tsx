import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, StatusTabs, DataTable, StatusBadge, ManageDropdown, type Column, type StatusTab } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import { usePackages, usePackageStats } from '@/hooks/usePackages';
import { useLocations } from '@/hooks/useLocations';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Package = Tables<'packages'>;

const TEMPLATE_HEADERS = ['ID', 'Name', 'Type', 'Term(D)', 'Sessions', 'Price', 'Categories', 'Access locations', 'Sold at', 'Date modified', 'Status'];

const Packages = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('on_sale');

  const { data: packages, isLoading } = usePackages(activeTab, search);
  const { data: stats } = usePackageStats();
  const { data: locations } = useLocations();

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

  const handleExport = () => {
    if (!packages?.length) {
      toast.info(t('common.noData'));
      return;
    }

    const locationMap = new Map(
      (locations || []).map((l) => [l.id, l.name])
    );

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
        case 'unlimited': return 'Unlimited';
        case 'session': return 'Sessions';
        case 'pt': return 'PT';
        default: return type;
      }
    };

    // Build ID map: assign PKG-NNNNN based on row index
    const idMap = new Map(packages.map((pkg, i) => [pkg.id, `PKG-${String(i + 1).padStart(5, '0')}`]));

    const csvColumns: CsvColumn<Package>[] = [
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
    exportToCsv(packages, csvColumns, 'packages');
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
    { 
      key: 'name', 
      header: t('common.name'), 
      cell: (row) => language === 'th' && row.name_th ? row.name_th : row.name_en 
    },
    {
      key: 'type',
      header: t('packages.type'),
      cell: (row) => (
        <StatusBadge variant={row.type === 'pt' ? 'pending' : 'default'}>
          {getTypeLabel(row.type)}
        </StatusBadge>
      ),
    },
    { key: 'term', header: t('packages.term'), cell: (row) => row.term_days },
    { key: 'sessions', header: t('packages.sessions'), cell: (row) => row.sessions || '-' },
    {
      key: 'price',
      header: t('packages.priceInclVat'),
      cell: (row) => formatCurrency(row.price),
    },
    { 
      key: 'categories', 
      header: t('packages.categories'), 
      cell: (row) => row.all_categories ? t('common.all') : (row.categories?.join(', ') || '-')
    },
    { 
      key: 'access', 
      header: t('packages.access'), 
      cell: (row) => getUsageTypeLabel(row.usage_type)
    },
    {
      key: 'popular',
      header: t('packages.popular'),
      cell: (row) =>
        row.is_popular ? (
          <Star className="h-4 w-4 fill-warning text-warning" />
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('packages.title')}
        breadcrumbs={[{ label: t('nav.package') }, { label: t('packages.title') }]}
        actions={
          <div className="flex items-center gap-2">
            <ManageDropdown
              onExport={handleExport}
              onDownloadTemplate={handleDownloadTemplate}
              exportDisabled={!packages?.length}
            />
            <Button
              className="bg-primary hover:bg-primary-hover"
              onClick={() => navigate('/package/create')}
            >
              {t('packages.createPackage')}
            </Button>
          </div>
        }
      />

      <div className="mb-6">
        <SearchBar
          placeholder={t('packages.searchPlaceholder')}
          value={search}
          onChange={setSearch}
          className="max-w-md"
        />
      </div>

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
          data={packages || []}
          rowKey={(row) => row.id}
          emptyMessage={t('common.noData')}
          onRowClick={(row) => navigate(`/package/${row.id}`)}
        />
      )}
    </div>
  );
};

export default Packages;
