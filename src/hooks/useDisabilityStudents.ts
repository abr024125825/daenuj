import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type SpecialNeedType = 'reader' | 'extra_time' | 'companion' | 'scribe' | 'separate_room' | 'assistive_technology' | 'other';

export interface DisabilityStudent {
  id: string;
  student_name: string;
  university_id: string;
  national_id: string | null;
  disability_type: string | null;
  disability_code: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  notes: string | null;
  special_needs: SpecialNeedType[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export function useDisabilityStudents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students, isLoading } = useQuery({
    queryKey: ['disability-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disability_students')
        .select('*')
        .order('student_name');

      if (error) throw error;
      return data as DisabilityStudent[];
    },
  });

  const addStudent = useMutation({
    mutationFn: async (student: Omit<DisabilityStudent, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('disability_students')
        .insert(student)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disability-students'] });
      toast({ title: 'Success', description: 'Student added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateStudent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DisabilityStudent> & { id: string }) => {
      const { error } = await supabase
        .from('disability_students')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disability-students'] });
      toast({ title: 'Success', description: 'Student updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteStudent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('disability_students')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disability-students'] });
      toast({ title: 'Success', description: 'Student deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    students,
    isLoading,
    addStudent,
    updateStudent,
    deleteStudent,
  };
}
