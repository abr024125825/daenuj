import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CourseScheduleManager } from '@/components/volunteer/CourseScheduleManager';
import { WeeklyScheduleGrid } from '@/components/volunteer/WeeklyScheduleGrid';
import { OpportunityCalendar } from '@/components/volunteer/OpportunityCalendar';
import { ExamScheduleManager } from '@/components/volunteer/ExamScheduleManager';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, GraduationCap, Calendar, BookOpen, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSystemSettings } from '@/hooks/useSystemSettings';

export function SchedulePage() {
  const { user } = useAuth();
  const { settings } = useSystemSettings();

  const { data: volunteer, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <DashboardLayout title="Schedule">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!volunteer) {
    return (
      <DashboardLayout title="Schedule">
        <Card>
          <CardContent className="py-12">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to be an approved volunteer to access this feature. Please complete your volunteer application first.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const showExamSchedule = settings?.exam_schedule_enabled ?? false;

  return (
    <DashboardLayout title="Schedule">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold">My Schedule</h2>
          <p className="text-muted-foreground">
            View your opportunities calendar and manage your course schedule
          </p>
        </div>

        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList className={`grid w-full ${showExamSchedule ? 'grid-cols-4' : 'grid-cols-3'} lg:w-auto lg:inline-flex`}>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Opportunities Calendar</span>
              <span className="sm:hidden">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="grid" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Weekly Course View</span>
              <span className="sm:hidden">Weekly</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Manage Courses</span>
              <span className="sm:hidden">Courses</span>
            </TabsTrigger>
            {showExamSchedule && (
              <TabsTrigger value="exams" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Exam Schedule</span>
                <span className="sm:hidden">Exams</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="calendar">
            <OpportunityCalendar volunteerId={volunteer.id} />
          </TabsContent>

          <TabsContent value="grid">
            <WeeklyScheduleGrid volunteerId={volunteer.id} />
          </TabsContent>

          <TabsContent value="courses">
            <CourseScheduleManager volunteerId={volunteer.id} />
          </TabsContent>

          {showExamSchedule && (
            <TabsContent value="exams">
              <ExamScheduleManager volunteerId={volunteer.id} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
