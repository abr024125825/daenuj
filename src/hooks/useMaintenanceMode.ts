import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useMaintenanceMode() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: isMaintenanceMode, isLoading } = useQuery({
    queryKey: ['maintenance-mode'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'maintenance_mode')
        .maybeSingle();
      if (error) throw error;
      const val = data?.setting_value as { enabled?: boolean } | null;
      return val?.enabled ?? false;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  const toggleMaintenance = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'maintenance_mode',
          setting_value: { enabled } as any,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_key' });
      if (error) throw error;
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-mode'] });
      toast({
        title: enabled ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled',
        description: enabled
          ? 'All non-admin users will see the maintenance page'
          : 'The site is now accessible to all users',
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return { isMaintenanceMode: isMaintenanceMode ?? false, isLoading, toggleMaintenance };
}
