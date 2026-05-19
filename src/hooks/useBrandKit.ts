import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { logActivity } from '@/lib/activityLogger';
import { queryKeys } from '@/lib/queryKeys';
import { DEFAULT_BRAND, type BrandKit } from '@/components/branding/brandDefaults';

const SECTION = 'branding';
const KEY = 'brand_kit';

const merge = (raw: unknown): BrandKit => {
  if (!raw || typeof raw !== 'object') return DEFAULT_BRAND;
  const r = raw as Partial<BrandKit>;
  return {
    ...DEFAULT_BRAND,
    ...r,
    social: { ...DEFAULT_BRAND.social, ...(r.social ?? {}) },
    contact: { ...DEFAULT_BRAND.contact, ...(r.contact ?? {}) },
  };
};

export const useBrandKit = () => {
  return useQuery({
    queryKey: queryKeys.settings(SECTION),
    queryFn: async (): Promise<BrandKit> => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('section', SECTION)
        .eq('key', KEY)
        .maybeSingle();
      if (error) throw error;
      return merge(data?.value);
    },
  });
};

export const useSaveBrandKit = () => {
  const qc = useQueryClient();
  const { t } = useLanguage();
  return useMutation({
    mutationFn: async (kit: BrandKit) => {
      const { error } = await supabase
        .from('settings')
        .upsert(
          [{ section: SECTION, key: KEY, value: kit as unknown as Json }],
          { onConflict: 'section,key' }
        );
      if (error) throw error;
      return kit;
    },
    onSuccess: (kit) => {
      qc.invalidateQueries({ queryKey: queryKeys.settings(SECTION) });
      logActivity({
        event_type: 'setting_updated',
        activity: `Branding kit updated`,
        entity_type: 'setting',
        new_value: { section: SECTION, key: KEY, name: kit.name } as Record<string, unknown>,
      });
      toast.success(t('settings.branding.savedToast'));
    },
    onError: (err: Error) => {
      console.error('[useSaveBrandKit] save failed', err);
      toast.error(err.message);
    },
  });
};
