import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar, Users, FileText, AlertCircle, TrendingUp, ArrowRight,
  Loader2, CheckCircle, Clock, BarChart3, PieChart, Activity, Download
} from 'lucide-react';
import { useDisabilityExamStats } from '@/hooks/useDisabilityExamStats';
import { useDisabilityExams } from '@/hooks/useDisabilityExams';
import { useDisabilityStudents } from '@/hooks/useDisabilityStudents';
import { useAcademicSemesters } from '@/hooks/useAcademicSemesters';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isTomorrow, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { generateDisabilityReportPDF } from '@/lib/generateDisabilityReportPDF';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const CHART_COLORS = [
  'hsl(195, 85%, 42%)', 'hsl(45, 95%, 50%)', 'hsl(160, 76%, 36%)',
  'hsl(0, 84%, 60%)', 'hsl(270, 60%, 55%)', 'hsl(30, 80%, 50%)',
];

function getDateLabel(dateStr: string) {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM dd');
}

export function DisabilityCoordinatorDashboard() {
  const navigate = useNavigate();
  const { stats, isLoading: statsLoading } = useDisabilityExamStats();
  const { activeSemester } = useAcademicSemesters();
  const { exams, isLoading: examsLoading } = useDisabilityExams(activeSemester?.id);
  const { students } = useDisabilityStudents();

  // Fetch volunteer performance data
  const { data: assignments } = useQuery({
    queryKey: ['disability-assignments-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disability_exam_assignments')
        .select('volunteer_id, status, assigned_role, completed_at, exam_id');
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = statsLoading || examsLoading;

  // Upcoming exams (next 7 days)
  const today = new Date();
  const upcomingExams = exams
    ?.filter(exam => {
      const examDate = parseISO(exam.exam_date);
      return examDate >= today && exam.status !== 'cancelled';
    })
    .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
    .slice(0, 5);

  const pendingExams = exams?.filter(e => e.status === 'pending') || [];

  // ── Chart Data ──

  // 1. Disability types distribution
  const disabilityTypeData = useMemo(() => {
    if (!students?.length) return [];
    const counts: Record<string, number> = {};
    students.forEach(s => {
      const type = s.disability_type || 'Not Specified';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [students]);

  // 2. Special needs distribution
  const specialNeedsData = useMemo(() => {
    if (!students?.length) return [];
    const counts: Record<string, number> = {};
    students.forEach(s => {
      const needs = s.special_needs as string[] | null;
      if (needs?.length) {
        needs.forEach(need => {
          const label = need.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          counts[label] = (counts[label] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [students]);

  // 3. Monthly exam trends (last 6 months)
  const monthlyTrends = useMemo(() => {
    if (!exams?.length) return [];
    const sixMonthsAgo = subMonths(today, 5);
    const months = eachMonthOfInterval({ start: startOfMonth(sixMonthsAgo), end: endOfMonth(today) });
    return months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const label = format(month, 'MMM');
      const monthExams = exams.filter(e => e.exam_date.startsWith(monthStr));
      return {
        name: label,
        total: monthExams.length,
        completed: monthExams.filter(e => e.status === 'completed').length,
        pending: monthExams.filter(e => e.status === 'pending').length,
      };
    });
  }, [exams]);

  // 4. Exam status for pie chart
  const statusPieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Pending', value: stats.pendingExams, color: 'hsl(45, 95%, 50%)' },
      { name: 'Assigned', value: stats.assignedExams, color: 'hsl(195, 85%, 42%)' },
      { name: 'Confirmed', value: stats.confirmedExams, color: 'hsl(160, 76%, 36%)' },
      { name: 'Completed', value: stats.completedExams, color: 'hsl(200, 20%, 60%)' },
    ].filter(d => d.value > 0);
  }, [stats]);

  // 5. Top volunteers
  const topVolunteers = useMemo(() => {
    if (!assignments?.length) return [];
    const counts: Record<string, { completed: number; total: number }> = {};
    assignments.forEach(a => {
      if (!counts[a.volunteer_id]) counts[a.volunteer_id] = { completed: 0, total: 0 };
      counts[a.volunteer_id].total++;
      if (a.status === 'completed') counts[a.volunteer_id].completed++;
    });
    return Object.entries(counts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5);
  }, [assignments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleExportPDF = async () => {
    if (!stats) return;
    await generateDisabilityReportPDF({
      stats,
      semesterName: activeSemester?.name || 'Current Semester',
      academicYear: activeSemester?.academic_year || '',
      disabilityTypes: disabilityTypeData.map(d => ({ name: d.name, count: d.value })),
      specialNeeds: specialNeedsData.map(d => ({ name: d.name, count: d.value })),
      monthlyExams: monthlyTrends.map(m => ({ month: m.name, total: m.total, completed: m.completed })),
      topVolunteers: topVolunteers.map(v => ({ name: `Volunteer`, completed: v.completed, total: v.total })),
    });
  };

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportPDF}>
          <Download className="h-4 w-4" /> Export PDF Report
        </Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Users} label="Active Students" value={stats?.activeStudents || 0} sub={`${stats?.totalStudents || 0} total`} color="text-primary" />
        <KPICard icon={AlertCircle} label="Pending Exams" value={stats?.pendingExams || 0} sub="Need assignment" color="text-orange-500" />
        <KPICard icon={Calendar} label="This Week" value={stats?.upcomingExamsThisWeek || 0} sub="Upcoming exams" color="text-purple-500" />
        <KPICard icon={TrendingUp} label="Coverage Rate" value={`${stats?.coverageRate || 0}%`} sub="Exams covered" color="text-green-500" />
      </div>

      {/* ── Row 2: Action Required + Exam Status Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Assignments */}
        <Card className={pendingExams.length > 0 ? 'border-orange-500/30' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Action Required
            </CardTitle>
            <CardDescription>
              {pendingExams.length > 0
                ? `${pendingExams.length} exam(s) need volunteer assignments`
                : 'All exams have volunteers assigned'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingExams.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
                All caught up!
              </div>
            ) : (
              <div className="space-y-2">
                {pendingExams.slice(0, 4).map(exam => (
                  <div key={exam.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{exam.student?.student_name}</p>
                      <p className="text-xs text-muted-foreground">{exam.course_name} · {getDateLabel(exam.exam_date)}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{exam.start_time}</Badge>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-2 gap-1" onClick={() => navigate('/dashboard/disability-exams')}>
                  Manage All <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exam Status Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-4 w-4" />
              Exam Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusPieData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No exam data available</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={160}>
                  <RechartsPie>
                    <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="value" stroke="none">
                      {statusPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {statusPieData.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="text-muted-foreground flex-1">{entry.name}</span>
                      <span className="font-semibold">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Monthly Trends + Disability Types ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Monthly Exam Trends
            </CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyTrends.every(m => m.total === 0) ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No historical data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="completed" name="Completed" fill="hsl(160, 76%, 36%)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="hsl(45, 95%, 50%)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Disability Types Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Student Disability Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            {disabilityTypeData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No student data available</div>
            ) : (
              <div className="space-y-3">
                {disabilityTypeData.map((item, i) => {
                  const total = disabilityTypeData.reduce((s, d) => s + d.value, 0);
                  const pct = Math.round((item.value / total) * 100);
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="font-medium">{item.value} ({pct}%)</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Special Needs + Upcoming Exams ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Special Needs Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Special Needs Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {specialNeedsData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No special needs data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={specialNeedsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="value" name="Students" fill="hsl(195, 85%, 42%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Exams */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!upcomingExams?.length ? (
              <div className="text-center py-6 text-muted-foreground text-sm">No upcoming exams</div>
            ) : (
              <div className="space-y-2">
                {upcomingExams.map(exam => {
                  const statusColors: Record<string, string> = {
                    pending: 'bg-yellow-500', assigned: 'bg-blue-500', confirmed: 'bg-green-500',
                  };
                  return (
                    <div key={exam.id} className="flex items-center justify-between p-2.5 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{exam.student?.student_name}</p>
                          <Badge className={`${statusColors[exam.status] || 'bg-gray-500'} text-white text-[10px] px-1.5`}>
                            {exam.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{exam.course_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{getDateLabel(exam.exam_date)}</p>
                        <p className="text-xs text-muted-foreground">{exam.start_time}</p>
                      </div>
                    </div>
                  );
                })}
                <Button variant="outline" size="sm" className="w-full mt-2 gap-1" onClick={() => navigate('/dashboard/disability-exams')}>
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 5: Volunteer Performance ── */}
      {topVolunteers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Top Volunteers — Disability Support
            </CardTitle>
            <CardDescription>By completed assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {topVolunteers.map((v, i) => {
                const rate = v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0;
                return (
                  <div key={v.id} className="p-3 rounded-lg border text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <span className="text-primary font-bold text-sm">#{i + 1}</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{v.completed}</p>
                    <p className="text-xs text-muted-foreground">of {v.total} assigned</p>
                    <Progress value={rate} className="h-1.5 mt-2" />
                    <p className="text-[10px] text-muted-foreground mt-1">{rate}% completion</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── KPI Card ─── */
function KPICard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub: string; color: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
