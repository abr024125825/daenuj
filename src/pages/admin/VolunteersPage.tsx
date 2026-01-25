import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Search, Loader2, Eye, Clock, Award, Calendar, Star, 
  UserCheck, UserX, Mail, Phone, GraduationCap, BookOpen
} from 'lucide-react';
import { useVolunteers, useVolunteerDetails, useToggleVolunteerActive } from '@/hooks/useVolunteers';
import { useVolunteerCourses } from '@/hooks/useVolunteerCourses';
import { useAcademicSemesters } from '@/hooks/useAcademicSemesters';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export function VolunteersPage() {
  const { volunteers, isLoading } = useVolunteers();
  const toggleActive = useToggleVolunteerActive();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const { volunteer, attendanceHistory, certificates, isLoading: detailsLoading } = 
    useVolunteerDetails(selectedVolunteerId || undefined);

  const filteredVolunteers = volunteers?.filter((v: any) => {
    const name = `${v.application?.first_name} ${v.application?.family_name}`;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           v.application?.university_id?.includes(searchQuery) ||
           v.application?.university_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'active') return matchesSearch && v.is_active;
    if (filterStatus === 'inactive') return matchesSearch && !v.is_active;
    return matchesSearch;
  });

  const handleViewDetails = (volunteerId: string) => {
    setSelectedVolunteerId(volunteerId);
    setDetailsOpen(true);
  };

  const handleToggleActive = (volunteerId: string, isActive: boolean) => {
    toggleActive.mutate({ volunteerId, isActive });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Volunteers">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Volunteers">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold">Volunteers</h2>
            <p className="text-muted-foreground">{volunteers?.length || 0} registered volunteers</p>
          </div>
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
                  <p className="text-2xl font-bold">{volunteers?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Volunteers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilterStatus('active')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <UserCheck className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {volunteers?.filter((v: any) => v.is_active).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {volunteers?.reduce((sum: number, v: any) => sum + (v.total_hours || 0), 0) || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Award className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {volunteers?.reduce((sum: number, v: any) => sum + (v.opportunities_completed || 0), 0) || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Opportunities Done</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CardTitle>All Volunteers</CardTitle>
                {filterStatus !== 'all' && (
                  <Badge variant="secondary" className="capitalize">{filterStatus}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, ID, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>University ID</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVolunteers?.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {v.application?.first_name?.[0]}{v.application?.family_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {v.application?.first_name} {v.application?.family_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{v.application?.university_email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{v.application?.university_id}</TableCell>
                    <TableCell>{v.application?.faculty?.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{v.total_hours || 0} hrs</Badge>
                    </TableCell>
                    <TableCell>{v.opportunities_completed || 0}</TableCell>
                    <TableCell>
                      {v.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-warning fill-warning" />
                          <span>{v.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={v.is_active}
                          onCheckedChange={(checked) => handleToggleActive(v.id, checked)}
                          disabled={toggleActive.isPending}
                        />
                        <span className="text-sm text-muted-foreground">
                          {v.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleViewDetails(v.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!filteredVolunteers || filteredVolunteers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No volunteers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Volunteer Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Volunteer Details</DialogTitle>
            </DialogHeader>
            {detailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : volunteer ? (
              <Tabs defaultValue="info" className="mt-4">
                <TabsList>
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  <TabsTrigger value="activity">Activity History</TabsTrigger>
                  <TabsTrigger value="certificates">Certificates</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Clock className="h-6 w-6 mx-auto text-warning mb-2" />
                        <p className="text-2xl font-bold">{volunteer.total_hours || 0}</p>
                        <p className="text-sm text-muted-foreground">Total Hours</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Award className="h-6 w-6 mx-auto text-primary mb-2" />
                        <p className="text-2xl font-bold">{volunteer.opportunities_completed || 0}</p>
                        <p className="text-sm text-muted-foreground">Opportunities</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Star className="h-6 w-6 mx-auto text-warning mb-2" />
                        <p className="text-2xl font-bold">{volunteer.rating?.toFixed(1) || '-'}</p>
                        <p className="text-sm text-muted-foreground">Rating</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Personal Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Full Name</p>
                          <p className="font-medium">
                            {volunteer.application?.first_name} {volunteer.application?.father_name} {volunteer.application?.grandfather_name} {volunteer.application?.family_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">University ID</p>
                          <p className="font-medium font-mono">{volunteer.application?.university_id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{volunteer.application?.university_email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="font-medium">{volunteer.application?.phone_number}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Faculty</p>
                            <p className="font-medium">{volunteer.application?.faculty?.name}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Major</p>
                          <p className="font-medium">{volunteer.application?.major?.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Academic Year</p>
                          <p className="font-medium">{volunteer.application?.academic_year}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge variant={volunteer.is_active ? 'default' : 'secondary'}>
                            {volunteer.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {volunteer.application?.skills?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Skills</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {volunteer.application.skills.map((skill: string) => (
                            <Badge key={skill} variant="outline">{skill}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {volunteer.application?.interests?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Interests</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {volunteer.application.interests.map((interest: string) => (
                            <Badge key={interest} variant="secondary">{interest}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="schedule" className="mt-4">
                  <VolunteerScheduleView volunteerId={selectedVolunteerId || ''} />
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                  <div className="space-y-3">
                    {attendanceHistory?.map((att: any) => (
                      <div key={att.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{att.opportunity?.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(att.check_in_time), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        <Badge variant="outline">{att.check_in_method}</Badge>
                      </div>
                    ))}
                    {(!attendanceHistory || attendanceHistory.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">No activity yet</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="certificates" className="mt-4">
                  <div className="space-y-3">
                    {certificates?.map((cert: any) => (
                      <div key={cert.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                        <Award className="h-5 w-5 text-warning" />
                        <div className="flex-1">
                          <p className="font-medium">{cert.opportunity?.title}</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {cert.certificate_number}
                          </p>
                        </div>
                        <Badge>{cert.hours} hrs</Badge>
                      </div>
                    ))}
                    {(!certificates || certificates.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">No certificates yet</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

// Component to display volunteer schedule in the details dialog
function VolunteerScheduleView({ volunteerId }: { volunteerId: string }) {
  const { courses, isLoading, isScheduleLocked } = useVolunteerCourses(volunteerId);
  const { activeSemester } = useAcademicSemesters();
  
  const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  
  // Fetch exams for this volunteer
  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: ['volunteer-exams', volunteerId, activeSemester?.id],
    queryFn: async () => {
      if (!activeSemester) return [];
      const { data, error } = await supabase
        .from('exam_schedules')
        .select(`
          *,
          course:volunteer_courses(course_code, course_name)
        `)
        .eq('volunteer_id', volunteerId)
        .eq('semester_id', activeSemester.id)
        .order('exam_date');
      if (error) throw error;
      return data;
    },
    enabled: !!volunteerId && !!activeSemester,
  });
  
  const activeSemesterCourses = courses?.filter(c => c.semester_id === activeSemester?.id) || [];
  const isLocked = activeSemester ? isScheduleLocked(activeSemester.id) : false;
  
  // Group courses by day
  const coursesByDay = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = activeSemesterCourses.filter(c => c.day_of_week === day);
    return acc;
  }, {} as Record<string, typeof activeSemesterCourses>);

  if (isLoading || examsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (activeSemesterCourses.length === 0 && (!exams || exams.length === 0)) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No schedule submitted yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Badge variant={isLocked ? 'default' : 'secondary'}>
          {isLocked ? 'Schedule Locked' : 'Schedule Unlocked'}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {activeSemester?.name}
        </span>
      </div>
      
      {/* Course Schedule */}
      {activeSemesterCourses.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-primary" />
            Course Schedule ({activeSemesterCourses.length} courses)
          </h4>
          {DAYS_OF_WEEK.filter(day => coursesByDay[day].length > 0).map(day => (
            <div key={day} className="mb-4">
              <h5 className="font-medium text-sm text-muted-foreground mb-2">{day}</h5>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Location</TableHead>
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
                          <Badge variant="secondary">{course.location}</Badge>
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

      {/* Exam Schedule */}
      {exams && exams.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <GraduationCap className="h-4 w-4 text-warning" />
            Exam Schedule ({exams.length} exams)
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam: any) => (
                <TableRow key={exam.id}>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {exam.exam_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-mono text-xs">{exam.course?.course_code}</span>
                      <p className="text-sm">{exam.course?.course_name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(exam.exam_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {exam.start_time} - {exam.end_time}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {exam.location && (
                      <Badge variant="secondary">{exam.location}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
