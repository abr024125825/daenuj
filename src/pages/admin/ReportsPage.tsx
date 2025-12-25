import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  GraduationCap,
  Building,
  Search,
  ClipboardCheck,
  AlertCircle,
} from 'lucide-react';
import { useReportsData } from '@/hooks/useReports';
import {
  useFacultyReports,
  useTopHoursReport,
  useAttendanceReport,
  useCertificatesReport,
  useTotalHoursReport,
  useAllVolunteersExport,
  useVolunteerDetails,
} from '@/hooks/useEnhancedReports';
import { useOpportunities } from '@/hooks/useOpportunities';
import { generateReportPDF } from '@/lib/generateReportPDF';
import { generateVolunteerPDF, generateAttendanceReportPDF, generateAllVolunteersPDF } from '@/lib/generateVolunteerPDF';
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
import { format } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))', '#10b981', '#8b5cf6', '#f43f5e', '#06b6d4', '#eab308'];

export function ReportsPage() {
  const { stats, monthlyData, facultyBreakdown, topVolunteers, isLoading } = useReportsData();
  const { data: facultyData, isLoading: facultyLoading } = useFacultyReports();
  const { data: topHoursData, isLoading: topHoursLoading } = useTopHoursReport(20);
  const { data: certificatesData, isLoading: certsLoading } = useCertificatesReport();
  const { data: totalHoursData, isLoading: hoursLoading } = useTotalHoursReport();
  const { data: allVolunteers, isLoading: volunteersLoading } = useAllVolunteersExport();
  const { opportunities } = useOpportunities();
  
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>('');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>('');
  const [volunteerSearch, setVolunteerSearch] = useState('');
  
  const { data: attendanceData, isLoading: attendanceLoading } = useAttendanceReport(selectedOpportunityId);
  const { data: volunteerDetails, isLoading: volunteerDetailsLoading } = useVolunteerDetails(selectedVolunteerId);

  if (isLoading) {
    return (
      <DashboardLayout title="Reports">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const exportReportPDF = async () => {
    if (!stats) return;
    
    await generateReportPDF({
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

  const exportVolunteerPDF = async () => {
    if (!volunteerDetails) return;
    await generateVolunteerPDF(volunteerDetails);
  };

  const exportAttendancePDF = async () => {
    if (!attendanceData || !attendanceData.opportunity) return;
    await generateAttendanceReportPDF({
      opportunity: {
        title: attendanceData.opportunity.title,
        date: attendanceData.opportunity.date,
        location: attendanceData.opportunity.location,
        start_time: attendanceData.opportunity.start_time,
        end_time: attendanceData.opportunity.end_time,
      },
      attendees: attendanceData.attendees,
      registered: attendanceData.registered,
      attended: attendanceData.attended,
    });
  };

  const exportAllVolunteersPDF = async () => {
    if (!allVolunteers) return;
    await generateAllVolunteersPDF(allVolunteers.map(v => ({
      name: v.full_name,
      university_id: v.university_id,
      faculty: v.faculty,
      total_hours: v.total_hours,
      opportunities_completed: v.opportunities_completed,
      is_active: v.is_active ?? false,
    })));
  };

  const engagementRate = stats?.totalVolunteers 
    ? Math.round((stats.activeVolunteers / stats.totalVolunteers) * 100) 
    : 0;

  const avgHoursPerVolunteer = stats?.totalVolunteers 
    ? Math.round((stats.totalHours / stats.totalVolunteers) * 10) / 10 
    : 0;

  const completionRate = stats?.totalOpportunities 
    ? Math.round((stats.completedOpportunities / stats.totalOpportunities) * 100) 
    : 0;

  const filteredVolunteers = allVolunteers?.filter(v => 
    v.full_name.toLowerCase().includes(volunteerSearch.toLowerCase()) ||
    v.university_id.includes(volunteerSearch)
  );

  const completedOpportunities = opportunities?.filter((o: any) => 
    o.status === 'completed' || o.status === 'published'
  );

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
            Export Summary PDF
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="faculty">By Faculty</TabsTrigger>
            <TabsTrigger value="top-hours">Top Hours</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="volunteers">All Volunteers</TabsTrigger>
            <TabsTrigger value="individual">Individual Report</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
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
                      <Badge variant="secondary" className="text-xs mt-1">
                        <UserCheck className="h-3 w-3 mr-1" />
                        {stats?.activeVolunteers || 0} active
                      </Badge>
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
                      <p className="text-3xl font-bold">{totalHoursData?.totalHours || stats?.totalHours || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Hours</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {totalHoursData?.avgHours || avgHoursPerVolunteer} avg/volunteer
                      </Badge>
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
                      <Badge variant="secondary" className="text-xs mt-1">
                        <FileCheck className="h-3 w-3 mr-1" />
                        {stats?.completedOpportunities || 0} completed
                      </Badge>
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
                      <p className="text-3xl font-bold">{certificatesData?.totalIssued || stats?.totalCertificates || 0}</p>
                      <p className="text-sm text-muted-foreground">Certificates</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {certificatesData?.totalPending || 0} pending
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

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
                    <span className="text-sm text-muted-foreground">opportunities</span>
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
                    <span className="text-sm text-muted-foreground">check-ins</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
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
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                        <Legend />
                        <Area type="monotone" dataKey="volunteers" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorVolunteers)" name="New Volunteers" />
                        <Area type="monotone" dataKey="hours" stroke="hsl(var(--warning))" fillOpacity={1} fill="url(#colorHours)" name="Hours" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available yet
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Faculty Distribution</CardTitle>
                  <CardDescription>Volunteers by academic faculty</CardDescription>
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

          {/* Faculty Tab */}
          <TabsContent value="faculty" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Volunteers by Faculty
                    </CardTitle>
                    <CardDescription>Breakdown of volunteers and hours per faculty</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {facultyLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Faculty</TableHead>
                        <TableHead className="text-right">Volunteers</TableHead>
                        <TableHead className="text-right">Total Hours</TableHead>
                        <TableHead className="text-right">Avg Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facultyData?.map((faculty) => (
                        <TableRow key={faculty.id}>
                          <TableCell className="font-medium">{faculty.name}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{faculty.count}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{faculty.hours}</TableCell>
                          <TableCell className="text-right">
                            {faculty.count > 0 ? (faculty.hours / faculty.count).toFixed(1) : 0}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!facultyData || facultyData.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No faculty data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Hours Tab */}
          <TabsContent value="top-hours" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-warning" />
                  Top Volunteers by Hours
                </CardTitle>
                <CardDescription>Volunteers ranked by total hours contributed</CardDescription>
              </CardHeader>
              <CardContent>
                {topHoursLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topHoursData?.map((v, index) => (
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
                          <p className="font-medium">{v.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {v.faculty} • {v.opportunities_completed} opportunities
                          </p>
                        </div>
                        <Badge variant="default" className="text-lg px-3 py-1">
                          {v.total_hours} hrs
                        </Badge>
                      </div>
                    ))}
                    {(!topHoursData || topHoursData.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">No volunteers yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5" />
                      Attendance Report
                    </CardTitle>
                    <CardDescription>View attendance for each opportunity</CardDescription>
                  </div>
                  {attendanceData && (
                    <Button onClick={exportAttendancePDF} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedOpportunityId} onValueChange={setSelectedOpportunityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an opportunity" />
                  </SelectTrigger>
                  <SelectContent>
                    {completedOpportunities?.map((opp: any) => (
                      <SelectItem key={opp.id} value={opp.id}>
                        {opp.title} - {opp.date ? format(new Date(opp.date), 'MMM dd, yyyy') : 'No date'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {attendanceLoading && (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}

                {attendanceData && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-primary">{attendanceData.registered}</p>
                          <p className="text-sm text-muted-foreground">Registered</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-green-500">{attendanceData.attended}</p>
                          <p className="text-sm text-muted-foreground">Attended</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-destructive">{attendanceData.absent}</p>
                          <p className="text-sm text-muted-foreground">Absent</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Volunteer</TableHead>
                          <TableHead>University ID</TableHead>
                          <TableHead>Check-in Time</TableHead>
                          <TableHead>Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceData.attendees.map((att, index) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{att.name}</TableCell>
                            <TableCell>{att.university_id}</TableCell>
                            <TableCell>{new Date(att.check_in_time).toLocaleTimeString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{att.check_in_method}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {attendanceData.attendees.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No attendance records
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Award className="h-10 w-10 mx-auto text-green-500 mb-2" />
                  <p className="text-3xl font-bold">{certificatesData?.totalIssued || 0}</p>
                  <p className="text-muted-foreground">Certificates Issued</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-10 w-10 mx-auto text-warning mb-2" />
                  <p className="text-3xl font-bold">{certificatesData?.totalPending || 0}</p>
                  <p className="text-muted-foreground">Pending Certificates</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-10 w-10 mx-auto text-primary mb-2" />
                  <p className="text-3xl font-bold">{certificatesData?.totalHoursIssued || 0}</p>
                  <p className="text-muted-foreground">Total Hours Certified</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="issued">
              <TabsList>
                <TabsTrigger value="issued">Issued ({certificatesData?.issued?.length || 0})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({certificatesData?.pending?.length || 0})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="issued">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Certificate #</TableHead>
                          <TableHead>Volunteer</TableHead>
                          <TableHead>Opportunity</TableHead>
                          <TableHead>Hours</TableHead>
                          <TableHead>Issued</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {certificatesData?.issued?.slice(0, 20).map((cert) => (
                          <TableRow key={cert.id}>
                            <TableCell className="font-mono text-sm">{cert.certificate_number}</TableCell>
                            <TableCell>{cert.volunteer_name}</TableCell>
                            <TableCell>{cert.opportunity_title}</TableCell>
                            <TableCell><Badge>{cert.hours} hrs</Badge></TableCell>
                            <TableCell className="text-muted-foreground">
                              {cert.issued_at ? format(new Date(cert.issued_at), 'MMM dd, yyyy') : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="pending">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Volunteer</TableHead>
                          <TableHead>University ID</TableHead>
                          <TableHead>Opportunity</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {certificatesData?.pending?.map((p, index) => (
                          <TableRow key={index}>
                            <TableCell>{p.volunteer_name}</TableCell>
                            <TableCell>{p.university_id}</TableCell>
                            <TableCell>{p.opportunity_title}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {p.opportunity_date ? format(new Date(p.opportunity_date), 'MMM dd, yyyy') : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!certificatesData?.pending || certificatesData.pending.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No pending certificates
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* All Volunteers Tab */}
          <TabsContent value="volunteers" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      All Volunteers Export
                    </CardTitle>
                    <CardDescription>Complete list of all registered volunteers</CardDescription>
                  </div>
                  <Button onClick={exportAllVolunteersPDF} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or ID..."
                    value={volunteerSearch}
                    onChange={(e) => setVolunteerSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {volunteersLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>University ID</TableHead>
                        <TableHead>Faculty</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Opportunities</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVolunteers?.slice(0, 50).map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-medium">{v.full_name}</TableCell>
                          <TableCell>{v.university_id}</TableCell>
                          <TableCell>{v.faculty || 'N/A'}</TableCell>
                          <TableCell><Badge variant="secondary">{v.total_hours}</Badge></TableCell>
                          <TableCell>{v.opportunities_completed}</TableCell>
                          <TableCell>
                            <Badge variant={v.is_active ? 'default' : 'outline'}>
                              {v.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Individual Report Tab */}
          <TabsContent value="individual" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Individual Volunteer Report
                    </CardTitle>
                    <CardDescription>Generate a detailed PDF report for any volunteer</CardDescription>
                  </div>
                  {volunteerDetails && (
                    <Button onClick={exportVolunteerPDF} variant="default">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedVolunteerId} onValueChange={setSelectedVolunteerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a volunteer" />
                  </SelectTrigger>
                  <SelectContent>
                    {allVolunteers?.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.full_name} ({v.university_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {volunteerDetailsLoading && (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}

                {volunteerDetails && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span className="font-medium">
                              {volunteerDetails.volunteer.first_name} {volunteerDetails.volunteer.father_name} {volunteerDetails.volunteer.family_name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span>{volunteerDetails.volunteer.university_email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Phone:</span>
                            <span>{volunteerDetails.volunteer.phone_number}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Faculty:</span>
                            <span>{volunteerDetails.volunteer.faculty_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Major:</span>
                            <span>{volunteerDetails.volunteer.major_name}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Statistics</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-bold text-primary">{volunteerDetails.volunteer.total_hours}</p>
                              <p className="text-xs text-muted-foreground">Hours</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-500">{volunteerDetails.volunteer.opportunities_completed}</p>
                              <p className="text-xs text-muted-foreground">Opportunities</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-warning">
                                {volunteerDetails.volunteer.rating?.toFixed(1) || 'N/A'}
                              </p>
                              <p className="text-xs text-muted-foreground">Rating</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {volunteerDetails.attendance.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Attendance History</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Opportunity</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Check-in</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {volunteerDetails.attendance.slice(0, 5).map((att, i) => (
                                <TableRow key={i}>
                                  <TableCell>{att.opportunity_title}</TableCell>
                                  <TableCell>{att.date ? format(new Date(att.date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                                  <TableCell>{new Date(att.check_in_time).toLocaleTimeString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}

                    {volunteerDetails.certificates.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Certificates</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Certificate #</TableHead>
                                <TableHead>Opportunity</TableHead>
                                <TableHead>Hours</TableHead>
                                <TableHead>Issued</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {volunteerDetails.certificates.map((cert, i) => (
                                <TableRow key={i}>
                                  <TableCell className="font-mono text-sm">{cert.certificate_number}</TableCell>
                                  <TableCell>{cert.opportunity_title}</TableCell>
                                  <TableCell><Badge>{cert.hours} hrs</Badge></TableCell>
                                  <TableCell>{cert.issued_at ? format(new Date(cert.issued_at), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}
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
