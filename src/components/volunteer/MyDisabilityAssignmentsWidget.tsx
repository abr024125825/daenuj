import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HandHeart, ArrowRight, Calendar, Clock, MapPin, Loader2 } from 'lucide-react';
import { useDisabilityExamAssignments } from '@/hooks/useDisabilityExamAssignments';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  completed: 'default',
  cancelled: 'destructive',
};

const roleLabels: Record<string, string> = {
  reader: 'Reader',
  writer: 'Writer',
  supervisor: 'Supervisor',
  mobility_assistant: 'Mobility Assistant',
  sign_language: 'Sign Language',
  other: 'Assistant',
};

export function MyDisabilityAssignmentsWidget() {
  const { user } = useAuth();

  // Get volunteer record
  const { data: volunteer } = useQuery({
    queryKey: ['my-volunteer-record', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('volunteers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { assignments, isLoading } = useDisabilityExamAssignments(volunteer?.id);

  // Filter for upcoming assignments (pending or confirmed, future exam date)
  const upcomingAssignments = assignments?.filter((assignment: any) => {
    const examDate = new Date(assignment.exam?.exam_date);
    return (
      (assignment.status === 'pending' || assignment.status === 'confirmed') &&
      examDate >= new Date()
    );
  }).slice(0, 3) || [];

  // Count pending assignments
  const pendingCount = assignments?.filter((a: any) => a.status === 'pending').length || 0;

  if (isLoading || !volunteer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandHeart className="h-5 w-5 text-primary" />
            Disability Support Assignments
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
          <HandHeart className="h-5 w-5 text-primary" />
          Disability Support
          {pendingCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pendingCount} pending
            </Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" className="gap-1" asChild>
          <Link to="/dashboard/my-disability-assignments">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingAssignments.length > 0 ? (
            upcomingAssignments.map((assignment: any) => (
              <div
                key={assignment.id}
                className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{assignment.exam?.course_name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Student: {assignment.exam?.student?.student_name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {roleLabels[assignment.assigned_role] || assignment.assigned_role}
                    </Badge>
                    <Badge variant={statusColors[assignment.status]}>
                      {assignment.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(assignment.exam?.exam_date), 'MMM dd')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {assignment.exam?.start_time}
                  </span>
                  {assignment.exam?.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {assignment.exam?.location}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <HandHeart className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No upcoming disability support assignments</p>
              <p className="text-sm">You'll be notified when assigned to help a student</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
