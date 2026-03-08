import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { PageHeader, SearchBar, DataTable, StatusBadge, ManageDropdown, BulkActionBar, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClasses, useBulkUpdateClassStatus, useBulkDeleteClasses, useBulkDuplicateClasses } from '@/hooks/useClasses';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type ClassRow = Tables<'classes'> & { category?: { id: string; name: string } | null };

const CLASS_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'drafts', label: 'Drafts' },
  { value: 'archive', label: 'Archive' },
];

const TEMPLATE_HEADERS = ['Name', 'Name (TH)', 'Type', 'Category', 'Level', 'Duration', 'Status'];

const Classes = () => {
  const { t, language } = useLanguage();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const { data: classesResult, isLoading } = useClasses(
    undefined, search, undefined, undefined, undefined, page, perPage
  );
  const classes = classesResult?.rows as ClassRow[] | undefined;
  const total = classesResult?.total ?? 0;

  const bulkStatus = useBulkUpdateClassStatus();
  const bulkDelete = useBulkDeleteClasses();
  const bulkDuplicate = useBulkDuplicateClasses();
  const isBulkLoading = bulkStatus.isPending || bulkDelete.isPending || bulkDuplicate.isPending;

  const handleSelectRow = useCallback((id: string) => {
    setSelectedRows((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!classes) return;
    setSelectedRows((prev) => prev.length === classes.length ? [] : classes.map((c) => c.id));
  }, [classes]);

  const clearSelection = useCallback(() => setSelectedRows([]), []);

  const getLevelLabel = (level: string | null) => {
    switch (level) {
      case 'all_levels': return t('classes.allLevels');
      case 'beginner': return t('classes.beginner');
      case 'intermediate': return t('classes.intermediate');
      case 'advanced': return t('classes.advanced');
      default: return level || '-';
    }
  };

  const buildCsvColumns = (data: ClassRow[]): CsvColumn<ClassRow>[] => [
    { key: 'name', header: 'Name', accessor: (r) => r.name },
    { key: 'name_th', header: 'Name (TH)', accessor: (r) => r.name_th || '' },
    { key: 'type', header: 'Type', accessor: (r) => r.type === 'pt' ? 'PT' : 'Class' },
    { key: 'category', header: 'Category', accessor: (r) => r.category?.name || '-' },
    { key: 'level', header: 'Level', accessor: (r) => r.level || '-' },
    { key: 'duration', header: 'Duration', accessor: (r) => r.duration || 60 },
    { key: 'status', header: 'Status', accessor: (r) => r.status || 'active' },
  ];

  const handleExport = () => {
    if (!classes?.length) { toast.info(t('common.noData')); return; }
    exportToCsv(classes, buildCsvColumns(classes), 'classes');
    toast.success(t('common.export'));
  };

  const handleExportSelected = () => {
    if (!classes) return;
    const selected = classes.filter((c) => selectedRows.includes(c.id));
    if (!selected.length) return;
    exportToCsv(selected, buildCsvColumns(selected), 'classes-selected');
    toast.success(t('common.export'));
  };

  const handleDownloadTemplate = () => {
    const csv = TEMPLATE_HEADERS.join(',');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'classes-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloadTemplate'));
  };

  const columns: Column<ClassRow>[] = [
    { key: 'name', header: t('classes.className'), cell: (row) => row.name },
    {
      key: 'type',
      header: t('packages.type'),
      cell: (row) => (
        <StatusBadge variant={row.type === 'pt' ? 'pending' : 'default'}>
          {row.type === 'pt' ? 'PT' : 'Class'}
        </StatusBadge>
      ),
    },
    {
      key: 'categories',
      header: t('packages.categories'),
      cell: (row) => row.category?.name || '-',
    },
    { key: 'level', header: t('classes.level'), cell: (row) => getLevelLabel(row.level) },
    { key: 'duration', header: t('classes.duration'), cell: (row) => row.duration || 60 },
  ];

  return (
    <div>
      <PageHeader
        title={t('classes.title')}
        breadcrumbs={[{ label: t('nav.yourGym') }, { label: t('classes.title') }]}
        actions={
          <div className="flex items-center gap-2">
            <ManageDropdown onExport={handleExport} onDownloadTemplate={handleDownloadTemplate} exportDisabled={!classes?.length} />
            <Button className="bg-primary hover:bg-primary-hover" onClick={() => navigate('/class/create')}>
              {t('classes.createClass')}
            </Button>
          </div>
        }
      />

      <SearchBar
        placeholder={t('classes.searchPlaceholder')}
        value={search}
        onChange={(v) => { setSearch(v); setPage(1); clearSelection(); }}
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
          data={classes || []}
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/class/${row.id}`)}
          emptyMessage={t('classes.noClasses')}
          pagination={{ page, perPage, total }}
          onPageChange={setPage}
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
          const selected = (classes || []).filter((c) => selectedRows.includes(c.id));
          bulkDuplicate.mutate(selected, { onSuccess: clearSelection });
        }}
        statusOptions={CLASS_STATUS_OPTIONS}
        onChangeStatus={(status) => { bulkStatus.mutate({ ids: selectedRows, status }, { onSuccess: clearSelection }); }}
        isLoading={isBulkLoading}
      />
    </div>
  );
};

export default Classes;
