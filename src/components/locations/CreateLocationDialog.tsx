import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateLocation } from '@/hooks/useLocations';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LocationFormFields, defaultLocationForm, type LocationFormData } from './LocationFormFields';
import { toast } from 'sonner';

interface CreateLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateLocationDialog = ({ open, onOpenChange }: CreateLocationDialogProps) => {
  const { t } = useLanguage();
  const [form, setForm] = useState<LocationFormData>({ ...defaultLocationForm });
  const createMutation = useCreateLocation();

  const handleSave = () => {
    if (!form.location_id.trim() || !form.name.trim()) {
      toast.error(t('common.requiredFields'));
      return;
    }

    createMutation.mutate(
      {
        location_id: form.location_id.trim(),
        name: form.name.trim(),
        contact_number: form.contact_number.trim() || null,
        status: form.status,
        categories: form.categories,
        opening_hours: form.opening_hours as any,
      },
      {
        onSuccess: () => {
          toast.success(t('locations.createSuccess'));
          setForm({ ...defaultLocationForm });
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('locations.createLocation')}</DialogTitle>
        </DialogHeader>
        <LocationFormFields form={form} onChange={setForm} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={createMutation.isPending}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
