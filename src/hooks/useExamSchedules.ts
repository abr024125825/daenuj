import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ExamType = 'first' | 'second' | 'midterm' | 'final';

export interface ExamSchedule {
  id: string;
  volunteer_id: string;
  course_id: string;
  semester_id: string;
  exam_type: ExamType;
  exam_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  created_at: string;
  updated_at: string;
  course?: {
    course_code: string;
    course_name: string;
  };
}

export function useExamSchedules(volunteerId?: string, semesterId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: exams, isLoading } = useQuery({
    queryKey: ['exam-schedules', volunteerId, semesterId],
    queryFn: async () => {
      if (!volunteerId) return [];

      let query = supabase
        .from('exam_schedules')
        .select(`
          *,
          course:volunteer_courses(course_code, course_name)
        `)
        .eq('volunteer_id', volunteerId);

      if (semesterId) {
        query = query.eq('semester_id', semesterId);
      }

      const { data, error } = await query.order('exam_date');

      if (error) throw error;
      return data as ExamSchedule[];
    },
    enabled: !!volunteerId,
  });

  const addExam = useMutation({
    mutationFn: async (exam: Omit<ExamSchedule, 'id' | 'created_at' | 'updated_at' | 'course'>) => {
      const { error } = await supabase
        .from('exam_schedules')
        .insert(exam);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-schedules', volunteerId, semesterId] });
      toast({ title: 'Success', description: 'Exam schedule added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateExam = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ExamSchedule> & { id: string }) => {
      const { error } = await supabase
        .from('exam_schedules')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-schedules', volunteerId, semesterId] });
      toast({ title: 'Success', description: 'Exam schedule updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteExam = useMutation({
    mutationFn: async (examId: string) => {
      const { error } = await supabase
        .from('exam_schedules')
        .delete()
        .eq('id', examId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-schedules', volunteerId, semesterId] });
      toast({ title: 'Success', description: 'Exam schedule deleted successfully' });
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

// Hook to check exam conflicts with opportunities
export function useExamAvailability(opportunityDate?: string, startTime?: string, endTime?: string) {
  const { data: conflicts, isLoading } = useQuery({
    queryKey: ['exam-availability', opportunityDate, startTime, endTime],
    queryFn: async () => {
      if (!opportunityDate || !startTime || !endTime) return [];

      // Get all exam schedules that conflict with this opportunity time
      const { data, error } = await supabase
        .from('exam_schedules')
        .select(`
          *,
          volunteer:volunteers(id, user_id),
          course:volunteer_courses(course_code, course_name)
        `)
        .eq('exam_date', opportunityDate)
        .lt('start_time', endTime)
        .gt('end_time', startTime);

      if (error) throw error;
      return data;
    },
    enabled: !!opportunityDate && !!startTime && !!endTime,
  });

  return { conflicts, isLoading };
}
