import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users, Brain, Calendar, FileText, ArrowRight, Loader2, Shield, Lock,
  UserPlus, Search, Link2, ClipboardList, Bell, Eye,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MFASetup } from '@/components/auth/MFASetup';
import { TherapistAvailabilityManager } from '@/components/therapist/TherapistAvailabilityManager';
import { PatientRegistrationForm } from '@/components/emr/PatientRegistrationForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export function PsychologistDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [linkSearch, setLinkSearch] = useState('');
  const [linkResults, setLinkResults] = useState<any[]>([]);
  const [linking, setLinking] = useState<string | null>(null);

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

  const { data: todayAppointments, isLoading: apptLoading, refetch: refetchAppts } = useQuery({
    queryKey: ['my-today-appointments', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patients(full_name, file_number)')
        .eq('provider_id', user!.id)
        .eq('appointment_date', today)
        .order('appointment_time', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000, // refresh every 30s
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

  const { data: pendingRequests } = useQuery({
    queryKey: ['pending-file-requests-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('file_open_requests' as any)
        .select('id')
        .eq('status', 'pending');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleSearchToLink = async () => {
    if (!linkSearch.trim()) return;
    const { data, error } = await supabase
      .from('patients')
      .select('id, full_name, file_number, national_id, status')
      .or(`full_name.ilike.%${linkSearch}%,file_number.ilike.%${linkSearch}%,national_id.ilike.%${linkSearch}%`)
      .eq('status', 'active')
      .limit(10);
    if (!error) setLinkResults(data || []);
  };

  const handleLinkPatient = async (patientId: string) => {
    setLinking(patientId);
    try {
      // Check if already linked
      const { data: existing } = await supabase
        .from('patient_provider_assignments')
        .select('id')
        .eq('patient_id', patientId)
        .eq('provider_id', user!.id)
        .eq('is_active', true)
        .maybeSingle();

      if (existing) {
        toast({ title: 'Already linked', description: 'This patient is already assigned to you.' });
        return;
      }

      const { error } = await supabase.from('patient_provider_assignments').insert({
        patient_id: patientId,
        provider_id: user!.id,
        assigned_by: user!.id,
        is_active: true,
      } as any);
      if (error) throw error;

      qc.invalidateQueries({ queryKey: ['my-assigned-patients'] });
      toast({ title: 'Patient linked successfully' });
      setLinkResults(prev => prev.filter(p => p.id !== patientId));
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLinking(null);
    }
  };

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
          <TabsTrigger value="link">Link Patient</TabsTrigger>
          <TabsTrigger value="requests" className="relative">
            File Requests
            {pendingRequests && pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs flex items-center justify-center rounded-full">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="register">Register Patient</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/emr')}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">My Patients</p>
                    <p className="text-3xl font-bold mt-2">{assignedPatients?.length || 0}</p>
                    <Badge variant="secondary" className="mt-2">Assigned</Badge>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10 text-primary"><Users className="h-6 w-6" /></div>
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
                  <div className="p-3 rounded-xl bg-accent/10 text-accent"><Calendar className="h-6 w-6" /></div>
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
                      <Shield className="h-3 w-3 mr-1" />Confidential
                    </Badge>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10 text-primary"><Brain className="h-6 w-6" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/dashboard/emr')}>
                  <FileText className="h-6 w-6 text-primary" />
                  <span className="text-xs text-center">My Patients</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/dashboard/emr/all')}>
                  <Eye className="h-6 w-6 text-primary" />
                  <span className="text-xs text-center">All Records</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 relative" onClick={() => navigate('/dashboard/emr/requests')}>
                  <ClipboardList className="h-6 w-6 text-primary" />
                  <span className="text-xs text-center">File Requests</span>
                  {pendingRequests && pendingRequests.length > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full">
                      {pendingRequests.length}
                    </Badge>
                  )}
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/dashboard/notifications')}>
                  <Bell className="h-6 w-6 text-primary" />
                  <span className="text-xs text-center">Notifications</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Today's Schedule */}
        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Today's Appointments — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayAppointments && todayAppointments.length > 0 ? (
                <div className="space-y-3">
                  {todayAppointments.map((appt: any) => (
                    <div key={appt.id} className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/40 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {appt.patients?.full_name || 'Unknown Patient'}
                          </span>
                          <Badge variant="outline" className="text-xs">{appt.patients?.file_number}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{appt.appointment_time}</span>
                          <span>·</span>
                          <span className="capitalize">{appt.appointment_type?.replace('_', ' ')}</span>
                          <span>·</span>
                          <span>{appt.duration_minutes} min</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={appt.status === 'scheduled' ? 'secondary' : 'default'} className="text-xs">
                          {appt.status}
                        </Badge>
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

        {/* Link Patient */}
        <TabsContent value="link">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Link Existing Patient to Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Search for an existing patient by name, file number, or national ID to link them to your caseload.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patient name, file number, or national ID..."
                    value={linkSearch}
                    onChange={e => setLinkSearch(e.target.value)}
                    className="pl-9"
                    onKeyDown={e => e.key === 'Enter' && handleSearchToLink()}
                  />
                </div>
                <Button onClick={handleSearchToLink}>Search</Button>
              </div>

              {linkResults.length > 0 && (
                <div className="space-y-2">
                  {linkResults.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-foreground">{p.full_name}</p>
                        <p className="text-xs text-muted-foreground">{p.file_number}{p.national_id ? ` · NID: ${p.national_id}` : ''}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleLinkPatient(p.id)}
                        disabled={linking === p.id}
                        className="gap-1"
                      >
                        {linking === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
                        Link
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {linkResults.length === 0 && linkSearch && (
                <p className="text-sm text-muted-foreground text-center py-4">No results. Try a different search.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* File Requests - navigate to dedicated page */}
        <TabsContent value="requests">
          <Card>
            <CardContent className="py-8 text-center space-y-4">
              <ClipboardList className="h-12 w-12 mx-auto text-primary/40" />
              <p className="text-muted-foreground">Manage file opening requests from students who completed the screening test.</p>
              {pendingRequests && pendingRequests.length > 0 && (
                <Badge variant="destructive">{pendingRequests.length} pending request(s)</Badge>
              )}
              <Button onClick={() => navigate('/dashboard/emr/requests')}>
                Open File Requests Page
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
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
