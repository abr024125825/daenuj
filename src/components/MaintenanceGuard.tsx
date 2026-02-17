import { ReactNode } from 'react';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { useAuth } from '@/contexts/AuthContext';
import MaintenancePage from '@/pages/MaintenancePage';

export function MaintenanceGuard({ children }: { children: ReactNode }) {
  const { isMaintenanceMode, isLoading } = useMaintenanceMode();
  const { profile } = useAuth();

  // Don't block while loading
  if (isLoading) return <>{children}</>;

  // If maintenance mode is on, only admins can access
  if (isMaintenanceMode && profile?.role !== 'admin') {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}
