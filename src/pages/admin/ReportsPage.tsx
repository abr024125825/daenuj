import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Clock,
  Award,
  Calendar,
  TrendingUp,
  Loader2,
  Trophy,
} from 'lucide-react';
import { useReportsData } from '@/hooks/useReports';
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
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))', '#10b981', '#8b5cf6', '#f43f5e'];

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

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold">Reports & Analytics</h2>
          <p className="text-muted-foreground">Overview of volunteer program performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats?.totalVolunteers || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Volunteers</p>
                  <Badge variant="secondary" className="mt-1">
                    {stats?.activeVolunteers || 0} active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-warning/10">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats?.totalHours || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <Badge variant="secondary" className="mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Volunteered
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/10">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats?.totalOpportunities || 0}</p>
                  <p className="text-sm text-muted-foreground">Opportunities</p>
                  <Badge variant="secondary" className="mt-1">
                    {stats?.completedOpportunities || 0} completed
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <Award className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats?.totalCertificates || 0}</p>
                  <p className="text-sm text-muted-foreground">Certificates</p>
                  <Badge variant="secondary" className="mt-1">
                    Issued
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData && monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="volunteers" 
                      stroke="hsl(var(--primary))" 
                      name="New Volunteers"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="hours" 
                      stroke="hsl(var(--warning))" 
                      name="Hours"
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

          {/* Faculty Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Volunteers by Faculty</CardTitle>
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

        {/* Top Volunteers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-warning" />
              Top Volunteers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topVolunteers?.map((v: any, index: number) => (
                <div key={v.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                    index === 1 ? 'bg-gray-300/20 text-gray-600' :
                    index === 2 ? 'bg-amber-600/20 text-amber-700' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {v.application?.first_name} {v.application?.family_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {v.opportunities_completed || 0} opportunities completed
                    </p>
                  </div>
                  <Badge variant="secondary">{v.total_hours || 0} hrs</Badge>
                </div>
              ))}
              {(!topVolunteers || topVolunteers.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No volunteers yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
