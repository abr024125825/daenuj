import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, UserPlus } from 'lucide-react';

export function PatientRegistrationForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLegacy, setIsLegacy] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    // Legacy file fields
    legacy_year: '',
    legacy_semester: '',
    legacy_number: '',
  });

  const handleSubmit = async () => {
    if (!form.full_name || !user) {
      toast({ title: 'Error', description: 'Patient name is required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      let fileNumber: string;

      if (isLegacy && form.legacy_year && form.legacy_semester && form.legacy_number) {
        // Legacy file: first letter + year + semester + manual number (prefixed with 9)
        const firstLetter = form.full_name.trim()[0]?.toUpperCase() || 'X';
        fileNumber = `${firstLetter}-${form.legacy_year}-${form.legacy_semester}-9${form.legacy_number.padStart(4, '0')}`;
      } else {
        // Auto-generate using the DB function
        const firstLetter = form.full_name.trim()[0]?.toUpperCase() || 'X';
        const currentMonth = new Date().getMonth() + 1;
        let semester: number;
        if (currentMonth >= 9 || currentMonth === 1) semester = 1;
        else if (currentMonth >= 2 && currentMonth <= 6) semester = 2;
        else semester = 3;
        const year = new Date().getFullYear().toString();

        const { data: fnData, error: fnError } = await supabase.rpc('generate_file_number', {
          _first_letter: firstLetter,
          _year: year,
          _semester: semester,
        });

        if (fnError) throw fnError;
        fileNumber = fnData;
      }

      const { data: newPatient, error } = await supabase.from('patients').insert({
        full_name: form.full_name,
        file_number: fileNumber,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        phone: form.phone || null,
        email: form.email || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        created_by: user.id,
        assigned_provider_id: user.id,
      }).select().single();

      if (error) throw error;

      // Auto-assign patient to the registering provider
      await supabase.from('patient_provider_assignments').insert({
        patient_id: newPatient.id,
        provider_id: user.id,
        assigned_by: user.id,
      });

      // Auto-create first encounter (initial visit)
      const profileRes = await supabase.from('profiles').select('first_name, last_name').eq('user_id', user.id).single();
      const providerName = profileRes.data ? `${profileRes.data.first_name} ${profileRes.data.last_name}` : 'Provider';
      await supabase.from('encounters').insert({
        patient_id: newPatient.id,
        provider_id: user.id,
        provider_name: providerName,
        clinic_type: 'psychological',
        visit_type: 'initial',
        status: 'open',
        chief_complaint: 'Initial intake - first visit',
      });

      toast({ title: 'Patient Registered', description: `File Number: ${fileNumber} - First encounter created automatically` });
      qc.invalidateQueries({ queryKey: ['patients'] });
      qc.invalidateQueries({ queryKey: ['my-assigned-patients'] });
      qc.invalidateQueries({ queryKey: ['my-patients'] });
      qc.invalidateQueries({ queryKey: ['provider-assignments'] });
      qc.invalidateQueries({ queryKey: ['encounters'] });
      qc.invalidateQueries({ queryKey: ['my-encounters-count'] });
      setForm({
        full_name: '', date_of_birth: '', gender: '', phone: '', email: '',
        emergency_contact_name: '', emergency_contact_phone: '',
        legacy_year: '', legacy_semester: '', legacy_number: '',
      });
      setIsLegacy(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Register New Patient
        </CardTitle>
        <CardDescription>
          File number is auto-generated: [First Letter]-[Year]-[Semester]-[Seq]. Toggle legacy mode for existing paper files.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label>Full Name (English) *</Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Student full name in English"
            />
          </div>
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={(v) => setForm(f => ({ ...f, gender: v }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Emergency Contact Name</Label>
            <Input value={form.emergency_contact_name} onChange={(e) => setForm(f => ({ ...f, emergency_contact_name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Emergency Contact Phone</Label>
            <Input value={form.emergency_contact_phone} onChange={(e) => setForm(f => ({ ...f, emergency_contact_phone: e.target.value }))} />
          </div>
        </div>

        {/* Legacy File Toggle */}
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          <Switch checked={isLegacy} onCheckedChange={setIsLegacy} />
          <div>
            <p className="text-sm font-medium">Legacy Paper File</p>
            <p className="text-xs text-muted-foreground">Enable to manually enter year, semester, and number for existing paper records</p>
          </div>
        </div>

        {isLegacy && (
          <div className="grid grid-cols-3 gap-4 p-3 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label>Year</Label>
              <Input
                placeholder="2025"
                value={form.legacy_year}
                onChange={(e) => setForm(f => ({ ...f, legacy_year: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={form.legacy_semester} onValueChange={(v) => setForm(f => ({ ...f, legacy_semester: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Winter</SelectItem>
                  <SelectItem value="2">2 - Spring</SelectItem>
                  <SelectItem value="3">3 - Summer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>File Number</Label>
              <Input
                placeholder="0001"
                value={form.legacy_number}
                onChange={(e) => setForm(f => ({ ...f, legacy_number: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Will be prefixed with 9</p>
            </div>
          </div>
        )}

        <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting || !form.full_name}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Register Patient
        </Button>
      </CardContent>
    </Card>
  );
}
