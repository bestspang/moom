import React, { useState } from 'react';
import { useEconomyGuardrails, EconomyGuardrail } from '@/hooks/useEconomyGuardrails';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const GamificationGuardrails = () => {
  const { data: guardrails, isLoading, updateGuardrail } = useEconomyGuardrails();
  const [edits, setEdits] = useState<Record<string, { rule_value: string; is_active: boolean }>>({});

  if (isLoading) {
    return <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  const getEdit = (g: EconomyGuardrail) => edits[g.id] ?? { rule_value: g.rule_value, is_active: g.is_active ?? true };
  const isDirty = (g: EconomyGuardrail) => {
    const e = edits[g.id];
    return e && (e.rule_value !== g.rule_value || e.is_active !== (g.is_active ?? true));
  };

  const handleSave = (g: EconomyGuardrail) => {
    const e = getEdit(g);
    updateGuardrail.mutate({ id: g.id, rule_code: g.rule_code, rule_value: e.rule_value, is_active: e.is_active, old_rule_value: g.rule_value, old_is_active: g.is_active ?? true });
    setEdits((prev) => { const n = { ...prev }; delete n[g.id]; return n; });
  };

  const categorize = (code: string) => {
    if (code.startsWith('PACKAGE_')) return 'Package';
    if (code.startsWith('SHOP_')) return 'Shop';
    if (code.startsWith('REFERRAL_')) return 'Referral';
    if (code.startsWith('ROLLBACK_') || code.startsWith('DAILY_') || code.startsWith('ANTI_')) return 'Safety';
    return 'Other';
  };

  const grouped = (guardrails ?? []).reduce<Record<string, EconomyGuardrail[]>>((acc, g) => {
    const cat = categorize(g.rule_code);
    (acc[cat] = acc[cat] || []).push(g);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Economy Guardrails</h2>
        <p className="text-sm text-muted-foreground">
          These values drive package/shop XP & Coin calculations, caps, and safety rules. Changes take effect on the next event processed.
        </p>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{category}</h3>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[280px]">Rule Code</TableHead>
                  <TableHead className="w-[120px]">Value</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[80px]">Active</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((g) => {
                  const edit = getEdit(g);
                  const dirty = isDirty(g);
                  return (
                    <TableRow key={g.id}>
                      <TableCell className="font-mono text-xs">{g.rule_code}</TableCell>
                      <TableCell>
                        <Input
                          className="h-8 w-24 font-mono text-xs"
                          value={edit.rule_value}
                          onChange={(e) =>
                            setEdits((prev) => ({
                              ...prev,
                              [g.id]: { ...edit, rule_value: e.target.value },
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">
                        {g.description || '—'}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={edit.is_active}
                          onCheckedChange={(checked) =>
                            setEdits((prev) => ({
                              ...prev,
                              [g.id]: { ...edit, is_active: checked },
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
                            onClick={() => handleSave(g)}
                            disabled={updateGuardrail.isPending}
                          >
                            {updateGuardrail.isPending ? (
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
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GamificationGuardrails;
