import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { ListCard } from '@/apps/shared/components/ListCard';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { QueryError } from '@/apps/shared/components/QueryError';
import { Skeleton } from '@/components/ui/skeleton';
import { Dumbbell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function TrainerWorkoutsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['trainer-workouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('id, name, training_category, track_metric, unit, description')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('trainer.nav.workouts')} subtitle={t('trainer.trainingTemplates')} />
      {isError ? (
        <QueryError onRetry={() => refetch()} />
      ) : isLoading ? (
        <Section><div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div></Section>
      ) : !data?.length ? (
        <EmptyState icon={<Dumbbell className="h-10 w-10" />} title={t('trainer.noWorkoutsYet')} description={t('trainer.workoutsWillAppear')} />
      ) : (
        <Section>
          <div className="space-y-2">
            {data.map(w => (
              <ListCard
                key={w.id}
                title={w.name}
                subtitle={w.training_category ?? undefined}
                meta={w.track_metric ? `${w.track_metric} (${w.unit})` : undefined}
                onClick={() => navigate(`/trainer/workouts/${w.id}`)}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
