import { ReactNode } from 'react';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { useAuth } from '@/contexts/AuthContext';
import MaintenancePage from '@/pages/MaintenancePage';
import { Loader2 } from 'lucide-react';

export function MaintenanceGuard({ children }: { children: ReactNode }) {
  const { isMaintenanceMode, isLoading } = useMaintenanceMode();
  const { profile } = useAuth();

  // Show loading spinner until maintenance status is confirmed
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If maintenance mode is on, only admins can access
  if (isMaintenanceMode && profile?.role !== 'admin') {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}
