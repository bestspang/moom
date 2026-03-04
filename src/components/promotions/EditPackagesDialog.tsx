import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePackages } from '@/hooks/usePackages';
import { usePromotionPackages, useAddPromotionPackage, useRemovePromotionPackage } from '@/hooks/usePromotionPackages';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchBar } from '@/components/common';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface EditPackagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotionId: string;
  currentPackageIds: string[];
}

export const EditPackagesDialog = ({
  open,
  onOpenChange,
  promotionId,
  currentPackageIds,
}: EditPackagesDialogProps) => {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const { data: packages, isLoading } = usePackages(undefined, search);
  const { data: linkedPackages } = usePromotionPackages(promotionId);
  const addPkg = useAddPromotionPackage();
  const removePkg = useRemovePromotionPackage();

  const linkedIds = useMemo(
    () => new Set((linkedPackages || []).map((p) => p.id)),
    [linkedPackages],
  );

  const [pendingAdds, setPendingAdds] = useState<Set<string>>(new Set());
  const [pendingRemoves, setPendingRemoves] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (open) {
      setPendingAdds(new Set());
      setPendingRemoves(new Set());
    }
  }, [open]);

  const isSelected = (id: string) => {
    if (pendingRemoves.has(id)) return false;
    if (pendingAdds.has(id)) return true;
    return linkedIds.has(id);
  };

  const togglePackage = (id: string) => {
    if (linkedIds.has(id)) {
      // Currently linked — toggle remove
      setPendingRemoves((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else {
      // Not linked — toggle add
      setPendingAdds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  const handleSave = async () => {
    try {
      const ops: Promise<void>[] = [];
      for (const pkgId of pendingAdds) {
        ops.push(addPkg.mutateAsync({ promotionId, packageId: pkgId }));
      }
      for (const pkgId of pendingRemoves) {
        ops.push(removePkg.mutateAsync({ promotionId, packageId: pkgId }));
      }
      await Promise.all(ops);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update packages');
    }
  };

  const hasChanges = pendingAdds.size > 0 || pendingRemoves.size > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('promotions.editPackages')}</DialogTitle>
        </DialogHeader>

        <SearchBar
          placeholder={t('common.search')}
          value={search}
          onChange={setSearch}
          className="mb-4"
        />

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))
          ) : (
            packages?.map((pkg) => (
              <label
                key={pkg.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
              >
                <Checkbox
                  checked={isSelected(pkg.id)}
                  onCheckedChange={() => togglePackage(pkg.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {language === 'th' ? pkg.name_th || pkg.name_en : pkg.name_en}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(Number(pkg.price))} · {pkg.sessions ?? '∞'} {t('promotions.sessions')}
                  </p>
                </div>
              </label>
            ))
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || addPkg.isPending || removePkg.isPending}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
