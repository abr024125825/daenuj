import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DisabilityExamLog {
  id: string;
  exam_id: string | null;
  assignment_id: string | null;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  performed_by: string;
  performed_at: string;
  ip_address: string | null;
}

export function useDisabilityExamLogs(examId?: string) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['disability-exam-logs', examId],
    queryFn: async () => {
      let query = supabase
        .from('disability_exam_logs')
        .select('*')
        .order('performed_at', { ascending: false })
        .limit(100);

      if (examId) {
        query = query.eq('exam_id', examId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DisabilityExamLog[];
    },
  });

  return { logs, isLoading };
}
