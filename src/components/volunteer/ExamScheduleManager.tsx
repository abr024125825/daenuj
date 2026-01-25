import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Pencil, Trash2, Calendar, Clock, MapPin, FileText, Loader2, AlertCircle, GraduationCap } from 'lucide-react';
import { useExamSchedules, ExamSchedule, ExamType } from '@/hooks/useExamSchedules';
import { useVolunteerCourses } from '@/hooks/useVolunteerCourses';
import { useAcademicSemesters } from '@/hooks/useAcademicSemesters';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';

const EXAM_TYPES: { value: ExamType; label: string; color: string }[] = [
  { value: 'first', label: 'First Exam', color: 'bg-blue-500' },
  { value: 'second', label: 'Second Exam', color: 'bg-green-500' },
  { value: 'midterm', label: 'Midterm Exam', color: 'bg-orange-500' },
  { value: 'final', label: 'Final Exam', color: 'bg-red-500' },
];

interface ExamScheduleManagerProps {
  volunteerId: string;
}

export function ExamScheduleManager({ volunteerId }: ExamScheduleManagerProps) {
  const { activeSemester, isLoading: semestersLoading } = useAcademicSemesters();
  const { courses, isLoading: coursesLoading } = useVolunteerCourses(volunteerId);
  const { exams, isLoading: examsLoading, addExam, updateExam, deleteExam } = useExamSchedules(volunteerId, activeSemester?.id);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamSchedule | null>(null);
  const [formData, setFormData] = useState({
    course_id: '',
    exam_type: '' as ExamType | '',
    exam_date: '',
    start_time: '',
    end_time: '',
    location: '',
  });

  // Get unique courses for current semester
  const semesterCourses = courses?.filter(c => c.semester_id === activeSemester?.id) || [];
  const uniqueCourses = semesterCourses.reduce((acc, course) => {
    if (!acc.find(c => c.course_code === course.course_code)) {
      acc.push(course);
    }
    return acc;
  }, [] as typeof semesterCourses);

  const handleSubmit = async () => {
    if (!activeSemester || !formData.course_id || !formData.exam_type) return;

    const examData = {
      volunteer_id: volunteerId,
      course_id: formData.course_id,
      semester_id: activeSemester.id,
      exam_type: formData.exam_type as ExamType,
      exam_date: formData.exam_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      location: formData.location || null,
    };

    if (selectedExam) {
      await updateExam.mutateAsync({ id: selectedExam.id, ...examData });
    } else {
      await addExam.mutateAsync(examData);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (exam: ExamSchedule) => {
    setSelectedExam(exam);
    setFormData({
      course_id: exam.course_id,
      exam_type: exam.exam_type,
      exam_date: exam.exam_date,
      start_time: exam.start_time,
      end_time: exam.end_time,
      location: exam.location || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedExam) return;
    await deleteExam.mutateAsync(selectedExam.id);
    setDeleteDialogOpen(false);
    setSelectedExam(null);
  };

  const resetForm = () => {
    setSelectedExam(null);
    setFormData({
      course_id: '',
      exam_type: '',
      exam_date: '',
      start_time: '',
      end_time: '',
      location: '',
    });
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const getExamTypeBadge = (type: ExamType) => {
    const examType = EXAM_TYPES.find(t => t.value === type);
    return (
      <Badge variant="secondary" className={`${examType?.color} text-white`}>
        {examType?.label || type}
      </Badge>
    );
  };

  // Check if exam type already exists for a course
  const existingExamTypes = (courseId: string) => {
    return exams?.filter(e => e.course_id === courseId).map(e => e.exam_type) || [];
  };

  const isLoading = semestersLoading || coursesLoading || examsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeSemester) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No active semester. Please contact an administrator to activate a semester.
        </AlertDescription>
      </Alert>
    );
  }

  if (uniqueCourses.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please add your course schedule first before adding exam schedules.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Exam Schedule
            </CardTitle>
            <CardDescription>
              Add your exam dates for {activeSemester.name} to help determine your availability
            </CardDescription>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Exam
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {exams && exams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No exam schedules added yet</p>
            <p className="text-sm mt-1">Add your exam dates to avoid scheduling conflicts</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Exam Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams?.map(exam => (
                <TableRow key={exam.id}>
                  <TableCell>
                    <div>
                      <span className="font-mono text-sm">{exam.course?.course_code}</span>
                      <p className="text-xs text-muted-foreground">{exam.course?.course_name}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getExamTypeBadge(exam.exam_type)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(exam.exam_date), 'MMM dd, yyyy')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {exam.start_time} - {exam.end_time}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {exam.location && (
                      <Badge variant="secondary" className="gap-1">
                        <MapPin className="h-3 w-3" />
                        {exam.location}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(exam)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedExam(exam);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add/Edit Exam Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedExam ? 'Edit Exam Schedule' : 'Add Exam Schedule'}
              </DialogTitle>
              <DialogDescription>
                Enter your exam details for the current semester
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Course *</Label>
                <Select
                  value={formData.course_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueCourses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.course_code} - {course.course_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Exam Type *</Label>
                <Select
                  value={formData.exam_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, exam_type: value as ExamType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPES.map(type => {
                      const isUsed = !selectedExam && formData.course_id && existingExamTypes(formData.course_id).includes(type.value);
                      return (
                        <SelectItem 
                          key={type.value} 
                          value={type.value}
                          disabled={isUsed}
                        >
                          {type.label} {isUsed && '(Already added)'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exam_date">Exam Date *</Label>
                <Input
                  id="exam_date"
                  type="date"
                  value={formData.exam_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, exam_date: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  placeholder="e.g., Hall A, Room 101"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.course_id || !formData.exam_type || !formData.exam_date || !formData.start_time || !formData.end_time}
              >
                {selectedExam ? 'Save Changes' : 'Add Exam'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Exam Schedule</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this exam schedule? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
