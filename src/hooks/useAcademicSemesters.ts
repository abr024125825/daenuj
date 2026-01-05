import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AcademicSemester {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  academic_year: string;
  semester_number: number;
  is_active: boolean;
  is_schedule_open: boolean;
  schedule_closed_at: string | null;
  schedule_closed_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export function useAcademicSemesters() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: semesters, isLoading } = useQuery({
    queryKey: ['academic-semesters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_semesters')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as AcademicSemester[];
    },
  });

  const activeSemester = semesters?.find(s => s.is_active);

  const createSemester = useMutation({
    mutationFn: async (semester: Omit<AcademicSemester, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('academic_semesters')
        .insert(semester);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-semesters'] });
      toast({ title: 'Success', description: 'Semester created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateSemester = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AcademicSemester> & { id: string }) => {
      const { error } = await supabase
        .from('academic_semesters')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-semesters'] });
      toast({ title: 'Success', description: 'Semester updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const activateSemester = useMutation({
    mutationFn: async (semesterId: string) => {
      // Deactivate all other semesters
      const { error: deactivateError } = await supabase
        .from('academic_semesters')
        .update({ is_active: false })
        .neq('id', semesterId);

      if (deactivateError) throw deactivateError;

      // Activate the selected semester
      const { error } = await supabase
        .from('academic_semesters')
        .update({ is_active: true })
        .eq('id', semesterId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-semesters'] });
      toast({ title: 'Success', description: 'Semester activated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const closeSemester = useMutation({
    mutationFn: async (semesterId: string) => {
      const { error } = await supabase
        .from('academic_semesters')
        .update({ is_active: false })
        .eq('id', semesterId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-semesters'] });
      toast({ title: 'Success', description: 'Semester closed successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteSemester = useMutation({
    mutationFn: async (semesterId: string) => {
      const { error } = await supabase
        .from('academic_semesters')
        .delete()
        .eq('id', semesterId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-semesters'] });
      toast({ title: 'Success', description: 'Semester deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const toggleScheduleOpen = useMutation({
    mutationFn: async ({ semesterId, isOpen }: { semesterId: string; isOpen: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('academic_semesters')
        .update({ 
          is_schedule_open: isOpen,
          schedule_closed_at: isOpen ? null : new Date().toISOString(),
          schedule_closed_by: isOpen ? null : user?.id,
        })
        .eq('id', semesterId);

      if (error) throw error;
    },
    onSuccess: (_, { isOpen }) => {
      queryClient.invalidateQueries({ queryKey: ['academic-semesters'] });
      toast({ 
        title: 'Success', 
        description: isOpen ? 'Schedule submission is now open' : 'Schedule submission is now closed' 
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    semesters,
    activeSemester,
    isLoading,
    createSemester,
    updateSemester,
    activateSemester,
    closeSemester,
    deleteSemester,
    toggleScheduleOpen,
  };
}
