import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { SupervisorDashboard } from '@/components/dashboard/SupervisorDashboard';
import { VolunteerDashboard } from '@/components/dashboard/VolunteerDashboard';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'supervisor':
      return <SupervisorDashboard />;
    case 'volunteer':
      return <VolunteerDashboard />;
    default:
      return null;
  }
}
