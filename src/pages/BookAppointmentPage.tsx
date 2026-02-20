import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Loader2, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, getDay } from 'date-fns';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AvailableSlot {
  date: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  provider_id: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
  const [existingAppointment, setExistingAppointment] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [confirmSlot, setConfirmSlot] = useState<AvailableSlot | null>(null);

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

      // Check if patient already has a scheduled/confirmed appointment
      const { data: activeAppt } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', data.id)
        .in('status', ['scheduled', 'confirmed'])
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .order('appointment_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (activeAppt) {
        setExistingAppointment(activeAppt);
        setStep('slots');
        return;
      }

      // Also check if there's an encounter from today that is not signed yet
      const today = new Date().toISOString().split('T')[0];
      const { data: unsignedEnc } = await supabase
        .from('encounters')
        .select('id')
        .eq('patient_id', data.id)
        .is('signed_at', null)
        .gte('encounter_date', today + 'T00:00:00')
        .limit(1)
        .maybeSingle();

      if (unsignedEnc) {
        setExistingAppointment({ status: 'in_session', appointment_date: today, appointment_time: '--', duration_minutes: 0 });
        setStep('slots');
        return;
      }

      // Fetch available slots
      const { data: slots, error: slotsError } = await supabase
        .from('therapist_availability_slots')
        .select('*')
        .eq('is_active', true);

      if (slotsError) throw slotsError;

      const { data: leaves } = await supabase
        .from('therapist_leaves')
        .select('*')
        .gte('end_date', new Date().toISOString().split('T')[0]);

      const { data: existingAppts } = await supabase
        .from('appointments')
        .select('appointment_date, appointment_time, provider_id')
        .in('status', ['scheduled', 'confirmed']);

      const todayDate = new Date();
      const generatedSlots: AvailableSlot[] = [];

      for (const slot of (slots || [])) {
        const maxDailyPatients = (slot as any).max_daily_patients || 8;
        
        for (let d = 1; d <= 7; d++) {
          const date = addDays(todayDate, d);
          const dayOfWeek = getDay(date);
          
          if (dayOfWeek !== slot.day_of_week) continue;

          const dateStr = format(date, 'yyyy-MM-dd');

          const isOnLeave = (leaves || []).some(
            (l: any) => l.provider_id === slot.provider_id && dateStr >= l.start_date && dateStr <= l.end_date
          );
          if (isOnLeave) continue;

          const dayAppts = (existingAppts || []).filter(
            (a: any) => a.provider_id === slot.provider_id && a.appointment_date === dateStr
          );
          if (dayAppts.length >= maxDailyPatients) continue;

          const sessionMinutes = (slot as any).session_minutes || 45;
          const bufferMinutes = (slot as any).buffer_minutes || 5;
          const breakMinutes = (slot as any).break_minutes || 10;
          const totalSlotMinutes = sessionMinutes + bufferMinutes + breakMinutes;

          const startParts = slot.start_time.split(':').map(Number);
          const endParts = slot.end_time.split(':').map(Number);
          const startMin = startParts[0] * 60 + startParts[1];
          const endMin = endParts[0] * 60 + endParts[1];

          for (let t = startMin; t + sessionMinutes + bufferMinutes <= endMin; t += totalSlotMinutes) {
            const slotStart = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
            const slotEnd = `${String(Math.floor((t + sessionMinutes + bufferMinutes) / 60)).padStart(2, '0')}:${String((t + sessionMinutes + bufferMinutes) % 60).padStart(2, '0')}`;

            const isBooked = dayAppts.some((a: any) => a.appointment_time === slotStart);
            if (isBooked) continue;

            generatedSlots.push({
              date: dateStr,
              day_of_week: slot.day_of_week,
              start_time: slotStart,
              end_time: slotEnd,
              slot_duration_minutes: sessionMinutes + bufferMinutes,
              provider_id: slot.provider_id,
            });
          }
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
      // Double-check no one else booked this slot (unique index will also prevent it)
      const { data: conflict } = await supabase
        .from('appointments')
        .select('id')
        .eq('provider_id', slot.provider_id)
        .eq('appointment_date', slot.date)
        .eq('appointment_time', slot.start_time)
        .in('status', ['scheduled', 'confirmed'])
        .maybeSingle();

      if (conflict) {
        toast({ title: 'Slot taken', description: 'This slot was just booked by another patient. Please choose another.', variant: 'destructive' });
        setAvailableSlots(prev => prev.filter(s => !(s.date === slot.date && s.start_time === slot.start_time && s.provider_id === slot.provider_id)));
        return;
      }

      // Also re-check that this patient doesn't already have an active appointment
      const { data: patientConflict } = await supabase
        .from('appointments')
        .select('id')
        .eq('patient_id', patient.id)
        .in('status', ['scheduled', 'confirmed'])
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (patientConflict) {
        toast({ title: 'Already booked', description: 'You already have an active appointment.', variant: 'destructive' });
        return;
      }

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

      if (error) {
        if (error.message?.includes('already has an active appointment')) {
          toast({ title: 'Already booked', description: 'You already have an active appointment. Only one at a time is allowed.', variant: 'destructive' });
          return;
        }
        if (error.message?.includes('already booked')) {
          toast({ title: 'Slot taken', description: 'This slot was just booked. Please choose another.', variant: 'destructive' });
          setAvailableSlots(prev => prev.filter(s => !(s.date === slot.date && s.start_time === slot.start_time && s.provider_id === slot.provider_id)));
          return;
        }
        throw error;
      }

      // Remove the booked slot from the list so it cannot appear again
      setAvailableSlots(prev => prev.filter(s => !(s.date === slot.date && s.start_time === slot.start_time && s.provider_id === slot.provider_id)));
      setBookedSlot(slot);
      setStep('success');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsBooking(false);
      setConfirmSlot(null);
    }
  };

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const grouped: Record<string, AvailableSlot[]> = {};
    for (const slot of availableSlots) {
      if (!grouped[slot.date]) grouped[slot.date] = [];
      grouped[slot.date].push(slot);
    }
    return grouped;
  }, [availableSlots]);

  const availableDates = Object.keys(slotsByDate).sort();
  const displayedSlots = selectedDay ? (slotsByDate[selectedDay] || []) : [];

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

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        {step === 'verify' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Book an Appointment</CardTitle>
              <CardDescription>Enter your medical file number and date of birth to view available slots</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Medical File Number</Label>
                <Input placeholder="e.g. A-2026-1-00001" value={fileNumber} onChange={(e) => setFileNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
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
            <Button variant="ghost" size="sm" onClick={() => { setStep('verify'); setExistingAppointment(null); setSelectedDay(null); }}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>

            {existingAppointment ? (
              <Card className="border-accent/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-accent" />
                    {existingAppointment.status === 'in_session' ? 'Active Session' : 'Existing Appointment'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {existingAppointment.status === 'in_session'
                      ? 'You have an active session in progress. You cannot book another until your provider signs and closes the current session.'
                      : 'You already have a scheduled appointment. You cannot book another until your current session is completed and signed by the provider.'}
                  </p>
                  {existingAppointment.status !== 'in_session' && (
                    <div className="p-4 border rounded-lg space-y-2 bg-muted/30">
                      <div className="flex items-center gap-2 font-medium">
                        <Calendar className="h-4 w-4 text-primary" />
                        {format(new Date(existingAppointment.appointment_date + 'T00:00:00'), 'EEEE, MMMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {existingAppointment.appointment_time} ({existingAppointment.duration_minutes} min)
                      </div>
                      <Badge variant="secondary" className="capitalize">{existingAppointment.status}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Available Appointments</CardTitle>
                  <CardDescription>
                    Welcome back, {patient?.full_name}. Select a day to see available time slots (next 7 days).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {availableDates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No available appointment slots at this time.</p>
                      <p className="text-sm mt-1">Please check back later.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {availableDates.map(dateStr => {
                          const date = new Date(dateStr + 'T00:00:00');
                          const dayName = DAY_NAMES[getDay(date)];
                          const isSelected = selectedDay === dateStr;
                          const slotCount = slotsByDate[dateStr].length;
                          return (
                            <Button
                              key={dateStr}
                              variant={isSelected ? 'default' : 'outline'}
                              className="flex-col h-auto py-3 px-4 min-w-[100px]"
                              onClick={() => setSelectedDay(dateStr)}
                            >
                              <span className="text-xs font-medium">{dayName}</span>
                              <span className="text-sm font-bold">{format(date, 'MMM dd')}</span>
                              <Badge variant={isSelected ? 'secondary' : 'outline'} className="text-xs mt-1">
                                {slotCount} slot{slotCount !== 1 ? 's' : ''}
                              </Badge>
                            </Button>
                          );
                        })}
                      </div>

                      {selectedDay && (
                        <div className="space-y-2 mt-4">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            Available times for {DAY_NAMES[getDay(new Date(selectedDay + 'T00:00:00'))]}, {format(new Date(selectedDay + 'T00:00:00'), 'MMMM dd, yyyy')}
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {displayedSlots.map((slot, i) => (
                              <Button
                                key={i}
                                variant="outline"
                                className="h-auto py-3 flex-col gap-1 hover:border-primary hover:bg-primary/5"
                                onClick={() => setConfirmSlot(slot)}
                                disabled={isBooking}
                              >
                                <span className="font-semibold text-sm">{slot.start_time}</span>
                                <span className="text-xs text-muted-foreground">{slot.slot_duration_minutes} min</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {!selectedDay && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          ← Select a day above to see available time slots
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === 'success' && bookedSlot && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">Appointment Booked!</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Date:</strong> {DAY_NAMES[bookedSlot.day_of_week]}, {format(new Date(bookedSlot.date + 'T00:00:00'), 'MMMM dd, yyyy')}</p>
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

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmSlot} onOpenChange={(open) => !open && setConfirmSlot(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Appointment</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to book this appointment?</p>
              {confirmSlot && (
                <div className="p-3 rounded-lg bg-muted/50 border mt-2 space-y-1">
                  <p className="font-medium text-foreground">
                    {DAY_NAMES[confirmSlot.day_of_week]}, {format(new Date(confirmSlot.date + 'T00:00:00'), 'MMMM dd, yyyy')}
                  </p>
                  <p className="text-sm">Time: {confirmSlot.start_time} · Duration: {confirmSlot.slot_duration_minutes} min</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBooking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmSlot && handleBook(confirmSlot)}
              disabled={isBooking}
            >
              {isBooking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
