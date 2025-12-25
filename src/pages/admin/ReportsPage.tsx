import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Clock,
  Award,
  Calendar,
  TrendingUp,
  Loader2,
  Trophy,
  UserCheck,
  FileCheck,
  BarChart3,
  Download,
  Target,
  Activity,
  FileText,
} from 'lucide-react';
import { useReportsData } from '@/hooks/useReports';
import { generateReportPDF } from '@/lib/generateReportPDF';
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

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))', '#10b981', '#8b5cf6', '#f43f5e', '#06b6d4', '#eab308'];

export function ReportsPage() {
  const { stats, monthlyData, facultyBreakdown, topVolunteers, isLoading } = useReportsData();

  if (isLoading) {
    return (
      <DashboardLayout title="Reports">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const exportReportPDF = () => {
    if (!stats) return;
    
    generateReportPDF({
      stats: {
        totalVolunteers: stats.totalVolunteers || 0,
        activeVolunteers: stats.activeVolunteers || 0,
        totalHours: stats.totalHours || 0,
        totalOpportunities: stats.totalOpportunities || 0,
        completedOpportunities: stats.completedOpportunities || 0,
        totalCertificates: stats.totalCertificates || 0,
        totalAttendance: stats.totalAttendance || 0,
      },
      monthlyData: monthlyData || [],
      facultyBreakdown: facultyBreakdown || [],
      topVolunteers: topVolunteers?.map((v: any) => ({
        name: `${v.application?.first_name || ''} ${v.application?.family_name || ''}`,
        hours: v.total_hours || 0,
        opportunities: v.opportunities_completed || 0,
      })) || [],
    });
  };

  // Calculate engagement rate
  const engagementRate = stats?.totalVolunteers 
    ? Math.round((stats.activeVolunteers / stats.totalVolunteers) * 100) 
    : 0;

  // Calculate average hours per volunteer
  const avgHoursPerVolunteer = stats?.totalVolunteers 
    ? Math.round((stats.totalHours / stats.totalVolunteers) * 10) / 10 
    : 0;

  // Calculate completion rate
  const completionRate = stats?.totalOpportunities 
    ? Math.round((stats.completedOpportunities / stats.totalOpportunities) * 100) 
    : 0;

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold">Reports & Analytics</h2>
            <p className="text-muted-foreground">Comprehensive overview of volunteer program performance</p>
          </div>
          <Button onClick={exportReportPDF} variant="default" className="gap-2">
            <FileText className="h-4 w-4" />
            Export PDF Report
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/20">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats?.totalVolunteers || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Volunteers</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          <UserCheck className="h-3 w-3 mr-1" />
                          {stats?.activeVolunteers || 0} active
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-warning/20">
                      <Clock className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats?.totalHours || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Hours</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {avgHoursPerVolunteer} avg/volunteer
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-accent/20">
                      <Calendar className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats?.totalOpportunities || 0}</p>
                      <p className="text-sm text-muted-foreground">Opportunities</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          <FileCheck className="h-3 w-3 mr-1" />
                          {stats?.completedOpportunities || 0} completed
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-500/20">
                      <Award className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats?.totalCertificates || 0}</p>
                      <p className="text-sm text-muted-foreground">Certificates</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          Issued
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Engagement Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{engagementRate}%</span>
                    <span className="text-sm text-muted-foreground">active volunteers</span>
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
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    Completion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{completionRate}%</span>
                    <span className="text-sm text-muted-foreground">opportunities completed</span>
                  </div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all" 
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-warning" />
                    Total Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{stats?.totalAttendance || 0}</span>
                    <span className="text-sm text-muted-foreground">check-ins recorded</span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Via QR code scanning
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Monthly Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trends</CardTitle>
                  <CardDescription>Volunteer growth and hours over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {monthlyData && monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={monthlyData}>
                        <defs>
                          <linearGradient id="colorVolunteers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-muted-foreground" />
                        <YAxis className="text-muted-foreground" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }} 
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="volunteers" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1}
                          fill="url(#colorVolunteers)"
                          name="New Volunteers"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="hours" 
                          stroke="hsl(var(--warning))" 
                          fillOpacity={1}
                          fill="url(#colorHours)"
                          name="Hours"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Faculty Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Volunteers by Faculty</CardTitle>
                  <CardDescription>Distribution across academic faculties</CardDescription>
                </CardHeader>
                <CardContent>
                  {facultyBreakdown && facultyBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={facultyBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          innerRadius={60}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {facultyBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="volunteers" className="space-y-6">
            {/* Top Volunteers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-warning" />
                  Top Volunteers Leaderboard
                </CardTitle>
                <CardDescription>Volunteers ranked by total hours contributed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topVolunteers?.map((v: any, index: number) => (
                    <div key={v.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-600 ring-2 ring-yellow-500/50' :
                        index === 1 ? 'bg-gray-300/20 text-gray-600 ring-2 ring-gray-400/50' :
                        index === 2 ? 'bg-amber-600/20 text-amber-700 ring-2 ring-amber-600/50' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-lg">
                          {v.application?.first_name} {v.application?.family_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {v.opportunities_completed || 0} opportunities completed
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="default" className="text-lg px-3 py-1">
                          {v.total_hours || 0} hrs
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {(!topVolunteers || topVolunteers.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">No volunteers yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Faculty Distribution Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Faculty Distribution</CardTitle>
                <CardDescription>Number of volunteers per faculty</CardDescription>
              </CardHeader>
              <CardContent>
                {facultyBreakdown && facultyBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={facultyBreakdown} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }} 
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-6">
            {/* Opportunities Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary">{stats?.totalOpportunities || 0}</p>
                    <p className="text-muted-foreground mt-2">Total Opportunities Created</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-green-500">{stats?.completedOpportunities || 0}</p>
                    <p className="text-muted-foreground mt-2">Successfully Completed</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-warning">{stats?.totalAttendance || 0}</p>
                    <p className="text-muted-foreground mt-2">Total Attendance Records</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Certificates */}
            <Card>
              <CardHeader>
                <CardTitle>Certificates Issued Over Time</CardTitle>
                <CardDescription>Monthly certificate issuance trends</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyData && monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }} 
                      />
                      <Bar dataKey="certificates" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Certificates" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Hours/Volunteer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{avgHoursPerVolunteer}</p>
                  <p className="text-xs text-muted-foreground mt-1">hours per volunteer</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{engagementRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">active volunteers</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{completionRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">opportunities completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Certificate Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {stats?.totalVolunteers ? Math.round((stats.totalCertificates / stats.totalVolunteers) * 100) : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">volunteers with certificates</p>
                </CardContent>
              </Card>
            </div>

            {/* Hours vs Certificates Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Hours vs Certificates Comparison</CardTitle>
                <CardDescription>Monthly comparison of volunteer hours and certificates issued</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyData && monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }} 
                      />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="hours" 
                        stroke="hsl(var(--warning))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--warning))' }}
                        name="Hours"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="certificates" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                        name="Certificates"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
