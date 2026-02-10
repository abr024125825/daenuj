import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMyDisabilityAssignments, useDisabilityExamAssignments } from '@/hooks/useDisabilityExamAssignments';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, MapPin, User, Loader2, CheckCircle, AlertCircle, HandHeart, Info, Phone } from 'lucide-react';
import { format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-500', icon: AlertCircle },
  assigned: { label: 'Assigned', color: 'bg-blue-500', icon: User },
  confirmed: { label: 'Confirmed', color: 'bg-green-500', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-gray-500', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: AlertCircle },
};

const ROLE_LABELS: Record<string, string> = {
  reader: 'Reader',
  extra_time: 'Extra Time Supervisor',
  companion: 'Companion',
  scribe: 'Scribe',
  separate_room: 'Separate Room Supervisor',
  assistive_technology: 'Assistive Technology Support',
  other: 'Other',
};

const SPECIAL_NEEDS_LABELS: Record<string, string> = {
  reader: 'Reader',
  extra_time: 'Extra Time',
  companion: 'Companion',
  scribe: 'Scribe',
  separate_room: 'Separate Room',
  assistive_technology: 'Assistive Technology',
  other: 'Other',
};

export function MyDisabilityAssignmentsPage() {
  const { user } = useAuth();
  const { assignments, isLoading } = useMyDisabilityAssignments();
  const { updateAssignment } = useDisabilityExamAssignments();

  const handleComplete = async (assignmentId: string) => {
    if (!user) return;
    try {
      await updateAssignment.mutateAsync({
        id: assignmentId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        performedBy: user.id,
      });
    } catch (error) {
      console.error('Failed to complete assignment:', error);
    }
  };

  const handleConfirm = async (assignmentId: string) => {
    if (!user) return;
    try {
      await updateAssignment.mutateAsync({
        id: assignmentId,
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        performedBy: user.id,
      });
    } catch (error) {
      console.error('Failed to confirm assignment:', error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const upcomingAssignments = assignments?.filter(a => 
    a.status !== 'completed' && a.status !== 'cancelled'
  ) || [];
  
  const pastAssignments = assignments?.filter(a => 
    a.status === 'completed' || a.status === 'cancelled'
  ) || [];

  return (
    <DashboardLayout title="My Disability Exam Assignments">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HandHeart className="h-6 w-6" />
            My Disability Exam Assignments
          </h1>
          <p className="text-muted-foreground">
            View your assigned disability exam support duties. Assignments are mandatory.
          </p>
        </div>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
            <CardDescription>
              {upcomingAssignments.length} assignment(s) - <span className="text-primary font-medium">Mandatory attendance required</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAssignments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming assignments</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Your Role</TableHead>
                    <TableHead>Special Needs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingAssignments.map((assignment) => {
                    const statusConfig = STATUS_CONFIG[assignment.status];
                    const StatusIcon = statusConfig.icon;
                    const exam = assignment.exam;
                    
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{exam?.student?.student_name}</p>
                            <p className="text-xs text-muted-foreground">
                              ID: {exam?.student?.university_id}
                            </p>
                            {(exam?.student as any)?.contact_phone && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Phone className="h-3 w-3" />
                                {(exam?.student as any).contact_phone}
                              </p>
                            )}
                            {exam?.student?.disability_type && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {exam.student.disability_type}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{exam?.course_name}</p>
                            {exam?.course_code && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {exam.course_code}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline" className="gap-1">
                              <Calendar className="h-3 w-3" />
                              {exam?.exam_date && format(new Date(exam.exam_date), 'MMM dd, yyyy')}
                            </Badge>
                            <Badge variant="outline" className="gap-1 block w-fit">
                              <Clock className="h-3 w-3" />
                              {exam?.start_time} - {exam?.end_time}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {exam?.location && (
                            <Badge variant="secondary" className="gap-1">
                              <MapPin className="h-3 w-3" />
                              {exam.location}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">
                            {ROLE_LABELS[assignment.assigned_role] || assignment.assigned_role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(exam as any)?.special_needs?.map((need: string) => (
                              <Badge key={need} variant="secondary" className="text-xs">
                                {SPECIAL_NEEDS_LABELS[need] || need}
                              </Badge>
                            ))}
                            {(exam as any)?.special_needs_notes && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-5 w-5">
                                      <Info className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{(exam as any).special_needs_notes}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig.color} text-white gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {assignment.status === 'assigned' && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleConfirm(assignment.id)}
                                disabled={updateAssignment.isPending}
                              >
                                Confirm
                              </Button>
                            )}
                            {(assignment.status === 'confirmed') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleComplete(assignment.id)}
                                disabled={updateAssignment.isPending}
                              >
                                Mark Complete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Past Assignments */}
        {pastAssignments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Past Assignments</CardTitle>
              <CardDescription>
                {pastAssignments.length} completed/cancelled assignment(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Your Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastAssignments.map((assignment) => {
                    const statusConfig = STATUS_CONFIG[assignment.status];
                    
                    return (
                      <TableRow key={assignment.id} className="opacity-60">
                        <TableCell>{assignment.exam?.student?.student_name}</TableCell>
                        <TableCell>{assignment.exam?.course_name}</TableCell>
                        <TableCell>
                          {assignment.exam?.exam_date && format(new Date(assignment.exam.exam_date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {ROLE_LABELS[assignment.assigned_role] || assignment.assigned_role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig.color} text-white`}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
