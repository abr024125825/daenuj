import { useState } from 'react';
import { DashboardLayout } from './DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  ClipboardList,
  CheckCircle,
  Clock,
  MapPin,
  UserCheck,
  LogOut,
  UsersRound,
  Loader2,
} from 'lucide-react';
import { useSupervisorOpportunities } from '@/hooks/useSupervisors';
import { useOpportunityRegistrations } from '@/hooks/useOpportunities';
import { format } from 'date-fns';

export function SupervisorDashboard() {
  const { opportunities, isLoading } = useSupervisorOpportunities();
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [registrationsDialogOpen, setRegistrationsDialogOpen] = useState(false);

  const { 
    registrations, 
    approveRegistration, 
    manualCheckIn, 
    bulkCheckIn, 
    checkOut, 
    checkedInVolunteerIds, 
    checkedOutVolunteerIds 
  } = useOpportunityRegistrations(selectedOpportunity?.id);

  const openRegistrationsDialog = (opp: any) => {
    setSelectedOpportunity(opp);
    setRegistrationsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'published': return 'default';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const stats = {
    total: opportunities?.length || 0,
    published: opportunities?.filter((o: any) => o.status === 'published').length || 0,
    completed: opportunities?.filter((o: any) => o.status === 'completed').length || 0,
    totalVolunteers: opportunities?.reduce((acc: number, o: any) => acc + (o.registrations?.[0]?.count || 0), 0) || 0,
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Supervisor Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Supervisor Dashboard">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Assigned Opportunities</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.published}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalVolunteers}</p>
                  <p className="text-sm text-muted-foreground">Total Volunteers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              My Assigned Opportunities
            </CardTitle>
            <CardDescription>
              Manage attendance and volunteers for your assigned opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {opportunities && opportunities.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Opportunity</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Volunteers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {opportunities.map((opp: any) => (
                    <TableRow key={opp.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{opp.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{opp.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {opp.date ? format(new Date(opp.date), 'MMM dd, yyyy') : 'No date'}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {opp.start_time} - {opp.end_time}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {opp.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="gap-1 text-sm"
                          onClick={() => openRegistrationsDialog(opp)}
                        >
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {opp.registrations?.[0]?.count || 0}/{opp.required_volunteers}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(opp.status)}>{opp.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" onClick={() => openRegistrationsDialog(opp)}>
                            <ClipboardList className="h-4 w-4 mr-1" />
                            Manage Attendance
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Opportunities Assigned</h3>
                <p className="text-muted-foreground">
                  You will see your assigned opportunities here once the admin assigns them to you.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registrations Dialog */}
        <Dialog open={registrationsDialogOpen} onOpenChange={setRegistrationsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage Attendance - {selectedOpportunity?.title}</DialogTitle>
              <DialogDescription>
                Check in and check out volunteers for this opportunity
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Approved Volunteers */}
              {registrations?.filter((r: any) => r.status === 'approved').length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      Approved ({registrations?.filter((r: any) => r.status === 'approved').length})
                      {' • '}
                      <span className="text-green-600">
                        {registrations?.filter((r: any) => r.status === 'approved' && checkedInVolunteerIds.has(r.volunteer?.id)).length} checked in
                      </span>
                    </p>
                    {registrations?.filter((r: any) => r.status === 'approved' && !checkedInVolunteerIds.has(r.volunteer?.id)).length > 0 && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => bulkCheckIn.mutate(selectedOpportunity?.id)}
                        disabled={bulkCheckIn.isPending}
                      >
                        <UsersRound className="h-4 w-4 mr-2" />
                        Check In All ({registrations?.filter((r: any) => r.status === 'approved' && !checkedInVolunteerIds.has(r.volunteer?.id)).length})
                      </Button>
                    )}
                  </div>
                  {registrations?.filter((r: any) => r.status === 'approved').map((reg: any) => {
                    const isCheckedIn = checkedInVolunteerIds.has(reg.volunteer?.id);
                    const isCheckedOut = checkedOutVolunteerIds.has(reg.volunteer?.id);
                    return (
                      <div key={reg.id} className={`flex items-center justify-between p-3 border rounded-lg ${
                        isCheckedOut 
                          ? 'bg-muted/50 border-muted-foreground/20' 
                          : isCheckedIn 
                            ? 'bg-green-500/10 border-green-500/30' 
                            : 'bg-green-500/5 border-green-500/20'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCheckedOut 
                              ? 'bg-muted text-muted-foreground' 
                              : isCheckedIn 
                                ? 'bg-green-500 text-white' 
                                : 'bg-green-500/20'
                          }`}>
                            {isCheckedOut ? (
                              <LogOut className="h-4 w-4" />
                            ) : isCheckedIn ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <span className="text-xs font-medium text-green-600">
                                {reg.volunteer?.application?.first_name?.[0]}{reg.volunteer?.application?.family_name?.[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {reg.volunteer?.application?.first_name} {reg.volunteer?.application?.family_name}
                              {isCheckedOut && <span className="ml-2 text-xs text-muted-foreground font-normal">(Left Early)</span>}
                              {isCheckedIn && !isCheckedOut && <span className="ml-2 text-xs text-green-600 font-normal">(Checked In)</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">{reg.volunteer?.application?.university_id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={isCheckedOut ? "outline" : isCheckedIn ? "default" : "secondary"} 
                            className={isCheckedOut ? "text-muted-foreground" : isCheckedIn ? "bg-green-500" : ""}
                          >
                            {isCheckedOut ? 'checked out' : isCheckedIn ? 'checked in' : 'approved'}
                          </Badge>
                          {!isCheckedIn && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => manualCheckIn.mutate({
                                opportunityId: selectedOpportunity?.id,
                                volunteerId: reg.volunteer?.id,
                                registrationId: reg.id,
                              })}
                              disabled={manualCheckIn.isPending}
                              title="Manual Check-in"
                            >
                              <UserCheck className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                          {isCheckedIn && !isCheckedOut && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => checkOut.mutate({
                                opportunityId: selectedOpportunity?.id,
                                volunteerId: reg.volunteer?.id,
                              })}
                              disabled={checkOut.isPending}
                              title="Check Out (Left Early)"
                            >
                              <LogOut className="h-4 w-4 text-orange-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pending Volunteers */}
              {registrations?.filter((r: any) => r.status === 'pending').length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending ({registrations?.filter((r: any) => r.status === 'pending').length})
                  </p>
                  {registrations?.filter((r: any) => r.status === 'pending').map((reg: any) => (
                    <div key={reg.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {reg.volunteer?.application?.first_name?.[0]}{reg.volunteer?.application?.family_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {reg.volunteer?.application?.first_name} {reg.volunteer?.application?.family_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{reg.volunteer?.application?.university_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">pending</Badge>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => approveRegistration.mutate(reg.id)} 
                          disabled={approveRegistration.isPending}
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(!registrations || registrations.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No volunteers registered for this opportunity yet.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
