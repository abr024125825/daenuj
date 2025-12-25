import { useAuth } from '@/contexts/AuthContext';
import { CertificatesPage } from '@/pages/admin/CertificatesPage';
import { VolunteerCertificatesPage } from '@/pages/volunteer/CertificatesPage';

export function CertificatesRouter() {
  const { profile } = useAuth();
  
  if (profile?.role === 'admin' || profile?.role === 'supervisor') {
    return <CertificatesPage />;
  }
  return <VolunteerCertificatesPage />;
}
