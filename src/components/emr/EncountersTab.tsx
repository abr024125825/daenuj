import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEncounters, useCreateEncounter, useDeleteEncounter } from '@/hooks/useEMR';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2, Calendar, User, MapPin, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logAudit } from '@/lib/auditHelper';

export function EncountersTab({ patientId }: { patientId: string }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { data: encounters, isLoading } = useEncounters(patientId);
  const createEncounter = useCreateEncounter();
  const deleteEncounter = useDeleteEncounter();
  const [isOpen, setIsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({
    clinic_type: 'psychiatry', visit_type: 'new', location: '', chief_complaint: '',
  });

  const userName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();

  const handleCreate = async () => {
    const result = await createEncounter.mutateAsync({
      patient_id: patientId,
      clinic_type: form.clinic_type,
      visit_type: form.visit_type,
      location: form.location || null,
      chief_complaint: form.chief_complaint || null,
      provider_id: user?.id,
      provider_name: userName,
    });
    await logAudit({
      patientId, action: 'create', entityType: 'encounter', entityId: result.id,
      performedBy: user?.id!, performedByName: userName,
      newValue: { clinic_type: form.clinic_type, visit_type: form.visit_type },
    });
    setIsOpen(false);
    setForm({ clinic_type: 'psychiatry', visit_type: 'new', location: '', chief_complaint: '' });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await logAudit({
      patientId, action: 'delete', entityType: 'encounter', entityId: deleteTarget.id,
      performedBy: user?.id!, performedByName: userName,
      oldValue: { encounter_number: deleteTarget.encounter_number, clinic_type: deleteTarget.clinic_type, date: deleteTarget.encounter_date },
    });
    await deleteEncounter.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
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
            <Card key={enc.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => navigate(`/dashboard/emr/encounter/${enc.id}`)}>
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
                  <div className="flex items-center gap-2">
                    <Badge variant={enc.status === 'completed' ? 'default' : enc.status === 'signed' ? 'secondary' : 'outline'} className="text-xs">
                      {enc.status}
                    </Badge>
                    {enc.status !== 'signed' && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(enc); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Encounter #{deleteTarget?.encounter_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this encounter and all associated data. This action is logged in the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
