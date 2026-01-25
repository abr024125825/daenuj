import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
export function useVolunteers() {
  const { data: volunteers, isLoading } = useQuery({
    queryKey: ['volunteers-list'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const { data, error } = await supabase
        .from('volunteers')
        .select(`
          *,
          application:volunteer_applications(
            first_name,
            father_name,
            family_name,
            university_id,
            university_email,
            phone_number,
            faculty:faculties(name),
            major:majors(name)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return { volunteers, isLoading };
}

export function useVolunteerDetails(volunteerId?: string) {
  const { data: volunteer, isLoading } = useQuery({
    queryKey: ['volunteer-details', volunteerId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!volunteerId) return null;
      
      const { data, error } = await supabase
        .from('volunteers')
        .select(`
          *,
          application:volunteer_applications(
            first_name,
            father_name,
            grandfather_name,
            family_name,
            university_id,
            university_email,
            phone_number,
            academic_year,
            skills,
            interests,
            faculty:faculties(name),
            major:majors(name)
          )
        `)
        .eq('id', volunteerId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!volunteerId,
  });

  const { data: attendanceHistory } = useQuery({
    queryKey: ['volunteer-attendance', volunteerId],
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      if (!volunteerId) return [];
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          opportunity:opportunities(title, date, location)
        `)
        .eq('volunteer_id', volunteerId)
        .order('check_in_time', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!volunteerId,
  });

  const { data: certificates } = useQuery({
    queryKey: ['volunteer-certificates', volunteerId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!volunteerId) return [];
      
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          opportunity:opportunities(title, date)
        `)
        .eq('volunteer_id', volunteerId)
        .order('issued_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!volunteerId,
  });

  return { volunteer, attendanceHistory, certificates, isLoading };
}

export function useToggleVolunteerActive() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ volunteerId, isActive }: { volunteerId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('volunteers')
        .update({ is_active: isActive })
        .eq('id', volunteerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers-list'] });
      toast({ title: 'Success', description: 'Volunteer status updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
