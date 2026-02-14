import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEncounters, useCreateEncounter } from '@/hooks/useEMR';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2, Calendar, User, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function EncountersTab({ patientId }: { patientId: string }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { data: encounters, isLoading } = useEncounters(patientId);
  const createEncounter = useCreateEncounter();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    clinic_type: 'psychiatry', visit_type: 'new', location: '', chief_complaint: '',
  });

  const handleCreate = async () => {
    await createEncounter.mutateAsync({
      patient_id: patientId,
      clinic_type: form.clinic_type,
      visit_type: form.visit_type,
      location: form.location || null,
      chief_complaint: form.chief_complaint || null,
      provider_id: user?.id,
      provider_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
    });
    setIsOpen(false);
    setForm({ clinic_type: 'psychiatry', visit_type: 'new', location: '', chief_complaint: '' });
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Encounters ({encounters?.length || 0})</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Encounter</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Encounter</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Clinic Type</Label>
                  <Select value={form.clinic_type} onValueChange={v => setForm(f => ({ ...f, clinic_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="psychiatry">Psychiatry</SelectItem>
                      <SelectItem value="psychology">Psychology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Visit Type</Label>
                  <Select value={form.visit_type} onValueChange={v => setForm(f => ({ ...f, visit_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div>
                <Label>Chief Complaint</Label>
                <Textarea value={form.chief_complaint} onChange={e => setForm(f => ({ ...f, chief_complaint: e.target.value }))} rows={3} />
              </div>
              <Button onClick={handleCreate} disabled={createEncounter.isPending} className="w-full">
                {createEncounter.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Encounter
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!encounters?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No encounters yet</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {encounters.map((enc) => (
            <Card key={enc.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/dashboard/emr/encounter/${enc.id}`)}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      #{enc.encounter_number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{enc.clinic_type === 'psychiatry' ? 'Psychiatry' : 'Psychology'} Visit</span>
                        <Badge variant={enc.visit_type === 'new' ? 'default' : 'secondary'} className="text-xs">{enc.visit_type === 'new' ? 'New' : 'Follow-up'}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(enc.encounter_date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{enc.provider_name}</span>
                        {enc.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{enc.location}</span>}
                      </div>
                      {enc.chief_complaint && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">CC: {enc.chief_complaint}</p>}
                    </div>
                  </div>
                  <Badge variant={enc.status === 'completed' ? 'default' : enc.status === 'signed' ? 'secondary' : 'outline'} className="text-xs">
                    {enc.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
