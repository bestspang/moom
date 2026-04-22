import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { QueryError } from '@/apps/shared/components/QueryError';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

export default function TrainerWorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: workout, isLoading, isError, refetch } = useQuery({
    queryKey: ['trainer-workout-detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('id, name, training_category, track_metric, unit, description')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isError) return <QueryError onRetry={refetch} />;

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader
        title={isLoading ? '' : (workout?.name ?? '')}
        subtitle={workout?.training_category ?? ''}
      />

      <Section title={t('trainer.workoutDetails')} className="mb-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {workout?.training_category && (
              <div className="flex justify-between items-center rounded-lg bg-card px-4 py-3">
                <span className="text-sm text-muted-foreground">{t('trainer.category')}</span>
                <Badge variant="secondary">{workout.training_category}</Badge>
              </div>
            )}
            {workout?.track_metric && (
              <div className="flex justify-between items-center rounded-lg bg-card px-4 py-3">
                <span className="text-sm text-muted-foreground">{t('trainer.metric')}</span>
                <span className="text-sm font-medium">{workout.track_metric}{workout.unit ? ` (${workout.unit})` : ''}</span>
              </div>
            )}
            {workout?.description && (
              <div className="rounded-lg bg-card px-4 py-3">
                <p className="text-sm text-muted-foreground mb-1">{t('trainer.description')}</p>
                <p className="text-sm">{workout.description}</p>
              </div>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}
