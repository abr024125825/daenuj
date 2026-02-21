import { useState, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar, Clock, Loader2, CheckCircle, ArrowLeft, AlertCircle,
  Shield, User, CalendarDays, Download, Printer
} from 'lucide-react';
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

const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function formatTime12(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
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
  const [existingAppointment, setExistingAppointment] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [confirmSlot, setConfirmSlot] = useState<AvailableSlot | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handleVerify = async () => {
    if (!fileNumber || !dateOfBirth) {
      toast({ title: 'خطأ', description: 'الرجاء إدخال رقم الملف وتاريخ الميلاد', variant: 'destructive' });
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
        toast({ title: 'غير موجود', description: 'لم يتم العثور على مريض بهذا الرقم وتاريخ الميلاد.', variant: 'destructive' });
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

      // Check unsigned encounter
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
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBook = async (slot: AvailableSlot) => {
    if (!patient) return;
    setIsBooking(true);
    try {
      // Double-check no one else booked this slot
      const { data: conflict } = await supabase
        .from('appointments')
        .select('id')
        .eq('provider_id', slot.provider_id)
        .eq('appointment_date', slot.date)
        .eq('appointment_time', slot.start_time)
        .in('status', ['scheduled', 'confirmed'])
        .maybeSingle();

      if (conflict) {
        toast({ title: 'الموعد محجوز', description: 'تم حجز هذا الموعد من قبل مريض آخر. اختر موعداً آخر.', variant: 'destructive' });
        setAvailableSlots(prev => prev.filter(s => !(s.date === slot.date && s.start_time === slot.start_time && s.provider_id === slot.provider_id)));
        return;
      }

      // Re-check patient doesn't have active appointment
      const { data: patientConflict } = await supabase
        .from('appointments')
        .select('id')
        .eq('patient_id', patient.id)
        .in('status', ['scheduled', 'confirmed'])
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (patientConflict) {
        toast({ title: 'موعد موجود', description: 'لديك موعد محجوز مسبقاً.', variant: 'destructive' });
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
          toast({ title: 'موعد موجود', description: 'لديك موعد محجوز مسبقاً. يسمح بحجز موعد واحد فقط.', variant: 'destructive' });
          return;
        }
        if (error.message?.includes('already booked')) {
          toast({ title: 'الموعد محجوز', description: 'تم حجز هذا الموعد. اختر موعداً آخر.', variant: 'destructive' });
          setAvailableSlots(prev => prev.filter(s => !(s.date === slot.date && s.start_time === slot.start_time && s.provider_id === slot.provider_id)));
          return;
        }
        throw error;
      }

      setAvailableSlots(prev => prev.filter(s => !(s.date === slot.date && s.start_time === slot.start_time && s.provider_id === slot.provider_id)));
      setBookedSlot(slot);
      setStep('success');
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setIsBooking(false);
      setConfirmSlot(null);
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html dir="rtl">
          <head>
            <title>تأكيد الموعد</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; direction: rtl; color: #1a1a1a; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; }
              .header h1 { font-size: 24px; color: #0ea5e9; margin: 0; }
              .header p { color: #666; margin: 5px 0 0; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
              .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
              .info-box .label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
              .info-box .value { font-size: 16px; font-weight: 600; }
              .notice { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin-top: 24px; font-size: 14px; }
              .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; }
              @media print { body { padding: 20px; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🏥 مركز الإرشاد النفسي</h1>
              <p>تأكيد حجز موعد</p>
            </div>
            ${printContents}
            <div class="footer">
              <p>تم الطباعة بتاريخ ${format(new Date(), 'yyyy/MM/dd - hh:mm a')}</p>
              <p>هذا التأكيد لا يحل محل التأكيد الرسمي من المركز</p>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة للرئيسية
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">

        {/* ───── Step 1: Verify ───── */}
        {step === 'verify' && (
          <div className="space-y-6">
            {/* Hero */}
            <div className="text-center space-y-2 py-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">حجز موعد</h1>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                أدخل رقم ملفك الطبي وتاريخ ميلادك لعرض المواعيد المتاحة
              </p>
            </div>

            <Card className="border-border/50 shadow-lg">
              <CardContent className="pt-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    رقم الملف الطبي
                  </Label>
                  <Input
                    placeholder="مثال: A-2026-1-00001"
                    value={fileNumber}
                    onChange={(e) => setFileNumber(e.target.value)}
                    className="h-11 text-base"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-primary" />
                    تاريخ الميلاد
                  </Label>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="h-11"
                  />
                </div>
                <Button className="w-full h-11 text-base font-semibold" onClick={handleVerify} disabled={isVerifying}>
                  {isVerifying ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Calendar className="h-5 w-5 mr-2" />}
                  تحقق وعرض المواعيد
                </Button>
              </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground">
              يُسمح بحجز موعد واحد فقط في كل مرة
            </p>
          </div>
        )}

        {/* ───── Step 2: Slots / Existing Appointment ───── */}
        {step === 'slots' && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => { setStep('verify'); setExistingAppointment(null); setSelectedDay(null); }}>
              <ArrowLeft className="h-4 w-4 mr-2" /> رجوع
            </Button>

            {/* Patient info bar */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{patient?.full_name}</p>
                <p className="text-xs text-muted-foreground" dir="ltr">File #: {patient?.file_number}</p>
              </div>
            </div>

            {existingAppointment ? (
              /* ── Existing Appointment Block ── */
              <Card className="border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/10 shadow-lg overflow-hidden">
                <div className="h-1 bg-amber-400" />
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-lg">
                    <AlertCircle className="h-5 w-5" />
                    {existingAppointment.status === 'in_session' ? 'جلسة نشطة حالياً' : 'لديك موعد محجوز مسبقاً'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {existingAppointment.status === 'in_session'
                      ? 'لديك جلسة نشطة حالياً. لا يمكنك حجز موعد آخر حتى ينهي المعالج الجلسة الحالية ويتم توقيعها.'
                      : 'لا يمكنك حجز أكثر من موعد واحد. يجب أن تكتمل جلستك الحالية ويتم توقيعها من قبل المعالج قبل حجز موعد جديد.'}
                  </p>

                  {existingAppointment.status !== 'in_session' && (
                    <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                          <span className="text-lg font-bold text-primary leading-none">
                            {new Date(existingAppointment.appointment_date + 'T00:00:00').getDate()}
                          </span>
                          <span className="text-[10px] text-primary/70 uppercase">
                            {format(new Date(existingAppointment.appointment_date + 'T00:00:00'), 'MMM')}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {DAY_NAMES_AR[getDay(new Date(existingAppointment.appointment_date + 'T00:00:00'))]}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(existingAppointment.appointment_date + 'T00:00:00'), 'yyyy/MM/dd')}
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium" dir="ltr">{formatTime12(existingAppointment.appointment_time)}</span>
                        </div>
                        <Badge variant="secondary" className="capitalize">
                          {existingAppointment.status === 'scheduled' ? 'مجدول' : existingAppointment.status === 'confirmed' ? 'مؤكد' : existingAppointment.status}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>إذا كنت بحاجة لتغيير موعدك، يرجى التواصل مع مركز الإرشاد النفسي مباشرة.</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* ── Available Slots ── */
              <Card className="shadow-lg border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    المواعيد المتاحة
                  </CardTitle>
                  <CardDescription>
                    اختر اليوم ثم الوقت المناسب لحجز موعدك (الأيام السبعة القادمة)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {availableDates.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="font-medium text-foreground">لا توجد مواعيد متاحة حالياً</p>
                      <p className="text-sm text-muted-foreground mt-1">يرجى المحاولة مرة أخرى لاحقاً</p>
                    </div>
                  ) : (
                    <>
                      {/* Day selector */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {availableDates.map(dateStr => {
                          const date = new Date(dateStr + 'T00:00:00');
                          const dayNameAr = DAY_NAMES_AR[getDay(date)];
                          const isSelected = selectedDay === dateStr;
                          const slotCount = slotsByDate[dateStr].length;
                          return (
                            <button
                              key={dateStr}
                              onClick={() => setSelectedDay(dateStr)}
                              className={`
                                relative flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all duration-200
                                ${isSelected
                                  ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                                  : 'border-border/50 bg-card hover:border-primary/30 hover:bg-muted/30'
                                }
                              `}
                            >
                              <span className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                                {dayNameAr}
                              </span>
                              <span className={`text-lg font-bold mt-0.5 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                {date.getDate()}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {format(date, 'MMM')}
                              </span>
                              <Badge
                                variant={isSelected ? 'default' : 'secondary'}
                                className="text-[10px] px-1.5 h-4 mt-1.5"
                              >
                                {slotCount}
                              </Badge>
                            </button>
                          );
                        })}
                      </div>

                      {/* Time slots */}
                      {selectedDay ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Clock className="h-4 w-4 text-primary" />
                            الأوقات المتاحة - {DAY_NAMES_AR[getDay(new Date(selectedDay + 'T00:00:00'))]}، {format(new Date(selectedDay + 'T00:00:00'), 'yyyy/MM/dd')}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {displayedSlots.map((slot, i) => (
                              <button
                                key={i}
                                onClick={() => setConfirmSlot(slot)}
                                disabled={isBooking}
                                className="group relative flex flex-col items-center gap-1 py-3.5 px-3 rounded-xl border-2 border-border/50 bg-card hover:border-primary hover:bg-primary/5 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 disabled:opacity-50"
                              >
                                <span className="font-bold text-base text-foreground group-hover:text-primary transition-colors" dir="ltr">
                                  {formatTime12(slot.start_time)}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {slot.slot_duration_minutes} دقيقة
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">اختر يوماً لعرض الأوقات المتاحة</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ───── Step 3: Success ───── */}
        {step === 'success' && bookedSlot && (
          <div className="space-y-4">
            <Card className="shadow-lg border-border/50 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-500" />
              <CardContent className="py-10 text-center space-y-5">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">تم حجز الموعد بنجاح!</h2>
                  <p className="text-muted-foreground text-sm mt-1">يرجى الحضور في الموعد المحدد</p>
                </div>

                {/* Printable section */}
                <div ref={printRef}>
                  <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '0 auto', maxWidth: '400px' }}>
                    <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
                      <p className="text-xs text-muted-foreground mb-1">اليوم</p>
                      <p className="font-bold text-foreground">{DAY_NAMES_AR[bookedSlot.day_of_week]}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
                      <p className="text-xs text-muted-foreground mb-1">التاريخ</p>
                      <p className="font-bold text-foreground">{format(new Date(bookedSlot.date + 'T00:00:00'), 'yyyy/MM/dd')}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
                      <p className="text-xs text-muted-foreground mb-1">الوقت</p>
                      <p className="font-bold text-foreground" dir="ltr">{formatTime12(bookedSlot.start_time)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
                      <p className="text-xs text-muted-foreground mb-1">المدة</p>
                      <p className="font-bold text-foreground">{bookedSlot.slot_duration_minutes} دقيقة</p>
                    </div>
                  </div>
                  <div className="info-box" style={{ textAlign: 'center', marginTop: '12px' }}>
                    <p className="text-xs text-muted-foreground">رقم الملف</p>
                    <p className="font-bold text-foreground" dir="ltr">{patient?.file_number}</p>
                  </div>
                  <div className="info-box" style={{ textAlign: 'center', marginTop: '8px' }}>
                    <p className="text-xs text-muted-foreground">اسم المريض</p>
                    <p className="font-bold text-foreground">{patient?.full_name}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4 justify-center">
                  <Button variant="outline" onClick={handlePrint} className="gap-2">
                    <Printer className="h-4 w-4" />
                    طباعة التأكيد
                  </Button>
                  <Button onClick={() => navigate('/')} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    العودة للرئيسية
                  </Button>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground">
              في حال الرغبة بتغيير الموعد، يرجى التواصل مع مركز الإرشاد النفسي
            </p>
          </div>
        )}
      </main>

      {/* ── Confirmation Dialog ── */}
      <AlertDialog open={!!confirmSlot} onOpenChange={(open) => !open && setConfirmSlot(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">تأكيد حجز الموعد</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-center">
                <p>هل أنت متأكد من حجز الموعد التالي؟</p>
                {confirmSlot && (
                  <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2 text-foreground">
                    <p className="font-bold text-lg">
                      {DAY_NAMES_AR[confirmSlot.day_of_week]}
                    </p>
                    <p className="text-sm">
                      {format(new Date(confirmSlot.date + 'T00:00:00'), 'yyyy/MM/dd')}
                    </p>
                    <Separator />
                    <p className="font-semibold text-primary" dir="ltr">
                      {formatTime12(confirmSlot.start_time)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      مدة الجلسة: {confirmSlot.slot_duration_minutes} دقيقة
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel disabled={isBooking}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmSlot && handleBook(confirmSlot)}
              disabled={isBooking}
            >
              {isBooking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              تأكيد الحجز
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
