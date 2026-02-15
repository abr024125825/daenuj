import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePatients, useCreatePatient } from '@/hooks/useEMR';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, Users, UserPlus, Loader2, Search, Link2 } from 'lucide-react';
import { format } from 'date-fns';

function useProviders() {
  return useQuery({
    queryKey: ['emr-providers'],
    queryFn: async () => {
      // Get psychologist user_ids from user_roles (source of truth)
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'psychologist');
      if (roleError) throw roleError;
      const psychIds = roleData?.map(r => r.user_id) || [];
      if (psychIds.length === 0) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', psychIds);
      if (error) throw error;
      return data;
    },
  });
}

function useAppointments() {
  return useQuery({
    queryKey: ['all-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patients(full_name, national_id, file_number)')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

function useProviderAssignments() {
  return useQuery({
    queryKey: ['provider-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_provider_assignments')
        .select('*, patients(full_name, national_id, file_number)')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });
}

export function ClinicCoordinatorPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatePatientOpen, setIsCreatePatientOpen] = useState(false);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  const { data: patients, isLoading: patientsLoading } = usePatients(searchTerm);
  const { data: providers } = useProviders();
  const { data: appointments, isLoading: apptLoading } = useAppointments();
  const { data: assignments } = useProviderAssignments();
  const createPatient = useCreatePatient();

  const [newPatient, setNewPatient] = useState({
    full_name: '', national_id: '', date_of_birth: '', gender: '', marital_status: '',
    phone: '', email: '', emergency_contact_name: '', emergency_contact_phone: '',
  });

  const [apptForm, setApptForm] = useState({
    patient_id: '', provider_id: '', appointment_date: '', appointment_time: '',
    duration_minutes: '30', appointment_type: 'new', notes: '',
  });

  const [assignForm, setAssignForm] = useState({ patient_id: '', provider_id: '' });

  const createAppointment = useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase.from('appointments').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-appointments'] });
      toast({ title: 'Appointment booked successfully' });
      setIsBookOpen(false);
      setApptForm({ patient_id: '', provider_id: '', appointment_date: '', appointment_time: '', duration_minutes: '30', appointment_type: 'new', notes: '' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const assignProvider = useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase.from('patient_provider_assignments').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provider-assignments'] });
      toast({ title: 'Patient assigned to provider' });
      setIsAssignOpen(false);
      setAssignForm({ patient_id: '', provider_id: '' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const handleCreatePatient = async () => {
    if (!newPatient.full_name.trim() || !newPatient.national_id.trim()) {
      toast({ title: 'Required', description: 'Name and National ID are required', variant: 'destructive' });
      return;
    }
    await createPatient.mutateAsync({ ...newPatient, date_of_birth: newPatient.date_of_birth || null, created_by: user?.id });
    setIsCreatePatientOpen(false);
    setNewPatient({ full_name: '', national_id: '', date_of_birth: '', gender: '', marital_status: '', phone: '', email: '', emergency_contact_name: '', emergency_contact_phone: '' });
  };

  const handleBookAppointment = () => {
    if (!apptForm.patient_id || !apptForm.provider_id || !apptForm.appointment_date || !apptForm.appointment_time) {
      toast({ title: 'Required', description: 'Patient, Provider, Date and Time are required', variant: 'destructive' });
      return;
    }
    createAppointment.mutate({
      ...apptForm,
      duration_minutes: parseInt(apptForm.duration_minutes),
      created_by: user?.id,
    });
  };

  const handleAssignProvider = () => {
    if (!assignForm.patient_id || !assignForm.provider_id) {
      toast({ title: 'Required', description: 'Patient and Provider are required', variant: 'destructive' });
      return;
    }
    assignProvider.mutate({ ...assignForm, assigned_by: user?.id });
  };

  return (
    <DashboardLayout title="Clinic Coordinator">
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Dialog open={isCreatePatientOpen} onOpenChange={setIsCreatePatientOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="h-4 w-4 mr-2" /> Register Patient</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Register New Patient</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Label>Full Name *</Label><Input value={newPatient.full_name} onChange={e => setNewPatient(p => ({ ...p, full_name: e.target.value }))} /></div>
                <div><Label>National ID *</Label><Input value={newPatient.national_id} onChange={e => setNewPatient(p => ({ ...p, national_id: e.target.value }))} /></div>
                <div><Label>Date of Birth</Label><Input type="date" value={newPatient.date_of_birth} onChange={e => setNewPatient(p => ({ ...p, date_of_birth: e.target.value }))} /></div>
                <div>
                  <Label>Gender</Label>
                  <Select value={newPatient.gender} onValueChange={v => setNewPatient(p => ({ ...p, gender: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Marital Status</Label>
                  <Select value={newPatient.marital_status} onValueChange={v => setNewPatient(p => ({ ...p, marital_status: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Phone</Label><Input value={newPatient.phone} onChange={e => setNewPatient(p => ({ ...p, phone: e.target.value }))} /></div>
                <div><Label>Email</Label><Input type="email" value={newPatient.email} onChange={e => setNewPatient(p => ({ ...p, email: e.target.value }))} /></div>
              </div>
              <Button onClick={handleCreatePatient} disabled={createPatient.isPending} className="w-full mt-4">
                {createPatient.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Patient
              </Button>
            </DialogContent>
          </Dialog>

          <Dialog open={isBookOpen} onOpenChange={setIsBookOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Calendar className="h-4 w-4 mr-2" /> Book Appointment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Book Appointment</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Patient *</Label>
                  <Select value={apptForm.patient_id} onValueChange={v => setApptForm(f => ({ ...f, patient_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {patients?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name} ({p.national_id})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Provider *</Label>
                  <Select value={apptForm.provider_id} onValueChange={v => setApptForm(f => ({ ...f, provider_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                    <SelectContent>
                      {providers?.map(p => (
                        <SelectItem key={p.user_id} value={p.user_id}>Dr. {p.first_name} {p.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Date *</Label><Input type="date" value={apptForm.appointment_date} onChange={e => setApptForm(f => ({ ...f, appointment_date: e.target.value }))} /></div>
                  <div><Label>Time *</Label><Input type="time" value={apptForm.appointment_time} onChange={e => setApptForm(f => ({ ...f, appointment_time: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Duration (min)</Label><Input type="number" value={apptForm.duration_minutes} onChange={e => setApptForm(f => ({ ...f, duration_minutes: e.target.value }))} /></div>
                  <div>
                    <Label>Type</Label>
                    <Select value={apptForm.appointment_type} onValueChange={v => setApptForm(f => ({ ...f, appointment_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New Visit</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Notes</Label><Textarea value={apptForm.notes} onChange={e => setApptForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
                <Button onClick={handleBookAppointment} disabled={createAppointment.isPending} className="w-full">
                  {createAppointment.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Book Appointment
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Link2 className="h-4 w-4 mr-2" /> Assign Patient to Provider</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Assign Patient to Provider</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Patient *</Label>
                  <Select value={assignForm.patient_id} onValueChange={v => setAssignForm(f => ({ ...f, patient_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {patients?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name} ({p.national_id})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Provider *</Label>
                  <Select value={assignForm.provider_id} onValueChange={v => setAssignForm(f => ({ ...f, provider_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                    <SelectContent>
                      {providers?.map(p => (
                        <SelectItem key={p.user_id} value={p.user_id}>Dr. {p.first_name} {p.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAssignProvider} disabled={assignProvider.isPending} className="w-full">
                  {assignProvider.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Assign Patient
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="appointments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="assignments">Provider Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            <Card>
              <CardHeader><CardTitle>All Appointments</CardTitle></CardHeader>
              <CardContent>
                {apptLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments?.map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{a.patients?.full_name}</TableCell>
                          <TableCell>{a.appointment_date}</TableCell>
                          <TableCell>{a.appointment_time}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{a.appointment_type?.replace('_', ' ')}</Badge></TableCell>
                          <TableCell><Badge variant={a.status === 'completed' ? 'default' : a.status === 'cancelled' ? 'destructive' : 'secondary'}>{a.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                      {!appointments?.length && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No appointments yet</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Patients</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search patients..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {patientsLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File #</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>National ID</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patients?.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.file_number}</TableCell>
                          <TableCell>{p.full_name}</TableCell>
                          <TableCell>{p.national_id}</TableCell>
                          <TableCell className="capitalize">{p.gender || 'N/A'}</TableCell>
                          <TableCell><Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                      {!patients?.length && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No patients found</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments">
            <Card>
              <CardHeader><CardTitle>Provider Assignments</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>National ID</TableHead>
                      <TableHead>Assigned Since</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments?.map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.patients?.full_name}</TableCell>
                        <TableCell>{a.patients?.national_id}</TableCell>
                        <TableCell>{format(new Date(a.assigned_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell><Badge variant={a.is_active ? 'default' : 'secondary'}>{a.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {!assignments?.length && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No assignments yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
