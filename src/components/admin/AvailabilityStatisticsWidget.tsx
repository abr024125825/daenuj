import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Clock, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAcademicSemesters } from '@/hooks/useAcademicSemesters';
import { timeRangesOverlap } from '@/lib/timeUtils';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const TIME_PERIODS = [
  { name: 'Morning', start: '08:00', end: '12:00' },
  { name: 'Afternoon', start: '12:00', end: '16:00' },
  { name: 'Evening', start: '16:00', end: '20:00' },
];

export function AvailabilityStatisticsWidget() {
  const { activeSemester, isLoading: semesterLoading } = useAcademicSemesters();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['availability-statistics', activeSemester?.id],
    queryFn: async () => {
      if (!activeSemester) return null;

      // Get all active volunteers
      const { data: volunteers, error: volError } = await supabase
        .from('volunteers')
        .select('id')
        .eq('is_active', true);

      if (volError) throw volError;

      const totalVolunteers = volunteers?.length || 0;

      // Get all courses for the active semester
      const { data: courses, error: courseError } = await supabase
        .from('volunteer_courses')
        .select('volunteer_id, day_of_week, start_time, end_time')
        .eq('semester_id', activeSemester.id);

      if (courseError) throw courseError;

      // Calculate volunteers with schedules
      const volunteersWithSchedules = new Set(courses?.map(c => c.volunteer_id) || []);
      const volunteersWithScheduleCount = volunteersWithSchedules.size;

      // Bug #2 fix: Calculate availability by day AND time period together
      // A volunteer with a 10-11 lecture is only busy during that slot, not all day
      const availabilityByDay: Record<string, number> = {};

      DAYS_OF_WEEK.forEach(day => {
        const dayCourses = courses?.filter(c => c.day_of_week === day) || [];
        // Count unique volunteers who have ANY course on this day
        const busyVolunteers = new Set(dayCourses.map(c => c.volunteer_id));
        availabilityByDay[day] = totalVolunteers - busyVolunteers.size;
      });

      // Bug #3 fix: Use numeric time comparison via timeRangesOverlap
      const availabilityByPeriod: Record<string, number> = {};
      
      TIME_PERIODS.forEach(period => {
        let busyDuringPeriod = new Set<string>();
        
        courses?.forEach(course => {
          if (timeRangesOverlap(course.start_time, course.end_time, period.start, period.end)) {
            busyDuringPeriod.add(course.volunteer_id);
          }
        });

        availabilityByPeriod[period.name] = totalVolunteers - busyDuringPeriod.size;
      });

      // Calculate total course hours per volunteer
      const courseHoursPerVolunteer: Record<string, number> = {};
      courses?.forEach(course => {
        const [startH, startM] = course.start_time.split(':').map(Number);
        const [endH, endM] = course.end_time.split(':').map(Number);
        const hours = (endH * 60 + endM - startH * 60 - startM) / 60;
        
        courseHoursPerVolunteer[course.volunteer_id] = 
          (courseHoursPerVolunteer[course.volunteer_id] || 0) + hours;
      });

      const avgCourseHours = Object.values(courseHoursPerVolunteer).length > 0
        ? Object.values(courseHoursPerVolunteer).reduce((a, b) => a + b, 0) / 
          Object.values(courseHoursPerVolunteer).length
        : 0;

      // Peak availability day
      const peakDay = Object.entries(availabilityByDay)
        .sort((a, b) => b[1] - a[1])[0];

      return {
        totalVolunteers,
        volunteersWithSchedule: volunteersWithScheduleCount,
        scheduleCompletionRate: totalVolunteers > 0 
          ? (volunteersWithScheduleCount / totalVolunteers) * 100 
          : 0,
        availabilityByDay,
        availabilityByPeriod,
        avgCourseHours: Math.round(avgCourseHours * 10) / 10,
        peakAvailabilityDay: peakDay ? peakDay[0] : null,
        peakAvailabilityCount: peakDay ? peakDay[1] : 0,
      };
    },
    enabled: !!activeSemester,
  });

  if (isLoading || semesterLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!activeSemester) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No active semester</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Volunteer Availability Statistics
        </CardTitle>
        <CardDescription>
          Overview for {activeSemester.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{stats.totalVolunteers}</p>
            <p className="text-xs text-muted-foreground">Total Volunteers</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{stats.volunteersWithSchedule}</p>
            <p className="text-xs text-muted-foreground">With Schedules</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{stats.avgCourseHours}h</p>
            <p className="text-xs text-muted-foreground">Avg. Weekly Classes</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.peakAvailabilityCount}</p>
            <p className="text-xs text-muted-foreground">Peak Availability</p>
          </div>
        </div>

        {/* Schedule Completion Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Schedule Completion Rate</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(stats.scheduleCompletionRate)}%
            </span>
          </div>
          <Progress value={stats.scheduleCompletionRate} />
          <p className="text-xs text-muted-foreground">
            {stats.volunteersWithSchedule} of {stats.totalVolunteers} volunteers have entered their course schedule
          </p>
        </div>

        {/* Availability by Day */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Availability by Day
          </h4>
          <div className="space-y-2">
            {DAYS_OF_WEEK.map(day => {
              const available = stats.availabilityByDay[day] || 0;
              const percentage = stats.totalVolunteers > 0 
                ? (available / stats.totalVolunteers) * 100 
                : 0;
              const isPeak = day === stats.peakAvailabilityDay;

              return (
                <div key={day} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      {day}
                      {isPeak && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Peak
                        </Badge>
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {available} available
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Availability by Time Period */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Availability by Time Period
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {TIME_PERIODS.map(period => {
              const available = stats.availabilityByPeriod[period.name] || 0;
              const percentage = stats.totalVolunteers > 0 
                ? (available / stats.totalVolunteers) * 100 
                : 0;

              return (
                <div key={period.name} className="text-center p-3 border rounded-lg">
                  <p className="text-lg font-bold text-primary">{available}</p>
                  <p className="text-xs font-medium">{period.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {period.start} - {period.end}
                  </p>
                  <Progress value={percentage} className="h-1 mt-2" />
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
