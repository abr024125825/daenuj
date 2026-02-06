import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserCheck, 
  Loader2, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Users,
  Wand2
} from 'lucide-react';
import { useDisabilityExams, SpecialNeedType } from '@/hooks/useDisabilityExams';
import { 
  useDisabilityExamAssignments, 
  AvailableVolunteer 
} from '@/hooks/useDisabilityExamAssignments';
import { useAcademicSemesters } from '@/hooks/useAcademicSemesters';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const ROLE_LABELS: Record<SpecialNeedType, string> = {
  reader: 'Reader',
  extra_time: 'Extra Time Supervisor',
  companion: 'Companion',
  scribe: 'Scribe',
  separate_room: 'Separate Room Supervisor',
  assistive_technology: 'Assistive Technology Support',
  other: 'Other',
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-500' },
  assigned: { label: 'Assigned', color: 'bg-blue-500' },
  confirmed: { label: 'Confirmed', color: 'bg-green-500' },
  completed: { label: 'Completed', color: 'bg-gray-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500' },
};

export function DisabilityAssignmentsManager() {
  const { user } = useAuth();
  const { activeSemester } = useAcademicSemesters();
  const { exams, isLoading: examsLoading } = useDisabilityExams(activeSemester?.id);
  const { 
    assignments, 
    isLoading: assignmentsLoading, 
    getAvailableVolunteers,
    checkConflict,
    assignVolunteer,
    removeAssignment,
  } = useDisabilityExamAssignments();

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [availableVolunteers, setAvailableVolunteers] = useState<AvailableVolunteer[]>([]);
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [formData, setFormData] = useState({
    volunteer_id: '',
    assigned_role: '' as SpecialNeedType | '',
    notes: '',
  });

  const selectedExam = exams?.find(e => e.id === selectedExamId);

  const openAssignDialog = async (examId: string) => {
    const exam = exams?.find(e => e.id === examId);
    if (!exam) return;

    setSelectedExamId(examId);
    setFormData({ volunteer_id: '', assigned_role: '', notes: '' });
    setHasConflict(false);
    setAssignDialogOpen(true);

    // Fetch available volunteers
    setLoadingVolunteers(true);
    try {
      const volunteers = await getAvailableVolunteers(
        exam.exam_date,
        exam.start_time,
        exam.end_time
      );
      setAvailableVolunteers(volunteers);
    } catch (error) {
      console.error('Failed to fetch volunteers:', error);
      setAvailableVolunteers([]);
    } finally {
      setLoadingVolunteers(false);
    }
  };

  const handleVolunteerSelect = async (volunteerId: string) => {
    if (!selectedExam) return;

    setFormData(prev => ({ ...prev, volunteer_id: volunteerId }));

    // Check for conflicts
    const conflict = await checkConflict(
      volunteerId,
      selectedExam.exam_date,
      selectedExam.start_time,
      selectedExam.end_time
    );
    setHasConflict(conflict);
  };

  const handleAssign = async () => {
    if (!user || !selectedExamId || !formData.volunteer_id || !formData.assigned_role) return;

    await assignVolunteer.mutateAsync({
      exam_id: selectedExamId,
      volunteer_id: formData.volunteer_id,
      assigned_role: formData.assigned_role as SpecialNeedType,
      assigned_by: user.id,
      notes: formData.notes || undefined,
    });

    setAssignDialogOpen(false);
    setSelectedExamId(null);
  };

  const handleRemove = async () => {
    if (!user || !selectedAssignmentId) return;
    
    await removeAssignment.mutateAsync({
      id: selectedAssignmentId,
      performedBy: user.id,
    });

    setDeleteDialogOpen(false);
    setSelectedAssignmentId(null);
  };

  // Group exams by those needing assignments
  const pendingExams = exams?.filter(e => e.status === 'pending') || [];
  const assignedExams = exams?.filter(e => e.status !== 'pending') || [];

  const isLoading = examsLoading || assignmentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Exams Needing Volunteers
          </CardTitle>
          <CardDescription>
            {pendingExams.length} exam(s) waiting for volunteer assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingExams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
              <p>All exams have volunteers assigned!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Required Support</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingExams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{exam.student?.student_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {exam.student?.disability_type}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{exam.course_name}</p>
                        {exam.course_code && (
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
                          {format(new Date(exam.exam_date), 'MMM dd, yyyy')}
                        </Badge>
                        <Badge variant="outline" className="gap-1 block w-fit">
                          <Clock className="h-3 w-3" />
                          {exam.start_time} - {exam.end_time}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {exam.special_needs?.map((need) => (
                          <Badge key={need} variant="secondary" className="text-xs">
                            {ROLE_LABELS[need] || need}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => openAssignDialog(exam.id)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Current Assignments
          </CardTitle>
          <CardDescription>
            {assignments?.length || 0} active assignment(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!assignments || assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No assignments yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => {
                  const statusConfig = STATUS_CONFIG[assignment.status];
                  const volunteerName = assignment.volunteer?.application
                    ? `${assignment.volunteer.application.first_name} ${assignment.volunteer.application.family_name}`
                    : 'Unknown';

                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        {assignment.exam?.student?.student_name}
                      </TableCell>
                      <TableCell>
                        {assignment.exam?.course_name}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {assignment.exam?.exam_date && format(new Date(assignment.exam.exam_date), 'MMM dd')}
                          </Badge>
                          <Badge variant="outline" className="gap-1 block w-fit">
                            <Clock className="h-3 w-3" />
                            {assignment.exam?.start_time}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {volunteerName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {ROLE_LABELS[assignment.assigned_role] || assignment.assigned_role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig.color} text-white`}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAssignmentId(assignment.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assign Volunteer Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Assign Volunteer
            </DialogTitle>
            <DialogDescription>
              {selectedExam && (
                <>
                  {selectedExam.student?.student_name} - {selectedExam.course_name}
                  <br />
                  {format(new Date(selectedExam.exam_date), 'MMMM dd, yyyy')} at {selectedExam.start_time}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {loadingVolunteers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Available Volunteers</Label>
                  {availableVolunteers.length === 0 ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No volunteers available for this time slot
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Select
                      value={formData.volunteer_id}
                      onValueChange={handleVolunteerSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a volunteer" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVolunteers.map((volunteer) => (
                          <SelectItem key={volunteer.volunteer_id} value={volunteer.volunteer_id}>
                            {volunteer.full_name}
                            {volunteer.availability_score === 100 && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Available
                              </Badge>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {hasConflict && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This volunteer has a conflicting assignment at this time!
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label>Assigned Role *</Label>
                  <Select
                    value={formData.assigned_role}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_role: value as SpecialNeedType }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedExam?.special_needs?.map((need) => (
                        <SelectItem key={need} value={need}>
                          {ROLE_LABELS[need] || need}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional instructions for the volunteer..."
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!formData.volunteer_id || !formData.assigned_role || hasConflict || assignVolunteer.isPending}
            >
              {assignVolunteer.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Assign Volunteer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Assignment Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this volunteer assignment? 
              The volunteer will be notified and the exam will need a new assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemove} 
              className="bg-destructive text-destructive-foreground"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
