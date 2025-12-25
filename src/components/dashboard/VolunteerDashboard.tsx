import { useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Award,
  Clock,
  ArrowRight,
  CheckCircle,
  BookOpen,
  QrCode,
  Trophy,
  Target,
  Loader2,
} from 'lucide-react';
import { useMyRegistrations } from '@/hooks/useOpportunities';
import { useMyCertificates } from '@/hooks/useCertificates';
import { useMyTraining } from '@/hooks/useTraining';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export function VolunteerDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Get volunteer record
  const { data: volunteer, isLoading: volunteerLoading } = useQuery({
    queryKey: ['my-volunteer-record', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('volunteers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { registrations, isLoading: registrationsLoading } = useMyRegistrations();
  const { certificates, isLoading: certificatesLoading } = useMyCertificates();
  const { courses, isCourseComplete, isLoading: trainingLoading } = useMyTraining();

  const isLoading = volunteerLoading || registrationsLoading || certificatesLoading || trainingLoading;

  const totalHours = volunteer?.total_hours || 0;
  const opportunitiesCompleted = volunteer?.opportunities_completed || 0;
  const certificatesEarned = certificates?.length || 0;
  
  const requiredCourses = courses?.filter((c: any) => c.is_required) || [];
  const trainingsCompleted = requiredCourses.filter((c: any) => 
    isCourseComplete(c.id, c.content?.length || 0)
  ).length;
  const trainingsTotal = requiredCourses.length;

  // Upcoming opportunities (approved registrations)
  const upcomingOpportunities = registrations?.filter((reg: any) => {
    const oppDate = new Date(reg.opportunity?.date);
    return oppDate >= new Date() && reg.status === 'approved';
  }).slice(0, 3) || [];

  // Pending registrations
  const pendingRegistrations = registrations?.filter((reg: any) => reg.status === 'pending') || [];

  // Recent certificates
  const recentCertificates = certificates?.slice(0, 2) || [];

  if (isLoading) {
    return (
      <DashboardLayout title="My Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <Card className="gradient-primary text-primary-foreground overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-8 relative">
            <h2 className="text-2xl font-display font-bold mb-2">
              Welcome back, {profile?.first_name || 'Volunteer'}!
            </h2>
            <p className="text-primary-foreground/80 mb-6">
              You're making a difference. Keep up the great work!
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-3xl font-bold">{totalHours}</p>
                <p className="text-sm text-primary-foreground/70">Total Hours</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{opportunitiesCompleted}</p>
                <p className="text-sm text-primary-foreground/70">Opportunities</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{certificatesEarned}</p>
                <p className="text-sm text-primary-foreground/70">Certificates</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{trainingsCompleted}/{trainingsTotal || 0}</p>
                <p className="text-sm text-primary-foreground/70">Trainings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Required Training Progress */}
        {trainingsTotal > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Required Training
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1" asChild>
                <Link to="/dashboard/training">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {trainingsCompleted} of {trainingsTotal} courses completed
                  </span>
                  <span className="text-sm font-medium">
                    {trainingsTotal > 0 ? Math.round((trainingsCompleted / trainingsTotal) * 100) : 0}%
                  </span>
                </div>
                <Progress value={trainingsTotal > 0 ? (trainingsCompleted / trainingsTotal) * 100 : 0} />
                {trainingsCompleted < trainingsTotal && (
                  <p className="text-sm text-muted-foreground">
                    Complete all required training courses to participate in volunteering opportunities.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming Opportunities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                My Upcoming Activities
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1" asChild>
                <Link to="/dashboard/opportunities">
                  Browse All <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingOpportunities.length > 0 ? (
                  upcomingOpportunities.map((reg: any) => (
                    <div
                      key={reg.id}
                      className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{reg.opportunity?.title}</h4>
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" /> Approved
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {reg.opportunity?.date 
                            ? format(new Date(reg.opportunity.date), 'MMM dd, yyyy') 
                            : 'TBD'} at {reg.opportunity?.start_time || 'TBD'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{reg.opportunity?.location}</p>
                    </div>
                  ))
                ) : pendingRegistrations.length > 0 ? (
                  pendingRegistrations.slice(0, 2).map((reg: any) => (
                    <div
                      key={reg.id}
                      className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{reg.opportunity?.title}</h4>
                        <Badge variant="secondary">Pending Approval</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {reg.opportunity?.date 
                            ? format(new Date(reg.opportunity.date), 'MMM dd, yyyy')
                            : 'TBD'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No upcoming activities</p>
                    <Button variant="link" size="sm" asChild>
                      <Link to="/dashboard/opportunities">Browse opportunities</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Certificates */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-warning" />
                My Certificates
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1" asChild>
                <Link to="/dashboard/certificates">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCertificates.length > 0 ? (
                  recentCertificates.map((cert: any) => (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                          <Trophy className="h-6 w-6 text-warning" />
                        </div>
                        <div>
                          <p className="font-medium">{cert.opportunity?.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {cert.hours} hours • {format(new Date(cert.issued_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No certificates yet</p>
                    <p className="text-sm">Complete opportunities to earn certificates</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Browse Opportunities CTA */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-display font-semibold">Find Your Next Opportunity</h3>
                <p className="text-muted-foreground">
                  Browse available volunteering opportunities and make a difference.
                </p>
              </div>
            </div>
            <Button variant="hero" size="lg" className="gap-2" onClick={() => navigate('/dashboard/opportunities')}>
              <Calendar className="h-5 w-5" />
              Browse Opportunities
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
