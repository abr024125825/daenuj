import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Faculty {
  id: string;
  name: string;
  created_at: string;
}

export interface Major {
  id: string;
  faculty_id: string;
  name: string;
  created_at: string;
}

export function useFaculties() {
  return useQuery({
    queryKey: ['faculties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faculties')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Faculty[];
    },
  });
}

export function useMajors(facultyId?: string) {
  return useQuery({
    queryKey: ['majors', facultyId],
    queryFn: async () => {
      let query = supabase.from('majors').select('*').order('name');
      
      if (facultyId) {
        query = query.eq('faculty_id', facultyId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Major[];
    },
    enabled: !!facultyId,
  });
}
