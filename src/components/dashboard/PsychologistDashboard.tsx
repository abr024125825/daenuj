import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Brain,
  Calendar,
  FileText,
  ArrowRight,
  Loader2,
  Shield,
  Lock,
  ShieldCheck,
  Clock,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MFASetup } from '@/components/auth/MFASetup';
import { TherapistAvailabilityManager } from '@/components/therapist/TherapistAvailabilityManager';
import { PatientRegistrationForm } from '@/components/emr/PatientRegistrationForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PsychologistDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: assignedPatients, isLoading: patientsLoading } = useQuery({
    queryKey: ['my-assigned-patients', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_provider_assignments')
        .select('id, patient_id')
        .eq('provider_id', user!.id)
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: todayAppointments, isLoading: apptLoading } = useQuery({
    queryKey: ['my-today-appointments', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('provider_id', user!.id)
        .eq('appointment_date', today)
        .eq('status', 'scheduled');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: encounters, isLoading: encLoading } = useQuery({
    queryKey: ['my-encounters-count', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encounters')
        .select('id, status')
        .eq('provider_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isLoading = patientsLoading || apptLoading || encLoading;

  if (isLoading) {
    return (
      <DashboardLayout title="Psychologist Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Psychologist Dashboard">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="today">Today's Schedule</TabsTrigger>
          <TabsTrigger value="register">Register Patient</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/emr')}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">My Patients</p>
                    <p className="text-3xl font-bold mt-2">{assignedPatients?.length || 0}</p>
                    <Badge variant="secondary" className="mt-2">Assigned</Badge>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Appointments</p>
                    <p className="text-3xl font-bold mt-2">{todayAppointments?.length || 0}</p>
                    <Badge variant="secondary" className="mt-2">Scheduled</Badge>
                  </div>
                  <div className="p-3 rounded-xl bg-accent/10 text-accent">
                    <Calendar className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Encounters</p>
                    <p className="text-3xl font-bold mt-2">{encounters?.length || 0}</p>
                    <Badge variant="outline" className="mt-2">
                      <Shield className="h-3 w-3 mr-1" />
                      Confidential
                    </Badge>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Brain className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/dashboard/emr')}>
                  <FileText className="h-6 w-6 text-primary" />
                  <span>Patient Records</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/dashboard/emr')}>
                  <Brain className="h-6 w-6 text-primary" />
                  <span>New Encounter</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/dashboard/notifications')}>
                  <Lock className="h-6 w-6 text-primary" />
                  <span>Notifications</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => {
                  const tabEl = document.querySelector('[data-state="inactive"][value="register"]') as HTMLElement;
                  tabEl?.click();
                }}>
                  <UserPlus className="h-6 w-6 text-primary" />
                  <span>Register Patient</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Today's Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayAppointments && todayAppointments.length > 0 ? (
                <div className="space-y-3">
                  {todayAppointments.map((appt: any) => (
                    <div key={appt.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">{appt.appointment_time}</p>
                        <p className="text-xs text-muted-foreground capitalize">{appt.appointment_type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{appt.status}</Badge>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/emr/patient/${appt.patient_id}`)}>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No appointments scheduled for today</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="register">
          <PatientRegistrationForm />
        </TabsContent>

        <TabsContent value="availability">
          <TherapistAvailabilityManager />
        </TabsContent>

        <TabsContent value="security">
          <MFASetup />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
