import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Pencil, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, DataTable, EmptyState, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
  type TrainingTemplateRow,
  type WorkoutItemRow,
} from '@/hooks/useTrainingTemplates';
import { CreateTrainingDialog } from '@/components/workouts/CreateTrainingDialog';
import { EditWorkoutItemDialog } from '@/components/workouts/EditWorkoutItemDialog';
import { EditTrainingNameDialog } from '@/components/workouts/EditTrainingNameDialog';

const WorkoutList = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [filterTrainingId, setFilterTrainingId] = useState<string | undefined>(undefined);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const toggleSection = (id: string) =>
    setOpenSections((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));

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
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t('workouts.createTraining')}
          </Button>
        }
      />

      {/* Search + filter */}
      <div className="flex items-center gap-4 mb-6">
        <SearchBar
          placeholder={t('workouts.searchPlaceholder')}
          value={search}
          onChange={setSearch}
          className="max-w-md"
        />
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
              <SelectItem key={tr.id} value={tr.id}>
                {tr.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Training groups */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : !trainings?.length ? (
        <EmptyState
          variant="workouts"
          message={t('workouts.noTrainings')}
          description={t('workouts.noTrainingsDesc')}
        />
      ) : (
        <div className="space-y-4">
          {trainings.map((training: TrainingTemplateRow) => {
            const isOpen = openSections[training.id] ?? true;
            return (
              <Collapsible
                key={training.id}
                open={isOpen}
                onOpenChange={() => toggleSection(training.id)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <CollapsibleTrigger className="flex items-center gap-2 font-semibold">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    {training.name}
                  </CollapsibleTrigger>
                  <Switch
                    checked={training.is_active}
                    onCheckedChange={(checked) =>
                      updateTraining.mutate({ id: training.id, is_active: checked })
                    }
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
                  <DataTable
                    columns={columns}
                    data={training.workout_items}
                    rowKey={(row) => row.id}
                  />
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      <CreateTrainingDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* Edit workout item dialog */}
      {editItem && (
        <EditWorkoutItemDialog
          open={!!editItem}
          onOpenChange={(v) => { if (!v) setEditItem(null); }}
          item={editItem}
        />
      )}

      {/* Edit training name dialog */}
      {editTraining && (
        <EditTrainingNameDialog
          open={!!editTraining}
          onOpenChange={(v) => { if (!v) setEditTraining(null); }}
          training={editTraining}
        />
      )}

      {/* Delete workout item confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(v) => { if (!v) setDeleteItem(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workouts.deleteWorkoutTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('workouts.deleteWorkoutDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteItem) {
                  deleteWorkoutItemMutation.mutate({ id: deleteItem.id, name: deleteItem.name });
                  setDeleteItem(null);
                }
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete training confirmation */}
      <AlertDialog open={!!deleteTraining} onOpenChange={(v) => { if (!v) setDeleteTraining(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workouts.deleteTrainingTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('workouts.deleteTrainingDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTraining) {
                  deleteTrainingMutation.mutate({ id: deleteTraining.id, name: deleteTraining.name });
                  setDeleteTraining(null);
                }
              }}
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
