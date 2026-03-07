import React, { useState } from 'react';
import { Target, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGoals, useCreateGoal, useDeleteGoal, type GoalType, type GoalWithProgress } from '@/hooks/useGoals';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrency } from '@/lib/formatters';

const GOAL_ICONS: Record<GoalType, string> = {
  revenue: '💰',
  new_members: '👥',
  retention: '🔄',
  checkins: '🏋️',
};

export const GoalProgressCard: React.FC = () => {
  const { t } = useLanguage();
  const { can } = usePermissions();
  const { data: goals, isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const deleteGoal = useDeleteGoal();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [type, setType] = useState<GoalType>('revenue');
  const [targetValue, setTargetValue] = useState('');

  const handleCreate = () => {
    if (!targetValue) return;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    createGoal.mutate({
      type,
      target_value: Number(targetValue),
      period_start: start.toISOString().slice(0, 10),
      period_end: end.toISOString().slice(0, 10),
    }, {
      onSuccess: () => {
        setDialogOpen(false);
        setTargetValue('');
      },
    });
  };

  const formatValue = (goal: GoalWithProgress) => {
    if (goal.type === 'revenue') return `${formatCurrency(goal.current_value)} / ${formatCurrency(Number(goal.target_value))}`;
    if (goal.type === 'retention') return `${goal.current_value}% / ${goal.target_value}%`;
    return `${goal.current_value} / ${goal.target_value}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!goals?.length && !can('settings', 'write')) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            {t('goals.title')}
          </CardTitle>
          {can('settings', 'write') && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('goals.createGoal')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>{t('goals.type')}</Label>
                    <Select value={type} onValueChange={(v) => setType(v as GoalType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="revenue">{t('goals.typeRevenue')}</SelectItem>
                        <SelectItem value="new_members">{t('goals.typeNewMembers')}</SelectItem>
                        <SelectItem value="retention">{t('goals.typeRetention')}</SelectItem>
                        <SelectItem value="checkins">{t('goals.typeCheckins')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('goals.targetValue')}</Label>
                    <Input
                      type="number"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      placeholder={type === 'retention' ? '80' : '100000'}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{t('goals.periodNote')}</p>
                  <Button onClick={handleCreate} disabled={createGoal.isPending || !targetValue} className="w-full">
                    {t('common.create')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!goals?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t('goals.noGoals')}</p>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <div key={goal.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    {GOAL_ICONS[goal.type]} {t(`goals.type${goal.type.charAt(0).toUpperCase() + goal.type.slice(1).replace('_', '')}` as any) || goal.type}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatValue(goal)}</span>
                    {can('settings', 'write') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteGoal.mutate(goal.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <Progress value={goal.progress} className="h-2" />
                <p className="text-[11px] text-muted-foreground text-right">{goal.progress}%</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
