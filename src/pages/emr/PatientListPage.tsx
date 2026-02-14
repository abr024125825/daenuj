import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { usePatients, useCreatePatient, usePatientAlerts } from '@/hooks/useEMR';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, UserPlus, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PatientListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    full_name: '', national_id: '', date_of_birth: '', gender: '', marital_status: '',
    phone: '', email: '', emergency_contact_name: '', emergency_contact_phone: '',
  });

  const { data: patients, isLoading } = usePatients(searchTerm);
  const createPatient = useCreatePatient();

  const handleCreate = async () => {
    if (!newPatient.full_name.trim() || !newPatient.national_id.trim()) {
      toast({ title: 'Required', description: 'Name and National ID are required', variant: 'destructive' });
      return;
    }
    await createPatient.mutateAsync({
      ...newPatient,
      date_of_birth: newPatient.date_of_birth || null,
      created_by: user?.id,
    });
    setIsCreateOpen(false);
    setNewPatient({ full_name: '', national_id: '', date_of_birth: '', gender: '', marital_status: '', phone: '', email: '', emergency_contact_name: '', emergency_contact_phone: '' });
  };

  return (
    <DashboardLayout title="Patient Records">
      <div className="space-y-6">
        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by National ID, Name, or File Number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="h-4 w-4 mr-2" /> New Patient</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Register New Patient</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Full Name *</Label>
                  <Input value={newPatient.full_name} onChange={e => setNewPatient(p => ({ ...p, full_name: e.target.value }))} />
                </div>
                <div>
                  <Label>National ID *</Label>
                  <Input value={newPatient.national_id} onChange={e => setNewPatient(p => ({ ...p, national_id: e.target.value }))} />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input type="date" value={newPatient.date_of_birth} onChange={e => setNewPatient(p => ({ ...p, date_of_birth: e.target.value }))} />
                </div>
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
                <div>
                  <Label>Phone</Label>
                  <Input value={newPatient.phone} onChange={e => setNewPatient(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={newPatient.email} onChange={e => setNewPatient(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <Label>Emergency Contact</Label>
                  <Input value={newPatient.emergency_contact_name} onChange={e => setNewPatient(p => ({ ...p, emergency_contact_name: e.target.value }))} placeholder="Name" />
                </div>
                <div>
                  <Label>Emergency Phone</Label>
                  <Input value={newPatient.emergency_contact_phone} onChange={e => setNewPatient(p => ({ ...p, emergency_contact_phone: e.target.value }))} />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createPatient.isPending} className="w-full mt-4">
                {createPatient.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Patient
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Patient List */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !patients?.length ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            {searchTerm ? 'No patients found matching your search' : 'No patients registered yet. Click "New Patient" to get started.'}
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {patients.map(patient => (
              <Card
                key={patient.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/dashboard/emr/patient/${patient.id}`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{patient.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {patient.file_number} · NID: {patient.national_id}
                          {patient.gender && ` · ${patient.gender === 'male' ? 'M' : 'F'}`}
                          {patient.date_of_birth && ` · DOB: ${patient.date_of_birth}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(patient.allergies as string[])?.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />Allergies
                        </Badge>
                      )}
                      <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                        {patient.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
