import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDiagnoses, useCreateDiagnosis, useUpdateDiagnosis, useICDCodes } from '@/hooks/useEMR';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2, Search, Lock } from 'lucide-react';

interface DiagnosesTabProps {
  patientId: string;
  encounterId?: string;
  isSigned?: boolean;
}

export function DiagnosesTab({ patientId, encounterId, isSigned = false }: DiagnosesTabProps) {
  const { user } = useAuth();
  const { data: diagnoses, isLoading } = useDiagnoses(patientId);
  const createDiagnosis = useCreateDiagnosis();
  const updateDiagnosis = useUpdateDiagnosis();
  const [isOpen, setIsOpen] = useState(false);
  const [icdSearch, setIcdSearch] = useState('');
  const { data: icdCodes } = useICDCodes(icdSearch);
  const [selected, setSelected] = useState<{ code: string; description: string } | null>(null);
  const [diagType, setDiagType] = useState('primary');

  const handleCreate = async () => {
    if (!selected) return;
    await createDiagnosis.mutateAsync({
      patient_id: patientId, icd_code: selected.code, icd_description: selected.description,
      diagnosis_type: diagType, created_by: user?.id, encounter_id: encounterId || null,
    });
    setIsOpen(false);
    setSelected(null);
    setIcdSearch('');
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  // Filter diagnoses by encounter if provided
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
                    <Button variant="ghost" size="sm" onClick={() => updateDiagnosis.mutate({ id: d.id, status: 'resolved', resolved_date: new Date().toISOString().split('T')[0] })}>
                      Resolve
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
