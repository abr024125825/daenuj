import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SystemSettings {
  auto_approve_registrations: boolean;
  email_notifications: boolean;
  exam_schedule_enabled: boolean;
}

export function useSystemSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      const settingsMap: SystemSettings = {
        auto_approve_registrations: false,
        email_notifications: true,
        exam_schedule_enabled: false,
      };

      data?.forEach(item => {
        const value = item.setting_value as { enabled?: boolean };
        if (item.setting_key === 'auto_approve_registrations') {
          settingsMap.auto_approve_registrations = value.enabled ?? false;
        } else if (item.setting_key === 'email_notifications') {
          settingsMap.email_notifications = value.enabled ?? true;
        } else if (item.setting_key === 'exam_schedule_enabled') {
          settingsMap.exam_schedule_enabled = value.enabled ?? false;
        }
      });

      return settingsMap;
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          setting_value: { enabled },
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', key);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast({ 
        title: 'Setting Updated', 
        description: `${variables.key.replace(/_/g, ' ')} has been ${variables.enabled ? 'enabled' : 'disabled'}` 
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    settings,
    isLoading,
    updateSetting,
  };
}
