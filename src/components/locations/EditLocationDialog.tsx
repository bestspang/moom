import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUpdateLocation, useDeleteLocation } from '@/hooks/useLocations';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { LocationFormFields, type LocationFormData } from './LocationFormFields';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Location = Tables<'locations'>;

interface EditLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location | null;
}

export const EditLocationDialog = ({ open, onOpenChange, location }: EditLocationDialogProps) => {
  const { t } = useLanguage();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();

  const [form, setForm] = useState<LocationFormData>({
    location_id: '',
    name: '',
    contact_number: '',
    status: 'open',
    categories: [],
    opening_hours: {},
  });

  useEffect(() => {
    if (location) {
      setForm({
        location_id: location.location_id,
        name: location.name,
        contact_number: location.contact_number || '',
        status: location.status || 'open',
        categories: location.categories || [],
        opening_hours: (location as any).opening_hours || {},
      });
    }
  }, [location]);

  const handleSave = () => {
    if (!location) return;
    if (!form.name.trim()) {
      toast.error(t('common.requiredFields'));
      return;
    }

    updateMutation.mutate(
      {
        id: location.id,
        data: {
          name: form.name.trim(),
          contact_number: form.contact_number.trim() || null,
          status: form.status,
          categories: form.categories,
          opening_hours: form.opening_hours as any,
        },
      },
      {
        onSuccess: () => {
          toast.success(t('locations.updateSuccess'));
          onOpenChange(false);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!location) return;
    deleteMutation.mutate(location.id, {
      onSuccess: () => {
        toast.success(t('locations.deleteSuccess'));
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('locations.editLocation')}</DialogTitle>
        </DialogHeader>
        <LocationFormFields form={form} onChange={setForm} isEdit />
        <DialogFooter className="flex justify-between sm:justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                {t('common.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('locations.deleteConfirm')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('locations.deleteConfirmDesc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>{t('common.delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
