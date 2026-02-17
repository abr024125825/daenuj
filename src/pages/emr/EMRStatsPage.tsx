import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Calendar, FileText, Activity, ShieldAlert, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function useEMRStats() {
  return useQuery({
    queryKey: ['emr-admin-stats'],
    queryFn: async () => {
      const [patientsRes, encountersRes, appointmentsRes, providersRes] = await Promise.all([
        supabase.from('patients').select('id, status, gender, created_at', { count: 'exact', head: false }),
        supabase.from('encounters').select('id, status, clinic_type, visit_type, created_at', { count: 'exact', head: false }),
        supabase.from('appointments').select('id, status, appointment_type, appointment_date', { count: 'exact', head: false }),
        supabase.from('patient_provider_assignments').select('id, provider_id, is_active', { count: 'exact', head: false }),
      ]);

      const patients = patientsRes.data || [];
      const encounters = encountersRes.data || [];
      const appointments = appointmentsRes.data || [];
      const assignments = providersRes.data || [];

      const activePatients = patients.filter(p => p.status === 'active').length;
      const maleCount = patients.filter(p => p.gender === 'male').length;
      const femaleCount = patients.filter(p => p.gender === 'female').length;

      const openEncounters = encounters.filter(e => e.status === 'open').length;
      const signedEncounters = encounters.filter(e => e.status === 'signed').length;

      const scheduledAppts = appointments.filter(a => a.status === 'scheduled').length;
      const completedAppts = appointments.filter(a => a.status === 'completed').length;
      const cancelledAppts = appointments.filter(a => a.status === 'cancelled').length;

      const today = new Date().toISOString().split('T')[0];
      const todayAppts = appointments.filter(a => a.appointment_date === today).length;

      const activeAssignments = assignments.filter(a => a.is_active).length;
      const uniqueProviders = new Set(assignments.filter(a => a.is_active).map(a => a.provider_id)).size;

      // Monthly trend (last 6 months)
      const monthlyPatients: Record<string, number> = {};
      patients.forEach(p => {
        const month = p.created_at?.substring(0, 7);
        if (month) monthlyPatients[month] = (monthlyPatients[month] || 0) + 1;
      });

      return {
        totalPatients: patients.length,
        activePatients,
        maleCount,
        femaleCount,
        totalEncounters: encounters.length,
        openEncounters,
        signedEncounters,
        totalAppointments: appointments.length,
        scheduledAppts,
        completedAppts,
        cancelledAppts,
        todayAppts,
        activeAssignments,
        uniqueProviders,
        monthlyPatients,
      };
    },
  });
}

export function EMRStatsPage() {
  const { data: stats, isLoading } = useEMRStats();

  if (isLoading) {
    return (
      <DashboardLayout title="EMR Statistics">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="EMR Statistics">
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            For patient privacy, admin access is limited to aggregate statistics only. Patient names and personal details are not displayed.
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Patients</p>
                  <p className="text-3xl font-bold mt-1">{stats?.totalPatients || 0}</p>
                  <Badge variant="secondary" className="mt-2">{stats?.activePatients || 0} active</Badge>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Encounters</p>
                  <p className="text-3xl font-bold mt-1">{stats?.totalEncounters || 0}</p>
                  <Badge variant="secondary" className="mt-2">{stats?.openEncounters || 0} open</Badge>
                </div>
                <div className="p-3 rounded-xl bg-accent/10 text-accent">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Appointments</p>
                  <p className="text-3xl font-bold mt-1">{stats?.totalAppointments || 0}</p>
                  <Badge variant="secondary" className="mt-2">{stats?.todayAppts || 0} today</Badge>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Providers</p>
                  <p className="text-3xl font-bold mt-1">{stats?.uniqueProviders || 0}</p>
                  <Badge variant="secondary" className="mt-2">{stats?.activeAssignments || 0} assignments</Badge>
                </div>
                <div className="p-3 rounded-xl bg-accent/10 text-accent">
                  <Activity className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Breakdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Patient Demographics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Male</span>
                <Badge variant="outline">{stats?.maleCount || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Female</span>
                <Badge variant="outline">{stats?.femaleCount || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Not Specified</span>
                <Badge variant="outline">
                  {(stats?.totalPatients || 0) - (stats?.maleCount || 0) - (stats?.femaleCount || 0)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Encounter Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Open</span>
                <Badge variant="secondary">{stats?.openEncounters || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Signed</span>
                <Badge variant="default">{stats?.signedEncounters || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total</span>
                <Badge variant="outline">{stats?.totalEncounters || 0}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Appointment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Scheduled</span>
                <Badge variant="secondary">{stats?.scheduledAppts || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Completed</span>
                <Badge variant="default">{stats?.completedAppts || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cancelled</span>
                <Badge variant="destructive">{stats?.cancelledAppts || 0}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}