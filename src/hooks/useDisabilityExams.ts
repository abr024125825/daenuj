import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type DisabilityExamStatus = 'pending' | 'assigned' | 'confirmed' | 'completed' | 'cancelled';
export type SpecialNeedType = 'reader' | 'extra_time' | 'companion' | 'scribe' | 'separate_room' | 'assistive_technology' | 'other';

export interface DisabilityExam {
  id: string;
  student_id: string;
  course_name: string;
  course_code: string | null;
  exam_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  extra_time_minutes: number;
  location: string | null;
  special_needs: SpecialNeedType[];
  special_needs_notes: string | null;
  status: DisabilityExamStatus;
  semester_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  student?: {
    id: string;
    student_name: string;
    university_id: string;
    disability_type: string | null;
    disability_code: string | null;
  };
}

export function useDisabilityExams(semesterId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: exams, isLoading } = useQuery({
    queryKey: ['disability-exams', semesterId],
    queryFn: async () => {
      let query = supabase
        .from('disability_exams')
        .select(`
          *,
          student:disability_students(id, student_name, university_id, disability_type, disability_code)
        `)
        .order('exam_date')
        .order('start_time');

      if (semesterId) {
        query = query.eq('semester_id', semesterId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DisabilityExam[];
    },
  });

  const addExam = useMutation({
    mutationFn: async (exam: Omit<DisabilityExam, 'id' | 'created_at' | 'updated_at' | 'student'>) => {
      const { data, error } = await supabase
        .from('disability_exams')
        .insert(exam)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disability-exams'] });
      toast({ title: 'Success', description: 'Exam added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateExam = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DisabilityExam> & { id: string }) => {
      const { error } = await supabase
        .from('disability_exams')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disability-exams'] });
      toast({ title: 'Success', description: 'Exam updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteExam = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('disability_exams')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disability-exams'] });
      toast({ title: 'Success', description: 'Exam deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    exams,
    isLoading,
    addExam,
    updateExam,
    deleteExam,
  };
}
