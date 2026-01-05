import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, MapPin, BookOpen } from 'lucide-react';
import { useVolunteerCourses } from '@/hooks/useVolunteerCourses';
import { useAcademicSemesters } from '@/hooks/useAcademicSemesters';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

interface WeeklyScheduleGridProps {
  volunteerId: string;
}

// Color palette for different courses
const COURSE_COLORS = [
  'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300',
  'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300',
  'bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300',
  'bg-orange-500/20 border-orange-500 text-orange-700 dark:text-orange-300',
  'bg-pink-500/20 border-pink-500 text-pink-700 dark:text-pink-300',
  'bg-cyan-500/20 border-cyan-500 text-cyan-700 dark:text-cyan-300',
  'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300',
  'bg-indigo-500/20 border-indigo-500 text-indigo-700 dark:text-indigo-300',
];

export function WeeklyScheduleGrid({ volunteerId }: WeeklyScheduleGridProps) {
  const { courses, isLoading } = useVolunteerCourses(volunteerId);
  const { activeSemester, isLoading: semestersLoading } = useAcademicSemesters();

  const activeSemesterCourses = useMemo(() => 
    courses?.filter(c => c.semester_id === activeSemester?.id) || [],
    [courses, activeSemester]
  );

  // Map course codes to colors for consistency
  const courseColorMap = useMemo(() => {
    const uniqueCourses = [...new Set(activeSemesterCourses.map(c => c.course_code))];
    return uniqueCourses.reduce((acc, code, index) => {
      acc[code] = COURSE_COLORS[index % COURSE_COLORS.length];
      return acc;
    }, {} as Record<string, string>);
  }, [activeSemesterCourses]);

  // Convert time string to slot index
  const timeToSlotIndex = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 8 * 60; // 08:00
    return Math.floor((totalMinutes - startMinutes) / 30);
  };

  // Get course at specific day and time
  const getCourseAtSlot = (day: string, slotIndex: number) => {
    return activeSemesterCourses.find(course => {
      if (course.day_of_week !== day) return false;
      const startSlot = timeToSlotIndex(course.start_time);
      const endSlot = timeToSlotIndex(course.end_time);
      return slotIndex >= startSlot && slotIndex < endSlot;
    });
  };

  // Check if this is the first slot of a course
  const isFirstSlotOfCourse = (day: string, slotIndex: number, course: any) => {
    if (!course) return false;
    const startSlot = timeToSlotIndex(course.start_time);
    return slotIndex === startSlot;
  };

  // Get course span (number of slots)
  const getCourseSpan = (course: any): number => {
    if (!course) return 1;
    const startSlot = timeToSlotIndex(course.start_time);
    const endSlot = timeToSlotIndex(course.end_time);
    return endSlot - startSlot;
  };

  if (isLoading || semestersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeSemester) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No active semester</p>
        </CardContent>
      </Card>
    );
  }

  if (activeSemesterCourses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No courses scheduled for this semester</p>
          <p className="text-sm mt-1">Add your course schedule to see the weekly view</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Weekly Schedule
        </CardTitle>
        <CardDescription>
          {activeSemester.name} ({activeSemester.academic_year})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Row */}
            <div className="grid grid-cols-6 gap-1 mb-2">
              <div className="p-2 text-center text-xs font-medium text-muted-foreground">
                Time
              </div>
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="p-2 text-center text-xs font-medium bg-muted rounded">
                  {day}
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="relative">
              {TIME_SLOTS.map((time, slotIndex) => (
                <div key={time} className="grid grid-cols-6 gap-1" style={{ height: '28px' }}>
                  {/* Time Label */}
                  <div className="flex items-center justify-end pr-2 text-xs text-muted-foreground">
                    {slotIndex % 2 === 0 ? time : ''}
                  </div>

                  {/* Day Columns */}
                  {DAYS_OF_WEEK.map(day => {
                    const course = getCourseAtSlot(day, slotIndex);
                    const isFirst = isFirstSlotOfCourse(day, slotIndex, course);
                    const span = getCourseSpan(course);

                    if (course && isFirst) {
                      return (
                        <div
                          key={`${day}-${slotIndex}`}
                          className={`relative rounded border-l-4 p-1 ${courseColorMap[course.course_code]}`}
                          style={{ 
                            height: `${span * 28 + (span - 1)}px`,
                            zIndex: 10
                          }}
                        >
                          <div className="text-xs font-semibold truncate">
                            {course.course_code}
                          </div>
                          <div className="text-[10px] truncate opacity-80">
                            {course.course_name}
                          </div>
                          {course.location && (
                            <div className="text-[10px] truncate opacity-70 flex items-center gap-1">
                              <MapPin className="h-2 w-2" />
                              {course.location}
                            </div>
                          )}
                        </div>
                      );
                    } else if (course) {
                      return <div key={`${day}-${slotIndex}`} className="bg-transparent" />;
                    }
                    return (
                      <div
                        key={`${day}-${slotIndex}`}
                        className={`border-b border-dashed border-muted ${slotIndex % 2 === 0 ? 'bg-muted/20' : ''}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Courses:</p>
              <div className="flex flex-wrap gap-2">
                {[...new Set(activeSemesterCourses.map(c => c.course_code))].map(code => {
                  const course = activeSemesterCourses.find(c => c.course_code === code);
                  return (
                    <Badge 
                      key={code} 
                      variant="outline"
                      className={`text-xs ${courseColorMap[code]}`}
                    >
                      {code}: {course?.course_name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
