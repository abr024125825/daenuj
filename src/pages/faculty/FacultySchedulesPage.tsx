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
  BookOpen, Search, Loader2, Download, Calendar, Clock, Users, CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export function FacultySchedulesPage() {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch faculty info
  const { data: facultyInfo } = useQuery({
    queryKey: ['faculty-info', profile?.faculty_id],
    queryFn: async () => {
      if (!profile?.faculty_id) return null;
      const { data, error } = await supabase
        .from('faculties')
        .select('*')
        .eq('id', profile.faculty_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.faculty_id,
  });

  // Fetch volunteers with their schedule submission status
  const { data: volunteersWithSchedules = [], isLoading } = useQuery({
    queryKey: ['faculty-volunteers-schedules', profile?.faculty_id],
    queryFn: async () => {
      if (!profile?.faculty_id) return [];
      const { data, error } = await supabase
        .from('volunteer_applications')
        .select(`
          id,
          first_name,
          father_name,
          family_name,
          university_id,
          university_email,
          volunteers(
            id,
            schedule_submitted_at,
            schedule_submitted_for_semester,
            is_active
          ),
          major:majors(name)
        `)
        .eq('faculty_id', profile.faculty_id)
        .eq('status', 'approved');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.faculty_id,
  });

  // Fetch active semester
  const { data: activeSemester } = useQuery({
    queryKey: ['active-semester'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_semesters')
        .select('*')
        .eq('is_active', true)
        .single();
      if (error) return null;
      return data;
    },
  });

  const filteredVolunteers = volunteersWithSchedules.filter((v: any) => {
    const name = `${v.first_name} ${v.family_name}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || 
           v.university_id?.includes(searchQuery);
  });

  const stats = {
    total: volunteersWithSchedules.length,
    submitted: volunteersWithSchedules.filter((v: any) => 
      v.volunteers?.schedule_submitted_for_semester === activeSemester?.id
    ).length,
    pending: volunteersWithSchedules.filter((v: any) => 
      v.volunteers?.schedule_submitted_for_semester !== activeSemester?.id
    ).length,
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Faculty Schedules">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${facultyInfo?.name || 'Faculty'} - Schedules`}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Schedules Submitted</p>
                  <p className="text-2xl font-bold">{stats.submitted}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Submission</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Semester Info */}
        {activeSemester && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Current Semester</p>
                    <p className="text-sm text-muted-foreground">
                      {activeSemester.name} - {activeSemester.academic_year}
                    </p>
                  </div>
                </div>
                <Badge variant={activeSemester.is_schedule_open ? "default" : "secondary"}>
                  {activeSemester.is_schedule_open ? "Schedule Submission Open" : "Schedule Submission Closed"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Volunteers Schedule Status Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Schedule Submissions
                </CardTitle>
                <CardDescription>
                  Track schedule submissions from {facultyInfo?.name} volunteers
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
                  <TableHead>Volunteer</TableHead>
                  <TableHead>University ID</TableHead>
                  <TableHead>Major</TableHead>
                  <TableHead>Schedule Status</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Active Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVolunteers.map((volunteer: any) => {
                  const hasSubmitted = volunteer.volunteers?.schedule_submitted_for_semester === activeSemester?.id;
                  return (
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
                        {hasSubmitted ? (
                          <Badge className="bg-green-500/10 text-green-700 border-green-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Submitted
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-amber-500/30">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {volunteer.volunteers?.schedule_submitted_at 
                          ? format(new Date(volunteer.volunteers.schedule_submitted_at), 'MMM dd, yyyy HH:mm')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {volunteer.volunteers?.is_active ? (
                          <Badge className="bg-green-500/10 text-green-700 border-green-500/30">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredVolunteers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No volunteers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
