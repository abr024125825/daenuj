import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useLabResults, useCreateLabResult } from '@/hooks/useEMR';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2 } from 'lucide-react';

export function LabsTab({ patientId }: { patientId: string }) {
  const { user } = useAuth();
  const { data: labs, isLoading } = useLabResults(patientId);
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
                    Result: {l.result_value || 'N/A'} {l.unit} {l.reference_range && `(Ref: ${l.reference_range})`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{l.test_date}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
