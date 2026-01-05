import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CourseScheduleManager } from '@/components/volunteer/CourseScheduleManager';
import { WeeklyScheduleGrid } from '@/components/volunteer/WeeklyScheduleGrid';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SchedulePage() {
  const { user } = useAuth();

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
      <DashboardLayout title="Course Schedule">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!volunteer) {
    return (
      <DashboardLayout title="Course Schedule">
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

  return (
    <DashboardLayout title="Course Schedule">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold">Course Schedule</h2>
          <p className="text-muted-foreground">
            Enter your academic course schedule to help us find volunteering opportunities that fit your availability
          </p>
        </div>

        <Tabs defaultValue="grid" className="space-y-4">
          <TabsList>
            <TabsTrigger value="grid">Weekly View</TabsTrigger>
            <TabsTrigger value="list">Manage Courses</TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            <WeeklyScheduleGrid volunteerId={volunteer.id} />
          </TabsContent>

          <TabsContent value="list">
            <CourseScheduleManager volunteerId={volunteer.id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
