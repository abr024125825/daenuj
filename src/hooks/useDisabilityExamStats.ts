import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAcademicSemesters } from './useAcademicSemesters';

export interface DisabilityExamStats {
  totalStudents: number;
  activeStudents: number;
  totalExams: number;
  pendingExams: number;
  assignedExams: number;
  confirmedExams: number;
  completedExams: number;
  cancelledExams: number;
  totalAssignments: number;
  upcomingExamsThisWeek: number;
  coverageRate: number;
}

export function useDisabilityExamStats() {
  const { activeSemester } = useAcademicSemesters();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['disability-exam-stats', activeSemester?.id],
    queryFn: async (): Promise<DisabilityExamStats> => {
      // Get students count
      const { count: totalStudents } = await supabase
        .from('disability_students')
        .select('*', { count: 'exact', head: true });

      const { count: activeStudents } = await supabase
        .from('disability_students')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get exams by status
      let examsQuery = supabase
        .from('disability_exams')
        .select('status');

      if (activeSemester?.id) {
        examsQuery = examsQuery.eq('semester_id', activeSemester.id);
      }

      const { data: exams } = await examsQuery;

      const totalExams = exams?.length || 0;
      const pendingExams = exams?.filter(e => e.status === 'pending').length || 0;
      const assignedExams = exams?.filter(e => e.status === 'assigned').length || 0;
      const confirmedExams = exams?.filter(e => e.status === 'confirmed').length || 0;
      const completedExams = exams?.filter(e => e.status === 'completed').length || 0;
      const cancelledExams = exams?.filter(e => e.status === 'cancelled').length || 0;

      // Get assignments count
      const { count: totalAssignments } = await supabase
        .from('disability_exam_assignments')
        .select('*', { count: 'exact', head: true });

      // Get upcoming exams this week
      const today = new Date();
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      let upcomingQuery = supabase
        .from('disability_exams')
        .select('*', { count: 'exact', head: true })
        .gte('exam_date', today.toISOString().split('T')[0])
        .lte('exam_date', weekFromNow.toISOString().split('T')[0])
        .neq('status', 'cancelled');

      if (activeSemester?.id) {
        upcomingQuery = upcomingQuery.eq('semester_id', activeSemester.id);
      }

      const { count: upcomingExamsThisWeek } = await upcomingQuery;

      // Calculate coverage rate
      const coveredExams = assignedExams + confirmedExams + completedExams;
      const coverageRate = totalExams > 0 ? Math.round((coveredExams / totalExams) * 100) : 100;

      return {
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        totalExams,
        pendingExams,
        assignedExams,
        confirmedExams,
        completedExams,
        cancelledExams,
        totalAssignments: totalAssignments || 0,
        upcomingExamsThisWeek: upcomingExamsThisWeek || 0,
        coverageRate,
      };
    },
  });

  return { stats, isLoading };
}
