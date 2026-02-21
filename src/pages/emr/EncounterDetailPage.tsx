import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, Plus, Lock, Activity, Brain, AlertTriangle, ArrowRightLeft, FileText } from 'lucide-react';
import { useEncounter, useUpdateEncounter, useMSE, useUpsertMSE, useEncounterHistories, useUpsertHistory, useAddendums, useCreateAddendum } from '@/hooks/useEMR';
import { useAuth } from '@/contexts/AuthContext';
import { DiagnosesTab } from '@/components/emr/DiagnosesTab';
import { TherapySessionsTab } from '@/components/emr/TherapySessionsTab';
import { RiskAssessmentsTab } from '@/components/emr/RiskAssessmentsTab';
import { ReferralsTab } from '@/components/emr/ReferralsTab';
import { DocumentsTab } from '@/components/emr/DocumentsTab';
import { useToast } from '@/hooks/use-toast';

const MSE_FIELDS = [
  { key: 'appearance', label: 'Appearance', options: ['Well-groomed', 'Disheveled', 'Bizarre', 'Age-appropriate'] },
  { key: 'behavior', label: 'Behavior', options: ['Cooperative', 'Agitated', 'Withdrawn', 'Hostile', 'Guarded'] },
  { key: 'mood', label: 'Mood', options: ['Euthymic', 'Depressed', 'Anxious', 'Irritable', 'Euphoric', 'Angry'] },
  { key: 'affect', label: 'Affect', options: ['Appropriate', 'Flat', 'Blunted', 'Labile', 'Restricted', 'Incongruent'] },
  { key: 'thought_process', label: 'Thought Process', options: ['Linear', 'Tangential', 'Circumstantial', 'Loose', 'Blocking', 'Flight of ideas'] },
  { key: 'thought_content', label: 'Thought Content', options: ['Normal', 'Suicidal ideation', 'Homicidal ideation', 'Delusions', 'Obsessions', 'Phobias'] },
  { key: 'perception', label: 'Perception', options: ['Normal', 'Auditory hallucinations', 'Visual hallucinations', 'Illusions', 'Derealization'] },
  { key: 'insight', label: 'Insight', options: ['Good', 'Fair', 'Poor', 'Absent'] },
  { key: 'judgment', label: 'Judgment', options: ['Good', 'Fair', 'Poor', 'Impaired'] },
  { key: 'cognitive_screening', label: 'Cognitive Screening', options: ['Intact', 'Impaired attention', 'Impaired memory', 'Disoriented', 'Confused'] },
];

const HISTORY_TYPES = [
  { key: 'psychiatric', label: 'Psychiatric History' },
  { key: 'medical', label: 'Medical History' },
  { key: 'family', label: 'Family History' },
  { key: 'substance_use', label: 'Substance Use' },
  { key: 'social', label: 'Social Background' },
];

export function EncounterDetailPage() {
  const { encounterId } = useParams<{ encounterId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { data: encounter, isLoading } = useEncounter(encounterId);
  const updateEncounter = useUpdateEncounter();
  const { data: mse } = useMSE(encounterId);
  const upsertMSE = useUpsertMSE();
  const { data: histories } = useEncounterHistories(encounterId);
  const upsertHistory = useUpsertHistory();
  const { data: addendums } = useAddendums(encounterId);
  const createAddendum = useCreateAddendum();

  const [chiefComplaint, setChiefComplaint] = useState('');
  const [mseForm, setMseForm] = useState<Record<string, string>>({});
  const [historyForms, setHistoryForms] = useState<Record<string, string>>({});
  const [addendumText, setAddendumText] = useState('');
  const [nextBookingDays, setNextBookingDays] = useState<number>(7);
  const [showSignDialog, setShowSignDialog] = useState(false);

  useState(() => {
    if (encounter?.chief_complaint) setChiefComplaint(encounter.chief_complaint);
  });

  if (isLoading) return <DashboardLayout title="Encounter"><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  if (!encounter) return <DashboardLayout title="Encounter"><p className="text-muted-foreground text-center py-12">Encounter not found</p></DashboardLayout>;

  const isSigned = encounter.status === 'signed';

  const userName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();

  const handleSaveCC = async () => {
    updateEncounter.mutate({ id: encounter.id, chief_complaint: chiefComplaint });
    const { logAudit } = await import('@/lib/auditHelper');
    await logAudit({ patientId: encounter.patient_id, action: 'update', entityType: 'encounter', entityId: encounter.id, performedBy: user?.id!, performedByName: userName, oldValue: { chief_complaint: encounter.chief_complaint }, newValue: { chief_complaint: chiefComplaint } });
    toast({ title: 'Chief complaint saved' });
  };

  const handleSaveMSE = () => {
    const mseData: any = { encounter_id: encounter.id };
    if (mse?.id) mseData.id = mse.id;
    MSE_FIELDS.forEach(f => {
      mseData[f.key] = mseForm[f.key] || mse?.[f.key as keyof typeof mse] || null;
      mseData[`${f.key}_notes`] = mseForm[`${f.key}_notes`] || mse?.[`${f.key}_notes` as keyof typeof mse] || null;
    });
    upsertMSE.mutate(mseData);
    toast({ title: 'MSE saved' });
  };

  const handleSaveHistory = (type: string) => {
    const existing = histories?.find(h => h.history_type === type);
    const data: any = {
      encounter_id: encounter.id,
      patient_id: encounter.patient_id,
      history_type: type,
      content: { text: historyForms[type] || (existing?.content as any)?.text || '' },
    };
    if (existing?.id) data.id = existing.id;
    upsertHistory.mutate(data);
    toast({ title: `${type} history saved` });
  };

  const handleSign = () => {
    updateEncounter.mutate({
      id: encounter.id,
      status: 'signed',
      signed_at: new Date().toISOString(),
      signed_by: user?.id,
      next_booking_after_days: nextBookingDays,
    });
    setShowSignDialog(false);
    toast({ title: 'Encounter signed and locked' });
  };

  const handleAddAddendum = () => {
    if (!addendumText.trim()) return;
    createAddendum.mutate({
      encounter_id: encounter.id,
      content: addendumText,
      created_by: user?.id,
      created_by_name: `${profile?.first_name} ${profile?.last_name}`,
    });
    setAddendumText('');
    toast({ title: 'Addendum added' });
  };

  return (
    <DashboardLayout title={`Encounter #${encounter.encounter_number}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/emr/patient/${encounter.patient_id}`)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Patient
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant={encounter.status === 'signed' ? 'secondary' : encounter.status === 'completed' ? 'default' : 'outline'}>
              {encounter.status === 'signed' && <Lock className="h-3 w-3 mr-1" />}
              {encounter.status}
            </Badge>
            {!isSigned && (
              <Button size="sm" variant="destructive" onClick={() => setShowSignDialog(true)}>
                <Lock className="h-4 w-4 mr-1" /> Sign & Lock
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="py-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div><span className="text-xs text-muted-foreground">Clinic</span><p className="font-medium capitalize">{encounter.clinic_type}</p></div>
              <div><span className="text-xs text-muted-foreground">Visit</span><p className="font-medium capitalize">{encounter.visit_type?.replace('_', '-')}</p></div>
              <div><span className="text-xs text-muted-foreground">Date</span><p className="font-medium">{new Date(encounter.encounter_date).toLocaleDateString()}</p></div>
              <div><span className="text-xs text-muted-foreground">Provider</span><p className="font-medium">{encounter.provider_name}</p></div>
              <div><span className="text-xs text-muted-foreground">Location</span><p className="font-medium">{encounter.location || 'N/A'}</p></div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="clinical" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1">
            <TabsTrigger value="clinical">Clinical Assessment</TabsTrigger>
            <TabsTrigger value="mse">MSE</TabsTrigger>
            <TabsTrigger value="diagnosis"><Activity className="h-3 w-3 mr-1" />Diagnoses</TabsTrigger>
            <TabsTrigger value="therapy"><Brain className="h-3 w-3 mr-1" />Therapy</TabsTrigger>
            <TabsTrigger value="risk"><AlertTriangle className="h-3 w-3 mr-1" />Risk</TabsTrigger>
            <TabsTrigger value="referrals"><ArrowRightLeft className="h-3 w-3 mr-1" />Referrals</TabsTrigger>
            <TabsTrigger value="documents"><FileText className="h-3 w-3 mr-1" />Documents</TabsTrigger>
            <TabsTrigger value="addendums">Addendums ({addendums?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="clinical" className="space-y-4">
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm">Chief Complaint</CardTitle></CardHeader>
              <CardContent className="pb-4">
                <Textarea
                  value={chiefComplaint || encounter.chief_complaint || ''}
                  onChange={e => setChiefComplaint(e.target.value)}
                  disabled={isSigned}
                  rows={2}
                />
                {!isSigned && <Button size="sm" onClick={handleSaveCC} className="mt-2"><Save className="h-3 w-3 mr-1" /> Save</Button>}
              </CardContent>
            </Card>

            {HISTORY_TYPES.map(ht => {
              const existing = histories?.find(h => h.history_type === ht.key);
              return (
                <Card key={ht.key}>
                  <CardHeader className="py-3"><CardTitle className="text-sm">{ht.label}</CardTitle></CardHeader>
                  <CardContent className="pb-4">
                    <Textarea
                      value={historyForms[ht.key] ?? (existing?.content as any)?.text ?? ''}
                      onChange={e => setHistoryForms(f => ({ ...f, [ht.key]: e.target.value }))}
                      disabled={isSigned}
                      rows={3}
                      placeholder={`Enter ${ht.label.toLowerCase()}...`}
                    />
                    {!isSigned && <Button size="sm" onClick={() => handleSaveHistory(ht.key)} className="mt-2"><Save className="h-3 w-3 mr-1" /> Save</Button>}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="mse">
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm">Mental Status Examination</CardTitle></CardHeader>
              <CardContent className="space-y-4 pb-4">
                {MSE_FIELDS.map(field => (
                  <div key={field.key} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">{field.label}</Label>
                      <Select
                        value={mseForm[field.key] || (mse as any)?.[field.key] || ''}
                        onValueChange={v => setMseForm(f => ({ ...f, [field.key]: v }))}
                        disabled={isSigned}
                      >
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {field.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">{field.label} Notes</Label>
                      <Textarea
                        value={mseForm[`${field.key}_notes`] || (mse as any)?.[`${field.key}_notes`] || ''}
                        onChange={e => setMseForm(f => ({ ...f, [`${field.key}_notes`]: e.target.value }))}
                        disabled={isSigned}
                        rows={1}
                        className="min-h-[36px]"
                      />
                    </div>
                  </div>
                ))}
                {!isSigned && <Button onClick={handleSaveMSE} className="w-full"><Save className="h-4 w-4 mr-1" /> Save MSE</Button>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagnosis">
            <DiagnosesTab patientId={encounter.patient_id} encounterId={encounter.id} isSigned={isSigned} />
          </TabsContent>

          <TabsContent value="therapy">
            <TherapySessionsTab patientId={encounter.patient_id} encounterId={encounter.id} />
          </TabsContent>

          <TabsContent value="risk">
            <RiskAssessmentsTab patientId={encounter.patient_id} encounterId={encounter.id} isSigned={isSigned} />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralsTab patientId={encounter.patient_id} encounterId={encounter.id} isSigned={isSigned} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsTab patientId={encounter.patient_id} encounterId={encounter.id} isSigned={isSigned} />
          </TabsContent>

          <TabsContent value="addendums" className="space-y-4">
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm">Add Addendum</CardTitle></CardHeader>
              <CardContent className="pb-4">
                <p className="text-xs text-muted-foreground mb-2">Encounters cannot be deleted. Only addendums can be added after signing.</p>
                <Textarea value={addendumText} onChange={e => setAddendumText(e.target.value)} rows={3} placeholder="Write addendum..." />
                <Button size="sm" onClick={handleAddAddendum} disabled={!addendumText.trim()} className="mt-2"><Plus className="h-3 w-3 mr-1" /> Add Addendum</Button>
              </CardContent>
            </Card>
            {addendums?.map(a => (
              <Card key={a.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">{a.created_by_name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-foreground">{a.content}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Sign Dialog with next booking days */}
        <AlertDialog open={showSignDialog} onOpenChange={setShowSignDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign & Lock Encounter</AlertDialogTitle>
              <AlertDialogDescription>
                This action is permanent. The encounter will be locked and can only be updated via addendums.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3 py-2">
              <Label className="text-sm font-medium">
                Number of days before the patient can book a new appointment
              </Label>
              <Input
                type="number"
                min={0}
                max={365}
                value={nextBookingDays}
                onChange={(e) => setNextBookingDays(parseInt(e.target.value) || 0)}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                The patient will only see available appointments after {nextBookingDays} days from signing.
              </p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSign} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Sign & Lock
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
