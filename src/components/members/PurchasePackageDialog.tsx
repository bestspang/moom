import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package } from 'lucide-react';
import { usePackages } from '@/hooks/usePackages';
import { useAssignPackageToMember } from '@/hooks/useMemberDetails';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';

interface PurchasePackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
}

export const PurchasePackageDialog = ({ open, onOpenChange, memberId, memberName }: PurchasePackageDialogProps) => {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);

  const { data: packages, isLoading } = usePackages('on_sale', search);
  const assignMutation = useAssignPackageToMember();

  const handleAssign = () => {
    const pkg = packages?.find((p) => p.id === selectedPkgId);
    if (!pkg) return;
    assignMutation.mutate(
      { memberId, pkg: { id: pkg.id, name_en: pkg.name_en, sessions: pkg.sessions } },
      {
        onSuccess: () => {
          setSelectedPkgId(null);
          setSearch('');
          onOpenChange(false);
        },
      }
    );
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'unlimited': return 'Unlimited';
      case 'session': return 'Session';
      case 'pt': return 'PT';
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('members.purchasePackage')}</DialogTitle>
          <p className="text-sm text-muted-foreground">{memberName}</p>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 min-h-0 max-h-[40vh]">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)
          ) : !packages?.length ? (
            <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>
          ) : (
            packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPkgId(pkg.id === selectedPkgId ? null : pkg.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  pkg.id === selectedPkgId
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {language === 'th' && pkg.name_th ? pkg.name_th : pkg.name_en}
                    </span>
                  </div>
                  <Badge variant="secondary">{typeLabel(pkg.type)}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground ml-6">
                  <span>{formatCurrency(pkg.price)}</span>
                  {pkg.sessions && <span>{pkg.sessions} sessions</span>}
                  <span>{pkg.term_days} days</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedPkgId || assignMutation.isPending}
          >
            {assignMutation.isPending ? t('common.saving') : t('common.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
