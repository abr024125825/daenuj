import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { OpportunitiesPage } from '@/pages/admin/OpportunitiesPage';
import { OpportunityDetailsPage } from '@/pages/admin/OpportunityDetailsPage';
import { VolunteerOpportunitiesPage } from '@/pages/volunteer/OpportunitiesPage';

export function OpportunitiesRouter() {
  const { profile } = useAuth();
  
  if (profile?.role === 'admin' || profile?.role === 'supervisor') {
    return (
      <Routes>
        <Route index element={<OpportunitiesPage />} />
        <Route path=":id" element={<OpportunityDetailsPage />} />
      </Routes>
    );
  }
  return <VolunteerOpportunitiesPage />;
}
