import { useState } from 'react';
import { DashboardLayout } from './DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Users,
  Calendar,
  GraduationCap,
  Award,
  TrendingUp,
  Clock,
  Search,
  Download,
  Eye,
  FileText,
  BarChart3,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export function FacultyCoordinatorDashboard() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

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

  // Fetch faculty volunteers
  const { data: facultyVolunteers = [] } = useQuery({
    queryKey: ['faculty-volunteers', profile?.faculty_id],
    queryFn: async () => {
      if (!profile?.faculty_id) return [];
      const { data, error } = await supabase
        .from('volunteer_applications')
        .select(`
          *,
          volunteers(id, total_hours, opportunities_completed, is_active, rating),
          major:majors(name)
        `)
        .eq('faculty_id', profile.faculty_id)
        .eq('status', 'approved');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.faculty_id,
  });

  // Fetch pending applications
  const { data: pendingApplications = [] } = useQuery({
    queryKey: ['faculty-pending-applications', profile?.faculty_id],
    queryFn: async () => {
      if (!profile?.faculty_id) return [];
      const { data, error } = await supabase
        .from('volunteer_applications')
        .select(`*, major:majors(name)`)
        .eq('faculty_id', profile.faculty_id)
        .eq('status', 'pending');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.faculty_id,
  });

  // Fetch faculty statistics
  const { data: statistics } = useQuery({
    queryKey: ['faculty-statistics', profile?.faculty_id],
    queryFn: async () => {
      if (!profile?.faculty_id) return { totalVolunteers: 0, totalHours: 0, avgRating: 0, completedOpportunities: 0 };
      
      const { data: volunteers } = await supabase
        .from('volunteer_applications')
        .select('volunteers(total_hours, opportunities_completed, rating)')
        .eq('faculty_id', profile.faculty_id)
        .eq('status', 'approved');

      const totalVolunteers = volunteers?.length || 0;
      const totalHours = volunteers?.reduce((sum, v) => sum + (v.volunteers?.total_hours || 0), 0) || 0;
      const completedOpportunities = volunteers?.reduce((sum, v) => sum + (v.volunteers?.opportunities_completed || 0), 0) || 0;
      const ratings = volunteers?.filter(v => v.volunteers?.rating).map(v => v.volunteers?.rating) || [];
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      return { totalVolunteers, totalHours, avgRating, completedOpportunities };
    },
    enabled: !!profile?.faculty_id,
  });

  const filteredVolunteers = facultyVolunteers.filter(v => 
    `${v.first_name} ${v.family_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.university_id.includes(searchTerm)
  );

  return (
    <DashboardLayout title={`${facultyInfo?.name || 'Faculty'} Coordinator Dashboard`}>
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Volunteers</p>
                  <p className="text-2xl font-bold">{statistics?.totalVolunteers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-bold">{statistics?.totalHours || 0}</p>
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
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <p className="text-2xl font-bold">{(statistics?.avgRating || 0).toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{statistics?.completedOpportunities || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Applications Alert */}
        {pendingApplications.length > 0 && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium">Pending Applications</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingApplications.length} applications awaiting review from your faculty
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">
                  {pendingApplications.length} Pending
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="volunteers" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="volunteers" className="gap-2">
              <Users className="h-4 w-4" />
              Volunteers
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2">
              <FileText className="h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="majors" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Majors
            </TabsTrigger>
          </TabsList>

          <TabsContent value="volunteers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Faculty Volunteers
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search volunteers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVolunteers.map((volunteer) => (
                      <TableRow key={volunteer.id}>
                        <TableCell className="font-medium">
                          {volunteer.first_name} {volunteer.father_name} {volunteer.family_name}
                        </TableCell>
                        <TableCell>{volunteer.university_id}</TableCell>
                        <TableCell>{volunteer.major?.name || '-'}</TableCell>
                        <TableCell>{volunteer.volunteers?.total_hours || 0}</TableCell>
                        <TableCell>{volunteer.volunteers?.opportunities_completed || 0}</TableCell>
                        <TableCell>
                          {volunteer.volunteers?.rating ? (
                            <div className="flex items-center gap-1">
                              <Award className="h-4 w-4 text-amber-500" />
                              {volunteer.volunteers.rating.toFixed(1)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
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
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredVolunteers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No volunteers found in your faculty
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Pending Applications
                </CardTitle>
                <CardDescription>
                  Review and manage volunteer applications from your faculty
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>University ID</TableHead>
                      <TableHead>Major</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Applied On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApplications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">
                          {app.first_name} {app.father_name} {app.family_name}
                        </TableCell>
                        <TableCell>{app.university_id}</TableCell>
                        <TableCell>{app.major?.name || '-'}</TableCell>
                        <TableCell>{app.academic_year}</TableCell>
                        <TableCell>{format(new Date(app.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {pendingApplications.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No pending applications
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Monthly Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    <p>Statistics charts will be displayed here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Hours Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    <p>Hours distribution chart will be displayed here</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Generate Reports</CardTitle>
                <CardDescription>Export detailed reports for your faculty</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Volunteer List PDF
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Hours Summary
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Applications Report
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="majors" className="space-y-4">
            <MajorsDistribution facultyId={profile?.faculty_id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function MajorsDistribution({ facultyId }: { facultyId?: string }) {
  const { data: majorsData = [] } = useQuery({
    queryKey: ['majors-distribution', facultyId],
    queryFn: async () => {
      if (!facultyId) return [];
      const { data, error } = await supabase
        .from('majors')
        .select(`
          id,
          name,
          volunteer_applications(count)
        `)
        .eq('faculty_id', facultyId);
      if (error) throw error;
      return data;
    },
    enabled: !!facultyId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Volunteers by Major
        </CardTitle>
        <CardDescription>
          Distribution of volunteers across different majors in your faculty
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {majorsData.map((major: any) => {
            const count = major.volunteer_applications?.[0]?.count || 0;
            return (
              <div key={major.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <span className="font-medium">{major.name}</span>
                <Badge variant="secondary">{count} volunteers</Badge>
              </div>
            );
          })}
          {majorsData.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No majors found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
