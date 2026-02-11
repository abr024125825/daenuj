import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  Wand2,
  Sparkles,
  FileText,
  UserMinus,
  Eye,
  Briefcase,
  User,
  Award,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDisabilityExams, SpecialNeedType } from '@/hooks/useDisabilityExams';
import { 
  useDisabilityExamAssignments, 
  AvailableVolunteer,
  DisabilityExamAssignment
} from '@/hooks/useDisabilityExamAssignments';
import { useAcademicSemesters } from '@/hooks/useAcademicSemesters';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { generateVolunteerAssignmentReport } from '@/lib/generateVolunteerAssignmentReport';
import { generateDisabilityCertificatePDF } from '@/lib/generateDisabilityCertificatePDF';
import { supabase } from '@/integrations/supabase/client';

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
    updateAssignment,
    removeAssignment,
    autoAssignVolunteer,
    autoAssignAllPending,
  } = useDisabilityExamAssignments();

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [selectedVolunteerForReport, setSelectedVolunteerForReport] = useState<{
    id: string;
    name: string;
    type: 'general' | 'employment';
  } | null>(null);
  const [availableVolunteers, setAvailableVolunteers] = useState<AvailableVolunteer[]>([]);
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportVolunteerId, setReportVolunteerId] = useState('');
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);
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

  const handleWithdraw = async () => {
    if (!user || !selectedAssignmentId) return;
    
    // Update the assignment status to cancelled with withdrawal reason
    await updateAssignment.mutateAsync({
      id: selectedAssignmentId,
      status: 'cancelled',
      notes: `Withdrawn: ${withdrawalReason}`,
      performedBy: user.id,
    });

    setWithdrawDialogOpen(false);
    setSelectedAssignmentId(null);
    setWithdrawalReason('');
    
    toast({
      title: 'Volunteer Withdrawn',
      description: 'The volunteer has been withdrawn from this assignment.',
    });
  };

  const openWithdrawDialog = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setWithdrawalReason('');
    setWithdrawDialogOpen(true);
  };

  const handleDownloadReport = (assignment: DisabilityExamAssignment) => {
    const volunteer = assignment.volunteer;
    if (!volunteer) return;

    const volunteerAssignments = assignments?.filter(a => a.volunteer_id === volunteer.id) || [];
    const dateRange = reportStartDate && reportEndDate
      ? { start: new Date(reportStartDate), end: new Date(reportEndDate) }
      : undefined;

    generateVolunteerAssignmentReport(
      {
        id: volunteer.id,
        volunteer_type: (volunteer.volunteer_type as 'general' | 'employment') || 'general',
        full_name: volunteer.application 
          ? `${volunteer.application.first_name} ${volunteer.application.family_name}`
          : 'Unknown',
        total_hours: 0,
      },
      volunteerAssignments,
      dateRange
    );
  };

  const handleFilteredReport = () => {
    if (!reportVolunteerId || !assignments) return;

    const volunteerAssignments = assignments.filter(a => a.volunteer_id === reportVolunteerId);
    if (volunteerAssignments.length === 0) {
      toast({ title: 'No assignments found for this volunteer', variant: 'destructive' });
      return;
    }

    const volunteer = volunteerAssignments[0]?.volunteer;
    const dateRange = reportStartDate && reportEndDate
      ? { start: new Date(reportStartDate), end: new Date(reportEndDate) }
      : undefined;

    generateVolunteerAssignmentReport(
      {
        id: reportVolunteerId,
        volunteer_type: (volunteer?.volunteer_type as 'general' | 'employment') || 'general',
        full_name: volunteer?.application
          ? `${volunteer.application.first_name} ${volunteer.application.family_name}`
          : 'Unknown',
        total_hours: 0,
      },
      volunteerAssignments,
      dateRange
    );
  };

  const calculateVolunteerHours = (volunteerId: string, startDate?: string, endDate?: string) => {
    if (!assignments) return { hours: 0, count: 0, students: 0 };
    let filtered = assignments.filter(a => a.volunteer_id === volunteerId && a.status === 'completed');
    if (startDate && endDate) {
      filtered = filtered.filter(a => {
        const examDate = a.exam?.exam_date;
        return examDate && examDate >= startDate && examDate <= endDate;
      });
    }
    const hours = filtered.reduce((sum, a) => {
      if (!a.exam) return sum;
      const [sh, sm] = a.exam.start_time.split(':').map(Number);
      const [eh, em] = a.exam.end_time.split(':').map(Number);
      return sum + Math.max(0, ((eh * 60 + em) - (sh * 60 + sm)) / 60);
    }, 0);
    const studentIds = new Set(filtered.map(a => a.exam?.student?.university_id).filter(Boolean));
    return { hours, count: filtered.length, students: studentIds.size };
  };

  const handleIssueCertificate = async () => {
    if (!reportVolunteerId || !assignments || !user) return;
    setIsGeneratingCert(true);
    try {
      const volunteerAssignments = assignments.filter(a => a.volunteer_id === reportVolunteerId);
      const volunteer = volunteerAssignments[0]?.volunteer;
      if (!volunteer) throw new Error('Volunteer not found');

      const volunteerName = volunteer.application
        ? `${volunteer.application.first_name} ${volunteer.application.family_name}`
        : 'Unknown';

      const stats = calculateVolunteerHours(reportVolunteerId, reportStartDate, reportEndDate);

      if (stats.count === 0) {
        toast({ title: 'No completed assignments found', variant: 'destructive' });
        return;
      }

      // Generate certificate number
      const { data: certNum } = await supabase.rpc('generate_certificate_number');
      const certificateNumber = certNum || `DSC-${Date.now()}`;

      // Save certificate to database so it appears in volunteer's certificates page
      const { error: insertError } = await supabase
        .from('certificates')
        .insert({
          volunteer_id: reportVolunteerId,
          certificate_number: certificateNumber,
          hours: stats.hours,
          certificate_type: 'disability',
          disability_hours: stats.hours,
          disability_assignments_count: stats.count,
          disability_students_helped: stats.students,
          date_range_start: reportStartDate || null,
          date_range_end: reportEndDate || null,
        });

      if (insertError) throw insertError;

      // Update volunteer total hours
      const { data: vol } = await supabase
        .from('volunteers')
        .select('total_hours')
        .eq('id', reportVolunteerId)
        .single();

      if (vol) {
        await supabase
          .from('volunteers')
          .update({
            total_hours: (vol.total_hours || 0) + stats.hours,
          })
          .eq('id', reportVolunteerId);
      }

      // Generate PDF
      await generateDisabilityCertificatePDF({
        volunteerName,
        totalHours: stats.hours,
        certificateNumber,
        issuedAt: format(new Date(), 'MMMM dd, yyyy'),
        assignmentsCount: stats.count,
        studentsHelped: stats.students,
        dateRange: reportStartDate && reportEndDate ? {
          start: format(new Date(reportStartDate), 'MMM dd, yyyy'),
          end: format(new Date(reportEndDate), 'MMM dd, yyyy'),
        } : undefined,
      });

      toast({ title: 'Certificate issued and saved successfully' });
    } catch (error) {
      toast({ title: 'Error generating certificate', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsGeneratingCert(false);
    }
  };

  // Get unique volunteers from assignments
  const uniqueVolunteers = assignments ? Array.from(
    new Map(assignments.map(a => [a.volunteer_id, a.volunteer])).entries()
  ).filter(([, v]) => v) : [];

  const { toast } = useToast();

  const handleAutoAssignAll = async () => {
    if (!user) return;
    
    setIsAutoAssigning(true);
    try {
      const result = await autoAssignAllPending(user.id);
      toast({
        title: 'Auto Assignment Complete',
        description: `Assigned ${result.success_count} volunteer(s)${result.fail_count > 0 ? ` - ${result.fail_count} failed` : ''}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const handleAutoAssignSingle = async (examId: string, role: SpecialNeedType) => {
    if (!user) return;
    
    try {
      const result = await autoAssignVolunteer(examId, role, user.id);
      if (result.success) {
        toast({
          title: 'Assigned',
          description: `Assigned ${result.volunteer_name}`,
        });
      } else {
        toast({
          title: 'No Volunteer Found',
          description: result.error || 'No volunteers available for this time slot',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Exams Needing Volunteers
              </CardTitle>
              <CardDescription>
                {pendingExams.length} exam(s) waiting for volunteer assignment
              </CardDescription>
            </div>
            {pendingExams.length > 0 && (
              <Button onClick={handleAutoAssignAll} disabled={isAutoAssigning}>
                {isAutoAssigning ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Auto Assign All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pendingExams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-primary opacity-50" />
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
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const firstNeed = exam.special_needs?.[0];
                            if (firstNeed) handleAutoAssignSingle(exam.id, firstNeed);
                          }}
                          disabled={!exam.special_needs?.length}
                          title="Auto Assign"
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => openAssignDialog(exam.id)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                      </div>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-36">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => {
                  const statusConfig = STATUS_CONFIG[assignment.status];
                  const volunteerName = assignment.volunteer?.application
                    ? `${assignment.volunteer.application.first_name} ${assignment.volunteer.application.family_name}`
                    : 'Unknown';
                  const volunteerType = assignment.volunteer?.volunteer_type || 'general';

                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{assignment.exam?.student?.student_name}</p>
                          <p className="text-xs text-muted-foreground">
                            ID: {assignment.exam?.student?.university_id}
                          </p>
                          {assignment.exam?.student?.disability_type && (
                            <p className="text-xs text-muted-foreground">
                              {assignment.exam.student.disability_type}
                            </p>
                          )}
                        </div>
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
                      <TableCell>
                        <div>
                          <p className="font-medium">{volunteerName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={volunteerType === 'employment' ? 'default' : 'secondary'}
                          className="gap-1"
                        >
                          {volunteerType === 'employment' ? (
                            <><Briefcase className="h-3 w-3" /> Employment</>
                          ) : (
                            <><User className="h-3 w-3" /> General</>
                          )}
                        </Badge>
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
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Download Report"
                            onClick={() => handleDownloadReport(assignment)}
                          >
                            <FileText className="h-4 w-4 text-primary" />
                          </Button>
                          {assignment.status !== 'cancelled' && assignment.status !== 'completed' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Withdraw Volunteer"
                              onClick={() => openWithdrawDialog(assignment.id)}
                            >
                              <UserMinus className="h-4 w-4 text-orange-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Remove Assignment"
                            onClick={() => {
                              setSelectedAssignmentId(assignment.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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

      {/* Reports & Certificates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Reports & Certificates
          </CardTitle>
          <CardDescription>
            Generate filtered reports and issue disability support certificates for volunteers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            <div className="space-y-2">
              <Label>Volunteer</Label>
              <Select value={reportVolunteerId} onValueChange={setReportVolunteerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select volunteer" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueVolunteers.map(([id, vol]) => (
                    <SelectItem key={id} value={id}>
                      {vol?.application
                        ? `${vol.application.first_name} ${vol.application.family_name}`
                        : 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleFilteredReport}
                  disabled={!reportVolunteerId}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Report
                </Button>
                <Button
                  onClick={handleIssueCertificate}
                  disabled={!reportVolunteerId || isGeneratingCert}
                  className="flex-1"
                >
                  {isGeneratingCert ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Award className="h-4 w-4 mr-1" />
                  )}
                  Certificate
                </Button>
              </div>
            </div>
          </div>

          {reportVolunteerId && (
            <div className="p-3 rounded-lg bg-muted/50">
              {(() => {
                const stats = calculateVolunteerHours(reportVolunteerId, reportStartDate, reportEndDate);
                return (
                  <div className="flex items-center gap-6 text-sm">
                    <span><strong>{stats.hours.toFixed(1)}</strong> hours</span>
                    <span><strong>{stats.count}</strong> completed assignments</span>
                    <span><strong>{stats.students}</strong> students helped</span>
                  </div>
                );
              })()}
            </div>
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
                    <>
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
                              <div className="flex items-center gap-2">
                                <span>{volunteer.full_name}</span>
                                {volunteer.volunteer_type === 'employment' ? (
                                  <Badge variant="default" className="text-xs gap-1">
                                    <Briefcase className="h-3 w-3" />
                                    Emp
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs gap-1">
                                    <User className="h-3 w-3" />
                                    Gen
                                  </Badge>
                                )}
                                {volunteer.availability_score === 100 && (
                                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                    Free
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Emp</span> = Employment (Mandatory) | <span className="font-medium">Gen</span> = General (Optional)
                      </p>
                    </>
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

      {/* Withdraw Volunteer Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-orange-500" />
              Withdraw Volunteer
            </DialogTitle>
            <DialogDescription>
              This will withdraw the volunteer from the assignment. The exam will need to be reassigned.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="withdrawal_reason">Reason for Withdrawal *</Label>
              <Textarea
                id="withdrawal_reason"
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                placeholder="e.g., Schedule conflict, illness, personal reasons..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleWithdraw}
              disabled={!withdrawalReason.trim()}
            >
              Confirm Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
