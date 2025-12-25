import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Users, Search, Loader2, Eye, Clock, Award, Calendar, Star } from 'lucide-react';
import { useVolunteers, useVolunteerDetails } from '@/hooks/useVolunteers';
import { format } from 'date-fns';

export function VolunteersPage() {
  const { volunteers, isLoading } = useVolunteers();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { volunteer, attendanceHistory, certificates, isLoading: detailsLoading } = 
    useVolunteerDetails(selectedVolunteerId || undefined);

  const filteredVolunteers = volunteers?.filter((v: any) => {
    const name = `${v.application?.first_name} ${v.application?.family_name}`;
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           v.application?.university_id?.includes(searchQuery);
  });

  const handleViewDetails = (volunteerId: string) => {
    setSelectedVolunteerId(volunteerId);
    setDetailsOpen(true);
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
          <Card>
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
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Users className="h-5 w-5 text-green-500" />
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
            <div className="flex items-center justify-between">
              <CardTitle>All Volunteers</CardTitle>
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
                      <Badge variant={v.is_active ? 'default' : 'secondary'}>
                        {v.is_active ? 'Active' : 'Inactive'}
                      </Badge>
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
                  <TabsTrigger value="activity">Activity History</TabsTrigger>
                  <TabsTrigger value="certificates">Certificates</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
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
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{volunteer.application?.university_email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{volunteer.application?.phone_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Faculty</p>
                      <p className="font-medium">{volunteer.application?.faculty?.name}</p>
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
                      <p className="text-sm text-muted-foreground">Total Hours</p>
                      <p className="font-medium">{volunteer.total_hours || 0} hours</p>
                    </div>
                  </div>

                  {volunteer.application?.skills?.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {volunteer.application.skills.map((skill: string) => (
                          <Badge key={skill} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
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
