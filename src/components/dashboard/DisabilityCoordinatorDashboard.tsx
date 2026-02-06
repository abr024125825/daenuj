import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  FileText, 
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useDisabilityExamStats } from '@/hooks/useDisabilityExamStats';
import { useDisabilityExams } from '@/hooks/useDisabilityExams';
import { useAcademicSemesters } from '@/hooks/useAcademicSemesters';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';

export function DisabilityCoordinatorDashboard() {
  const navigate = useNavigate();
  const { stats, isLoading: statsLoading } = useDisabilityExamStats();
  const { activeSemester } = useAcademicSemesters();
  const { exams, isLoading: examsLoading } = useDisabilityExams(activeSemester?.id);

  const isLoading = statsLoading || examsLoading;

  // Get upcoming exams (next 7 days)
  const today = new Date();
  const upcomingExams = exams
    ?.filter(exam => {
      const examDate = parseISO(exam.exam_date);
      return examDate >= today && exam.status !== 'cancelled';
    })
    .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
    .slice(0, 5);

  // Get pending exams that need assignments
  const pendingExams = exams?.filter(e => e.status === 'pending') || [];

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM dd');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Total: {stats?.totalStudents || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Exams</CardTitle>
            <AlertCircle className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingExams || 0}</div>
            <p className="text-xs text-muted-foreground">Need volunteer assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.upcomingExamsThisWeek || 0}</div>
            <p className="text-xs text-muted-foreground">Upcoming exams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage Rate</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.coverageRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Exams with volunteers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Assignments Alert */}
        {pendingExams.length > 0 && (
          <Card className="border-orange-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Action Required
              </CardTitle>
              <CardDescription>
                {pendingExams.length} exam(s) need volunteer assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingExams.slice(0, 3).map(exam => (
                  <div key={exam.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{exam.student?.student_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {exam.course_name} • {getDateLabel(exam.exam_date)}
                      </p>
                    </div>
                    <Badge variant="outline">{exam.start_time}</Badge>
                  </div>
                ))}
              </div>
              <Button 
                className="w-full mt-4" 
                variant="outline"
                onClick={() => navigate('/dashboard/disability-exams')}
              >
                Manage Assignments
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Exams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upcoming Exams
            </CardTitle>
            <CardDescription>Next scheduled exams</CardDescription>
          </CardHeader>
          <CardContent>
            {!upcomingExams || upcomingExams.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No upcoming exams scheduled
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingExams.map(exam => {
                  const statusColors: Record<string, string> = {
                    pending: 'bg-yellow-500',
                    assigned: 'bg-blue-500',
                    confirmed: 'bg-green-500',
                  };
                  
                  return (
                    <div key={exam.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{exam.student?.student_name}</p>
                          <Badge className={`${statusColors[exam.status] || 'bg-gray-500'} text-white text-xs`}>
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
              </div>
            )}
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => navigate('/dashboard/disability-exams')}
            >
              View All Exams
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
