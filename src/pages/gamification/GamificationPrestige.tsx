import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Crown, Shield, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface PrestigeCriterion {
  id: string;
  level_number: number;
  criterion_code: string;
  criterion_type: string;
  target_value: number;
  description_en: string | null;
  description_th: string | null;
  is_active: boolean;
}

const LEVEL_ICONS: Record<number, React.ReactNode> = {
  18: <Shield className="h-4 w-4 text-blue-500" />,
  19: <Star className="h-4 w-4 text-purple-500" />,
  20: <Crown className="h-4 w-4 text-amber-500" />,
};

const GamificationPrestige = () => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [edits, setEdits] = useState<Record<string, { target_value: number; is_active: boolean }>>({});

  const { data: criteria, isLoading } = useQuery({
    queryKey: ['prestige-criteria'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prestige_criteria')
        .select('*')
        .order('level_number')
        .order('criterion_code');
      if (error) throw error;
      return data as PrestigeCriterion[];
    },
  });

  const updateCriterion = useMutation({
    mutationFn: async ({ id, target_value, is_active, old_target_value, old_is_active, criterion_code }: { id: string; target_value: number; is_active: boolean; old_target_value: number; old_is_active: boolean; criterion_code: string }) => {
      if (target_value < 0) throw new Error('Target value must be ≥ 0');
      const { error } = await supabase
        .from('prestige_criteria')
        .update({ target_value, is_active })
        .eq('id', id);
      if (error) throw error;

      // Audit log — fire-and-forget
      const { data: { user } } = await supabase.auth.getUser();
      supabase.from('gamification_audit_log').insert({
        event_type: 'admin_update_prestige_criterion',
        action_key: criterion_code,
        staff_id: user?.id ?? null,
        metadata: { criterion_id: id, criterion_code, old_target_value, new_target_value: target_value, old_is_active, new_is_active: is_active },
        flagged: false,
      }).then(({ error: auditErr }) => {
        if (auditErr) console.warn('[audit] prestige log failed:', auditErr.message);
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prestige-criteria'] });
      toast.success(t('gamification.prestige.updateSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  const getEdit = (c: PrestigeCriterion) => edits[c.id] ?? { target_value: c.target_value, is_active: c.is_active };
  const isDirty = (c: PrestigeCriterion) => {
    const e = edits[c.id];
    return e && (e.target_value !== c.target_value || e.is_active !== c.is_active);
  };

  const handleSave = (c: PrestigeCriterion) => {
    const e = getEdit(c);
    updateCriterion.mutate({ id: c.id, target_value: e.target_value, is_active: e.is_active, old_target_value: c.target_value, old_is_active: c.is_active, criterion_code: c.criterion_code });
    setEdits((prev) => { const n = { ...prev }; delete n[c.id]; return n; });
  };

  const grouped = (criteria ?? []).reduce<Record<number, PrestigeCriterion[]>>((acc, c) => {
    (acc[c.level_number] = acc[c.level_number] || []).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('gamification.prestige.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('gamification.prestige.description')}
        </p>
      </div>

      {[18, 19, 20].map((level) => (
        <div key={level} className="space-y-2">
          <div className="flex items-center gap-2">
            {LEVEL_ICONS[level]}
            <h3 className="text-sm font-semibold">Level {level}</h3>
            <Badge variant="outline" className="text-xs">
              {level === 18 ? 'Elite Guardian' : level === 19 ? 'Legend Apprentice' : 'Legend'}
            </Badge>
          </div>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[220px]">{t('gamification.prestige.criterion')}</TableHead>
                  <TableHead className="w-[100px]">{t('gamification.prestige.target')}</TableHead>
                  <TableHead>{t('gamification.prestige.descriptionCol')}</TableHead>
                  <TableHead className="w-[80px]">{t('common.active')}</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(grouped[level] ?? []).map((c) => {
                  const edit = getEdit(c);
                  const dirty = isDirty(c);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.criterion_code}</TableCell>
                      <TableCell>
                        <Input
                          className="h-8 w-20 font-mono text-xs"
                          type="number"
                          value={edit.target_value}
                          onChange={(e) =>
                            setEdits((prev) => ({
                              ...prev,
                              [c.id]: { ...edit, target_value: Number(e.target.value) || 0 },
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.description_en || '—'}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={edit.is_active}
                          onCheckedChange={(checked) =>
                            setEdits((prev) => ({
                              ...prev,
                              [c.id]: { ...edit, is_active: checked },
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {dirty && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => handleSave(c)}
                            disabled={updateCriterion.isPending}
                          >
                            {updateCriterion.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!grouped[level] || grouped[level].length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-4">
                      {t('gamification.prestige.noCriteria')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GamificationPrestige;
