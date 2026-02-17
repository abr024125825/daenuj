import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, getDay } from 'date-fns';

interface AvailableSlot {
  date: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  provider_id: string;
}

export default function BookAppointmentPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<'verify' | 'slots' | 'success'>('verify');
  const [fileNumber, setFileNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [bookedSlot, setBookedSlot] = useState<AvailableSlot | null>(null);

  const handleVerify = async () => {
    if (!fileNumber || !dateOfBirth) {
      toast({ title: 'Error', description: 'Please enter your file number and date of birth', variant: 'destructive' });
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, file_number, full_name, date_of_birth')
        .eq('file_number', fileNumber.trim())
        .eq('date_of_birth', dateOfBirth)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({ title: 'Not Found', description: 'No patient found with the provided file number and date of birth.', variant: 'destructive' });
        return;
      }

      setPatient(data);

      // Fetch available slots
      const { data: slots, error: slotsError } = await supabase
        .from('therapist_availability_slots')
        .select('*')
        .eq('is_active', true);

      if (slotsError) throw slotsError;

      // Fetch leaves
      const { data: leaves } = await supabase
        .from('therapist_leaves')
        .select('*')
        .gte('end_date', new Date().toISOString().split('T')[0]);

      // Fetch existing appointments to avoid double-booking
      const { data: existingAppts } = await supabase
        .from('appointments')
        .select('appointment_date, appointment_time, provider_id')
        .in('status', ['scheduled', 'confirmed']);

      // Generate available dates based on slots and booking windows
      const today = new Date();
      const generatedSlots: AvailableSlot[] = [];

      for (const slot of (slots || [])) {
        const bookingWindowDays = slot.booking_window_days || 7;
        
        // Only show slots after the booking window
        for (let d = bookingWindowDays; d <= bookingWindowDays + 14; d++) {
          const date = addDays(today, d);
          const dayOfWeek = getDay(date);
          
          if (dayOfWeek !== slot.day_of_week) continue;

          const dateStr = format(date, 'yyyy-MM-dd');

          // Check if provider is on leave
          const isOnLeave = (leaves || []).some(
            (l: any) => l.provider_id === slot.provider_id && dateStr >= l.start_date && dateStr <= l.end_date
          );
          if (isOnLeave) continue;

          // Check if slot already booked
          const isBooked = (existingAppts || []).some(
            (a: any) => a.provider_id === slot.provider_id && a.appointment_date === dateStr && a.appointment_time === slot.start_time
          );
          if (isBooked) continue;

          generatedSlots.push({
            date: dateStr,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            slot_duration_minutes: slot.slot_duration_minutes,
            provider_id: slot.provider_id,
          });
        }
      }

      generatedSlots.sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
      setAvailableSlots(generatedSlots);
      setStep('slots');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBook = async (slot: AvailableSlot) => {
    if (!patient) return;
    setIsBooking(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: patient.id,
          provider_id: slot.provider_id,
          appointment_date: slot.date,
          appointment_time: slot.start_time,
          duration_minutes: slot.slot_duration_minutes,
          appointment_type: 'new',
          status: 'scheduled',
          created_by: slot.provider_id,
        });

      if (error) throw error;

      setBookedSlot(slot);
      setStep('success');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsBooking(false);
    }
  };

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-lg">
        {step === 'verify' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Book an Appointment</CardTitle>
              <CardDescription>Enter your medical file number and date of birth to view available slots</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Medical File Number</Label>
                <Input
                  placeholder="e.g. A-2026-1-00001"
                  value={fileNumber}
                  onChange={(e) => setFileNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleVerify} disabled={isVerifying}>
                {isVerifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Verify & View Slots
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'slots' && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setStep('verify')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>Available Appointments</CardTitle>
                <CardDescription>
                  Welcome back, {patient?.full_name}. Select a time slot to book your appointment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availableSlots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No available appointment slots at this time.</p>
                    <p className="text-sm mt-1">Please check back later.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableSlots.map((slot, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-medium">
                            <Calendar className="h-4 w-4 text-primary" />
                            {DAY_NAMES[slot.day_of_week]}, {format(new Date(slot.date), 'MMM dd, yyyy')}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {slot.start_time} - {slot.end_time} ({slot.slot_duration_minutes} min)
                          </div>
                        </div>
                        <Button size="sm" onClick={() => handleBook(slot)} disabled={isBooking}>
                          {isBooking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Book'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'success' && bookedSlot && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">Appointment Booked!</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Date:</strong> {DAY_NAMES[bookedSlot.day_of_week]}, {format(new Date(bookedSlot.date), 'MMMM dd, yyyy')}</p>
                <p><strong>Time:</strong> {bookedSlot.start_time}</p>
                <p><strong>Duration:</strong> {bookedSlot.slot_duration_minutes} minutes</p>
              </div>
              <Badge variant="secondary">File #: {patient?.file_number}</Badge>
              <div className="pt-4">
                <Button onClick={() => navigate('/')}>Back to Home</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
