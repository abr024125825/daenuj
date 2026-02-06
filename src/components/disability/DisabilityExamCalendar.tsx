import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useDisabilityExams, DisabilityExam } from '@/hooks/useDisabilityExams';
import { useAcademicSemesters } from '@/hooks/useAcademicSemesters';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  assigned: 'bg-blue-500',
  confirmed: 'bg-green-500',
  completed: 'bg-gray-500',
  cancelled: 'bg-red-500',
};

export function DisabilityExamCalendar() {
  const { activeSemester } = useAcademicSemesters();
  const { exams, isLoading } = useDisabilityExams(activeSemester?.id);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day of week for first day (0 = Sunday)
  const startDayOfWeek = monthStart.getDay();
  const emptyDays = Array(startDayOfWeek).fill(null);

  const filteredExams = useMemo(() => {
    if (!exams) return [];
    if (statusFilter === 'all') return exams;
    return exams.filter(e => e.status === statusFilter);
  }, [exams, statusFilter]);

  const getExamsForDay = (date: Date): DisabilityExam[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredExams.filter(exam => exam.exam_date === dateStr);
  };

  const selectedDayExams = selectedDate ? getExamsForDay(selectedDate) : [];

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Exam Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month start */}
            {emptyDays.map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square" />
            ))}

            {/* Days */}
            {daysInMonth.map(day => {
              const dayExams = getExamsForDay(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square p-1 border rounded-lg cursor-pointer transition-colors
                    ${isSelected ? 'border-primary bg-primary/10' : 'border-transparent hover:border-muted-foreground/30'}
                    ${isToday ? 'bg-accent' : ''}
                    ${!isSameMonth(day, currentMonth) ? 'opacity-50' : ''}
                  `}
                >
                  <div className="text-sm font-medium">{format(day, 'd')}</div>
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {dayExams.slice(0, 3).map((exam, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full ${STATUS_COLORS[exam.status] || 'bg-gray-400'}`}
                        title={exam.course_name}
                      />
                    ))}
                    {dayExams.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{dayExams.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-xs capitalize">{status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate 
              ? format(selectedDate, 'MMMM dd, yyyy')
              : 'Select a date'
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <p className="text-muted-foreground text-sm">
              Click on a date to view exams
            </p>
          ) : selectedDayExams.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No exams scheduled for this date
            </p>
          ) : (
            <div className="space-y-3">
              {selectedDayExams.map(exam => (
                <div key={exam.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{exam.student?.student_name}</span>
                    <Badge className={`${STATUS_COLORS[exam.status]} text-white text-xs`}>
                      {exam.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{exam.course_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{exam.start_time} - {exam.end_time}</span>
                    {exam.location && <span>• {exam.location}</span>}
                  </div>
                  {exam.special_needs && exam.special_needs.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {exam.special_needs.map(need => (
                        <Badge key={need} variant="outline" className="text-xs">
                          {need}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
