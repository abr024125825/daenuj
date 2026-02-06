import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Pencil, Trash2, Loader2, Search, FileText, Calendar, Clock, FileSpreadsheet } from 'lucide-react';
import { useDisabilityExams, DisabilityExam, SpecialNeedType } from '@/hooks/useDisabilityExams';
import { useDisabilityStudents } from '@/hooks/useDisabilityStudents';
import { useAcademicSemesters } from '@/hooks/useAcademicSemesters';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ExcelUploadDialog } from './ExcelUploadDialog';
import { parseExamsExcel, ParsedExam } from '@/lib/excelParser';
import { useToast } from '@/hooks/use-toast';

const SPECIAL_NEEDS: { value: SpecialNeedType; label: string }[] = [
  { value: 'reader', label: 'Reader' },
  { value: 'extra_time', label: 'Extra Time' },
  { value: 'companion', label: 'Companion' },
  { value: 'scribe', label: 'Scribe' },
  { value: 'separate_room', label: 'Separate Room' },
  { value: 'assistive_technology', label: 'Assistive Technology' },
  { value: 'other', label: 'Other' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-500' },
  assigned: { label: 'Assigned', color: 'bg-blue-500' },
  confirmed: { label: 'Confirmed', color: 'bg-green-500' },
  completed: { label: 'Completed', color: 'bg-gray-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500' },
};

export function DisabilityExamsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeSemester } = useAcademicSemesters();
  const { exams, isLoading, addExam, updateExam, deleteExam } = useDisabilityExams(activeSemester?.id);
  const { students } = useDisabilityStudents();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<DisabilityExam | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    student_id: '',
    course_name: '',
    course_code: '',
    exam_date: '',
    start_time: '',
    end_time: '',
    duration_minutes: 60,
    extra_time_minutes: 0,
    location: '',
    special_needs: [] as SpecialNeedType[],
    special_needs_notes: '',
  });

  const filteredExams = exams?.filter(exam =>
    exam.student?.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.course_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!user || !activeSemester) return;

    const examData = {
      student_id: formData.student_id,
      course_name: formData.course_name,
      course_code: formData.course_code || null,
      exam_date: formData.exam_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      duration_minutes: formData.duration_minutes,
      extra_time_minutes: formData.extra_time_minutes,
      location: formData.location || null,
      special_needs: formData.special_needs,
      special_needs_notes: formData.special_needs_notes || null,
      semester_id: activeSemester.id,
      status: 'pending' as const,
      created_by: user.id,
    };

    if (selectedExam) {
      await updateExam.mutateAsync({ id: selectedExam.id, ...examData });
    } else {
      await addExam.mutateAsync(examData);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (exam: DisabilityExam) => {
    setSelectedExam(exam);
    setFormData({
      student_id: exam.student_id,
      course_name: exam.course_name,
      course_code: exam.course_code || '',
      exam_date: exam.exam_date,
      start_time: exam.start_time,
      end_time: exam.end_time,
      duration_minutes: exam.duration_minutes,
      extra_time_minutes: exam.extra_time_minutes,
      location: exam.location || '',
      special_needs: exam.special_needs || [],
      special_needs_notes: exam.special_needs_notes || '',
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
      student_id: '',
      course_name: '',
      course_code: '',
      exam_date: '',
      start_time: '',
      end_time: '',
      duration_minutes: 60,
      extra_time_minutes: 0,
      location: '',
      special_needs: [],
      special_needs_notes: '',
    });
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const toggleSpecialNeed = (need: SpecialNeedType) => {
    setFormData(prev => ({
      ...prev,
      special_needs: prev.special_needs.includes(need)
        ? prev.special_needs.filter(n => n !== need)
        : [...prev.special_needs, need],
    }));
  };

  const handleBulkUpload = async (data: ParsedExam[]) => {
    if (!user || !activeSemester) return;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const exam of data) {
      // Find student by university_id
      const student = students?.find(s => s.university_id === exam.student_university_id);
      if (!student) {
        errorCount++;
        continue;
      }
      
      try {
        await addExam.mutateAsync({
          student_id: student.id,
          course_name: exam.course_name,
          course_code: exam.course_code || null,
          exam_date: exam.exam_date,
          start_time: exam.start_time,
          end_time: exam.end_time,
          duration_minutes: exam.duration_minutes,
          extra_time_minutes: exam.extra_time_minutes || 0,
          location: exam.location || null,
          special_needs: (exam.special_needs || []) as SpecialNeedType[],
          special_needs_notes: exam.special_needs_notes || null,
          semester_id: activeSemester.id,
          status: 'pending',
          created_by: user.id,
        });
        successCount++;
      } catch {
        errorCount++;
      }
    }
    
    toast({
      title: 'تم الرفع',
      description: `تم إضافة ${successCount} امتحان${errorCount > 0 ? ` - فشل ${errorCount}` : ''}`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Disability Exams
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              رفع من Excel
            </Button>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Exam
            </Button>
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredExams && filteredExams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No exams found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Special Needs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams?.map((exam) => {
                  const statusConfig = STATUS_CONFIG[exam.status];
                  
                  return (
                    <TableRow key={exam.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{exam.student?.student_name}</p>
                          <p className="text-xs text-muted-foreground">
                            ID: {exam.student?.university_id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{exam.course_name}</p>
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
                        <div className="text-sm">
                          <p>{exam.duration_minutes} min</p>
                          {exam.extra_time_minutes > 0 && (
                            <p className="text-green-600">+{exam.extra_time_minutes} min extra</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {exam.special_needs?.map((need) => (
                            <Badge key={need} variant="secondary" className="text-xs">
                              {SPECIAL_NEEDS.find(n => n.value === need)?.label || need}
                            </Badge>
                          ))}
                        </div>
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedExam ? 'Edit Exam' : 'Add Exam'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Student *</Label>
                <Select
                  value={formData.student_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.filter(s => s.is_active).map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.student_name} ({student.university_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course_name">Course Name *</Label>
                  <Input
                    id="course_name"
                    value={formData.course_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, course_name: e.target.value }))}
                    placeholder="e.g., Introduction to Programming"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course_code">Course Code</Label>
                  <Input
                    id="course_code"
                    value={formData.course_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, course_code: e.target.value }))}
                    placeholder="e.g., CS101"
                  />
                </div>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    min="1"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extra_time_minutes">Extra Time (minutes)</Label>
                  <Input
                    id="extra_time_minutes"
                    type="number"
                    min="0"
                    value={formData.extra_time_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, extra_time_minutes: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Room 101"
                />
              </div>

              <div className="space-y-2">
                <Label>Special Needs</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SPECIAL_NEEDS.map((need) => (
                    <div key={need.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={need.value}
                        checked={formData.special_needs.includes(need.value)}
                        onCheckedChange={() => toggleSpecialNeed(need.value)}
                      />
                      <label
                        htmlFor={need.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {need.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="special_needs_notes">Special Needs Notes</Label>
                <Textarea
                  id="special_needs_notes"
                  value={formData.special_needs_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, special_needs_notes: e.target.value }))}
                  placeholder="Additional details about special needs..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.student_id || !formData.course_name || !formData.exam_date || !formData.start_time || !formData.end_time}
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
              <AlertDialogTitle>Delete Exam</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this exam? This will also delete all volunteer assignments.
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

        {/* Excel Upload Dialog */}
        <ExcelUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          type="exams"
          onUpload={(data) => handleBulkUpload(data as ParsedExam[])}
          parseFile={parseExamsExcel}
        />
      </CardContent>
    </Card>
  );
}
