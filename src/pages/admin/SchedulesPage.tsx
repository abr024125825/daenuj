import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
} from "@/components/ui/alert-dialog";
import { 
  Calendar, Search, Loader2, Eye, Clock, Printer, Download, 
  Lock, Unlock, Users, BookOpen, CheckCircle
} from 'lucide-react';
import { useVolunteers } from '@/hooks/useVolunteers';
import { useVolunteerCourses, VolunteerCourse } from '@/hooks/useVolunteerCourses';
import { useAcademicSemesters } from '@/hooks/useAcademicSemesters';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CourseScheduleManager } from '@/components/volunteer/CourseScheduleManager';
import { generateAllSchedulesPDF, generateVolunteerSchedulePDF } from '@/lib/generateSchedulesPDF';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

export function SchedulesPage() {
  const { volunteers, isLoading: volunteersLoading } = useVolunteers();
  const { activeSemester, isLoading: semestersLoading } = useAcademicSemesters();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [volunteerToUnlock, setVolunteerToUnlock] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'pending'>('all');

  // Fetch all courses for the active semester
  const { data: allCourses, isLoading: coursesLoading } = useQuery({
    queryKey: ['all-volunteer-courses', activeSemester?.id],
    queryFn: async () => {
      if (!activeSemester) return [];
      
      const { data, error } = await supabase
        .from('volunteer_courses')
        .select(`
          *,
          volunteer:volunteers(
            id,
            user_id,
            schedule_submitted_at,
            schedule_submitted_for_semester,
            application:volunteer_applications(
              first_name,
              father_name,
              family_name,
              university_id,
              university_email
            )
          )
        `)
        .eq('semester_id', activeSemester.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!activeSemester,
  });

  // Group courses by volunteer
  const volunteerSchedules = useMemo(() => {
    if (!volunteers || !activeSemester) return [];
    
    return volunteers.map((v: any) => {
      const courses = allCourses?.filter(c => c.volunteer_id === v.id) || [];
      const isSubmitted = v.schedule_submitted_for_semester === activeSemester.id;
      
      return {
        volunteer: v,
        courses,
        isSubmitted,
        courseCount: courses.length,
      };
    }).filter(vs => {
      // Filter by search
      const name = `${vs.volunteer.application?.first_name || ''} ${vs.volunteer.application?.family_name || ''}`;
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vs.volunteer.application?.university_id?.includes(searchQuery);
      
      // Filter by status
      if (filterStatus === 'submitted') return matchesSearch && vs.isSubmitted;
      if (filterStatus === 'pending') return matchesSearch && !vs.isSubmitted;
      return matchesSearch;
    });
  }, [volunteers, allCourses, activeSemester, searchQuery, filterStatus]);

  const unlockSchedule = useMutation({
    mutationFn: async (volunteerId: string) => {
      const { error } = await supabase
        .from('volunteers')
        .update({
          schedule_submitted_at: null,
          schedule_submitted_for_semester: null,
        })
        .eq('id', volunteerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers-list'] });
      queryClient.invalidateQueries({ queryKey: ['all-volunteer-courses'] });
      toast({ title: 'Success', description: 'Schedule unlocked for editing' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleViewDetails = (volunteerId: string) => {
    setSelectedVolunteerId(volunteerId);
    setDetailsOpen(true);
  };

  const handleUnlockClick = (volunteerId: string) => {
    setVolunteerToUnlock(volunteerId);
    setUnlockDialogOpen(true);
  };

  const confirmUnlock = async () => {
    if (!volunteerToUnlock) return;
    await unlockSchedule.mutateAsync(volunteerToUnlock);
    setUnlockDialogOpen(false);
    setVolunteerToUnlock(null);
  };

  // Print all schedules to PDF
  const handlePrintAllSchedules = async () => {
    if (!activeSemester) return;
    
    const volunteersData = volunteerSchedules.map(vs => ({
      volunteerName: `${vs.volunteer.application?.first_name || ''} ${vs.volunteer.application?.family_name || ''}`,
      universityId: vs.volunteer.application?.university_id || '',
      faculty: (vs.volunteer.application?.faculty as any)?.name || '',
      major: (vs.volunteer.application?.major as any)?.name || '',
      submittedAt: vs.isSubmitted ? vs.volunteer.schedule_submitted_at : null,
      courses: vs.courses.map(c => ({
        course_code: c.course_code,
        course_name: c.course_name,
        day_of_week: c.day_of_week,
        start_time: c.start_time,
        end_time: c.end_time,
        location: c.location,
      })),
    }));

    await generateAllSchedulesPDF({
      semester: {
        name: activeSemester.name,
        academicYear: activeSemester.academic_year,
      },
      volunteers: volunteersData,
      stats: {
        total: volunteers?.length || 0,
        submitted: volunteerSchedules.filter(vs => vs.isSubmitted).length,
        pending: volunteerSchedules.filter(vs => !vs.isSubmitted).length,
        totalCourses: allCourses?.length || 0,
      },
    });
    
    toast({ title: 'Success', description: 'Schedules PDF downloaded' });
  };

  // Print individual volunteer schedule PDF
  const handlePrintVolunteerSchedule = async (volunteerData: typeof volunteerSchedules[0]) => {
    if (!activeSemester) return;
    
    await generateVolunteerSchedulePDF({
      volunteer: {
        name: `${volunteerData.volunteer.application?.first_name || ''} ${volunteerData.volunteer.application?.family_name || ''}`,
        universityId: volunteerData.volunteer.application?.university_id || '',
        faculty: (volunteerData.volunteer.application?.faculty as any)?.name || '',
        major: (volunteerData.volunteer.application?.major as any)?.name || '',
        email: volunteerData.volunteer.application?.university_email || '',
      },
      semester: {
        name: activeSemester.name,
        academicYear: activeSemester.academic_year,
      },
      courses: volunteerData.courses.map(c => ({
        course_code: c.course_code,
        course_name: c.course_name,
        day_of_week: c.day_of_week,
        start_time: c.start_time,
        end_time: c.end_time,
        location: c.location,
      })),
    });
    
    toast({ title: 'Success', description: 'Volunteer schedule PDF downloaded' });
  };

  // Stats
  const stats = {
    total: volunteers?.length || 0,
    submitted: volunteerSchedules.filter(vs => vs.isSubmitted).length,
    pending: volunteerSchedules.filter(vs => !vs.isSubmitted).length,
    totalCourses: allCourses?.length || 0,
  };

  if (volunteersLoading || semestersLoading || coursesLoading) {
    return (
      <DashboardLayout title="Volunteer Schedules">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Volunteer Schedules">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold">Volunteer Schedules</h2>
            <p className="text-muted-foreground">
              {activeSemester?.name} ({activeSemester?.academic_year})
            </p>
          </div>
          <Button onClick={handlePrintAllSchedules} disabled={stats.submitted === 0}>
            <Printer className="h-4 w-4 mr-2" />
            Print All Schedules
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilterStatus('all')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Volunteers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilterStatus('submitted')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.submitted}</p>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilterStatus('pending')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <BookOpen className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalCourses}</p>
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedules Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CardTitle>Volunteer Schedules</CardTitle>
                {filterStatus !== 'all' && (
                  <Badge variant="secondary" className="capitalize">{filterStatus}</Badge>
                )}
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>University ID</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {volunteerSchedules.map((vs) => (
                  <TableRow key={vs.volunteer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {vs.volunteer.application?.first_name?.[0]}{vs.volunteer.application?.family_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {vs.volunteer.application?.first_name} {vs.volunteer.application?.family_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {vs.volunteer.application?.university_email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {vs.volunteer.application?.university_id}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{vs.courseCount} courses</Badge>
                    </TableCell>
                    <TableCell>
                      {vs.isSubmitted ? (
                        <Badge variant="default" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Submitted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Unlock className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleViewDetails(vs.volunteer.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handlePrintVolunteerSchedule(vs)}
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {vs.isSubmitted && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleUnlockClick(vs.volunteer.id)}
                          >
                            <Unlock className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {volunteerSchedules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No volunteers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Schedule Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Volunteer Schedule</DialogTitle>
              <DialogDescription>
                View and edit schedule for this volunteer
              </DialogDescription>
            </DialogHeader>
            {selectedVolunteerId && (
              <CourseScheduleManager 
                volunteerId={selectedVolunteerId} 
                isAdmin={true}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Unlock Confirmation Dialog */}
        <AlertDialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unlock Schedule</AlertDialogTitle>
              <AlertDialogDescription>
                This will allow the volunteer to edit their schedule again. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmUnlock}>
                Unlock
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
