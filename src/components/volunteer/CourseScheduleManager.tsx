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
import { Plus, Pencil, Trash2, Calendar, Clock, MapPin, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { useVolunteerCourses, VolunteerCourse } from '@/hooks/useVolunteerCourses';
import { useAcademicSemesters } from '@/hooks/useAcademicSemesters';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface CourseScheduleManagerProps {
  volunteerId: string;
}

export function CourseScheduleManager({ volunteerId }: CourseScheduleManagerProps) {
  const { courses, isLoading, addCourse, updateCourse, deleteCourse, clearSemesterCourses } = useVolunteerCourses(volunteerId);
  const { semesters, activeSemester, isLoading: semestersLoading } = useAcademicSemesters();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<VolunteerCourse | null>(null);
  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
    location: '',
  });

  const activeSemesterCourses = courses?.filter(c => c.semester_id === activeSemester?.id) || [];

  const handleSubmit = async () => {
    if (!activeSemester) return;

    const courseData = {
      ...formData,
      volunteer_id: volunteerId,
      semester_id: activeSemester.id,
      location: formData.location || null,
    };

    if (selectedCourse) {
      await updateCourse.mutateAsync({ id: selectedCourse.id, ...courseData });
    } else {
      await addCourse.mutateAsync(courseData);
    }

    setDialogOpen(false);
    resetForm();
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
    setDialogOpen(true);
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
            </CardTitle>
            <CardDescription>
              Manage your course schedule for {activeSemester.name} ({activeSemester.academic_year})
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setClearDialogOpen(true)}>
              Clear Schedule
            </Button>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
              <div className="grid grid-cols-2 gap-4">
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
                disabled={!formData.course_code || !formData.course_name || !formData.day_of_week || !formData.start_time || !formData.end_time || addCourse.isPending || updateCourse.isPending}
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
      </CardContent>
    </Card>
  );
}
