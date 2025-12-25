import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSupervisors() {
  const { data: supervisors, isLoading } = useQuery({
    queryKey: ['supervisors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .eq('role', 'supervisor');
      
      if (error) throw error;
      return data;
    },
  });

  return { supervisors, isLoading };
}

export function useSupervisorOpportunities() {
  const { data: opportunities, isLoading, refetch } = useQuery({
    queryKey: ['supervisor-opportunities'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          faculty:faculties(id, name),
          registrations:opportunity_registrations(count)
        `)
        .eq('supervisor_id', user.id)
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  return { opportunities, isLoading, refetch };
}
