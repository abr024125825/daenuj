import { useAuth } from '@/contexts/AuthContext';
import { EvaluationsPage } from '@/pages/admin/EvaluationsPage';
import { VolunteerEvaluationsPage } from '@/pages/volunteer/EvaluationsPage';

export function EvaluationsRouter() {
  const { profile } = useAuth();
  
  if (profile?.role === 'admin' || profile?.role === 'supervisor') {
    return <EvaluationsPage />;
  }
  return <VolunteerEvaluationsPage />;
}
