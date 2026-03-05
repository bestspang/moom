import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Plus, Pencil, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, DataTable, EmptyState, ManageDropdown, BulkActionBar, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useTrainingTemplates,
  useUpdateTraining,
  useDeleteTraining,
  useDeleteWorkoutItem,
  useBulkToggleTrainings,
  useBulkDeleteTrainings,
  useBulkDuplicateTrainings,
  type TrainingTemplateRow,
  type WorkoutItemRow,
} from '@/hooks/useTrainingTemplates';
import { CreateTrainingDialog } from '@/components/workouts/CreateTrainingDialog';
import { EditWorkoutItemDialog } from '@/components/workouts/EditWorkoutItemDialog';
import { EditTrainingNameDialog } from '@/components/workouts/EditTrainingNameDialog';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';
import { toast } from 'sonner';

const TEMPLATE_HEADERS = ['training_name', 'workout_name', 'track_metric', 'unit', 'goal_type', 'description'];

const TRAINING_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const WorkoutList = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [filterTrainingId, setFilterTrainingId] = useState<string | undefined>(undefined);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Edit states
  const [editItem, setEditItem] = useState<WorkoutItemRow | null>(null);
  const [editTraining, setEditTraining] = useState<TrainingTemplateRow | null>(null);

  // Delete states
  const [deleteItem, setDeleteItem] = useState<WorkoutItemRow | null>(null);
  const [deleteTraining, setDeleteTraining] = useState<TrainingTemplateRow | null>(null);

  const { data: allTrainings } = useTrainingTemplates();
  const { data: trainings, isLoading } = useTrainingTemplates(search, filterTrainingId);
  const updateTraining = useUpdateTraining();
  const deleteTrainingMutation = useDeleteTraining();
  const deleteWorkoutItemMutation = useDeleteWorkoutItem();

  const bulkToggle = useBulkToggleTrainings();
  const bulkDeleteMut = useBulkDeleteTrainings();
  const bulkDuplicate = useBulkDuplicateTrainings();
  const isBulkLoading = bulkToggle.isPending || bulkDeleteMut.isPending || bulkDuplicate.isPending;

  const handleSelectRow = useCallback((id: string) => {
    setSelectedRows((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  }, []);

  const clearSelection = useCallback(() => setSelectedRows([]), []);

  const toggleSection = (id: string) =>
    setOpenSections((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));

  const buildFlatItems = (data: TrainingTemplateRow[]) => {
    const flatItems: any[] = [];
    data.forEach((tr) => {
      tr.workout_items.forEach((item) => {
        flatItems.push({ training_name: tr.name, ...item });
      });
    });
    return flatItems;
  };

  const csvColumns: CsvColumn<any>[] = [
    { key: 'training_name', header: 'Training Name', accessor: (r) => r.training_name },
    { key: 'name', header: 'Workout Name', accessor: (r) => r.name },
    { key: 'track_metric', header: 'Track Metric', accessor: (r) => r.track_metric },
    { key: 'unit', header: 'Unit', accessor: (r) => r.unit },
    { key: 'goal_type', header: 'Goal Type', accessor: (r) => r.goal_type },
    { key: 'description', header: 'Description', accessor: (r) => r.description },
  ];

  const handleExport = () => {
    if (!trainings?.length) { toast.info(t('common.noData')); return; }
    exportToCsv(buildFlatItems(trainings), csvColumns, 'workouts');
    toast.success(t('common.export'));
  };

  const handleExportSelected = () => {
    if (!trainings) return;
    const selected = trainings.filter((tr) => selectedRows.includes(tr.id));
    if (!selected.length) return;
    exportToCsv(buildFlatItems(selected), csvColumns, 'workouts-selected');
    toast.success(t('common.export'));
  };

  const handleDownloadTemplate = () => {
    const csv = TEMPLATE_HEADERS.join(',');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'workouts-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloadTemplate'));
  };

  const columns: Column<WorkoutItemRow>[] = [
    { key: 'name', header: t('workouts.workout'), cell: (row) => row.name },
    { key: 'track_metric', header: t('workouts.trackMetric'), cell: (row) => row.track_metric ?? '—' },
    { key: 'unit', header: t('workouts.unit'), cell: (row) => row.unit ?? '—' },
    { key: 'goal_type', header: t('workouts.goalType'), cell: (row) => row.goal_type ?? '—' },
    { key: 'description', header: t('workouts.description'), cell: (row) => row.description ?? '—' },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditItem(row)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteItem(row)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
      className: 'w-20',
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('workouts.title')}
        breadcrumbs={[{ label: t('nav.yourGym') }, { label: t('workouts.title') }]}
        actions={
          <div className="flex items-center gap-2">
            <ManageDropdown onExport={handleExport} onDownloadTemplate={handleDownloadTemplate} exportDisabled={!trainings?.length} />
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {t('workouts.createTraining')}
            </Button>
          </div>
        }
      />

      {/* Search + filter */}
      <div className="flex items-center gap-4 mb-6">
        <SearchBar placeholder={t('workouts.searchPlaceholder')} value={search} onChange={setSearch} className="max-w-md" />
        <Select
          value={filterTrainingId ?? '__all__'}
          onValueChange={(v) => setFilterTrainingId(v === '__all__' ? undefined : v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('workouts.allTraining')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('workouts.allTraining')}</SelectItem>
            {(allTrainings ?? []).map((tr) => (
              <SelectItem key={tr.id} value={tr.id}>{tr.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Training groups */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : !trainings?.length ? (
        <EmptyState variant="workouts" message={t('workouts.noTrainings')} description={t('workouts.noTrainingsDesc')} />
      ) : (
        <div className="space-y-4">
          {trainings.map((training: TrainingTemplateRow) => {
            const isOpen = openSections[training.id] ?? true;
            const isSelected = selectedRows.includes(training.id);
            return (
              <Collapsible key={training.id} open={isOpen} onOpenChange={() => toggleSection(training.id)}>
                <div className="flex items-center gap-3 mb-2">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleSelectRow(training.id)}
                  />
                  <CollapsibleTrigger className="flex items-center gap-2 font-semibold">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {training.name}
                  </CollapsibleTrigger>
                  <Switch
                    checked={training.is_active}
                    onCheckedChange={(checked) => updateTraining.mutate({ id: training.id, is_active: checked })}
                  />
                  <span className="text-xs text-muted-foreground">
                    {training.is_active ? t('workouts.active') : t('workouts.inactive')}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditTraining(training)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTraining(training)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <CollapsibleContent>
                  <DataTable columns={columns} data={training.workout_items} rowKey={(row) => row.id} />
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      <BulkActionBar
        selectedCount={selectedRows.length}
        onClearSelection={clearSelection}
        onDelete={() => { bulkDeleteMut.mutate(selectedRows, { onSuccess: clearSelection }); }}
        onExport={handleExportSelected}
        onDuplicate={() => {
          const selected = (trainings || []).filter((tr) => selectedRows.includes(tr.id));
          bulkDuplicate.mutate(selected, { onSuccess: clearSelection });
        }}
        statusOptions={TRAINING_STATUS_OPTIONS}
        onChangeStatus={(status) => {
          bulkToggle.mutate({ ids: selectedRows, is_active: status === 'active' }, { onSuccess: clearSelection });
        }}
        isLoading={isBulkLoading}
      />

      <CreateTrainingDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {editItem && (
        <EditWorkoutItemDialog open={!!editItem} onOpenChange={(v) => { if (!v) setEditItem(null); }} item={editItem} />
      )}

      {editTraining && (
        <EditTrainingNameDialog open={!!editTraining} onOpenChange={(v) => { if (!v) setEditTraining(null); }} training={editTraining} />
      )}

      <AlertDialog open={!!deleteItem} onOpenChange={(v) => { if (!v) setDeleteItem(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workouts.deleteWorkoutTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('workouts.deleteWorkoutDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteItem) { deleteWorkoutItemMutation.mutate({ id: deleteItem.id, name: deleteItem.name }); setDeleteItem(null); } }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTraining} onOpenChange={(v) => { if (!v) setDeleteTraining(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workouts.deleteTrainingTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('workouts.deleteTrainingDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTraining) { deleteTrainingMutation.mutate({ id: deleteTraining.id, name: deleteTraining.name }); setDeleteTraining(null); } }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkoutList;
