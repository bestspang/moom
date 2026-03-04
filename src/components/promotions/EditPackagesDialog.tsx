import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePackages } from '@/hooks/usePackages';
import { useUpdatePromotion } from '@/hooks/usePromotions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchBar } from '@/components/common';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tables } from '@/integrations/supabase/types';

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
  const [selected, setSelected] = useState<string[]>(currentPackageIds);
  const { data: packages, isLoading } = usePackages(undefined, search);
  const updatePromotion = useUpdatePromotion();

  // Reset selection when dialog opens
  React.useEffect(() => {
    if (open) setSelected(currentPackageIds);
  }, [open, currentPackageIds]);

  const togglePackage = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    updatePromotion.mutate(
      { id: promotionId, data: { applicable_packages: selected } },
      { onSuccess: () => onOpenChange(false) }
    );
  };

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
                  checked={selected.includes(pkg.id)}
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
          <Button onClick={handleSave} disabled={updatePromotion.isPending}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
