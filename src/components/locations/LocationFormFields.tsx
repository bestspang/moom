import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClassCategories } from '@/hooks/useClassCategories';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export interface OpeningHoursEntry {
  open: string;
  close: string;
}

export interface LocationFormData {
  location_id: string;
  name: string;
  contact_number: string;
  status: 'open' | 'closed';
  categories: string[];
  opening_hours: Record<string, OpeningHoursEntry>;
}

interface LocationFormFieldsProps {
  form: LocationFormData;
  onChange: (form: LocationFormData) => void;
  isEdit?: boolean;
}

export const LocationFormFields = ({ form, onChange, isEdit }: LocationFormFieldsProps) => {
  const { t } = useLanguage();
  const { data: classCategories } = useClassCategories();

  const updateField = <K extends keyof LocationFormData>(key: K, value: LocationFormData[K]) => {
    onChange({ ...form, [key]: value });
  };

  const toggleCategory = (catName: string) => {
    const next = form.categories.includes(catName)
      ? form.categories.filter((c) => c !== catName)
      : [...form.categories, catName];
    updateField('categories', next);
  };

  const toggleDay = (day: string) => {
    const next = { ...form.opening_hours };
    if (next[day]) {
      delete next[day];
    } else {
      next[day] = { open: '06:00', close: '22:00' };
    }
    updateField('opening_hours', next);
  };

  const updateDayTime = (day: string, field: 'open' | 'close', value: string) => {
    const next = { ...form.opening_hours };
    if (next[day]) {
      next[day] = { ...next[day], [field]: value };
    }
    updateField('opening_hours', next);
  };

  return (
    <div className="space-y-4">
      {/* Location ID */}
      <div className="space-y-2">
        <Label>{t('locations.id')} *</Label>
        <Input
          value={form.location_id}
          onChange={(e) => updateField('location_id', e.target.value)}
          placeholder="BR-0001"
          disabled={isEdit}
        />
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label>{t('locations.locationName')} *</Label>
        <Input
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder={t('locations.locationName')}
        />
      </div>

      {/* Contact Number */}
      <div className="space-y-2">
        <Label>{t('locations.contactNumber')}</Label>
        <Input
          value={form.contact_number}
          onChange={(e) => updateField('contact_number', e.target.value)}
          placeholder="08X-XXX-XXXX"
        />
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label>{t('locations.status')}</Label>
        <Select value={form.status} onValueChange={(v) => updateField('status', v as 'open' | 'closed')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">{t('locations.open')}</SelectItem>
            <SelectItem value="closed">{t('locations.closed')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <Label>{t('locations.categories')}</Label>
        <div className="grid grid-cols-2 gap-2">
          {classCategories?.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={form.categories.includes(cat.name)}
                onCheckedChange={() => toggleCategory(cat.name)}
              />
              {cat.name}
            </label>
          ))}
        </div>
        {(!classCategories || classCategories.length === 0) && (
          <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
        )}
      </div>

      {/* Opening Hours */}
      <div className="space-y-2">
        <Label>{t('locations.openingHours')}</Label>
        <div className="space-y-2 rounded-md border p-3">
          {WEEKDAYS.map((day) => {
            const isEnabled = !!form.opening_hours[day];
            return (
              <div key={day} className="flex items-center gap-3">
                <Switch checked={isEnabled} onCheckedChange={() => toggleDay(day)} />
                <span className="w-20 text-sm font-medium capitalize">
                  {t(`locations.${day}` as any)}
                </span>
                {isEnabled ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      className="w-28"
                      value={form.opening_hours[day]?.open || '06:00'}
                      onChange={(e) => updateDayTime(day, 'open', e.target.value)}
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                      type="time"
                      className="w-28"
                      value={form.opening_hours[day]?.close || '22:00'}
                      onChange={(e) => updateDayTime(day, 'close', e.target.value)}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">{t('locations.closedDay')}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const defaultLocationForm: LocationFormData = {
  location_id: '',
  name: '',
  contact_number: '',
  status: 'open',
  categories: [],
  opening_hours: {
    monday: { open: '06:00', close: '22:00' },
    tuesday: { open: '06:00', close: '22:00' },
    wednesday: { open: '06:00', close: '22:00' },
    thursday: { open: '06:00', close: '22:00' },
    friday: { open: '06:00', close: '22:00' },
    saturday: { open: '08:00', close: '20:00' },
    sunday: { open: '08:00', close: '20:00' },
  },
};
