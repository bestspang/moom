import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, DataTable, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Workout { id: string; name: string; trackMetric: string; unit: string; description: string; }

const WorkoutList = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const workouts: Workout[] = [
    { id: '1', name: 'Fran', trackMetric: 'Time', unit: 'Mins (Minimize)', description: 'Thrusters, Pull-up' },
    { id: '2', name: 'Grace', trackMetric: 'Time', unit: 'Mins (Minimize)', description: '30 Clean & Jerks (135/95 lbs)' },
    { id: '3', name: 'Isabel', trackMetric: 'Time', unit: 'Mins (Minimize)', description: '30 Snatches (135/95 lbs)' },
    { id: '4', name: 'Helen', trackMetric: 'Time', unit: 'Mins (Minimize)', description: '3 Rounds: 400m run, 21 KB swings, 12 Pull-ups' },
    { id: '5', name: 'Annie', trackMetric: 'Time', unit: 'Mins (Minimize)', description: '50-40-30-20-10 Double-ups, Sit-ups' },
    { id: '6', name: 'Cindy', trackMetric: 'Rounds + Reps', unit: 'Round (Maximize)', description: 'AMRAP 20 min: 5 Pull-ups, 10 Push-ups, 15 Air Squats' },
  ];

  const columns: Column<Workout>[] = [
    { key: 'name', header: t('workouts.workout'), cell: (row) => row.name },
    { key: 'trackMetric', header: t('workouts.trackMetric'), cell: (row) => row.trackMetric },
    { key: 'unit', header: t('workouts.unit'), cell: (row) => row.unit },
    { key: 'description', header: 'Description', cell: (row) => row.description },
  ];

  return (
    <div>
      <PageHeader title={t('workouts.title')} breadcrumbs={[{ label: t('nav.yourGym') }, { label: t('workouts.title') }]} />
      <div className="flex items-center gap-4 mb-6">
        <SearchBar placeholder={t('workouts.searchPlaceholder')} value={search} onChange={setSearch} className="max-w-md" />
        <Button variant="outline">{t('workouts.allTraining')}</Button>
      </div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 mb-4 font-semibold">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          CrossFit
        </CollapsibleTrigger>
        <CollapsibleContent>
          <DataTable columns={columns} data={workouts} rowKey={(row) => row.id} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default WorkoutList;
