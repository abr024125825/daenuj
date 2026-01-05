import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  CheckCircle, 
  XCircle, 
  Users, 
  UserCheck, 
  UserX, 
  UserPlus,
  Loader2,
  Download,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useVolunteerAvailability } from '@/hooks/useVolunteerCourses';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VolunteerAvailabilityListsProps {
  opportunityId: string;
  opportunityDate: string;
  startTime: string;
  endTime: string;
  targetInterests: string[];
  registrations: any[];
  onAutoApprove?: (volunteerId: string) => void;
}

export function VolunteerAvailabilityLists({
  opportunityId,
  opportunityDate,
  startTime,
  endTime,
  targetInterests,
  registrations,
  onAutoApprove,
}: VolunteerAvailabilityListsProps) {
  const { availableVolunteers, isLoading } = useVolunteerAvailability(opportunityDate, startTime, endTime);
  const [activeTab, setActiveTab] = useState('available');

  const registeredIds = useMemo(() => 
    new Set(registrations?.map((r: any) => r.volunteer_id) || []),
    [registrations]
  );

  const approvedIds = useMemo(() => 
    new Set(registrations?.filter((r: any) => r.status === 'approved').map((r: any) => r.volunteer_id) || []),
    [registrations]
  );

  // Categorize volunteers
  const categorizedVolunteers = useMemo(() => {
    if (!availableVolunteers) return { available: [], registered: [], notRegistered: [], matchingInterests: [] };

    const available = availableVolunteers.available || [];
    
    // Available and registered (approved)
    const registered = available.filter((v: any) => approvedIds.has(v.id));
    
    // Available but not registered
    const notRegistered = available.filter((v: any) => !registeredIds.has(v.id));
    
    // Available with matching interests (even if not in their interests list)
    const matchingInterests = notRegistered.filter((v: any) => {
      const volunteerInterests = v.application?.interests || [];
      return targetInterests.some(interest => volunteerInterests.includes(interest));
    });

    // Available but opportunity not in their interests
    const notInInterests = notRegistered.filter((v: any) => {
      const volunteerInterests = v.application?.interests || [];
      return !targetInterests.some(interest => volunteerInterests.includes(interest));
    });

    return {
      available,
      registered,
      notRegistered,
      matchingInterests,
      notInInterests,
    };
  }, [availableVolunteers, registeredIds, approvedIds, targetInterests]);

  const exportToCSV = (volunteers: any[], filename: string) => {
    const headers = ['Name', 'University ID', 'Email', 'Phone', 'Faculty', 'Major'];
    const rows = volunteers.map((v: any) => [
      `${v.application?.first_name || ''} ${v.application?.father_name || ''} ${v.application?.family_name || ''}`,
      v.application?.university_id || '',
      v.application?.university_email || '',
      v.application?.phone_number || '',
      v.application?.faculty?.name || '',
      v.application?.major?.name || '',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (availableVolunteers?.noActiveSemester) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No active semester. Availability cannot be calculated without an active academic semester.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Volunteer Availability
            </CardTitle>
            <CardDescription>
              Based on course schedules for {availableVolunteers?.dayOfWeek || 'the opportunity day'}
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {categorizedVolunteers.available.length} Available
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="available" className="gap-1">
              <Users className="h-3 w-3" />
              All Available ({categorizedVolunteers.available.length})
            </TabsTrigger>
            <TabsTrigger value="registered" className="gap-1">
              <UserCheck className="h-3 w-3" />
              Registered ({categorizedVolunteers.registered.length})
            </TabsTrigger>
            <TabsTrigger value="not-registered" className="gap-1">
              <UserX className="h-3 w-3" />
              Not Registered ({categorizedVolunteers.notRegistered.length})
            </TabsTrigger>
            <TabsTrigger value="matching" className="gap-1">
              <UserPlus className="h-3 w-3" />
              Matching Interests ({categorizedVolunteers.matchingInterests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="mt-4">
            <VolunteerTable 
              volunteers={categorizedVolunteers.available}
              showActions={false}
              onExport={() => exportToCSV(categorizedVolunteers.available, 'available-volunteers')}
            />
          </TabsContent>

          <TabsContent value="registered" className="mt-4">
            <VolunteerTable 
              volunteers={categorizedVolunteers.registered}
              showActions={false}
              onExport={() => exportToCSV(categorizedVolunteers.registered, 'registered-available-volunteers')}
            />
          </TabsContent>

          <TabsContent value="not-registered" className="mt-4">
            <VolunteerTable 
              volunteers={categorizedVolunteers.notRegistered}
              showActions={!!onAutoApprove}
              onAutoApprove={onAutoApprove}
              onExport={() => exportToCSV(categorizedVolunteers.notRegistered, 'not-registered-volunteers')}
            />
          </TabsContent>

          <TabsContent value="matching" className="mt-4">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                These volunteers are available and have interests matching the opportunity's target interests.
              </p>
            </div>
            <VolunteerTable 
              volunteers={categorizedVolunteers.matchingInterests}
              showActions={!!onAutoApprove}
              showInterests
              targetInterests={targetInterests}
              onAutoApprove={onAutoApprove}
              onExport={() => exportToCSV(categorizedVolunteers.matchingInterests, 'matching-interest-volunteers')}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface VolunteerTableProps {
  volunteers: any[];
  showActions?: boolean;
  showInterests?: boolean;
  targetInterests?: string[];
  onAutoApprove?: (volunteerId: string) => void;
  onExport?: () => void;
}

function VolunteerTable({ 
  volunteers, 
  showActions, 
  showInterests,
  targetInterests = [],
  onAutoApprove,
  onExport 
}: VolunteerTableProps) {
  if (volunteers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No volunteers in this category</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>University ID</TableHead>
            <TableHead>Faculty</TableHead>
            <TableHead>Contact</TableHead>
            {showInterests && <TableHead>Matching Interests</TableHead>}
            {showActions && <TableHead className="w-32">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {volunteers.map((volunteer: any) => (
            <TableRow key={volunteer.id}>
              <TableCell className="font-medium">
                {volunteer.application?.first_name} {volunteer.application?.father_name} {volunteer.application?.family_name}
              </TableCell>
              <TableCell className="font-mono">
                {volunteer.application?.university_id}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <p>{volunteer.application?.faculty?.name}</p>
                  <p className="text-muted-foreground">{volunteer.application?.major?.name}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <p>{volunteer.application?.university_email}</p>
                  <p className="text-muted-foreground">{volunteer.application?.phone_number}</p>
                </div>
              </TableCell>
              {showInterests && (
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(volunteer.application?.interests || [])
                      .filter((i: string) => targetInterests.includes(i))
                      .map((interest: string) => (
                        <Badge key={interest} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                  </div>
                </TableCell>
              )}
              {showActions && onAutoApprove && (
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() => onAutoApprove(volunteer.id)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
