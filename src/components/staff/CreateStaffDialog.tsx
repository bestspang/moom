import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRoles } from '@/hooks/useRoles';
import { useLocations } from '@/hooks/useLocations';
import { useCreateStaffWithPositions } from '@/hooks/useStaff';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const DRAFT_KEY = 'staff-create-draft';

interface Position {
  role_id: string;
  scope_all_locations: boolean;
  location_ids: string[];
}

interface StaffDraft {
  first_name: string;
  last_name: string;
  nickname: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
  address_1: string;
  address_2: string;
  subdistrict: string;
  district: string;
  province: string;
  postal_code: string;
  positions: Position[];
}

const emptyDraft: StaffDraft = {
  first_name: '',
  last_name: '',
  nickname: '',
  date_of_birth: '',
  gender: '',
  phone: '',
  email: '',
  address_1: '',
  address_2: '',
  subdistrict: '',
  district: '',
  province: '',
  postal_code: '',
  positions: [{ role_id: '', scope_all_locations: true, location_ids: [] }],
};

interface CreateStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateStaffDialog: React.FC<CreateStaffDialogProps> = ({ open, onOpenChange }) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { data: roles } = useRoles();
  const { data: locations } = useLocations();
  const createStaff = useCreateStaffWithPositions();

  const [form, setForm] = useState<StaffDraft>(emptyDraft);

  // Load draft
  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setForm({ ...emptyDraft, ...parsed });
          toast.info(t('staff.draftRestored'));
        } catch { /* ignore */ }
      }
    }
  }, [open]);

  // Autosave draft
  useEffect(() => {
    if (open) {
      const timeout = setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [form, open]);

  const handleDiscard = () => {
    localStorage.removeItem(DRAFT_KEY);
    setForm(emptyDraft);
    onOpenChange(false);
  };

  const updateField = useCallback((field: keyof StaffDraft, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const updatePosition = useCallback((index: number, updates: Partial<Position>) => {
    setForm(prev => ({
      ...prev,
      positions: prev.positions.map((p, i) => i === index ? { ...p, ...updates } : p),
    }));
  }, []);

  const addPosition = () => {
    setForm(prev => ({
      ...prev,
      positions: [...prev.positions, { role_id: '', scope_all_locations: true, location_ids: [] }],
    }));
  };

  const removePosition = (index: number) => {
    setForm(prev => ({
      ...prev,
      positions: prev.positions.filter((_, i) => i !== index),
    }));
  };

  const canSubmit = form.first_name.trim() && form.last_name.trim() && form.positions.every(p => p.role_id);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await createStaff.mutateAsync({
        staff: {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          nickname: form.nickname.trim() || null,
          date_of_birth: form.date_of_birth || null,
          gender: form.gender || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          address_1: form.address_1.trim() || null,
          address_2: form.address_2.trim() || null,
          subdistrict: form.subdistrict.trim() || null,
          district: form.district.trim() || null,
          province: form.province.trim() || null,
          postal_code: form.postal_code.trim() || null,
          status: 'active',
        } as any,
        positions: form.positions.filter(p => p.role_id).map(p => ({
          role_id: p.role_id,
          scope_all_locations: p.scope_all_locations,
          location_ids: p.scope_all_locations ? [] : p.location_ids,
        })),
      });
      localStorage.removeItem(DRAFT_KEY);
      setForm(emptyDraft);
      onOpenChange(false);
    } catch { /* toast handled in hook */ }
  };

  const formContent = (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">{t('staff.profile')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('staff.firstName')} *</Label>
            <Input
              placeholder={t('staff.firstName')}
              value={form.first_name}
              onChange={e => updateField('first_name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('staff.lastName')} *</Label>
            <Input
              placeholder={t('staff.lastName')}
              value={form.last_name}
              onChange={e => updateField('last_name', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t('staff.nickname')}</Label>
          <Input
            placeholder={t('staff.nickname')}
            value={form.nickname}
            onChange={e => updateField('nickname', e.target.value)}
          />
        </div>
      </div>

      <Separator />

      {/* Demographics */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">{t('staff.demographics')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('staff.dateOfBirth')}</Label>
            <Input
              type="date"
              value={form.date_of_birth}
              onChange={e => updateField('date_of_birth', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('staff.gender')}</Label>
            <Select value={form.gender} onValueChange={v => updateField('gender', v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('staff.selectGender')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t('staff.genderMale')}</SelectItem>
                <SelectItem value="female">{t('staff.genderFemale')}</SelectItem>
                <SelectItem value="other">{t('staff.genderOther')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Contact Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">{t('staff.contactNumber')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('staff.contactNumber')}</Label>
            <Input
              placeholder="0xx-xxx-xxxx"
              value={form.phone}
              onChange={e => updateField('phone', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('leads.email')}</Label>
            <Input
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={e => updateField('email', e.target.value)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Address Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">{t('staff.address')}</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t('staff.address1')}</Label>
            <Input
              placeholder={t('staff.address1')}
              value={form.address_1}
              onChange={e => updateField('address_1', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('staff.address2')}</Label>
            <Input
              placeholder={t('staff.address2')}
              value={form.address_2}
              onChange={e => updateField('address_2', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('staff.subdistrict')}</Label>
              <Input
                placeholder={t('staff.subdistrict')}
                value={form.subdistrict}
                onChange={e => updateField('subdistrict', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('staff.district')}</Label>
              <Input
                placeholder={t('staff.district')}
                value={form.district}
                onChange={e => updateField('district', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('staff.province')}</Label>
              <Input
                placeholder={t('staff.province')}
                value={form.province}
                onChange={e => updateField('province', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('staff.postalCode')}</Label>
              <Input
                placeholder={t('staff.postalCode')}
                value={form.postal_code}
                onChange={e => updateField('postal_code', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Positions Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">{t('staff.positions')}</h3>
        {form.positions.map((pos, i) => (
          <div key={i} className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Position {i + 1}</span>
              {form.positions.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removePosition(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('nav.roles')}</Label>
              <Select value={pos.role_id} onValueChange={v => updatePosition(i, { role_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('nav.roles')} />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={pos.scope_all_locations}
                onCheckedChange={v => updatePosition(i, { scope_all_locations: v, location_ids: [] })}
              />
              <Label className="text-sm">
                {pos.scope_all_locations ? t('staff.allLocations') : t('staff.specificLocations')}
              </Label>
            </div>
            {!pos.scope_all_locations && (
              <div className="space-y-2">
                {locations?.map(loc => (
                  <label key={loc.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pos.location_ids.includes(loc.id)}
                      onChange={e => {
                        const ids = e.target.checked
                          ? [...pos.location_ids, loc.id]
                          : pos.location_ids.filter(id => id !== loc.id);
                        updatePosition(i, { location_ids: ids });
                      }}
                      className="rounded border-input"
                    />
                    {loc.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addPosition} className="w-full">
          <Plus className="h-4 w-4 mr-1" />
          {t('staff.addPosition')}
        </Button>
      </div>
    </div>
  );

  const footerContent = (
    <div className="flex items-center justify-between w-full">
      <p className="text-xs text-muted-foreground">
        {!canSubmit && t('staff.requiredFields')}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleDiscard}>
          {t('staff.discardDraft')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || createStaff.isPending}
          className="bg-primary hover:bg-primary-hover"
        >
          {createStaff.isPending ? t('common.loading') : t('common.create')}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{t('staff.createStaff')}</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="px-4 pb-4 overflow-y-auto max-h-[70vh]">
            {formContent}
          </ScrollArea>
          <DrawerFooter>{footerContent}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('staff.createStaff')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-1 overflow-y-auto">
          {formContent}
        </ScrollArea>
        <DialogFooter>{footerContent}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
};