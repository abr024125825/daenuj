import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  FileText, Search, Loader2, Eye, CheckCircle2, XCircle, 
  Clock, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export function FacultyApplicationsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch pending applications from the faculty
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['faculty-applications', profile?.faculty_id],
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      if (!profile?.faculty_id) return [];
      const { data, error } = await supabase
        .from('volunteer_applications')
        .select(`
          *,
          major:majors(name),
          faculty:faculties(name)
        `)
        .eq('faculty_id', profile.faculty_id)
        .order('created_at', { ascending: false });
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

  const pendingApplications = applications.filter((a: any) => a.status === 'pending');
  const approvedApplications = applications.filter((a: any) => a.status === 'approved');
  const rejectedApplications = applications.filter((a: any) => a.status === 'rejected');

  const filteredApplications = applications.filter((a: any) => {
    const name = `${a.first_name} ${a.family_name}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || 
           a.university_id?.includes(searchQuery);
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Faculty Applications">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${facultyInfo?.name || 'Faculty'} - Applications`}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingApplications.length}</p>
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
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{approvedApplications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{rejectedApplications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{applications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Alert */}
        {pendingApplications.length > 0 && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <p className="font-medium">
                  {pendingApplications.length} application(s) pending review
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Volunteer Applications
                </CardTitle>
                <CardDescription>
                  Applications from {facultyInfo?.name} students
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app: any) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{app.first_name} {app.father_name} {app.family_name}</p>
                        <p className="text-xs text-muted-foreground">{app.university_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{app.university_id}</TableCell>
                    <TableCell>{app.major?.name || '-'}</TableCell>
                    <TableCell>{app.academic_year}</TableCell>
                    <TableCell>{format(new Date(app.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          app.status === 'approved' ? 'default' :
                          app.status === 'rejected' ? 'destructive' : 'secondary'
                        }
                        className={
                          app.status === 'approved' ? 'bg-green-500/10 text-green-700 border-green-500/30' :
                          app.status === 'pending' ? 'bg-amber-500/10 text-amber-700 border-amber-500/30' : ''
                        }
                      >
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedApplication(app);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredApplications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No applications found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Application Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
            </DialogHeader>
            
            {selectedApplication && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Full Name</p>
                    <p className="font-medium">
                      {selectedApplication.first_name} {selectedApplication.father_name} {selectedApplication.grandfather_name} {selectedApplication.family_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">University ID</p>
                    <p className="font-medium">{selectedApplication.university_id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedApplication.university_email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedApplication.phone_number}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Major</p>
                    <p className="font-medium">{selectedApplication.major?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Academic Year</p>
                    <p className="font-medium">{selectedApplication.academic_year}</p>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground text-sm mb-1">Motivation</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3">{selectedApplication.motivation}</p>
                </div>

                {selectedApplication.skills?.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplication.skills.map((skill: string) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <Badge 
                    variant={
                      selectedApplication.status === 'approved' ? 'default' :
                      selectedApplication.status === 'rejected' ? 'destructive' : 'secondary'
                    }
                    className="text-base px-3 py-1"
                  >
                    Status: {selectedApplication.status}
                  </Badge>
                  
                  {selectedApplication.status === 'pending' && (
                    <p className="text-sm text-muted-foreground">
                      Note: Only administrators can approve or reject applications
                    </p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
