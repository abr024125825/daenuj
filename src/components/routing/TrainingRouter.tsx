import { useAuth } from '@/contexts/AuthContext';
import { TrainingPage } from '@/pages/admin/TrainingPage';
import { VolunteerTrainingPage } from '@/pages/volunteer/TrainingPage';

export function TrainingRouter() {
  const { profile } = useAuth();
  
  if (profile?.role === 'admin' || profile?.role === 'supervisor') {
    return <TrainingPage />;
  }
  return <VolunteerTrainingPage />;
}
