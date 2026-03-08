import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { StatCard } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import type { Expense } from '@/hooks/useExpenses';

interface PnLData {
  revenue: { packages: number; pt: number; other: number; total: number };
  expenseTotal: number;
  expensesByCategory: { category: string; amount: number }[];
  netProfit: number;
}

interface FinancePnLProps {
  pnl: PnLData;
  expenses: Expense[] | undefined;
  expensesLoading: boolean;
  onCreateExpense: (expense: { date: string; category: string; amount: number; description?: string }, opts: { onSuccess: () => void }) => void;
  isCreating: boolean;
  onDeleteExpense: (id: string) => void;
}

export const FinancePnL = ({
  pnl,
  expenses,
  expensesLoading,
  onCreateExpense,
  isCreating,
  onDeleteExpense,
}: FinancePnLProps) => {
  const { t } = useLanguage();
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ date: '', category: 'rent', amount: '', description: '' });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title={t('finance.pnlRevenue')} value={formatCurrency(pnl.revenue.total)} color="teal" />
        <StatCard title={t('finance.pnlExpenses')} value={formatCurrency(pnl.expenseTotal)} color="orange" />
        <StatCard
          title={t('finance.pnlNetProfit')}
          value={formatCurrency(pnl.netProfit)}
          color={pnl.netProfit >= 0 ? 'blue' : 'gray'}
        />
        <StatCard title={t('finance.pnlMargin')} value={pnl.revenue.total > 0 ? `${Math.round((pnl.netProfit / pnl.revenue.total) * 100)}%` : '0%'} color="magenta" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('finance.revenueBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('finance.pnlPackages')}</span>
                <span className="font-medium">{formatCurrency(pnl.revenue.packages)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('finance.pnlPT')}</span>
                <span className="font-medium">{formatCurrency(pnl.revenue.pt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('finance.pnlOther')}</span>
                <span className="font-medium">{formatCurrency(pnl.revenue.other)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                <span>{t('finance.pnlTotalRevenue')}</span>
                <span>{formatCurrency(pnl.revenue.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">{t('finance.pnlExpenses')}</CardTitle>
            <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  {t('finance.addExpense')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('finance.addExpense')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>{t('finance.dateTime')}</Label>
                    <Input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((p) => ({ ...p, date: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{t('finance.expenseCategory')}</Label>
                    <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm((p) => ({ ...p, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rent">Rent</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="salary">Salary</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('finance.amount')}</Label>
                    <Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{t('members.description')}</Label>
                    <Input value={expenseForm.description} onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))} />
                  </div>
                  <Button
                    className="w-full"
                    disabled={!expenseForm.amount || isCreating}
                    onClick={() => {
                      onCreateExpense({
                        date: expenseForm.date || new Date().toISOString().split('T')[0],
                        category: expenseForm.category,
                        amount: Number(expenseForm.amount),
                        description: expenseForm.description || undefined,
                      }, {
                        onSuccess: () => {
                          setExpenseDialogOpen(false);
                          setExpenseForm({ date: '', category: 'rent', amount: '', description: '' });
                        },
                      });
                    }}
                  >
                    {t('common.save')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {expensesLoading ? (
              <Skeleton className="h-[120px] w-full" />
            ) : pnl.expensesByCategory.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">{t('finance.noExpenses')}</div>
            ) : (
              <div className="space-y-2">
                {pnl.expensesByCategory.map((ec) => (
                  <div key={ec.category} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{ec.category}</span>
                    <span className="font-medium">{formatCurrency(ec.amount)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                  <span>{t('finance.pnlTotalExpenses')}</span>
                  <span>{formatCurrency(pnl.expenseTotal)}</span>
                </div>
              </div>
            )}

            {(expenses || []).length > 0 && (
              <div className="mt-4 space-y-1 max-h-[200px] overflow-y-auto">
                {(expenses || []).slice(0, 20).map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
                    <div>
                      <span className="text-muted-foreground">{exp.date}</span>
                      <span className="ml-2 capitalize">{exp.category}</span>
                      {exp.description && <span className="ml-2 text-muted-foreground">— {exp.description}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(Number(exp.amount))}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onDeleteExpense(exp.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
