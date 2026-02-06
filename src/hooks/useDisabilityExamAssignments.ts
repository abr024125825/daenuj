import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DisabilityExamStatus, SpecialNeedType } from './useDisabilityExams';

export interface DisabilityExamAssignment {
  id: string;
  exam_id: string;
  volunteer_id: string;
  assigned_role: SpecialNeedType;
  status: DisabilityExamStatus;
  assigned_at: string;
  assigned_by: string;
  confirmed_at: string | null;
  completed_at: string | null;
  notes: string | null;
  exam?: {
    id: string;
    course_name: string;
    course_code: string | null;
    exam_date: string;
    start_time: string;
    end_time: string;
    location: string | null;
    student?: {
      student_name: string;
      university_id: string;
      disability_type: string | null;
    };
  };
  volunteer?: {
    id: string;
    user_id: string;
    application?: {
      first_name: string;
      father_name: string;
      family_name: string;
    };
  };
}

export interface AvailableVolunteer {
  volunteer_id: string;
  user_id: string;
  full_name: string;
  availability_score: number;
}

export function useDisabilityExamAssignments(examId?: string, volunteerId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['disability-exam-assignments', examId, volunteerId],
    queryFn: async () => {
      let query = supabase
        .from('disability_exam_assignments')
        .select(`
          *,
          exam:disability_exams(
            id, course_name, course_code, exam_date, start_time, end_time, location,
            student:disability_students(student_name, university_id, disability_type)
          ),
          volunteer:volunteers(
            id, user_id,
            application:volunteer_applications(first_name, father_name, family_name)
          )
        `)
        .order('assigned_at', { ascending: false });

      if (examId) {
        query = query.eq('exam_id', examId);
      }
      if (volunteerId) {
        query = query.eq('volunteer_id', volunteerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DisabilityExamAssignment[];
    },
  });

  const getAvailableVolunteers = async (examDate: string, startTime: string, endTime: string): Promise<AvailableVolunteer[]> => {
    const { data, error } = await supabase.rpc('get_available_volunteers_for_exam', {
      _exam_date: examDate,
      _start_time: startTime,
      _end_time: endTime,
    });

    if (error) throw error;
    return data as AvailableVolunteer[];
  };

  const checkConflict = async (volunteerId: string, examDate: string, startTime: string, endTime: string, excludeAssignmentId?: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('check_volunteer_exam_conflict', {
      _volunteer_id: volunteerId,
      _exam_date: examDate,
      _start_time: startTime,
      _end_time: endTime,
      _exclude_assignment_id: excludeAssignmentId || null,
    });

    if (error) throw error;
    return data as boolean;
  };

  const assignVolunteer = useMutation({
    mutationFn: async (assignment: {
      exam_id: string;
      volunteer_id: string;
      assigned_role: SpecialNeedType;
      assigned_by: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('disability_exam_assignments')
        .insert({
          ...assignment,
          status: 'assigned',
        })
        .select()
        .single();

      if (error) throw error;

      // Update exam status to 'assigned'
      await supabase
        .from('disability_exams')
        .update({ status: 'assigned' })
        .eq('id', assignment.exam_id);

      // Log the action
      await supabase.from('disability_exam_logs').insert({
        exam_id: assignment.exam_id,
        action: 'volunteer_assigned',
        new_value: { volunteer_id: assignment.volunteer_id, role: assignment.assigned_role },
        performed_by: assignment.assigned_by,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disability-exam-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['disability-exams'] });
      toast({ title: 'Success', description: 'Volunteer assigned successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateAssignment = useMutation({
    mutationFn: async ({ id, performedBy, ...updates }: Partial<DisabilityExamAssignment> & { id: string; performedBy: string }) => {
      const { error } = await supabase
        .from('disability_exam_assignments')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Log the action
      const action = updates.status === 'confirmed' ? 'assignment_confirmed' :
                    updates.status === 'completed' ? 'assignment_completed' :
                    updates.status === 'cancelled' ? 'assignment_cancelled' : 'assignment_updated';

      await supabase.from('disability_exam_logs').insert({
        assignment_id: id,
        action,
        new_value: updates,
        performed_by: performedBy,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disability-exam-assignments'] });
      toast({ title: 'Success', description: 'Assignment updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const removeAssignment = useMutation({
    mutationFn: async ({ id, performedBy }: { id: string; performedBy: string }) => {
      // Log before delete
      const { data: assignment } = await supabase
        .from('disability_exam_assignments')
        .select('exam_id, volunteer_id, assigned_role')
        .eq('id', id)
        .single();

      if (assignment) {
        await supabase.from('disability_exam_logs').insert({
          exam_id: assignment.exam_id,
          action: 'assignment_removed',
          old_value: assignment,
          performed_by: performedBy,
        });
      }

      const { error } = await supabase
        .from('disability_exam_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disability-exam-assignments'] });
      toast({ title: 'Success', description: 'Assignment removed successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const autoAssignVolunteer = async (examId: string, assignedRole: SpecialNeedType, assignedBy: string) => {
    const { data, error } = await supabase.rpc('auto_assign_volunteer_for_exam', {
      _exam_id: examId,
      _assigned_role: assignedRole,
      _assigned_by: assignedBy,
    });

    if (error) throw error;
    
    queryClient.invalidateQueries({ queryKey: ['disability-exam-assignments'] });
    queryClient.invalidateQueries({ queryKey: ['disability-exams'] });
    
    return data as { success: boolean; error?: string; volunteer_id?: string; volunteer_name?: string };
  };

  const autoAssignAllPending = async (assignedBy: string) => {
    const { data, error } = await supabase.rpc('auto_assign_all_pending_exams', {
      _assigned_by: assignedBy,
    });

    if (error) throw error;
    
    queryClient.invalidateQueries({ queryKey: ['disability-exam-assignments'] });
    queryClient.invalidateQueries({ queryKey: ['disability-exams'] });
    
    return data as { success_count: number; fail_count: number };
  };

  return {
    assignments,
    isLoading,
    getAvailableVolunteers,
    checkConflict,
    assignVolunteer,
    updateAssignment,
    removeAssignment,
    autoAssignVolunteer,
    autoAssignAllPending,
  };
}

// Hook for volunteers to see their assignments
export function useMyDisabilityAssignments() {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['my-disability-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disability_exam_assignments')
        .select(`
          *,
          exam:disability_exams(
            id, course_name, course_code, exam_date, start_time, end_time, location, special_needs, special_needs_notes,
            student:disability_students(student_name, university_id, disability_type)
          )
        `)
        .order('exam(exam_date)', { ascending: true });

      if (error) throw error;
      return data as DisabilityExamAssignment[];
    },
  });

  return { assignments, isLoading };
}
