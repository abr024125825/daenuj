import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { usePatientMedications, useCreateMedication, useUpdateMedication, useDeleteMedication, useMedicationCatalog } from '@/hooks/useEMR';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2, Search, AlertTriangle, Lock, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logAudit } from '@/lib/auditHelper';

interface MedicationsTabProps {
  patientId: string;
  encounterId?: string;
  isSigned?: boolean;
}

export function MedicationsTab({ patientId, encounterId, isSigned = false }: MedicationsTabProps) {
  const { user, profile } = useAuth();
  const userName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
  const { toast } = useToast();
  const { data: meds, isLoading } = usePatientMedications(patientId);
  const createMed = useCreateMedication();
  const updateMed = useUpdateMedication();
  const deleteMed = useDeleteMedication();
  const [isOpen, setIsOpen] = useState(false);
  const [medSearch, setMedSearch] = useState('');
  const { data: catalog } = useMedicationCatalog(medSearch);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({
    medication_name: '', dose: '', route: 'Oral', frequency: '', duration: '', interaction_group: '',
  });

  const checkInteractions = () => {
    if (!form.interaction_group || !meds) return [];
    const activeMeds = meds.filter(m => m.status === 'active');
    const conflicts: string[] = [];
    const sameDrugClass = activeMeds.filter(m => m.interaction_group === form.interaction_group);
    if (sameDrugClass.length > 0) {
      conflicts.push(`Duplicate ${form.interaction_group}: already prescribed ${sameDrugClass.map(m => m.medication_name).join(', ')}`);
    }
    if (form.interaction_group === 'MAOI' && activeMeds.some(m => ['SSRI', 'SNRI'].includes(m.interaction_group || ''))) {
      conflicts.push('DANGEROUS: MAOI + SSRI/SNRI = Serotonin Syndrome Risk');
    }
    if (['SSRI', 'SNRI'].includes(form.interaction_group) && activeMeds.some(m => m.interaction_group === 'MAOI')) {
      conflicts.push('DANGEROUS: SSRI/SNRI + MAOI = Serotonin Syndrome Risk');
    }
    return conflicts;
  };

  const handleCreate = async () => {
    if (!form.medication_name || !form.dose || !form.frequency) {
      toast({ title: 'Required', description: 'Medication, dose, and frequency are required', variant: 'destructive' });
      return;
    }
    const conflicts = checkInteractions();
    if (conflicts.some(c => c.includes('DANGEROUS'))) {
      toast({ title: '⚠️ Dangerous Interaction', description: conflicts.join('; '), variant: 'destructive' });
      return;
    }
    const result = await createMed.mutateAsync({
      patient_id: patientId, ...form, prescribed_by: user?.id,
      start_date: new Date().toISOString().split('T')[0],
      encounter_id: encounterId || null,
    });
    await logAudit({
      patientId, action: 'create', entityType: 'medication', entityId: result.id, encounterId,
      performedBy: user?.id!, performedByName: userName,
      newValue: { medication: form.medication_name, dose: form.dose },
    });
    setIsOpen(false);
    setForm({ medication_name: '', dose: '', route: 'Oral', frequency: '', duration: '', interaction_group: '' });
  };

  const handleDiscontinue = async (m: any) => {
    await updateMed.mutateAsync({ id: m.id, status: 'discontinued', end_date: new Date().toISOString().split('T')[0] });
    await logAudit({
      patientId, action: 'update', entityType: 'medication', entityId: m.id, encounterId,
      performedBy: user?.id!, performedByName: userName,
      oldValue: { status: 'active' }, newValue: { status: 'discontinued' },
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await logAudit({
      patientId, action: 'delete', entityType: 'medication', entityId: deleteTarget.id, encounterId,
      performedBy: user?.id!, performedByName: userName,
      oldValue: { medication: deleteTarget.medication_name, dose: deleteTarget.dose },
    });
    await deleteMed.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const interactions = checkInteractions();

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const filteredMeds = encounterId ? meds?.filter(m => m.encounter_id === encounterId) : meds;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">
          Medications ({filteredMeds?.length || 0})
          {isSigned && <Lock className="inline h-4 w-4 ml-2 text-muted-foreground" />}
        </h3>
        {!isSigned && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Prescribe</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Prescribe Medication</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Search Formulary</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={medSearch} onChange={e => setMedSearch(e.target.value)} placeholder="Search medications..." className="pl-9" />
                  </div>
                  {medSearch && catalog && (
                    <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                      {catalog.map(m => (
                        <button key={m.id} className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => {
                            setForm(f => ({ ...f, medication_name: `${m.generic_name} (${m.brand_name || ''})`, dose: m.typical_dose || '', route: m.route || 'Oral', interaction_group: m.interaction_group || '' }));
                            setMedSearch('');
                          }}>
                          <span className="font-semibold">{m.generic_name}</span> {m.brand_name && `(${m.brand_name})`} — <span className="text-muted-foreground">{m.drug_class}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div><Label>Medication *</Label><Input value={form.medication_name} onChange={e => setForm(f => ({ ...f, medication_name: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Dose *</Label><Input value={form.dose} onChange={e => setForm(f => ({ ...f, dose: e.target.value }))} /></div>
                  <div><Label>Route</Label><Input value={form.route} onChange={e => setForm(f => ({ ...f, route: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Frequency *</Label><Input value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} placeholder="e.g. BID, TID" /></div>
                  <div><Label>Duration</Label><Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 4 weeks" /></div>
                </div>
                {interactions.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded p-3">
                    <div className="flex items-center gap-2 mb-1"><AlertTriangle className="h-4 w-4 text-destructive" /><span className="text-sm font-semibold text-destructive">Interaction Warning</span></div>
                    {interactions.map((c, i) => <p key={i} className="text-xs text-destructive">{c}</p>)}
                  </div>
                )}
                <Button onClick={handleCreate} disabled={createMed.isPending} className="w-full">Prescribe</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!filteredMeds?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No medications prescribed</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filteredMeds.map(m => (
            <Card key={m.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">{m.medication_name}</p>
                  <p className="text-xs text-muted-foreground">{m.dose} · {m.route} · {m.frequency} {m.duration && `· ${m.duration}`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.status === 'active' ? 'default' : 'secondary'} className="text-xs">{m.status}</Badge>
                  {!isSigned && m.status === 'active' && (
                    <Button variant="ghost" size="sm" onClick={() => handleDiscontinue(m)}>D/C</Button>
                  )}
                  {!isSigned && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(m)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medication?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {deleteTarget?.medication_name}? This action is logged in the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
