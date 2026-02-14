import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useLabResults, useCreateLabResult, usePatient } from '@/hooks/useEMR';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2, Printer } from 'lucide-react';

function printLabRequest(lab: any, patient: any) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html><head><title>Lab Request</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
      .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
      .header h1 { font-size: 20px; margin: 0; }
      .header h2 { font-size: 14px; color: #666; margin: 5px 0 0; }
      .field { margin-bottom: 12px; }
      .field label { font-weight: bold; display: block; font-size: 12px; color: #555; }
      .field p { margin: 4px 0; font-size: 14px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .footer { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 15px; font-size: 11px; color: #888; }
      .stamp { margin-top: 30px; text-align: right; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <div class="header">
      <h1>University of Jordan - Student Health Clinic</h1>
      <h2>Laboratory Investigation Request</h2>
    </div>
    <div class="grid">
      <div class="field"><label>Patient Name</label><p>${patient?.full_name || 'N/A'}</p></div>
      <div class="field"><label>File Number</label><p>${patient?.file_number || 'N/A'}</p></div>
      <div class="field"><label>National ID</label><p>${patient?.national_id || 'N/A'}</p></div>
      <div class="field"><label>Request Date</label><p>${lab.test_date || new Date().toLocaleDateString()}</p></div>
    </div>
    <hr style="margin: 15px 0"/>
    <div class="field"><label>Test Requested</label><p style="font-size:16px; font-weight:bold">${lab.test_name}</p></div>
    <div class="grid">
      <div class="field"><label>Category</label><p style="text-transform:capitalize">${lab.test_category || 'General'}</p></div>
      <div class="field"><label>Priority</label><p>Routine</p></div>
    </div>
    ${lab.notes ? `<div class="field"><label>Clinical Notes</label><p>${lab.notes}</p></div>` : ''}
    <div class="stamp">
      <p>Requesting Physician: _______________________</p>
      <p>Date: ${new Date().toLocaleDateString()}</p>
    </div>
    <div class="footer">
      <p>Please send results to the Psychological Services Unit.</p>
      <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
    </body></html>
  `);
  win.document.close();
  win.print();
}

export function LabsTab({ patientId }: { patientId: string }) {
  const { user } = useAuth();
  const { data: labs, isLoading } = useLabResults(patientId);
  const { data: patient } = usePatient(patientId);
  const createLab = useCreateLabResult();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    test_name: '', test_category: 'CBC', result_value: '', reference_range: '', unit: '',
    is_abnormal: false, test_date: new Date().toISOString().split('T')[0], notes: '',
  });

  const handleCreate = async () => {
    if (!form.test_name) return;
    await createLab.mutateAsync({ patient_id: patientId, ordered_by: user?.id, ...form });
    setIsOpen(false);
    setForm({ test_name: '', test_category: 'CBC', result_value: '', reference_range: '', unit: '', is_abnormal: false, test_date: new Date().toISOString().split('T')[0], notes: '' });
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Labs & Investigations ({labs?.length || 0})</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Lab Result</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Lab Result</DialogTitle></DialogHeader>
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
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Test Date</Label><Input type="date" value={form.test_date} onChange={e => setForm(f => ({ ...f, test_date: e.target.value }))} /></div>
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
              <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Clinical notes for lab" /></div>
              <Button onClick={handleCreate} disabled={createLab.isPending} className="w-full">Save Result</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!labs?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No lab results recorded</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {labs.map(l => (
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
