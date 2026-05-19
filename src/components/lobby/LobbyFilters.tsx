import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocations } from '@/hooks/useLocations';

export type MethodFilter = 'all' | 'manual' | 'qr' | 'liff';
export type PackageFilter = 'all' | 'with_package' | 'walk_in';

export interface LobbyFilterState {
  locationId: string; // 'all' | uuid
  method: MethodFilter;
  packageType: PackageFilter;
}

export const DEFAULT_LOBBY_FILTERS: LobbyFilterState = {
  locationId: 'all',
  method: 'all',
  packageType: 'all',
};

interface Props {
  value: LobbyFilterState;
  onChange: (next: LobbyFilterState) => void;
}

export function LobbyFilters({ value, onChange }: Props) {
  const { t } = useLanguage();
  const { data: locations = [] } = useLocations('active');

  const activeCount =
    (value.locationId !== 'all' ? 1 : 0) +
    (value.method !== 'all' ? 1 : 0) +
    (value.packageType !== 'all' ? 1 : 0);

  const reset = () => onChange(DEFAULT_LOBBY_FILTERS);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="h-4 w-4" />
          {t('lobby.filters')}
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {t('lobby.filterLocation')}
          </label>
          <Select
            value={value.locationId}
            onValueChange={(v) => onChange({ ...value, locationId: v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('lobby.filterAll')}</SelectItem>
              {locations.map((loc: any) => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {t('lobby.filterMethod')}
          </label>
          <Select
            value={value.method}
            onValueChange={(v) => onChange({ ...value, method: v as MethodFilter })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('lobby.filterAll')}</SelectItem>
              <SelectItem value="manual">{t('lobby.manual')}</SelectItem>
              <SelectItem value="qr">QR</SelectItem>
              <SelectItem value="liff">LIFF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {t('lobby.filterPackage')}
          </label>
          <Select
            value={value.packageType}
            onValueChange={(v) => onChange({ ...value, packageType: v as PackageFilter })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('lobby.filterAll')}</SelectItem>
              <SelectItem value="with_package">{t('lobby.filterWithPackage')}</SelectItem>
              <SelectItem value="walk_in">{t('lobby.filterWalkIn')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="w-full gap-1.5" onClick={reset}>
            <X className="h-3.5 w-3.5" />
            {t('lobby.clearFilters')}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
