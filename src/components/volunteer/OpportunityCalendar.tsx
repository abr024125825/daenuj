import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, isSameDay, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Clock, Users, Loader2 } from 'lucide-react';

interface OpportunityCalendarProps {
  volunteerId: string;
}

export function OpportunityCalendar({ volunteerId }: OpportunityCalendarProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Fetch registered opportunities for this volunteer
  const { data: registrations, isLoading: registrationsLoading } = useQuery({
    queryKey: ['my-opportunity-registrations', volunteerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunity_registrations')
        .select(`
          *,
          opportunity:opportunities(
            id,
            title,
            date,
            start_time,
            end_time,
            location,
            status,
            required_volunteers
          )
        `)
        .eq('volunteer_id', volunteerId)
        .in('status', ['approved', 'pending']);
      
      if (error) throw error;
      return data;
    },
    enabled: !!volunteerId,
  });

  // Fetch all published opportunities
  const { data: publishedOpportunities, isLoading: publishedLoading } = useQuery({
    queryKey: ['published-opportunities-calendar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('id, title, date, start_time, end_time, location, status, required_volunteers')
        .eq('status', 'published')
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const isLoading = registrationsLoading || publishedLoading;

  // Get registered opportunity IDs
  const registeredIds = new Set(registrations?.map(r => (r.opportunity as any)?.id).filter(Boolean) || []);

  // Combine and deduplicate opportunities
  const allOpportunities = [
    ...(registrations?.map(r => ({
      ...(r.opportunity as any),
      isRegistered: true,
      registrationStatus: r.status,
    })) || []),
    ...(publishedOpportunities?.filter(o => !registeredIds.has(o.id)).map(o => ({
      ...o,
      isRegistered: false,
      registrationStatus: null,
    })) || []),
  ].filter(o => o && o.date);

  // Get dates with opportunities
  const opportunityDates = allOpportunities.map(o => parseISO(o.date));

  // Get opportunities for selected date
  const selectedDateOpportunities = selectedDate
    ? allOpportunities.filter(o => isSameDay(parseISO(o.date), selectedDate))
    : [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Opportunities Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{
              hasOpportunity: opportunityDates,
              hasRegistered: allOpportunities
                .filter(o => o.isRegistered)
                .map(o => parseISO(o.date)),
            }}
            modifiersStyles={{
              hasOpportunity: {
                fontWeight: 'bold',
                backgroundColor: 'hsl(var(--primary) / 0.1)',
                borderRadius: '50%',
              },
              hasRegistered: {
                backgroundColor: 'hsl(var(--primary) / 0.3)',
                color: 'hsl(var(--primary))',
                borderRadius: '50%',
              },
            }}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateOpportunities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No opportunities on this date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className={`p-4 rounded-lg border ${
                    opp.isRegistered 
                      ? 'border-primary/50 bg-primary/5' 
                      : 'border-border bg-muted/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium">{opp.title}</h4>
                    {opp.isRegistered ? (
                      <Badge variant={opp.registrationStatus === 'approved' ? 'default' : 'secondary'}>
                        {opp.registrationStatus === 'approved' ? 'Registered' : 'Pending'}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Available</Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{opp.start_time?.slice(0, 5)} - {opp.end_time?.slice(0, 5)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{opp.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{opp.required_volunteers} volunteers needed</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
