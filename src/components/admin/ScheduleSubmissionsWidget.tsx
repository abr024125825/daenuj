import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Loader2, 
  Users, 
  CheckCircle, 
  Clock, 
  Download, 
  Calendar,
  FileText,
  Lock,
  Unlock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAcademicSemesters } from '@/hooks/useAcademicSemesters';
import { format } from 'date-fns';
import { generateScheduleSubmissionsPDF } from '@/lib/generateReportsPDF';

export function ScheduleSubmissionsWidget() {
  const { activeSemester, isLoading: semesterLoading } = useAcademicSemesters();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['schedule-submissions', activeSemester?.id],
    queryFn: async () => {
      if (!activeSemester) return null;

      // Get all active volunteers with their schedule status
      const { data: volunteers, error } = await supabase
        .from('volunteers')
        .select(`
          id,
          user_id,
          schedule_submitted_at,
          schedule_submitted_for_semester,
          application:volunteer_applications(
            first_name,
            father_name,
            family_name,
            university_id,
            faculty:faculties(name),
            major:majors(name)
          )
        `)
        .eq('is_active', true);

      if (error) throw error;

      // Get course counts per volunteer for this semester
      const { data: courses } = await supabase
        .from('volunteer_courses')
        .select('volunteer_id')
        .eq('semester_id', activeSemester.id);

      const courseCountMap = new Map<string, number>();
      courses?.forEach(c => {
        courseCountMap.set(c.volunteer_id, (courseCountMap.get(c.volunteer_id) || 0) + 1);
      });

      // Process volunteers
      const processed = volunteers?.map(v => {
        const isSubmitted = v.schedule_submitted_for_semester === activeSemester.id;
        return {
          id: v.id,
          volunteerName: `${v.application?.first_name || ''} ${v.application?.father_name || ''} ${v.application?.family_name || ''}`,
          universityId: v.application?.university_id || '',
          faculty: v.application?.faculty?.name || '',
          major: v.application?.major?.name || '',
          submittedAt: isSubmitted ? v.schedule_submitted_at : null,
          courseCount: courseCountMap.get(v.id) || 0,
          status: isSubmitted ? 'submitted' : 'pending' as 'submitted' | 'pending',
        };
      }) || [];

      const submitted = processed.filter(v => v.status === 'submitted');
      const pending = processed.filter(v => v.status === 'pending');

      return {
        volunteers: processed,
        submitted,
        pending,
        stats: {
          total: processed.length,
          submitted: submitted.length,
          pending: pending.length,
          submissionRate: processed.length > 0 ? (submitted.length / processed.length) * 100 : 0,
        },
      };
    },
    enabled: !!activeSemester,
  });

  const handleExportPDF = async () => {
    if (!data || !activeSemester) return;

    await generateScheduleSubmissionsPDF({
      semester: {
        name: activeSemester.name,
        academicYear: activeSemester.academic_year,
      },
      submissions: data.volunteers,
      stats: data.stats,
    });
  };

  const handleExportCSV = () => {
    if (!data || !activeSemester) return;

    const headers = ['Name', 'University ID', 'Faculty', 'Major', 'Courses', 'Status', 'Submitted At'];
    const rows = data.volunteers.map(v => [
      v.volunteerName,
      v.universityId,
      v.faculty,
      v.major,
      v.courseCount.toString(),
      v.status,
      v.submittedAt ? format(new Date(v.submittedAt), 'yyyy-MM-dd HH:mm') : '',
    ]);

    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule-submissions-${activeSemester.name.replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || semesterLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!activeSemester) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No active semester</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Schedule Submissions
            </CardTitle>
            <CardDescription>
              Volunteer schedule submission status for {activeSemester.name}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={activeSemester.is_schedule_open !== false ? 'outline' : 'secondary'}>
              {activeSemester.is_schedule_open !== false ? (
                <><Unlock className="h-3 w-3 mr-1" /> Open</>
              ) : (
                <><Lock className="h-3 w-3 mr-1" /> Closed</>
              )}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-1" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">{data.stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Volunteers</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{data.stats.submitted}</p>
            <p className="text-xs text-muted-foreground">Submitted</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{data.stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{Math.round(data.stats.submissionRate)}%</p>
            <p className="text-xs text-muted-foreground">Submission Rate</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Submission Progress</span>
            <span className="text-sm text-muted-foreground">
              {data.stats.submitted} of {data.stats.total}
            </span>
          </div>
          <Progress value={data.stats.submissionRate} />
        </div>

        {/* Pending Submissions List */}
        {data.pending.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Pending Submissions ({data.pending.length})
            </h4>
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>University ID</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Courses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.pending.slice(0, 10).map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.volunteerName}</TableCell>
                      <TableCell className="font-mono text-sm">{v.universityId}</TableCell>
                      <TableCell className="text-sm">{v.faculty}</TableCell>
                      <TableCell>
                        <Badge variant={v.courseCount > 0 ? 'outline' : 'secondary'}>
                          {v.courseCount} courses
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.pending.length > 10 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  And {data.pending.length - 10} more...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Recently Submitted */}
        {data.submitted.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Recently Submitted
            </h4>
            <div className="max-h-48 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>University ID</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Submitted At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.submitted
                    .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime())
                    .slice(0, 5)
                    .map(v => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.volunteerName}</TableCell>
                        <TableCell className="font-mono text-sm">{v.universityId}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{v.courseCount} courses</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {v.submittedAt && format(new Date(v.submittedAt), 'MMM dd, HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
