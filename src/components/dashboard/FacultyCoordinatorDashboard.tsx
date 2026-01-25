import { DashboardLayout } from './DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Clock,
  Award,
  FileText,
  BarChart3,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export function FacultyCoordinatorDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Fetch faculty info
  const { data: facultyInfo, isLoading: facultyLoading } = useQuery({
    queryKey: ['faculty-info', profile?.faculty_id],
    queryFn: async () => {
      if (!profile?.faculty_id) return null;
      const { data, error } = await supabase
        .from('faculties')
        .select('*')
        .eq('id', profile.faculty_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.faculty_id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch faculty statistics - optimized single query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['faculty-dashboard-stats', profile?.faculty_id],
    queryFn: async () => {
      if (!profile?.faculty_id) return { 
        totalVolunteers: 0, 
        totalHours: 0, 
        completedOpportunities: 0,
        pendingApplications: 0,
        activeVolunteers: 0
      };
      
      // Get approved volunteers with stats
      const { data: volunteers } = await supabase
        .from('volunteer_applications')
        .select('volunteers(total_hours, opportunities_completed, is_active)')
        .eq('faculty_id', profile.faculty_id)
        .eq('status', 'approved');

      // Get pending applications count
      const { count: pendingCount } = await supabase
        .from('volunteer_applications')
        .select('id', { count: 'exact', head: true })
        .eq('faculty_id', profile.faculty_id)
        .eq('status', 'pending');

      const totalVolunteers = volunteers?.length || 0;
      const activeVolunteers = volunteers?.filter(v => v.volunteers?.is_active).length || 0;
      const totalHours = volunteers?.reduce((sum, v) => sum + (v.volunteers?.total_hours || 0), 0) || 0;
      const completedOpportunities = volunteers?.reduce((sum, v) => sum + (v.volunteers?.opportunities_completed || 0), 0) || 0;

      return { 
        totalVolunteers, 
        totalHours, 
        completedOpportunities,
        pendingApplications: pendingCount || 0,
        activeVolunteers
      };
    },
    enabled: !!profile?.faculty_id,
    staleTime: 2 * 60 * 1000,
  });

  if (facultyLoading || statsLoading) {
    return (
      <DashboardLayout title="Faculty Coordinator Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${facultyInfo?.name || 'Faculty'} - Coordinator Dashboard`}>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Welcome, {profile?.first_name}!</h2>
                <p className="text-muted-foreground mt-1">
                  Managing volunteers for {facultyInfo?.name}
                </p>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                Faculty Coordinator
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Volunteers</p>
                  <p className="text-2xl font-bold">{stats?.totalVolunteers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-bold">{stats?.totalHours || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats?.completedOpportunities || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats?.activeVolunteers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Applications Alert */}
        {(stats?.pendingApplications || 0) > 0 && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium">Pending Applications</p>
                    <p className="text-sm text-muted-foreground">
                      {stats?.pendingApplications} application(s) awaiting review
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/dashboard/faculty-applications')}
                >
                  View Applications
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/dashboard/faculty-volunteers')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-primary" />
                Faculty Volunteers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                View and manage volunteers from your faculty
              </p>
              <Button variant="ghost" size="sm" className="gap-1 p-0">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/dashboard/faculty-applications')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-primary" />
                Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Review applications from faculty students
              </p>
              <Button variant="ghost" size="sm" className="gap-1 p-0">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/dashboard/faculty-schedules')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5 text-primary" />
                Schedules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Track schedule submissions from volunteers
              </p>
              <Button variant="ghost" size="sm" className="gap-1 p-0">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/dashboard/faculty-reports')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-primary" />
                Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                View faculty statistics and export reports
              </p>
              <Button variant="ghost" size="sm" className="gap-1 p-0">
                View Reports <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Role</CardTitle>
            <CardDescription>
              As a Faculty Coordinator, you have access to:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                View and monitor volunteers from {facultyInfo?.name}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Track volunteer applications from your faculty
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Monitor schedule submissions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Generate faculty-specific reports
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
