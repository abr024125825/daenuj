import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Calendar,
  ClipboardList,
  Award,
  TrendingUp,
  Clock,
  ArrowRight,
  UserPlus,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useVolunteerApplications } from '@/hooks/useApplications';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useVolunteers } from '@/hooks/useVolunteers';
import { useCertificates } from '@/hooks/useCertificates';
import { AvailabilityStatisticsWidget } from '@/components/admin/AvailabilityStatisticsWidget';
import { ScheduleSubmissionsWidget } from '@/components/admin/ScheduleSubmissionsWidget';
import { AnnouncementsWidget } from '@/components/admin/AnnouncementsWidget';
import { AvailabilityHeatmap } from '@/components/admin/AvailabilityHeatmap';
import { DisabilityExamsWidget } from '@/components/admin/DisabilityExamsWidget';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, subDays } from 'date-fns';

function AdminAppointmentsWidget() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [deleting, setDeleting] = useState<string | null>(null);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['admin-appointments', dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patients(full_name, file_number)')
        .eq('appointment_date', dateStr)
        .order('appointment_time', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['admin-appointments'] });
      toast({ title: 'Appointment deleted' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Appointments
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(d => subDays(d, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {format(selectedDate, 'EEE, MMM dd, yyyy')}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(d => addDays(d, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : !appointments || appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No appointments on this date</p>
        ) : (
          <div className="space-y-2">
            {appointments.map((appt: any) => (
              <div key={appt.id} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{appt.patients?.full_name || 'Unknown'}</span>
                    <Badge variant="outline" className="text-xs">{appt.patients?.file_number}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{appt.appointment_time}</span>
                    <span>·</span>
                    <span>{appt.duration_minutes} min</span>
                    <span>·</span>
                    <Badge variant="secondary" className="text-xs capitalize">{appt.status}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/emr/patient/${appt.patient_id}`)}>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(appt.id)}
                    disabled={deleting === appt.id}
                  >
                    {deleting === appt.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  
  // Optimize: Only fetch pending applications for dashboard
  const { data: applications, isLoading: applicationsLoading } = useVolunteerApplications('pending');
  
  // Optimize: Get counts without full data
  const { data: allApplications } = useVolunteerApplications();
  const { opportunities, isLoading: opportunitiesLoading } = useOpportunities();
  const { volunteers, isLoading: volunteersLoading } = useVolunteers();
  const { certificates, isLoading: certificatesLoading } = useCertificates();

  const isLoading = applicationsLoading || opportunitiesLoading || volunteersLoading || certificatesLoading;

  const pendingApplications = applications || [];
  const totalVolunteers = volunteers?.length || 0;
  const activeOpportunities = opportunities?.filter((o: any) => o.status === 'published') || [];
  const totalCertificates = certificates?.length || 0;

  const stats = [
    { 
      title: 'Total Volunteers', 
      value: totalVolunteers.toString(), 
      change: 'Active', 
      icon: Users, 
      color: 'text-primary',
      href: '/dashboard/volunteers'
    },
    { 
      title: 'Pending Applications', 
      value: pendingApplications.length.toString(), 
      change: 'New', 
      icon: ClipboardList, 
      color: 'text-accent',
      href: '/dashboard/applications'
    },
    { 
      title: 'Active Opportunities', 
      value: activeOpportunities.length.toString(), 
      change: 'Published', 
      icon: Calendar, 
      color: 'text-info',
      href: '/dashboard/opportunities'
    },
    { 
      title: 'Certificates Issued', 
      value: totalCertificates.toString(), 
      change: 'Total', 
      icon: Award, 
      color: 'text-warning',
      href: '/dashboard/certificates'
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.title} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(stat.href)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-display font-bold mt-2">{stat.value}</p>
                      <Badge variant="secondary" className="mt-2">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {stat.change}
                      </Badge>
                    </div>
                    <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Applications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-accent" />
                Pending Applications
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1" asChild>
                <Link to="/dashboard/applications">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApplications.length > 0 ? (
                  pendingApplications.slice(0, 3).map((app: any) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserPlus className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{app.first_name} {app.family_name}</p>
                          <p className="text-sm text-muted-foreground">{app.faculty?.name}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/dashboard/applications')}
                      >
                        Review
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No pending applications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Opportunities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Opportunities
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1" asChild>
                <Link to="/dashboard/opportunities">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeOpportunities.length > 0 ? (
                  activeOpportunities.slice(0, 3).map((opp: any) => (
                    <div
                      key={opp.id}
                      className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{opp.title}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(opp.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Badge variant={(opp.registrations?.[0]?.count || 0) >= opp.required_volunteers ? 'default' : 'secondary'}>
                          {opp.registrations?.[0]?.count || 0}/{opp.required_volunteers} volunteers
                        </Badge>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(((opp.registrations?.[0]?.count || 0) / opp.required_volunteers) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No active opportunities</p>
                    <Button variant="link" size="sm" asChild>
                      <Link to="/dashboard/opportunities">Create one</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments Widget */}
        <AdminAppointmentsWidget />

        {/* Announcements Widget */}
        <AnnouncementsWidget />

        {/* Disability Exams Widget */}
        <DisabilityExamsWidget />

        {/* Availability Statistics Widget */}
        <AvailabilityStatisticsWidget />

        {/* Volunteer Availability Heatmap */}
        <AvailabilityHeatmap />

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/dashboard/volunteers')}
              >
                <UserPlus className="h-6 w-6 text-primary" />
                <span>View Volunteers</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/dashboard/opportunities')}
              >
                <Calendar className="h-6 w-6 text-primary" />
                <span>Create Opportunity</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/dashboard/certificates')}
              >
                <Award className="h-6 w-6 text-primary" />
                <span>Issue Certificate</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/dashboard/reports')}
              >
                <ClipboardList className="h-6 w-6 text-primary" />
                <span>View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Submissions Widget */}
        <ScheduleSubmissionsWidget />
      </div>
    </DashboardLayout>
  );
}
