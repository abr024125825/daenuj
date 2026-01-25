import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, Download, Users, Clock, Award, TrendingUp,
  FileText, Calendar, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function FacultyReportsPage() {
  const { profile } = useAuth();

  // Fetch faculty info
  const { data: facultyInfo, isLoading: facultyLoading } = useQuery({
    queryKey: ['faculty-info', profile?.faculty_id],
    queryFn: async () => {
      if (!profile?.faculty_id) return null;
      const { data, error } = await supabase
        .from('faculties')
        .select('*')
        .eq('id', profile.faculty_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.faculty_id,
  });

  // Fetch faculty statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['faculty-statistics', profile?.faculty_id],
    queryFn: async () => {
      if (!profile?.faculty_id) return null;
      
      // Get volunteers
      const { data: volunteers } = await supabase
        .from('volunteer_applications')
        .select('volunteers(total_hours, opportunities_completed, rating, is_active)')
        .eq('faculty_id', profile.faculty_id)
        .eq('status', 'approved');

      const totalVolunteers = volunteers?.length || 0;
      const activeVolunteers = volunteers?.filter(v => v.volunteers?.is_active).length || 0;
      const totalHours = volunteers?.reduce((sum, v) => sum + (v.volunteers?.total_hours || 0), 0) || 0;
      const completedOpportunities = volunteers?.reduce((sum, v) => sum + (v.volunteers?.opportunities_completed || 0), 0) || 0;
      const ratings = volunteers?.filter(v => v.volunteers?.rating).map(v => v.volunteers?.rating) || [];
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      // Get pending applications
      const { count: pendingApplications } = await supabase
        .from('volunteer_applications')
        .select('id', { count: 'exact', head: true })
        .eq('faculty_id', profile.faculty_id)
        .eq('status', 'pending');

      return {
        totalVolunteers,
        activeVolunteers,
        totalHours,
        completedOpportunities,
        avgRating,
        pendingApplications: pendingApplications || 0,
      };
    },
    enabled: !!profile?.faculty_id,
  });

  // Fetch majors distribution
  const { data: majorsDistribution = [] } = useQuery({
    queryKey: ['majors-distribution', profile?.faculty_id],
    queryFn: async () => {
      if (!profile?.faculty_id) return [];
      const { data, error } = await supabase
        .from('majors')
        .select(`
          id,
          name,
          volunteer_applications(count)
        `)
        .eq('faculty_id', profile.faculty_id);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.faculty_id,
  });

  if (facultyLoading || statsLoading) {
    return (
      <DashboardLayout title="Faculty Reports">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${facultyInfo?.name || 'Faculty'} - Reports`}>
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="text-center">
                <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats?.totalVolunteers || 0}</p>
                <p className="text-xs text-muted-foreground">Total Volunteers</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="text-center">
                <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats?.activeVolunteers || 0}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="text-center">
                <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats?.totalHours || 0}</p>
                <p className="text-xs text-muted-foreground">Total Hours</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="text-center">
                <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats?.completedOpportunities || 0}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="text-center">
                <Award className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{(stats?.avgRating || 0).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="text-center">
                <FileText className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats?.pendingApplications || 0}</p>
                <p className="text-xs text-muted-foreground">Pending Apps</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Majors Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Volunteers by Major
            </CardTitle>
            <CardDescription>
              Distribution of volunteers across different majors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {majorsDistribution.map((major: any) => {
                const count = major.volunteer_applications?.[0]?.count || 0;
                const percentage = stats?.totalVolunteers 
                  ? Math.round((count / stats.totalVolunteers) * 100) 
                  : 0;
                return (
                  <div key={major.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{major.name}</span>
                      <span className="text-sm text-muted-foreground">{count} volunteers ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {majorsDistribution.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Export Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Export Reports
            </CardTitle>
            <CardDescription>
              Download detailed reports for your faculty
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Users className="h-5 w-5" />
                <span className="text-sm">Volunteers List</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Clock className="h-5 w-5" />
                <span className="text-sm">Hours Summary</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Calendar className="h-5 w-5" />
                <span className="text-sm">Schedule Report</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <FileText className="h-5 w-5" />
                <span className="text-sm">Applications Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
