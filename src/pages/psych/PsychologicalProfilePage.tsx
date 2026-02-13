import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PsychAccessGate } from './PsychAccessGate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Brain,
  Calendar,
  FileText,
  Shield,
  Loader2,
  Plus,
  ArrowLeft,
  Download,
  ClipboardList,
  Paperclip,
} from 'lucide-react';
import { usePsychProfile } from '@/hooks/usePsychologicalProfiles';
import { PsychSessionTemplates } from '@/components/psych/PsychSessionTemplates';
import { exportSessionsToJSON, downloadLocalFile } from '@/lib/psychSessionTemplates';
import { format } from 'date-fns';

export function PsychologicalProfilePage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const {
    profile,
    sessions,
    assessments,
    treatmentPlans,
    interventions,
    attachments,
    isLoading,
    createSession,
    createAssessment,
    createTreatmentPlan,
    createIntervention,
  } = usePsychProfile(profileId);

  const [sessionDialog, setSessionDialog] = useState(false);
  const [assessmentDialog, setAssessmentDialog] = useState(false);
  const [planDialog, setPlanDialog] = useState(false);
  const [interventionDialog, setInterventionDialog] = useState(false);

  // Session form
  const [sessionForm, setSessionForm] = useState({
    session_date: new Date().toISOString().split('T')[0],
    session_type: 'individual',
    duration_minutes: 50,
    summary: '',
    techniques_used: '',
    homework: '',
    private_notes: '',
    improvement_rating: 5,
  });

  // Assessment form
  const [assessmentForm, setAssessmentForm] = useState({
    reason_for_visit: '',
    main_symptoms: '',
    problem_duration: '',
    psychiatric_history: '',
    medication_history: '',
    assessment_scale: 'PHQ-9',
    assessment_score: 0,
    risk_level: 'low',
  });

  // Plan form
  const [planForm, setPlanForm] = useState({
    preliminary_diagnosis: '',
    therapeutic_approach: '',
    short_term_goals: '',
    long_term_goals: '',
    expected_sessions: 8,
  });

  // Intervention form
  const [interventionForm, setInterventionForm] = useState({
    intervention_type: '',
    notes: '',
    outcome: '',
  });

  const handleExportLocal = () => {
    if (!sessions || sessions.length === 0) return;
    const json = exportSessionsToJSON(sessions);
    downloadLocalFile(json, `profile-${profile?.university_id}-sessions-${new Date().toISOString().split('T')[0]}.json`);
  };

  if (isLoading) {
    return (
      <PsychAccessGate>
        <DashboardLayout title="Loading...">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </PsychAccessGate>
    );
  }

  if (!profile) {
    return (
      <PsychAccessGate>
        <DashboardLayout title="Not Found">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Profile not found</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/psych-profiles')}>
              Back to Profiles
            </Button>
          </div>
        </DashboardLayout>
      </PsychAccessGate>
    );
  }

  return (
    <PsychAccessGate>
      <DashboardLayout title={profile.student_name}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/psych-profiles')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-2xl font-display font-bold">{profile.student_name}</h2>
                <p className="text-muted-foreground">ID: {profile.university_id} • {profile.faculty || 'No faculty'}</p>
              </div>
              <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>{profile.status}</Badge>
            </div>
            <Button variant="outline" onClick={handleExportLocal} disabled={!sessions?.length}>
              <Download className="h-4 w-4 mr-2" />
              Export Local
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="info" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-flex">
              <TabsTrigger value="info" className="gap-1.5">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Info</span>
              </TabsTrigger>
              <TabsTrigger value="assessment" className="gap-1.5">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Assessment</span>
              </TabsTrigger>
              <TabsTrigger value="sessions" className="gap-1.5">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Sessions</span>
              </TabsTrigger>
              <TabsTrigger value="treatment" className="gap-1.5">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Treatment</span>
              </TabsTrigger>
              <TabsTrigger value="interventions" className="gap-1.5">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Interventions</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="gap-1.5">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Tools</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Student Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <Label className="text-muted-foreground text-xs">Full Name</Label>
                      <p className="font-medium">{profile.student_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">University ID</Label>
                      <p className="font-medium">{profile.university_id}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Phone</Label>
                      <p className="font-medium">{profile.phone || '—'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Faculty</Label>
                      <p className="font-medium">{profile.faculty || '—'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Academic Year</Label>
                      <p className="font-medium">{profile.academic_year || '—'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Referral Source</Label>
                      <p className="font-medium">{profile.referral_source || '—'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Disability Type</Label>
                      <p className="font-medium">{profile.disability_type || '—'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Created</Label>
                      <p className="font-medium">{format(new Date(profile.created_at), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assessment Tab */}
            <TabsContent value="assessment">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Initial Assessments</h3>
                  <Button size="sm" onClick={() => setAssessmentDialog(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    New Assessment
                  </Button>
                </div>
                {assessments?.length === 0 ? (
                  <Card><CardContent className="py-8 text-center text-muted-foreground">No assessments recorded</CardContent></Card>
                ) : (
                  assessments?.map((a) => (
                    <Card key={a.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant={a.risk_level === 'high' ? 'destructive' : a.risk_level === 'medium' ? 'default' : 'secondary'}>
                            Risk: {a.risk_level}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{format(new Date(a.assessed_at), 'MMM dd, yyyy')}</span>
                        </div>
                        {a.assessment_scale && (
                          <p className="text-sm"><strong>{a.assessment_scale}:</strong> {a.assessment_score}</p>
                        )}
                        {a.reason_for_visit && <p className="text-sm"><strong>Reason:</strong> {a.reason_for_visit}</p>}
                        {a.main_symptoms && <p className="text-sm"><strong>Symptoms:</strong> {a.main_symptoms}</p>}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value="sessions">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Session Timeline ({sessions?.length || 0})</h3>
                  <Button size="sm" onClick={() => setSessionDialog(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Session
                  </Button>
                </div>
                {sessions?.length === 0 ? (
                  <Card><CardContent className="py-8 text-center text-muted-foreground">No sessions recorded</CardContent></Card>
                ) : (
                  <div className="space-y-3">
                    {sessions?.map((s, i) => (
                      <Card key={s.id} className="relative">
                        {i < (sessions?.length || 0) - 1 && (
                          <div className="absolute left-8 top-full w-0.5 h-3 bg-border" />
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                              <Calendar className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium">{format(new Date(s.session_date), 'EEEE, MMM dd, yyyy')}</p>
                                <Badge variant="outline">{s.session_type} • {s.duration_minutes}min</Badge>
                              </div>
                              {s.summary && <p className="text-sm text-muted-foreground mt-1">{s.summary}</p>}
                              {s.techniques_used && <p className="text-xs text-muted-foreground mt-1"><strong>Techniques:</strong> {s.techniques_used}</p>}
                              {s.homework && <p className="text-xs text-muted-foreground mt-1"><strong>Homework:</strong> {s.homework}</p>}
                              {s.improvement_rating && (
                                <div className="mt-2">
                                  <Badge variant="secondary">Improvement: {s.improvement_rating}/10</Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Treatment Plan Tab */}
            <TabsContent value="treatment">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Treatment Plans</h3>
                  <Button size="sm" onClick={() => setPlanDialog(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    New Plan
                  </Button>
                </div>
                {treatmentPlans?.length === 0 ? (
                  <Card><CardContent className="py-8 text-center text-muted-foreground">No treatment plans</CardContent></Card>
                ) : (
                  treatmentPlans?.map((p) => (
                    <Card key={p.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge>{p.plan_status}</Badge>
                          <span className="text-sm text-muted-foreground">{format(new Date(p.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                        {p.preliminary_diagnosis && <p className="text-sm"><strong>Diagnosis:</strong> {p.preliminary_diagnosis}</p>}
                        {p.therapeutic_approach && <p className="text-sm"><strong>Approach:</strong> {p.therapeutic_approach}</p>}
                        {p.short_term_goals && <p className="text-sm"><strong>Short-term Goals:</strong> {p.short_term_goals}</p>}
                        {p.long_term_goals && <p className="text-sm"><strong>Long-term Goals:</strong> {p.long_term_goals}</p>}
                        {p.expected_sessions && <p className="text-sm"><strong>Expected Sessions:</strong> {p.expected_sessions}</p>}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Interventions Tab */}
            <TabsContent value="interventions">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Intervention Log</h3>
                  <Button size="sm" onClick={() => setInterventionDialog(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Log Intervention
                  </Button>
                </div>
                {interventions?.length === 0 ? (
                  <Card><CardContent className="py-8 text-center text-muted-foreground">No interventions logged</CardContent></Card>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Outcome</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {interventions?.map((i) => (
                        <TableRow key={i.id}>
                          <TableCell>{format(new Date(i.intervention_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell><Badge variant="outline">{i.intervention_type}</Badge></TableCell>
                          <TableCell className="max-w-xs truncate">{i.notes || '—'}</TableCell>
                          <TableCell>{i.outcome || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            {/* Clinical Tools Tab */}
            <TabsContent value="tools">
              <PsychSessionTemplates sessions={sessions || []} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Add Session Dialog */}
        <Dialog open={sessionDialog} onOpenChange={setSessionDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={sessionForm.session_date} onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Input type="number" value={sessionForm.duration_minutes} onChange={(e) => setSessionForm({ ...sessionForm, duration_minutes: parseInt(e.target.value) || 50 })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={sessionForm.session_type} onValueChange={(v) => setSessionForm({ ...sessionForm, session_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="crisis">Crisis</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Summary</Label>
                <Textarea value={sessionForm.summary} onChange={(e) => setSessionForm({ ...sessionForm, summary: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Techniques Used</Label>
                <Input value={sessionForm.techniques_used} onChange={(e) => setSessionForm({ ...sessionForm, techniques_used: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Homework</Label>
                <Input value={sessionForm.homework} onChange={(e) => setSessionForm({ ...sessionForm, homework: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Private Notes</Label>
                <Textarea value={sessionForm.private_notes} onChange={(e) => setSessionForm({ ...sessionForm, private_notes: e.target.value })} rows={2} placeholder="Only visible to you" />
              </div>
              <div className="space-y-2">
                <Label>Improvement Rating (1-10)</Label>
                <Input type="number" min={1} max={10} value={sessionForm.improvement_rating} onChange={(e) => setSessionForm({ ...sessionForm, improvement_rating: parseInt(e.target.value) || 5 })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSessionDialog(false)}>Cancel</Button>
              <Button onClick={async () => { await createSession.mutateAsync(sessionForm); setSessionDialog(false); }} disabled={createSession.isPending}>
                {createSession.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Assessment Dialog */}
        <Dialog open={assessmentDialog} onOpenChange={setAssessmentDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Assessment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Reason for Visit</Label>
                <Textarea value={assessmentForm.reason_for_visit} onChange={(e) => setAssessmentForm({ ...assessmentForm, reason_for_visit: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Main Symptoms</Label>
                <Textarea value={assessmentForm.main_symptoms} onChange={(e) => setAssessmentForm({ ...assessmentForm, main_symptoms: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Problem Duration</Label>
                  <Input value={assessmentForm.problem_duration} onChange={(e) => setAssessmentForm({ ...assessmentForm, problem_duration: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Risk Level</Label>
                  <Select value={assessmentForm.risk_level} onValueChange={(v) => setAssessmentForm({ ...assessmentForm, risk_level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assessment Scale</Label>
                  <Select value={assessmentForm.assessment_scale} onValueChange={(v) => setAssessmentForm({ ...assessmentForm, assessment_scale: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PHQ-9">PHQ-9</SelectItem>
                      <SelectItem value="GAD-7">GAD-7</SelectItem>
                      <SelectItem value="BDI-II">BDI-II</SelectItem>
                      <SelectItem value="BAI">BAI</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Score</Label>
                  <Input type="number" value={assessmentForm.assessment_score} onChange={(e) => setAssessmentForm({ ...assessmentForm, assessment_score: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Psychiatric History</Label>
                <Textarea value={assessmentForm.psychiatric_history} onChange={(e) => setAssessmentForm({ ...assessmentForm, psychiatric_history: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Medication History</Label>
                <Textarea value={assessmentForm.medication_history} onChange={(e) => setAssessmentForm({ ...assessmentForm, medication_history: e.target.value })} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssessmentDialog(false)}>Cancel</Button>
              <Button onClick={async () => { await createAssessment.mutateAsync(assessmentForm); setAssessmentDialog(false); }} disabled={createAssessment.isPending}>
                {createAssessment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Assessment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Treatment Plan Dialog */}
        <Dialog open={planDialog} onOpenChange={setPlanDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Treatment Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Preliminary Diagnosis</Label>
                <Textarea value={planForm.preliminary_diagnosis} onChange={(e) => setPlanForm({ ...planForm, preliminary_diagnosis: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Therapeutic Approach</Label>
                <Input value={planForm.therapeutic_approach} onChange={(e) => setPlanForm({ ...planForm, therapeutic_approach: e.target.value })} placeholder="e.g. CBT, Supportive, Eclectic" />
              </div>
              <div className="space-y-2">
                <Label>Short-term Goals</Label>
                <Textarea value={planForm.short_term_goals} onChange={(e) => setPlanForm({ ...planForm, short_term_goals: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Long-term Goals</Label>
                <Textarea value={planForm.long_term_goals} onChange={(e) => setPlanForm({ ...planForm, long_term_goals: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Expected Sessions</Label>
                <Input type="number" value={planForm.expected_sessions} onChange={(e) => setPlanForm({ ...planForm, expected_sessions: parseInt(e.target.value) || 8 })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPlanDialog(false)}>Cancel</Button>
              <Button onClick={async () => { await createTreatmentPlan.mutateAsync(planForm); setPlanDialog(false); }} disabled={createTreatmentPlan.isPending}>
                {createTreatmentPlan.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Intervention Dialog */}
        <Dialog open={interventionDialog} onOpenChange={setInterventionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Intervention</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={interventionForm.intervention_type} onValueChange={(v) => setInterventionForm({ ...interventionForm, intervention_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone_call">Phone Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="crisis_response">Crisis Response</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={interventionForm.notes} onChange={(e) => setInterventionForm({ ...interventionForm, notes: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Outcome</Label>
                <Input value={interventionForm.outcome} onChange={(e) => setInterventionForm({ ...interventionForm, outcome: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInterventionDialog(false)}>Cancel</Button>
              <Button
                onClick={async () => { await createIntervention.mutateAsync(interventionForm); setInterventionDialog(false); }}
                disabled={createIntervention.isPending || !interventionForm.intervention_type}
              >
                {createIntervention.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </PsychAccessGate>
  );
}
