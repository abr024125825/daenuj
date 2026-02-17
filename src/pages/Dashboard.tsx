import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { SupervisorDashboard } from '@/components/dashboard/SupervisorDashboard';
import { FacultyCoordinatorDashboard } from '@/components/dashboard/FacultyCoordinatorDashboard';
import { DisabilityCoordinatorDashboard } from '@/components/dashboard/DisabilityCoordinatorDashboard';
import { PsychologistDashboard } from '@/components/dashboard/PsychologistDashboard';
import { VolunteerDashboard } from '@/components/dashboard/VolunteerDashboard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user, profile, isLoading, isAuthenticated } = useAuth();
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

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Disability coordinator gets their own dashboard
  if (profile.role === 'disability_coordinator') {
    return (
      <DashboardLayout title="Disability Coordinator Dashboard">
        <DisabilityCoordinatorDashboard />
      </DashboardLayout>
    );
  }

  // Psychologist gets their own dashboard
  if (profile.role === 'psychologist') {
    return <PsychologistDashboard />;
  }

  // Clinic coordinator role removed - treat as volunteer


  // Faculty coordinator is a supervisor with faculty_id
  if (profile.role === 'supervisor' && profile.faculty_id) {
    return <FacultyCoordinatorDashboard />;
  }

  switch (profile.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'supervisor':
      return <SupervisorDashboard />;
    case 'volunteer':
      return <VolunteerDashboard />;
    default:
      return <VolunteerDashboard />;
  }
}
