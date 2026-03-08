import React, { useState, useCallback } from 'react';
import { Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { PageHeader, SearchBar, StatusTabs, DataTable, StatusBadge, ManageDropdown, BulkActionBar, type Column, type StatusTab } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePromotions, usePromotionStats, useBulkUpdatePromotionStatus, useBulkDeletePromotions, useBulkDuplicatePromotions } from '@/hooks/usePromotions';
import { formatCurrency, getDateLocale } from '@/lib/formatters';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { ImportCenterDialog } from '@/components/import/ImportCenterDialog';

type Promotion = Tables<'promotions'>;

const TEMPLATE_HEADERS = ['Name', 'Type', 'Promo code', 'Discount', 'Started on', 'Ending on', 'Date modified', 'Status'];

const PROMO_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'drafts', label: 'Drafts' },
  { value: 'archive', label: 'Archive' },
];

const Promotions = () => {
  const { t, language } = useLanguage();
  const { can } = usePermissions();
  const locale = getDateLocale(language);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [importOpen, setImportOpen] = useState(false);

  const { data: promotions, isLoading } = usePromotions(activeTab, search);
  const { data: stats } = usePromotionStats();

  const bulkStatus = useBulkUpdatePromotionStatus();
  const bulkDelete = useBulkDeletePromotions();
  const bulkDuplicate = useBulkDuplicatePromotions();
  const isBulkLoading = bulkStatus.isPending || bulkDelete.isPending || bulkDuplicate.isPending;

  const handleSelectRow = useCallback((id: string) => {
    setSelectedRows((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!promotions) return;
    setSelectedRows((prev) => prev.length === promotions.length ? [] : promotions.map((p) => p.id));
  }, [promotions]);

  const clearSelection = useCallback(() => setSelectedRows([]), []);

  const statusTabs: StatusTab[] = [
    { key: 'active', label: t('common.active'), count: stats?.active || 0, color: 'teal' },
    { key: 'scheduled', label: t('packages.scheduled'), count: stats?.scheduled || 0 },
    { key: 'drafts', label: t('packages.drafts'), count: stats?.drafts || 0 },
    { key: 'archive', label: t('packages.archive'), count: stats?.archive || 0, color: 'gray' },
  ];

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Promo code copied!');
  };

  const getDiscountDisplay = (promo: Promotion) => {
    const mode = (promo as any).discount_mode || promo.discount_type;
    if (mode === 'percentage') {
      const val = (promo as any).percentage_discount ?? promo.discount_value;
      return `${val}%`;
    }
    const val = (promo as any).flat_rate_discount ?? promo.discount_value;
    return formatCurrency(Number(val));
  };

  const getExportDiscount = (promo: Promotion): string => {
    if (!promo.same_discount_all_packages) return 'Varies';
    const mode = (promo as any).discount_mode || promo.discount_type;
    if (mode === 'percentage') {
      const val = (promo as any).percentage_discount ?? promo.discount_value;
      return `${val}%`;
    }
    const val = (promo as any).flat_rate_discount ?? promo.discount_value;
    return `${Number(val)}฿`;
  };

  const fmtDate = (d: string | null) => d ? format(new Date(d), 'd MMM yyyy').toUpperCase() : '-';

  const buildCsvColumns = (): CsvColumn<Promotion>[] => [
    { key: 'name', header: 'Name', accessor: (r) => r.name },
    { key: 'type', header: 'Type', accessor: (r) => r.type === 'promo_code' ? 'Promo code' : 'Discount' },
    { key: 'promo_code', header: 'Promo code', accessor: (r) => r.promo_code || '-' },
    { key: 'discount', header: 'Discount', accessor: (r) => getExportDiscount(r) },
    { key: 'start_date', header: 'Started on', accessor: (r) => fmtDate(r.start_date) },
    { key: 'end_date', header: 'Ending on', accessor: (r) => fmtDate(r.end_date) },
    { key: 'date_modified', header: 'Date modified', accessor: (r) => fmtDate(r.updated_at) },
    { key: 'status', header: 'Status', accessor: (r) => r.status ?? 'drafts' },
  ];

  const handleExport = () => {
    if (!promotions?.length) { toast.info(t('common.noData')); return; }
    exportToCsv(promotions, buildCsvColumns(), 'promotions');
    toast.success(t('common.export'));
  };

  const handleExportSelected = () => {
    if (!promotions) return;
    const selected = promotions.filter((p) => selectedRows.includes(p.id));
    if (!selected.length) return;
    exportToCsv(selected, buildCsvColumns(), 'promotions-selected');
    toast.success(t('common.export'));
  };

  const handleDownloadTemplate = () => {
    const csv = TEMPLATE_HEADERS.join(',');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'promotions-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloadTemplate'));
  };

  const columns: Column<Promotion>[] = [
    { key: 'name', header: t('lobby.name'), cell: (row) => row.name },
    { key: 'type', header: t('packages.type'), cell: (row) => (
      <StatusBadge variant={row.type === 'promo_code' ? 'pending' : 'default'}>
        {row.type === 'promo_code' ? 'Promo code' : 'Discount'}
      </StatusBadge>
    )},
    { key: 'promoCode', header: t('promotions.promoCode'), cell: (row) => row.promo_code ? (
      <div className="flex items-center gap-2">
        <code className="bg-muted px-2 py-1 rounded text-sm">{row.promo_code}</code>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); copyPromoCode(row.promo_code!); }}>
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    ) : '-' },
    { key: 'discount', header: t('promotions.discount'), cell: (row) => getDiscountDisplay(row) },
    { key: 'startDate', header: t('promotions.startedOn'), cell: (row) => row.start_date ? format(new Date(row.start_date), 'd MMM yyyy', { locale }) : '-' },
    { key: 'endDate', header: t('promotions.endingOn'), cell: (row) => row.end_date ? format(new Date(row.end_date), 'd MMM yyyy', { locale }) : '-' },
  ];

  return (
    <div>
      <PageHeader
        title={t('promotions.title')}
        breadcrumbs={[{ label: t('nav.package') }, { label: t('promotions.title') }]}
        actions={
          <div className="flex items-center gap-2">
            {can('promotions', 'write') && (
              <>
                <ManageDropdown onExport={handleExport} onDownloadTemplate={handleDownloadTemplate} onImport={() => setImportOpen(true)} exportDisabled={!promotions?.length} />
                <Button className="bg-primary hover:bg-primary-hover" onClick={() => navigate('/promotion/create')}>
                  {t('promotions.createPromotion')}
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="mb-6">
        <SearchBar placeholder={t('promotions.searchPlaceholder')} value={search} onChange={setSearch} className="max-w-md" />
      </div>

      <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={(tab) => { setActiveTab(tab); clearSelection(); }} />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={promotions || []}
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/promotion/${row.id}`)}
          emptyMessage={t('common.noData')}
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
          const selected = (promotions || []).filter((p) => selectedRows.includes(p.id));
          bulkDuplicate.mutate(selected, { onSuccess: clearSelection });
        }}
        statusOptions={PROMO_STATUS_OPTIONS}
        onChangeStatus={(status) => { bulkStatus.mutate({ ids: selectedRows, status }, { onSuccess: clearSelection }); }}
        isLoading={isBulkLoading}
      />

      <ImportCenterDialog open={importOpen} onOpenChange={setImportOpen} presetEntity="promotions" />
    </div>
  );
};

export default Promotions;
