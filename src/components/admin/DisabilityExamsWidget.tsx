import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accessibility, ArrowRight, Calendar, Clock, User, Loader2 } from 'lucide-react';
import { useDisabilityExams } from '@/hooks/useDisabilityExams';
import { format } from 'date-fns';

export function DisabilityExamsWidget() {
  const { exams, isLoading } = useDisabilityExams();

  // Get upcoming exams (scheduled status, future date)
  const upcomingExams = exams?.filter((exam: any) => {
    const examDate = new Date(exam.exam_date);
    return exam.status === 'scheduled' && examDate >= new Date();
  }).slice(0, 3) || [];

  // Get exams needing assignments
  const examsNeedingAssignment = exams?.filter((exam: any) => {
    const hasAssignments = exam.assignments && exam.assignments.length > 0;
    return exam.status === 'scheduled' && !hasAssignments;
  }).length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5 text-primary" />
            Disability Exams
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Accessibility className="h-5 w-5 text-primary" />
          Disability Exams
          {examsNeedingAssignment > 0 && (
            <Badge variant="destructive" className="ml-2">
              {examsNeedingAssignment} need assignment
            </Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" className="gap-1" asChild>
          <Link to="/dashboard/disability-exams">
            Manage <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingExams.length > 0 ? (
            upcomingExams.map((exam: any) => (
              <div
                key={exam.id}
                className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{exam.course_name}</h4>
                    {exam.course_code && (
                      <p className="text-xs text-muted-foreground">{exam.course_code}</p>
                    )}
                  </div>
                  <Badge variant={exam.assignments?.length > 0 ? 'default' : 'secondary'}>
                    {exam.assignments?.length || 0} volunteers
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {exam.student?.student_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(exam.exam_date), 'MMM dd')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {exam.start_time}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Accessibility className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No upcoming disability exams</p>
              <Button variant="link" size="sm" asChild>
                <Link to="/dashboard/disability-exams">Schedule an exam</Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
