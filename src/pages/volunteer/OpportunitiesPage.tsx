import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Calendar, MapPin, Users, Clock, Search, Loader2, QrCode, CheckCircle } from 'lucide-react';
import { useOpportunities, useOpportunityRegistrations, useMyRegistrations, useAttendance } from '@/hooks/useOpportunities';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

export function VolunteerOpportunitiesPage() {
  const { opportunities, isLoading } = useOpportunities();
  const { registrations: myRegistrations } = useMyRegistrations();
  const { checkIn } = useAttendance();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [qrToken, setQrToken] = useState('');

  // Get volunteer record
  const { data: volunteer } = useQuery({
    queryKey: ['my-volunteer-record'],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('volunteers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { registerForOpportunity } = useOpportunityRegistrations();

  const publishedOpportunities = opportunities?.filter(
    (opp: any) => opp.status === 'published'
  );

  const filteredOpportunities = publishedOpportunities?.filter((opp: any) =>
    opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isRegistered = (opportunityId: string) => {
    return myRegistrations?.some((reg: any) => reg.opportunity_id === opportunityId);
  };

  const getRegistrationStatus = (opportunityId: string) => {
    const reg = myRegistrations?.find((reg: any) => reg.opportunity_id === opportunityId);
    return reg?.status;
  };

  const handleRegister = async (opportunityId: string) => {
    if (!volunteer) return;
    await registerForOpportunity.mutateAsync({
      opportunityId,
      volunteerId: volunteer.id,
    });
  };

  const handleCheckIn = async () => {
    await checkIn.mutateAsync({ token: qrToken });
    setCheckInDialogOpen(false);
    setQrToken('');
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Opportunities">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Opportunities">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold">Available Opportunities</h2>
            <p className="text-muted-foreground">Browse and register for volunteering activities</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search opportunities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={() => setCheckInDialogOpen(true)}>
              <QrCode className="h-4 w-4 mr-2" />
              Check In
            </Button>
          </div>
        </div>

        {!volunteer && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="py-4">
              <p className="text-sm text-warning-foreground">
                You need to complete your volunteer registration and get approved before registering for opportunities.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOpportunities?.map((opp: any) => {
            const registered = isRegistered(opp.id);
            const status = getRegistrationStatus(opp.id);
            
            return (
              <Card key={opp.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{opp.title}</CardTitle>
                    {registered && (
                      <Badge variant={status === 'approved' ? 'default' : 'secondary'}>
                        {status === 'approved' ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Approved</>
                        ) : (
                          'Pending'
                        )}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">{opp.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(opp.date), 'EEEE, MMMM dd, yyyy')}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {opp.start_time} - {opp.end_time}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {opp.location}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {opp.registrations?.[0]?.count || 0} / {opp.required_volunteers} volunteers
                    </div>
                  </div>
                  
                  {opp.faculty && (
                    <Badge variant="outline">
                      {opp.faculty.name} only
                    </Badge>
                  )}

                  {!registered ? (
                    <Button
                      className="w-full"
                      onClick={() => handleRegister(opp.id)}
                      disabled={!volunteer || registerForOpportunity.isPending}
                    >
                      {registerForOpportunity.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Register
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Already Registered
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {(!filteredOpportunities || filteredOpportunities.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No opportunities available</h3>
              <p className="text-muted-foreground">Check back later for new volunteering opportunities.</p>
            </CardContent>
          </Card>
        )}

        {/* Check-in Dialog */}
        <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Check In with QR Code</DialogTitle>
              <DialogDescription>
                Enter the QR code token from the opportunity administrator to check in
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Enter QR code token..."
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
              />
              <Button
                className="w-full"
                onClick={handleCheckIn}
                disabled={!qrToken || checkIn.isPending}
              >
                {checkIn.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Check In
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
