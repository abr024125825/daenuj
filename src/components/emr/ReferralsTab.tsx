import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReferrals, useCreateReferral, useUpdateReferral, usePatient, useICDCodes } from '@/hooks/useEMR';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2, Printer, Search, Lock } from 'lucide-react';

interface ReferralsTabProps {
  patientId: string;
  encounterId?: string;
  isSigned?: boolean;
}

function printReferralReport(referral: any, patient: any, icdCode?: string, icdDescription?: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html><head><title>Referral Report</title>
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
      .header { text-align: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 25px; }
      .header h1 { font-size: 22px; margin: 0; color: #1e3a5f; letter-spacing: 1px; }
      .header h2 { font-size: 14px; color: #4a6fa5; margin: 5px 0 0; font-weight: normal; }
      .logo-text { font-size: 12px; color: #888; margin-top: 5px; }
      .field { margin-bottom: 12px; }
      .field label { font-weight: 600; display: block; font-size: 11px; color: #4a6fa5; text-transform: uppercase; letter-spacing: 0.5px; }
      .field p { margin: 4px 0; font-size: 14px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .section-title { font-size: 13px; font-weight: 700; color: #1e3a5f; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin: 20px 0 10px; }
      .footer { margin-top: 40px; border-top: 2px solid #1e3a5f; padding-top: 15px; font-size: 10px; color: #888; text-align: center; }
      .stamp { margin-top: 40px; }
      .stamp-line { border-bottom: 1px solid #333; width: 250px; display: inline-block; margin-bottom: 5px; }
      .icd-box { background: #f0f4f8; border: 1px solid #c0d0e0; padding: 10px; border-radius: 6px; margin: 10px 0; }
      .icd-code { font-family: monospace; font-size: 16px; font-weight: bold; color: #1e3a5f; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <div class="header">
      <h1>الجامعة الأردنية — University of Jordan</h1>
      <h2>Psychological Services Unit — Referral Report</h2>
      <p class="logo-text">Student Health & Wellness Center</p>
    </div>
    <div class="grid">
      <div class="field"><label>Patient Name</label><p>${patient?.full_name || 'N/A'}</p></div>
      <div class="field"><label>File Number</label><p>${patient?.file_number || 'N/A'}</p></div>
      <div class="field"><label>National ID</label><p>${patient?.national_id || 'N/A'}</p></div>
      <div class="field"><label>Date</label><p>${new Date().toLocaleDateString()}</p></div>
    </div>
    ${icdCode ? `
    <div class="icd-box">
      <label style="font-size:11px;color:#4a6fa5;font-weight:600">DIAGNOSIS (ICD-10)</label>
      <p><span class="icd-code">${icdCode}</span> — ${icdDescription || ''}</p>
    </div>
    ` : ''}
    <p class="section-title">Referral Details</p>
    <div class="field"><label>Referred To</label><p>${referral.referred_to}</p></div>
    <div class="grid">
      <div class="field"><label>Referral Type</label><p style="text-transform:capitalize">${referral.referral_type}</p></div>
      <div class="field"><label>Urgency</label><p style="text-transform:capitalize">${referral.urgency}</p></div>
    </div>
    <div class="field"><label>Specialty</label><p>${referral.specialty || 'N/A'}</p></div>
    <div class="field"><label>Reason for Referral</label><p>${referral.reason}</p></div>
    <div class="stamp">
      <p>Referring Provider: <span class="stamp-line"></span></p>
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

export function ReferralsTab({ patientId, encounterId, isSigned = false }: ReferralsTabProps) {
  const { user } = useAuth();
  const { data: referrals, isLoading } = useReferrals(patientId);
  const { data: patient } = usePatient(patientId);
  const createRef = useCreateReferral();
  const updateRef = useUpdateReferral();
  const [isOpen, setIsOpen] = useState(false);
  const [icdSearch, setIcdSearch] = useState('');
  const { data: icdCodes } = useICDCodes(icdSearch);
  const [selectedICD, setSelectedICD] = useState<{ code: string; description: string } | null>(null);
  const [form, setForm] = useState({
    referral_type: 'internal', referred_to: 'University Student Health Clinic', specialty: '', reason: '', urgency: 'routine',
  });

  const handleCreate = async () => {
    if (!form.referred_to || !form.reason) return;
    await createRef.mutateAsync({ 
      patient_id: patientId, referred_by: user?.id, ...form,
      encounter_id: encounterId || null,
    });
    setIsOpen(false);
    setForm({ referral_type: 'internal', referred_to: 'University Student Health Clinic', specialty: '', reason: '', urgency: 'routine' });
    setSelectedICD(null);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const filteredReferrals = encounterId
    ? referrals?.filter(r => r.encounter_id === encounterId)
    : referrals;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">
          Referrals ({filteredReferrals?.length || 0})
          {isSigned && <Lock className="inline h-4 w-4 ml-2 text-muted-foreground" />}
        </h3>
        {!isSigned && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Referral</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create Referral</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {/* ICD Code Selection */}
                <div>
                  <Label>Diagnosis (ICD-10)</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={icdSearch} onChange={e => setIcdSearch(e.target.value)} placeholder="Search ICD code..." className="pl-9" />
                  </div>
                  {icdSearch && icdCodes && (
                    <div className="mt-1 max-h-32 overflow-y-auto border rounded-md">
                      {icdCodes.map(icd => (
                        <button key={icd.id} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted ${selectedICD?.code === icd.code ? 'bg-primary/10' : ''}`}
                          onClick={() => { setSelectedICD({ code: icd.code, description: icd.description }); setIcdSearch(''); }}>
                          <span className="font-mono font-semibold text-primary">{icd.code}</span> — {icd.description}
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedICD && (
                    <div className="mt-1 p-2 bg-primary/5 rounded text-xs">
                      <span className="font-semibold">{selectedICD.code}</span> — {selectedICD.description}
                    </div>
                  )}
                </div>
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
                <div><Label>Referred To</Label><Input value={form.referred_to} onChange={e => setForm(f => ({ ...f, referred_to: e.target.value }))} /></div>
                <div><Label>Specialty</Label><Input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} /></div>
                <div><Label>Reason *</Label><Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3} /></div>
                <Button onClick={handleCreate} disabled={createRef.isPending} className="w-full">Create Referral</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!filteredReferrals?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No referrals</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filteredReferrals.map(r => (
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
                  <Button variant="ghost" size="icon" onClick={() => printReferralReport(r, patient, selectedICD?.code, selectedICD?.description)} title="Print Referral">
                    <Printer className="h-4 w-4" />
                  </Button>
                  {!isSigned && r.status === 'pending' && (
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
