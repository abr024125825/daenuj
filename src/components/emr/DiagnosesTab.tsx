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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDiagnoses, useCreateDiagnosis, useUpdateDiagnosis, useDeleteDiagnosis, useICDCodes } from '@/hooks/useEMR';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2, Search, Lock, Trash2, Edit } from 'lucide-react';
import { logAudit } from '@/lib/auditHelper';

interface DiagnosesTabProps {
  patientId: string;
  encounterId?: string;
  isSigned?: boolean;
}

export function DiagnosesTab({ patientId, encounterId, isSigned = false }: DiagnosesTabProps) {
  const { user, profile } = useAuth();
  const userName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
  const { data: diagnoses, isLoading } = useDiagnoses(patientId);
  const createDiagnosis = useCreateDiagnosis();
  const updateDiagnosis = useUpdateDiagnosis();
  const deleteDiagnosis = useDeleteDiagnosis();
  const [isOpen, setIsOpen] = useState(false);
  const [icdSearch, setIcdSearch] = useState('');
  const { data: icdCodes } = useICDCodes(icdSearch);
  const [selected, setSelected] = useState<{ code: string; description: string } | null>(null);
  const [diagType, setDiagType] = useState('primary');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const handleCreate = async () => {
    if (!selected) return;
    const result = await createDiagnosis.mutateAsync({
      patient_id: patientId, icd_code: selected.code, icd_description: selected.description,
      diagnosis_type: diagType, created_by: user?.id, encounter_id: encounterId || null,
    });
    await logAudit({
      patientId, action: 'create', entityType: 'diagnosis', entityId: result.id, encounterId,
      performedBy: user?.id!, performedByName: userName,
      newValue: { icd_code: selected.code, type: diagType },
    });
    setIsOpen(false);
    setSelected(null);
    setIcdSearch('');
  };

  const handleResolve = async (d: any) => {
    await updateDiagnosis.mutateAsync({ id: d.id, status: 'resolved', resolved_date: new Date().toISOString().split('T')[0] });
    await logAudit({
      patientId, action: 'update', entityType: 'diagnosis', entityId: d.id, encounterId,
      performedBy: user?.id!, performedByName: userName,
      oldValue: { status: 'active' }, newValue: { status: 'resolved' },
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await logAudit({
      patientId, action: 'delete', entityType: 'diagnosis', entityId: deleteTarget.id, encounterId,
      performedBy: user?.id!, performedByName: userName,
      oldValue: { icd_code: deleteTarget.icd_code, description: deleteTarget.icd_description },
    });
    await deleteDiagnosis.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const filteredDiagnoses = encounterId
    ? diagnoses?.filter(d => d.encounter_id === encounterId)
    : diagnoses;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">
          Diagnoses ({filteredDiagnoses?.length || 0})
          {isSigned && <Lock className="inline h-4 w-4 ml-2 text-muted-foreground" />}
        </h3>
        {!isSigned && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Diagnosis</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Diagnosis</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Search ICD-10 Code</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={icdSearch} onChange={e => setIcdSearch(e.target.value)} placeholder="Search by code or description..." className="pl-9" />
                  </div>
                  {icdSearch && icdCodes && (
                    <div className="mt-2 max-h-48 overflow-y-auto border rounded-md">
                      {icdCodes.map(icd => (
                        <button key={icd.id} className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${selected?.code === icd.code ? 'bg-primary/10' : ''}`}
                          onClick={() => { setSelected({ code: icd.code, description: icd.description }); setIcdSearch(''); }}>
                          <span className="font-mono font-semibold text-primary">{icd.code}</span> — {icd.description}
                        </button>
                      ))}
                    </div>
                  )}
                  {selected && (
                    <div className="mt-2 p-2 bg-primary/5 rounded text-sm">
                      Selected: <span className="font-semibold">{selected.code}</span> — {selected.description}
                    </div>
                  )}
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={diagType} onValueChange={setDiagType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} disabled={!selected || createDiagnosis.isPending} className="w-full">Add Diagnosis</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!filteredDiagnoses?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No diagnoses recorded</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filteredDiagnoses.map(d => (
            <Card key={d.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-primary text-sm">{d.icd_code}</span>
                    <Badge variant={d.diagnosis_type === 'primary' ? 'default' : 'secondary'} className="text-xs">{d.diagnosis_type}</Badge>
                  </div>
                  <p className="text-sm text-foreground">{d.icd_description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={d.status === 'active' ? 'destructive' : d.status === 'resolved' ? 'default' : 'outline'} className="text-xs">{d.status}</Badge>
                  {!isSigned && d.status === 'active' && (
                    <Button variant="ghost" size="sm" onClick={() => handleResolve(d)}>Resolve</Button>
                  )}
                  {!isSigned && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(d)}>
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
            <AlertDialogTitle>Delete Diagnosis?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {deleteTarget?.icd_code} — {deleteTarget?.icd_description}? This action is logged in the audit trail.
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
