import { useState } from 'react';
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
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Search, Loader2, Eye, Clock, Award, Calendar, 
  GraduationCap, BookOpen, Download, Mail, Phone
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export function FacultyVolunteersPage() {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch only volunteers from the faculty coordinator's faculty
  const { data: volunteers = [], isLoading } = useQuery({
    queryKey: ['faculty-volunteers', profile?.faculty_id],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!profile?.faculty_id) return [];
      const { data, error } = await supabase
        .from('volunteer_applications')
        .select(`
          *,
          volunteers(id, total_hours, opportunities_completed, is_active, rating, schedule_submitted_at),
          major:majors(name),
          faculty:faculties(name)
        `)
        .eq('faculty_id', profile.faculty_id)
        .eq('status', 'approved');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.faculty_id,
  });

  // Fetch faculty info
  const { data: facultyInfo } = useQuery({
    queryKey: ['faculty-info', profile?.faculty_id],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      if (!profile?.faculty_id) return null;
      const { data, error } = await supabase
        .from('faculties')
        .select('*')
        .eq('id', profile.faculty_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.faculty_id,
  });

  // Fetch volunteer courses when viewing details
  const { data: volunteerCourses = [] } = useQuery({
    queryKey: ['volunteer-courses', selectedVolunteer?.volunteers?.id],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!selectedVolunteer?.volunteers?.id) return [];
      const { data, error } = await supabase
        .from('volunteer_courses')
        .select('*, semester:academic_semesters(name)')
        .eq('volunteer_id', selectedVolunteer.volunteers.id)
        .order('day_of_week');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedVolunteer?.volunteers?.id,
  });

  // Fetch volunteer exams when viewing details
  const { data: volunteerExams = [] } = useQuery({
    queryKey: ['volunteer-exams', selectedVolunteer?.volunteers?.id],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!selectedVolunteer?.volunteers?.id) return [];
      const { data, error } = await supabase
        .from('exam_schedules')
        .select('*, course:volunteer_courses(course_name, course_code)')
        .eq('volunteer_id', selectedVolunteer.volunteers.id)
        .order('exam_date');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedVolunteer?.volunteers?.id,
  });

  const filteredVolunteers = volunteers.filter((v: any) => {
    const name = `${v.first_name} ${v.family_name}`.toLowerCase();
    const search = searchQuery.toLowerCase();
    return name.includes(search) || 
           v.university_id?.includes(search) ||
           v.university_email?.toLowerCase().includes(search);
  });

  const stats = {
    total: volunteers.length,
    active: volunteers.filter((v: any) => v.volunteers?.is_active).length,
    totalHours: volunteers.reduce((sum: number, v: any) => sum + (v.volunteers?.total_hours || 0), 0),
    completedOpportunities: volunteers.reduce((sum: number, v: any) => sum + (v.volunteers?.opportunities_completed || 0), 0),
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Faculty Volunteers">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${facultyInfo?.name || 'Faculty'} - Volunteers`}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Volunteers</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-bold">{stats.totalHours}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completedOpportunities}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Volunteers Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Faculty Volunteers
                </CardTitle>
                <CardDescription>
                  Volunteers registered from {facultyInfo?.name}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search volunteers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>University ID</TableHead>
                  <TableHead>Major</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVolunteers.map((volunteer: any) => (
                  <TableRow key={volunteer.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{volunteer.first_name} {volunteer.father_name} {volunteer.family_name}</p>
                        <p className="text-xs text-muted-foreground">{volunteer.university_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{volunteer.university_id}</TableCell>
                    <TableCell>{volunteer.major?.name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {volunteer.volunteers?.total_hours || 0}
                      </div>
                    </TableCell>
                    <TableCell>{volunteer.volunteers?.opportunities_completed || 0}</TableCell>
                    <TableCell>
                      {volunteer.volunteers?.is_active ? (
                        <Badge className="bg-green-500/10 text-green-700 border-green-500/30">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedVolunteer(volunteer);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredVolunteers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Volunteer Details</DialogTitle>
            </DialogHeader>
            
            {selectedVolunteer && (
              <Tabs defaultValue="info" className="mt-4">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  <TabsTrigger value="exams">Exams</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Personal Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Full Name:</span>
                          <span className="font-medium">
                            {selectedVolunteer.first_name} {selectedVolunteer.father_name} {selectedVolunteer.grandfather_name} {selectedVolunteer.family_name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">University ID:</span>
                          <span className="font-medium">{selectedVolunteer.university_id}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {selectedVolunteer.university_email}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-medium flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {selectedVolunteer.phone_number}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Academic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Faculty:</span>
                          <span className="font-medium">{selectedVolunteer.faculty?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Major:</span>
                          <span className="font-medium">{selectedVolunteer.major?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Academic Year:</span>
                          <span className="font-medium">{selectedVolunteer.academic_year}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Volunteer Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center p-3 rounded-lg bg-primary/5">
                            <p className="text-2xl font-bold text-primary">{selectedVolunteer.volunteers?.total_hours || 0}</p>
                            <p className="text-xs text-muted-foreground">Total Hours</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-green-500/5">
                            <p className="text-2xl font-bold text-green-600">{selectedVolunteer.volunteers?.opportunities_completed || 0}</p>
                            <p className="text-xs text-muted-foreground">Completed</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-amber-500/5">
                            <p className="text-2xl font-bold text-amber-600">{selectedVolunteer.volunteers?.rating?.toFixed(1) || '-'}</p>
                            <p className="text-xs text-muted-foreground">Rating</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-blue-500/5">
                            <p className="text-2xl font-bold text-blue-600">
                              {selectedVolunteer.volunteers?.is_active ? 'Active' : 'Inactive'}
                            </p>
                            <p className="text-xs text-muted-foreground">Status</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Course Schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {volunteerCourses.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Course</TableHead>
                              <TableHead>Day</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Location</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {volunteerCourses.map((course: any) => (
                              <TableRow key={course.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{course.course_name}</p>
                                    <p className="text-xs text-muted-foreground">{course.course_code}</p>
                                  </div>
                                </TableCell>
                                <TableCell>{course.day_of_week}</TableCell>
                                <TableCell>{course.start_time} - {course.end_time}</TableCell>
                                <TableCell>{course.location || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No courses registered</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="exams" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Exam Schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {volunteerExams.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Course</TableHead>
                              <TableHead>Exam Type</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Location</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {volunteerExams.map((exam: any) => (
                              <TableRow key={exam.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{exam.course?.course_name}</p>
                                    <p className="text-xs text-muted-foreground">{exam.course?.course_code}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize">
                                    {exam.exam_type}
                                  </Badge>
                                </TableCell>
                                <TableCell>{format(new Date(exam.exam_date), 'MMM dd, yyyy')}</TableCell>
                                <TableCell>{exam.start_time} - {exam.end_time}</TableCell>
                                <TableCell>{exam.location || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No exams scheduled</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
