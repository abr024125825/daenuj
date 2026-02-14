import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReferrals, useCreateReferral, useUpdateReferral, usePatient } from '@/hooks/useEMR';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2, Printer } from 'lucide-react';

function printReferralReport(referral: any, patient: any) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html><head><title>Referral Report</title>
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
      <h2>Referral Report</h2>
    </div>
    <div class="grid">
      <div class="field"><label>Patient Name</label><p>${patient?.full_name || 'N/A'}</p></div>
      <div class="field"><label>File Number</label><p>${patient?.file_number || 'N/A'}</p></div>
      <div class="field"><label>National ID</label><p>${patient?.national_id || 'N/A'}</p></div>
      <div class="field"><label>Date</label><p>${new Date().toLocaleDateString()}</p></div>
    </div>
    <hr style="margin: 15px 0"/>
    <div class="field"><label>Referred To</label><p>${referral.referred_to}</p></div>
    <div class="grid">
      <div class="field"><label>Referral Type</label><p style="text-transform:capitalize">${referral.referral_type}</p></div>
      <div class="field"><label>Urgency</label><p style="text-transform:capitalize">${referral.urgency}</p></div>
    </div>
    <div class="field"><label>Specialty</label><p>${referral.specialty || 'N/A'}</p></div>
    <div class="field"><label>Reason for Referral</label><p>${referral.reason}</p></div>
    <div class="stamp">
      <p>Provider Signature: _______________________</p>
      <p>Date: ${new Date().toLocaleDateString()}</p>
    </div>
    <div class="footer">
      <p>This is an official referral document from the University of Jordan Psychological Services Unit to the Student Health Clinic.</p>
      <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
    </body></html>
  `);
  win.document.close();
  win.print();
}

export function ReferralsTab({ patientId }: { patientId: string }) {
  const { user } = useAuth();
  const { data: referrals, isLoading } = useReferrals(patientId);
  const { data: patient } = usePatient(patientId);
  const createRef = useCreateReferral();
  const updateRef = useUpdateReferral();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    referral_type: 'internal', referred_to: 'University Student Health Clinic', specialty: '', reason: '', urgency: 'routine',
  });

  const handleCreate = async () => {
    if (!form.referred_to || !form.reason) return;
    await createRef.mutateAsync({ patient_id: patientId, referred_by: user?.id, ...form });
    setIsOpen(false);
    setForm({ referral_type: 'internal', referred_to: 'University Student Health Clinic', specialty: '', reason: '', urgency: 'routine' });
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Referrals ({referrals?.length || 0})</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Referral</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Referral to Student Health Clinic</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={form.referral_type} onValueChange={v => setForm(f => ({ ...f, referral_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="external">External</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Urgency</Label>
                  <Select value={form.urgency} onValueChange={v => setForm(f => ({ ...f, urgency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="emergent">Emergent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Referred To</Label>
                <Input value={form.referred_to} onChange={e => setForm(f => ({ ...f, referred_to: e.target.value }))} placeholder="University Student Health Clinic" />
              </div>
              <div><Label>Specialty</Label><Input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} /></div>
              <div><Label>Reason *</Label><Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3} /></div>
              <Button onClick={handleCreate} disabled={createRef.isPending} className="w-full">Create Referral</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!referrals?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No referrals</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {referrals.map(r => (
            <Card key={r.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm">{r.referred_to}</span>
                    <Badge variant="outline" className="text-xs">{r.referral_type}</Badge>
                    <Badge variant={r.urgency === 'emergent' ? 'destructive' : r.urgency === 'urgent' ? 'secondary' : 'outline'} className="text-xs">{r.urgency}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={r.status === 'completed' ? 'default' : r.status === 'pending' ? 'secondary' : 'outline'} className="text-xs">{r.status}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => printReferralReport(r, patient)} title="Print Referral">
                    <Printer className="h-4 w-4" />
                  </Button>
                  {r.status === 'pending' && (
                    <Button variant="ghost" size="sm" onClick={() => updateRef.mutate({ id: r.id, status: 'completed', completed_at: new Date().toISOString() })}>
                      Complete
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
