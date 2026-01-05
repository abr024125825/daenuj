import { useState, useRef } from 'react';
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
import { Plus, Pencil, Trash2, Calendar, Clock, MapPin, BookOpen, Loader2, AlertCircle, Upload, Download, FileSpreadsheet, Lock, Unlock, CheckCircle, ShieldAlert } from 'lucide-react';
import { useVolunteerCourses, VolunteerCourse } from '@/hooks/useVolunteerCourses';
import { useAcademicSemesters } from '@/hooks/useAcademicSemesters';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const LECTURE_PATTERNS = [
  { label: 'Sun/Tue/Thu', days: ['Sunday', 'Tuesday', 'Thursday'] },
  { label: 'Mon/Wed', days: ['Monday', 'Wednesday'] },
  { label: 'Single Day', days: [] },
];

interface CourseScheduleManagerProps {
  volunteerId: string;
  isAdmin?: boolean;
}

export function CourseScheduleManager({ volunteerId, isAdmin = false }: CourseScheduleManagerProps) {
  const { courses, isLoading, addCourse, updateCourse, deleteCourse, clearSemesterCourses, submitSchedule, unlockSchedule, isScheduleLocked, scheduleSubmittedAt } = useVolunteerCourses(volunteerId);
  const { semesters, activeSemester, isLoading: semestersLoading } = useAcademicSemesters();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<VolunteerCourse | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [lecturePattern, setLecturePattern] = useState<string>('');
  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
    location: '',
  });

  const activeSemesterCourses = courses?.filter(c => c.semester_id === activeSemester?.id) || [];
  
  // Check if schedule is locked (submitted) for current semester
  const isLocked = activeSemester ? isScheduleLocked(activeSemester.id) : false;
  
  // Check if semester is open for schedule submission
  const isScheduleOpen = activeSemester?.is_schedule_open !== false;
  
  // Can edit if: admin OR (schedule is open AND not locked)
  const canEdit = isAdmin || (isScheduleOpen && !isLocked);

  const handleSubmit = async () => {
    if (!activeSemester) return;

    // If editing, just update the single course
    if (selectedCourse) {
      const courseData = {
        ...formData,
        volunteer_id: volunteerId,
        semester_id: activeSemester.id,
        location: formData.location || null,
      };
      await updateCourse.mutateAsync({ id: selectedCourse.id, ...courseData });
    } else {
      // If adding new course with a pattern, add to all days in the pattern
      const selectedPattern = LECTURE_PATTERNS.find(p => p.label === lecturePattern);
      const daysToAdd = selectedPattern && selectedPattern.days.length > 0 
        ? selectedPattern.days 
        : [formData.day_of_week];

      for (const day of daysToAdd) {
        await addCourse.mutateAsync({
          volunteer_id: volunteerId,
          semester_id: activeSemester.id,
          course_code: formData.course_code,
          course_name: formData.course_name,
          day_of_week: day,
          start_time: formData.start_time,
          end_time: formData.end_time,
          location: formData.location || null,
        });
      }
    }

    setDialogOpen(false);
    resetForm();
    setLecturePattern('');
  };

  const handleEdit = (course: VolunteerCourse) => {
    setSelectedCourse(course);
    setFormData({
      course_code: course.course_code,
      course_name: course.course_name,
      day_of_week: course.day_of_week,
      start_time: course.start_time,
      end_time: course.end_time,
      location: course.location || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCourse) return;
    await deleteCourse.mutateAsync(selectedCourse.id);
    setDeleteDialogOpen(false);
    setSelectedCourse(null);
  };

  const handleClearSchedule = async () => {
    if (!activeSemester) return;
    await clearSemesterCourses.mutateAsync(activeSemester.id);
    setClearDialogOpen(false);
  };

  const resetForm = () => {
    setSelectedCourse(null);
    setFormData({
      course_code: '',
      course_name: '',
      day_of_week: '',
      start_time: '',
      end_time: '',
      location: '',
    });
  };

  const openAddDialog = () => {
    resetForm();
    setLecturePattern('');
    setDialogOpen(true);
  };

  const handleSubmitSchedule = async () => {
    if (!activeSemester) return;
    await submitSchedule.mutateAsync(activeSemester.id);
    setSubmitDialogOpen(false);
  };

  const handleUnlockSchedule = async () => {
    await unlockSchedule.mutateAsync();
    setUnlockDialogOpen(false);
  };

  // CSV Import functionality
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeSemester) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header row if present
      const startIndex = lines[0].toLowerCase().includes('course') ? 1 : 0;
      
      let successCount = 0;
      let errorCount = 0;

      for (let i = startIndex; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        
        if (values.length >= 5) {
          const [course_code, course_name, day_of_week, start_time, end_time, location] = values;
          
          // Validate day of week
          const normalizedDay = DAYS_OF_WEEK.find(d => 
            d.toLowerCase() === day_of_week.toLowerCase() ||
            d.toLowerCase().startsWith(day_of_week.toLowerCase().substring(0, 3))
          );
          
          if (normalizedDay && course_code && course_name && start_time && end_time) {
            try {
              await addCourse.mutateAsync({
                volunteer_id: volunteerId,
                semester_id: activeSemester.id,
                course_code,
                course_name,
                day_of_week: normalizedDay,
                start_time: formatTimeInput(start_time),
                end_time: formatTimeInput(end_time),
                location: location || null,
              });
              successCount++;
            } catch {
              errorCount++;
            }
          } else {
            errorCount++;
          }
        }
      }

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${successCount} courses${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      });
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      setImportDialogOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatTimeInput = (time: string): string => {
    // Handle various time formats: 8:00, 08:00, 8:00 AM, etc.
    let normalized = time.replace(/\s+/g, '').toUpperCase();
    
    // Check for AM/PM
    const isPM = normalized.includes('PM');
    const isAM = normalized.includes('AM');
    normalized = normalized.replace(/AM|PM/g, '');
    
    const parts = normalized.split(':');
    let hours = parseInt(parts[0]);
    const minutes = parts[1] ? parts[1].padStart(2, '0') : '00';
    
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  const downloadTemplate = () => {
    const template = `Course Code,Course Name,Day,Start Time,End Time,Location
CS101,Introduction to Computer Science,Sunday,08:00,09:30,Building A Room 101
CS201,Data Structures,Monday,10:00,11:30,Building B Room 205
MATH101,Calculus I,Tuesday,14:00,15:30,Building C Room 301`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'course_schedule_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group courses by day
  const coursesByDay = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = activeSemesterCourses.filter(c => c.day_of_week === day);
    return acc;
  }, {} as Record<string, typeof activeSemesterCourses>);

  if (isLoading || semestersLoading) {
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
          No active semester. Please contact an administrator to activate a semester before entering your course schedule.
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
              <BookOpen className="h-5 w-5" />
              Course Schedule
              {isLocked && (
                <Badge variant="secondary" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Submitted
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {isLocked 
                ? `Schedule submitted for ${activeSemester.name}. Contact admin for changes.`
                : `Manage your course schedule for ${activeSemester.name} (${activeSemester.academic_year})`
              }
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canEdit && (
              <>
                <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
                <Button variant="outline" onClick={() => setClearDialogOpen(true)}>
                  Clear Schedule
                </Button>
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </Button>
              </>
            )}
            {!isLocked && !isAdmin && activeSemesterCourses.length > 0 && isScheduleOpen && (
              <Button variant="default" onClick={() => setSubmitDialogOpen(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit Schedule
              </Button>
            )}
            {isLocked && isAdmin && (
              <Button variant="outline" onClick={() => setUnlockDialogOpen(true)}>
                <Unlock className="h-4 w-4 mr-2" />
                Unlock Schedule
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Schedule Status Alerts */}
        {!isScheduleOpen && !isAdmin && (
          <Alert className="mb-4" variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Schedule Submission Closed</AlertTitle>
            <AlertDescription>
              The schedule submission period has ended. Contact an administrator if you need to make changes.
            </AlertDescription>
          </Alert>
        )}
        
        {isLocked && !isAdmin && (
          <Alert className="mb-4">
            <Lock className="h-4 w-4" />
            <AlertTitle>Schedule Locked</AlertTitle>
            <AlertDescription>
              Your schedule has been submitted and is now locked. This schedule is used to determine your availability for volunteer opportunities.
            </AlertDescription>
          </Alert>
        )}

        {activeSemesterCourses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No courses added yet</p>
            <p className="text-sm mt-1">Add your course schedule to help us determine your availability</p>
          </div>
        ) : (
          <div className="space-y-4">
            {DAYS_OF_WEEK.filter(day => coursesByDay[day].length > 0).map(day => (
              <div key={day}>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">{day}</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coursesByDay[day].map(course => (
                      <TableRow key={course.id}>
                        <TableCell className="font-mono">{course.course_code}</TableCell>
                        <TableCell>{course.course_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {course.start_time} - {course.end_time}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {course.location && (
                            <Badge variant="secondary" className="gap-1">
                              <MapPin className="h-3 w-3" />
                              {course.location}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {canEdit ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(course)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedCourse(course);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Course Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedCourse ? 'Edit Course' : 'Add Course'}
              </DialogTitle>
              <DialogDescription>
                Enter your course details for the current semester
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="course_code">Course Code *</Label>
                <Input
                  id="course_code"
                  placeholder="e.g., CS101"
                  value={formData.course_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, course_code: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course_name">Course Name *</Label>
                <Input
                  id="course_name"
                  placeholder="e.g., Introduction to Computer Science"
                  value={formData.course_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, course_name: e.target.value }))}
                />
              </div>

              {/* Day Selection - Pattern or Single Day */}
              {!selectedCourse && (
                <div className="space-y-2">
                  <Label>Lecture Pattern *</Label>
                  <Select
                    value={lecturePattern}
                    onValueChange={(value) => {
                      setLecturePattern(value);
                      // Clear single day selection if pattern is selected
                      if (value !== 'Single Day') {
                        setFormData(prev => ({ ...prev, day_of_week: '' }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lecture pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      {LECTURE_PATTERNS.map(pattern => (
                        <SelectItem key={pattern.label} value={pattern.label}>
                          {pattern.label} {pattern.days.length > 0 && `(${pattern.days.join(', ')})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Show single day selector only when editing or when "Single Day" pattern is selected */}
              {(selectedCourse || lecturePattern === 'Single Day') && (
                <div className="space-y-2">
                  <Label htmlFor="day_of_week">Day *</Label>
                  <Select
                    value={formData.day_of_week}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, day_of_week: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map(day => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Building A, Room 101"
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
                disabled={
                  !formData.course_code || 
                  !formData.course_name || 
                  !formData.start_time || 
                  !formData.end_time || 
                  // For new courses: require pattern selection, and if Single Day, require day selection
                  (!selectedCourse && !lecturePattern) ||
                  (!selectedCourse && lecturePattern === 'Single Day' && !formData.day_of_week) ||
                  // For editing: require day selection
                  (selectedCourse && !formData.day_of_week) ||
                  addCourse.isPending || 
                  updateCourse.isPending
                }
              >
                {(addCourse.isPending || updateCourse.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {selectedCourse ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Course</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedCourse?.course_name}"? This action cannot be undone.
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

        {/* Clear Schedule Confirmation Dialog */}
        <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Schedule</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to clear all courses for the current semester? This is typically done at the start of a new semester.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearSchedule}>
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Import CSV Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Import Course Schedule
              </DialogTitle>
              <DialogDescription>
                Upload a CSV file with your course schedule. Download the template to see the required format.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a CSV file with columns: Course Code, Course Name, Day, Start Time, End Time, Location
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload">
                  <Button variant="outline" asChild disabled={isImporting}>
                    <span>
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
              <div className="flex items-center justify-center">
                <Button variant="link" onClick={downloadTemplate} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Submit Schedule Confirmation Dialog */}
        <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Submit Schedule
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Are you sure you want to submit your schedule? Once submitted, you will <strong>not be able to modify</strong> your course schedule for this semester.
                </p>
                <p>
                  Your submitted schedule will be used to determine your availability for volunteer opportunities.
                </p>
                <p className="text-sm">
                  You have <strong>{activeSemesterCourses.length}</strong> courses in your schedule.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmitSchedule}>
                <Lock className="h-4 w-4 mr-2" />
                Submit & Lock Schedule
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Unlock Schedule Confirmation Dialog (Admin only) */}
        <AlertDialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Unlock className="h-5 w-5" />
                Unlock Schedule
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to unlock this volunteer's schedule? They will be able to modify their course schedule again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnlockSchedule}>
                <Unlock className="h-4 w-4 mr-2" />
                Unlock Schedule
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
