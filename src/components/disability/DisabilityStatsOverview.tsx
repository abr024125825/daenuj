import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  FileText, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { useDisabilityExamStats } from '@/hooks/useDisabilityExamStats';

export function DisabilityStatsOverview() {
  const { stats, isLoading } = useDisabilityExamStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      subtitle: `${stats.activeStudents} active`,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Total Exams',
      value: stats.totalExams,
      subtitle: `${stats.upcomingExamsThisWeek} this week`,
      icon: FileText,
      color: 'text-purple-500',
    },
    {
      title: 'Pending Assignment',
      value: stats.pendingExams,
      subtitle: 'Need volunteers',
      icon: AlertCircle,
      color: 'text-orange-500',
    },
    {
      title: 'Coverage Rate',
      value: `${stats.coverageRate}%`,
      subtitle: 'Exams covered',
      icon: TrendingUp,
      color: 'text-green-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <Card key={idx}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Exam Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{stats.pendingExams}</span>
                <Badge variant="secondary">{stats.totalExams > 0 ? Math.round((stats.pendingExams / stats.totalExams) * 100) : 0}%</Badge>
              </div>
            </div>
            <Progress value={stats.totalExams > 0 ? (stats.pendingExams / stats.totalExams) * 100 : 0} className="h-2" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Assigned</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{stats.assignedExams}</span>
                <Badge variant="secondary">{stats.totalExams > 0 ? Math.round((stats.assignedExams / stats.totalExams) * 100) : 0}%</Badge>
              </div>
            </div>
            <Progress value={stats.totalExams > 0 ? (stats.assignedExams / stats.totalExams) * 100 : 0} className="h-2" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{stats.confirmedExams}</span>
                <Badge variant="secondary">{stats.totalExams > 0 ? Math.round((stats.confirmedExams / stats.totalExams) * 100) : 0}%</Badge>
              </div>
            </div>
            <Progress value={stats.totalExams > 0 ? (stats.confirmedExams / stats.totalExams) * 100 : 0} className="h-2" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{stats.completedExams}</span>
                <Badge variant="secondary">{stats.totalExams > 0 ? Math.round((stats.completedExams / stats.totalExams) * 100) : 0}%</Badge>
              </div>
            </div>
            <Progress value={stats.totalExams > 0 ? (stats.completedExams / stats.totalExams) * 100 : 0} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
