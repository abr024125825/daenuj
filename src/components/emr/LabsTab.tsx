import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useLabResults, useCreateLabResult, usePatient, useICDCodes } from '@/hooks/useEMR';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2, Printer, Search, Lock } from 'lucide-react';

interface LabsTabProps {
  patientId: string;
  encounterId?: string;
  isSigned?: boolean;
}

function printLabRequest(lab: any, patient: any) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html><head><title>Lab Request</title>
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
      .header { text-align: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 25px; }
      .header h1 { font-size: 22px; margin: 0; color: #1e3a5f; letter-spacing: 1px; }
      .header h2 { font-size: 14px; color: #4a6fa5; margin: 5px 0 0; font-weight: normal; }
      .field { margin-bottom: 12px; }
      .field label { font-weight: 600; display: block; font-size: 11px; color: #4a6fa5; text-transform: uppercase; letter-spacing: 0.5px; }
      .field p { margin: 4px 0; font-size: 14px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .footer { margin-top: 40px; border-top: 2px solid #1e3a5f; padding-top: 15px; font-size: 10px; color: #888; text-align: center; }
      .stamp { margin-top: 40px; }
      .stamp-line { border-bottom: 1px solid #333; width: 250px; display: inline-block; }
      .test-box { background: #f0f4f8; border: 1px solid #c0d0e0; padding: 15px; border-radius: 6px; margin: 15px 0; }
      .test-name { font-size: 18px; font-weight: bold; color: #1e3a5f; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <div class="header">
      <h1>الجامعة الأردنية — University of Jordan</h1>
      <h2>Laboratory Investigation Request</h2>
    </div>
    <div class="grid">
      <div class="field"><label>Patient Name</label><p>${patient?.full_name || 'N/A'}</p></div>
      <div class="field"><label>File Number</label><p>${patient?.file_number || 'N/A'}</p></div>
      <div class="field"><label>National ID</label><p>${patient?.national_id || 'N/A'}</p></div>
      <div class="field"><label>Request Date</label><p>${lab.test_date || new Date().toLocaleDateString()}</p></div>
    </div>
    <div class="test-box">
      <label style="font-size:11px;color:#4a6fa5;font-weight:600">TEST REQUESTED</label>
      <p class="test-name">${lab.test_name}</p>
      <p style="margin-top:5px;color:#666">Category: ${lab.test_category || 'General'}</p>
    </div>
    ${lab.notes ? `<div class="field"><label>Clinical Notes</label><p>${lab.notes}</p></div>` : ''}
    <div class="stamp">
      <p>Requesting Physician: <span class="stamp-line"></span></p>
      <p style="margin-top:15px">Signature: <span class="stamp-line"></span> &nbsp;&nbsp; Date: ${new Date().toLocaleDateString()}</p>
    </div>
    <div class="footer">
      <p>University of Jordan — Psychological Services Unit — Confidential Medical Document</p>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    </body></html>
  `);
  win.document.close();
  win.print();
}

export function LabsTab({ patientId, encounterId, isSigned = false }: LabsTabProps) {
  const { user } = useAuth();
  const { data: labs, isLoading } = useLabResults(patientId);
  const { data: patient } = usePatient(patientId);
  const createLab = useCreateLabResult();
  const [isOpen, setIsOpen] = useState(false);
  const [icdSearch, setIcdSearch] = useState('');
  const { data: icdCodes } = useICDCodes(icdSearch);
  const [form, setForm] = useState({
    test_name: '', test_category: 'CBC', result_value: '', reference_range: '', unit: '',
    is_abnormal: false, test_date: new Date().toISOString().split('T')[0], notes: '',
  });

  const handleCreate = async () => {
    if (!form.test_name) return;
    await createLab.mutateAsync({ 
      patient_id: patientId, ordered_by: user?.id, ...form,
      encounter_id: encounterId || null,
    });
    setIsOpen(false);
    setForm({ test_name: '', test_category: 'CBC', result_value: '', reference_range: '', unit: '', is_abnormal: false, test_date: new Date().toISOString().split('T')[0], notes: '' });
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const filteredLabs = encounterId
    ? labs?.filter(l => l.encounter_id === encounterId)
    : labs;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">
          Labs & Investigations ({filteredLabs?.length || 0})
          {isSigned && <Lock className="inline h-4 w-4 ml-2 text-muted-foreground" />}
        </h3>
        {!isSigned && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Order Lab</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Order Lab Investigation</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Test Name *</Label><Input value={form.test_name} onChange={e => setForm(f => ({ ...f, test_name: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={form.test_category} onValueChange={v => setForm(f => ({ ...f, test_category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CBC">CBC</SelectItem>
                        <SelectItem value="thyroid">Thyroid Function</SelectItem>
                        <SelectItem value="liver">Liver Profile</SelectItem>
                        <SelectItem value="drug_levels">Drug Levels</SelectItem>
                        <SelectItem value="renal">Renal Function</SelectItem>
                        <SelectItem value="metabolic">Metabolic Panel</SelectItem>
                        <SelectItem value="lipid">Lipid Panel</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Test Date</Label><Input type="date" value={form.test_date} onChange={e => setForm(f => ({ ...f, test_date: e.target.value }))} /></div>
                </div>
                {/* ICD Code for clinical indication */}
                <div>
                  <Label>Clinical Indication (ICD-10)</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={icdSearch} onChange={e => setIcdSearch(e.target.value)} placeholder="Search diagnosis code..." className="pl-9" />
                  </div>
                  {icdSearch && icdCodes && (
                    <div className="mt-1 max-h-28 overflow-y-auto border rounded-md">
                      {icdCodes.map(icd => (
                        <button key={icd.id} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted"
                          onClick={() => { setForm(f => ({ ...f, notes: `ICD: ${icd.code} - ${icd.description}${f.notes ? '\n' + f.notes : ''}` })); setIcdSearch(''); }}>
                          <span className="font-mono font-semibold text-primary">{icd.code}</span> — {icd.description}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Result</Label><Input value={form.result_value} onChange={e => setForm(f => ({ ...f, result_value: e.target.value }))} /></div>
                  <div><Label>Ref Range</Label><Input value={form.reference_range} onChange={e => setForm(f => ({ ...f, reference_range: e.target.value }))} /></div>
                  <div><Label>Unit</Label><Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Abnormal?</Label>
                  <Switch checked={form.is_abnormal} onCheckedChange={v => setForm(f => ({ ...f, is_abnormal: v }))} />
                </div>
                <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Clinical notes" /></div>
                <Button onClick={handleCreate} disabled={createLab.isPending} className="w-full">Order Lab</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!filteredLabs?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No lab results recorded</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filteredLabs.map(l => (
            <Card key={l.id} className={l.is_abnormal ? 'border-destructive/30' : ''}>
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm">{l.test_name}</span>
                    <Badge variant="outline" className="text-xs">{l.test_category}</Badge>
                    {l.is_abnormal && <Badge variant="destructive" className="text-xs">Abnormal</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Result: {l.result_value || 'Pending'} {l.unit} {l.reference_range && `(Ref: ${l.reference_range})`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{l.test_date}</span>
                  <Button variant="ghost" size="icon" onClick={() => printLabRequest(l, patient)} title="Print Lab Request">
                    <Printer className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
