import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  MapPin,
  Users,
  Loader2
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  parseISO
} from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  type: 'opportunity' | 'course';
  status?: string;
  registration_status?: string;
}

export function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Fetch volunteer data
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

  // Fetch opportunities the volunteer is registered for
  const { data: registeredOpportunities, isLoading: isOpportunitiesLoading } = useQuery({
    queryKey: ['my-calendar-opportunities', volunteer?.id],
    queryFn: async () => {
      if (!volunteer) return [];
      
      const { data, error } = await supabase
        .from('opportunity_registrations')
        .select(`
          status,
          opportunity:opportunities(
            id,
            title,
            date,
            start_time,
            end_time,
            location,
            status
          )
        `)
        .eq('volunteer_id', volunteer.id);
      
      if (error) throw error;
      
      return data?.map((reg: any) => ({
        id: reg.opportunity.id,
        title: reg.opportunity.title,
        date: reg.opportunity.date,
        start_time: reg.opportunity.start_time,
        end_time: reg.opportunity.end_time,
        location: reg.opportunity.location,
        type: 'opportunity' as const,
        status: reg.opportunity.status,
        registration_status: reg.status
      })) || [];
    },
    enabled: !!volunteer,
  });

  // Fetch volunteer's courses
  const { data: courses, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['my-calendar-courses', volunteer?.id],
    queryFn: async () => {
      if (!volunteer) return [];
      
      const { data, error } = await supabase
        .from('volunteer_courses')
        .select('*')
        .eq('volunteer_id', volunteer.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!volunteer,
  });

  // Convert courses to calendar events for the current month view
  const courseEvents = useMemo(() => {
    if (!courses) return [];
    
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const dayMap: Record<string, number> = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    
    const events: CalendarEvent[] = [];
    
    courses.forEach((course: any) => {
      const courseDayIndex = dayMap[course.day_of_week];
      
      days.forEach(day => {
        if (day.getDay() === courseDayIndex) {
          events.push({
            id: `${course.id}-${format(day, 'yyyy-MM-dd')}`,
            title: course.course_name,
            date: format(day, 'yyyy-MM-dd'),
            start_time: course.start_time,
            end_time: course.end_time,
            location: course.location || 'TBD',
            type: 'course' as const
          });
        }
      });
    });
    
    return events;
  }, [courses, currentDate]);

  // Combine all events
  const allEvents = useMemo(() => {
    return [...(registeredOpportunities || []), ...courseEvents];
  }, [registeredOpportunities, courseEvents]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return allEvents.filter(event => event.date === dateStr);
  };

  // Calendar grid generation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const isLoading = isOpportunitiesLoading || isCoursesLoading;

  if (isLoading) {
    return (
      <DashboardLayout title="Calendar">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const eventsForSelectedDate = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <DashboardLayout title="Calendar">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-primary" />
              My Calendar
            </h2>
            <p className="text-muted-foreground">View your volunteering schedule and courses</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  
                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        min-h-[80px] p-1 border rounded-lg cursor-pointer transition-all
                        ${isCurrentMonth ? 'bg-card' : 'bg-muted/30'}
                        ${isSelected ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}
                        ${isToday(day) ? 'border-primary' : 'border-border'}
                      `}
                    >
                      <div className={`
                        text-sm font-medium mb-1
                        ${isToday(day) ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                      `}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                            }}
                            className={`
                              text-[10px] px-1 py-0.5 rounded truncate cursor-pointer
                              ${event.type === 'opportunity' 
                                ? 'bg-primary/20 text-primary hover:bg-primary/30' 
                                : 'bg-secondary/20 text-secondary-foreground hover:bg-secondary/30'
                              }
                            `}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] text-muted-foreground">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate 
                  ? format(selectedDate, 'EEEE, MMMM d') 
                  : 'Select a date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                eventsForSelectedDate.length > 0 ? (
                  <div className="space-y-3">
                    {eventsForSelectedDate.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <Badge 
                            variant={event.type === 'opportunity' ? 'default' : 'secondary'}
                            className="text-[10px]"
                          >
                            {event.type === 'opportunity' ? 'Volunteer' : 'Course'}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.start_time} - {event.end_time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No events on this day</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Click on a date to view events</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary/20" />
            <span className="text-muted-foreground">Volunteering Opportunities</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-secondary/20" />
            <span className="text-muted-foreground">Academic Courses</span>
          </div>
        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant={selectedEvent.type === 'opportunity' ? 'default' : 'secondary'}>
                  {selectedEvent.type === 'opportunity' ? 'Volunteering Opportunity' : 'Academic Course'}
                </Badge>
                {selectedEvent.registration_status && (
                  <Badge variant="outline">{selectedEvent.registration_status}</Badge>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  <span>{format(parseISO(selectedEvent.date), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>{selectedEvent.start_time} - {selectedEvent.end_time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>{selectedEvent.location}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
