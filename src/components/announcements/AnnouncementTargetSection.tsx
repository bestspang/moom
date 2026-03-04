import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocations } from '@/hooks/useLocations';

interface Props {
  targetMode: string;
  targetLocationIds: string[];
  onModeChange: (mode: string) => void;
  onLocationIdsChange: (ids: string[]) => void;
}

export const AnnouncementTargetSection = ({
  targetMode,
  targetLocationIds,
  onModeChange,
  onLocationIdsChange,
}: Props) => {
  const { t } = useLanguage();
  const { data: locations } = useLocations();

  const toggleLocation = (id: string) => {
    onLocationIdsChange(
      targetLocationIds.includes(id)
        ? targetLocationIds.filter((l) => l !== id)
        : [...targetLocationIds, id]
    );
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{t('announcements.targetLocations')}</Label>
      <RadioGroup value={targetMode} onValueChange={onModeChange}>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="all" id="target-all" />
          <Label htmlFor="target-all" className="text-sm font-normal cursor-pointer">
            {t('announcements.allLocations')}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="specific" id="target-specific" />
          <Label htmlFor="target-specific" className="text-sm font-normal cursor-pointer">
            {t('announcements.specificLocations')}
          </Label>
        </div>
      </RadioGroup>

      {targetMode === 'specific' && locations && locations.length > 0 && (
        <div className="ml-6 space-y-2 rounded-md border p-3 max-h-40 overflow-y-auto">
          {locations.map((loc) => (
            <div key={loc.id} className="flex items-center gap-2">
              <Checkbox
                id={`loc-${loc.id}`}
                checked={targetLocationIds.includes(loc.id)}
                onCheckedChange={() => toggleLocation(loc.id)}
              />
              <Label htmlFor={`loc-${loc.id}`} className="text-sm font-normal cursor-pointer">
                {loc.name}
              </Label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
