import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, Download, Users, Clock, Award, TrendingUp,
  FileText, Calendar, Loader2, UserCheck, UserX, GraduationCap,
  Target, Activity, Star
} from 'lucide-react';
import { useFacultyReportsData } from '@/hooks/useFacultyReportsData';
import { 
  generateFacultyReportPDF, 
  generateFacultyVolunteersListPDF,
  generateFacultyHoursReportPDF 
} from '@/lib/generateFacultyReportPDF';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--muted-foreground))',
];

export function FacultyReportsPage() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { 
    facultyInfo, 
    stats, 
    majorsDistribution, 
    topVolunteers, 
    monthlyTrend,
    allVolunteers,
    isLoading 
  } = useFacultyReportsData();
  
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Check if user has faculty access
  if (!profile?.faculty_id) {
    return (
      <DashboardLayout title="Faculty Reports">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need to be assigned to a faculty to view faculty reports. Please contact the administrator.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const handleExportFullReport = async () => {
    if (!facultyInfo || !stats) return;
    setIsExporting('full');
    try {
      await generateFacultyReportPDF({
        facultyName: facultyInfo.name,
        stats: {
          totalVolunteers: stats.totalVolunteers,
          activeVolunteers: stats.activeVolunteers,
          totalHours: stats.totalHours,
          completedOpportunities: stats.completedOpportunities,
          avgRating: stats.avgRating,
          pendingApplications: stats.pendingApplications,
        },
        majorsDistribution: majorsDistribution.map(m => ({
          name: m.name,
          count: m.count,
          percentage: m.percentage,
        })),
        topVolunteers: topVolunteers.slice(0, 10).map(v => ({
          name: v.name,
          universityId: v.universityId,
          hours: v.hours,
          opportunities: v.opportunities,
        })),
        yearDistribution: stats.yearDistribution,
      });
      toast({ title: 'Success', description: 'Full report downloaded successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate report', variant: 'destructive' });
    }
    setIsExporting(null);
  };

  const handleExportVolunteersList = async () => {
    if (!facultyInfo || !allVolunteers) return;
    setIsExporting('volunteers');
    try {
      await generateFacultyVolunteersListPDF({
        facultyName: facultyInfo.name,
        volunteers: allVolunteers.map(v => ({
          name: v.name,
          universityId: v.universityId,
          major: v.major,
          hours: v.hours,
          status: v.status,
        })),
      });
      toast({ title: 'Success', description: 'Volunteers list downloaded successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate volunteers list', variant: 'destructive' });
    }
    setIsExporting(null);
  };

  const handleExportHoursReport = async () => {
    if (!facultyInfo || !stats || !topVolunteers) return;
    setIsExporting('hours');
    try {
      await generateFacultyHoursReportPDF({
        facultyName: facultyInfo.name,
        totalHours: stats.totalHours,
        volunteers: topVolunteers.map(v => ({
          name: v.name,
          universityId: v.universityId,
          hours: v.hours,
          opportunities: v.opportunities,
        })),
      });
      toast({ title: 'Success', description: 'Hours report downloaded successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate hours report', variant: 'destructive' });
    }
    setIsExporting(null);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Faculty Reports">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Show message if no data
  if (!stats || !facultyInfo) {
    return (
      <DashboardLayout title="Faculty Reports">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            There is no data available for your faculty yet. This might be because there are no approved volunteer applications.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const engagementRate = stats?.totalVolunteers 
    ? Math.round((stats.activeVolunteers / stats.totalVolunteers) * 100) 
    : 0;

  const avgHoursPerVolunteer = stats?.totalVolunteers 
    ? Math.round((stats.totalHours / stats.totalVolunteers) * 10) / 10 
    : 0;

  // Prepare pie chart data for active vs inactive
  const statusData = [
    { name: 'Active', value: stats?.activeVolunteers || 0, color: 'hsl(var(--chart-2))' },
    { name: 'Inactive', value: stats?.inactiveVolunteers || 0, color: 'hsl(var(--muted-foreground))' },
  ];

  return (
    <DashboardLayout title={`${facultyInfo?.name || 'Faculty'} - Reports`}>
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExportFullReport} disabled={isExporting !== null}>
            {isExporting === 'full' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Export Full Report
          </Button>
          <Button variant="outline" onClick={handleExportVolunteersList} disabled={isExporting !== null}>
            {isExporting === 'volunteers' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
            Export Volunteers List
          </Button>
          <Button variant="outline" onClick={handleExportHoursReport} disabled={isExporting !== null}>
            {isExporting === 'hours' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
            Export Hours Report
          </Button>
        </div>

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
                <UserCheck className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats?.activeVolunteers || 0}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="text-center">
                <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats?.totalHours?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">Total Hours</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="text-center">
                <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats?.completedOpportunities || 0}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="text-center">
                <Star className="h-6 w-6 text-amber-600 mx-auto mb-2" />
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

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Engagement Rate</p>
                  <p className="text-2xl font-bold">{engagementRate}%</p>
                </div>
                <Activity className="h-8 w-8 text-primary opacity-50" />
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${engagementRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Hours/Volunteer</p>
                  <p className="text-2xl font-bold">{avgHoursPerVolunteer}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inactive Volunteers</p>
                  <p className="text-2xl font-bold">{stats?.inactiveVolunteers || 0}</p>
                </div>
                <UserX className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="majors">By Major</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="top-volunteers">Top Volunteers</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status Distribution Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Volunteer Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Academic Year Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Volunteers by Academic Year
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.yearDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="majors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Volunteers by Major
                </CardTitle>
                <CardDescription>
                  Distribution of volunteers across different majors in your faculty
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={majorsDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number) => [`${value} volunteers`, 'Count']}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary Table */}
                <div className="mt-6 space-y-3">
                  {majorsDistribution.map((major) => (
                    <div key={major.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium">{major.name}</span>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">{major.count} volunteers</Badge>
                        <Badge variant="outline">{major.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                  {majorsDistribution.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="grid grid-cols-1 gap-6">
              {/* Monthly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Monthly Volunteer Registrations
                  </CardTitle>
                  <CardDescription>New volunteer registrations over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="volunteers" 
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary))" 
                          fillOpacity={0.3}
                          name="New Volunteers"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Hours Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Cumulative Hours by Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="hours" 
                          stroke="hsl(var(--chart-2))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--chart-2))' }}
                          name="Total Hours"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="top-volunteers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Top Performing Volunteers
                </CardTitle>
                <CardDescription>
                  Volunteers ranked by total hours contributed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topVolunteers.slice(0, 15).map((volunteer, index) => (
                    <div 
                      key={volunteer.id} 
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index < 3 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{volunteer.name}</p>
                          <p className="text-sm text-muted-foreground">{volunteer.universityId} • {volunteer.major}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="font-bold text-primary">{volunteer.hours} hrs</p>
                          <p className="text-xs text-muted-foreground">{volunteer.opportunities} opportunities</p>
                        </div>
                        <Badge variant={volunteer.isActive ? 'default' : 'secondary'}>
                          {volunteer.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {topVolunteers.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No volunteers found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
