import { useAuth } from '@/contexts/AuthContext';
import { OpportunitiesPage } from '@/pages/admin/OpportunitiesPage';
import { VolunteerOpportunitiesPage } from '@/pages/volunteer/OpportunitiesPage';

export function OpportunitiesRouter() {
  const { profile } = useAuth();
  
  if (profile?.role === 'admin' || profile?.role === 'supervisor') {
    return <OpportunitiesPage />;
  }
  return <VolunteerOpportunitiesPage />;
}
