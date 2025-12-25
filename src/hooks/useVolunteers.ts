import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useVolunteers() {
  const { data: volunteers, isLoading } = useQuery({
    queryKey: ['volunteers-list'],
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
