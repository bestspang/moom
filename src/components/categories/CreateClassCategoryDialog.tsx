import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateClassCategory } from '@/hooks/useClassCategories';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateClassCategoryDialog = ({ open, onOpenChange }: Props) => {
  const { t } = useLanguage();
  const createMutation = useCreateClassCategory();
  const [name, setName] = useState('');
  const [nameTh, setNameTh] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createMutation.mutate(
      { name: name.trim(), name_th: nameTh.trim() || null },
      {
        onSuccess: () => {
          setName('');
          setNameTh('');
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('categories.createCategory')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('categories.nameEn')} *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('categories.nameEnPlaceholder')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nameTh">{t('categories.nameTh')}</Label>
            <Input
              id="nameTh"
              value={nameTh}
              onChange={(e) => setNameTh(e.target.value)}
              placeholder={t('categories.nameThPlaceholder')}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!name.trim() || createMutation.isPending}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClassCategoryDialog;
