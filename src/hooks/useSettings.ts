import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Json } from '@/integrations/supabase/types';
import { logActivity } from '@/lib/activityLogger';
import { queryKeys } from '@/lib/queryKeys';

export type SettingsSection = 'general' | 'class' | 'client' | 'package' | 'contracts';

export interface Setting {
  id: string;
  section: string;
  key: string;
  value: Json;
  created_at: string | null;
  updated_at: string | null;
}

export const useSettings = (section: SettingsSection) => {
  return useQuery({
    queryKey: queryKeys.settings(section),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('section', section);

      if (error) throw error;
      
      // Convert array to key-value object for easier access
      const settingsMap: Record<string, Json> = {};
      data?.forEach((setting) => {
        settingsMap[setting.key] = setting.value;
      });
      
      return settingsMap;
    },
  });
};

export const useUpdateSetting = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ 
      section, 
      key, 
      value 
    }: { 
      section: SettingsSection; 
      key: string; 
      value: Json;
    }) => {
      // Upsert - insert or update if exists
      const { error } = await supabase
        .from('settings')
        .upsert(
          { section, key, value },
          { onConflict: 'section,key' }
        );

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings(variables.section) });
      logActivity({
        event_type: 'setting_updated',
        activity: `Setting "${variables.section}.${variables.key}" updated`,
        entity_type: 'setting',
        new_value: { section: variables.section, key: variables.key, value: variables.value } as Record<string, unknown>,
      });
      toast.success(t('common.saved'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useSaveSettings = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ 
      section, 
      settings 
    }: { 
      section: SettingsSection; 
      settings: Record<string, Json>;
    }) => {
      const upsertData = Object.entries(settings).map(([key, value]) => ({
        section,
        key,
        value,
      }));

      const { error } = await supabase
        .from('settings')
        .upsert(upsertData, { onConflict: 'section,key' });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings(variables.section) });
      logActivity({
        event_type: 'setting_updated',
        activity: `Settings section "${variables.section}" updated (${Object.keys(variables.settings).length} keys)`,
        entity_type: 'setting',
        new_value: variables.settings as Record<string, unknown>,
      });
      toast.success(t('common.saved'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

// Helper to get typed value from settings
export const getSettingValue = <T>(
  settings: Record<string, Json> | undefined,
  key: string,
  defaultValue: T
): T => {
  if (!settings || settings[key] === undefined) return defaultValue;
  return settings[key] as T;
};
