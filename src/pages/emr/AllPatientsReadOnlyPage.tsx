import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Loader2, AlertTriangle, Eye, Shield, Activity, Pill, Brain, TestTube, ArrowRightLeft, ScrollText, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EMRAccessGate } from './EMRAccessGate';
import { usePatient, usePatientAlerts, useDiagnoses, usePatientMedications, useEncounters } from '@/hooks/useEMR';

// Read-only patient detail view - no edit/add buttons
function ReadOnlyPatientView({ patientId, onBack }: { patientId: string; onBack: () => void }) {
  const { data: patient, isLoading } = usePatient(patientId);
  const { data: alerts } = usePatientAlerts(patientId);
  const { data: diagnoses } = useDiagnoses(patientId);
  const { data: medications } = usePatientMedications(patientId);
  const { data: encounters } = useEncounters(patientId);

  const { data: therapySessions } = useQuery({
    queryKey: ['therapy-sessions-ro', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emr_therapy_sessions')
        .select('*')
        .eq('patient_id', patientId)
        .order('session_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch screening data if patient has screening_session_id
  const { data: screeningData } = useQuery({
    queryKey: ['patient-screening', patientId],
    queryFn: async () => {
      const { data: pat } = await supabase.from('patients').select('screening_session_id').eq('id', patientId).single();
      if (!pat?.screening_session_id) return null;
      const { data } = await supabase.from('screening_results').select('*').eq('session_id', pat.screening_session_id).maybeSingle();
      return data;
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!patient) return <p className="text-center text-muted-foreground py-12">Patient not found</p>;

  const activeDiagnoses = diagnoses?.filter(d => d.status === 'active') || [];
  const activeMeds = medications?.filter(m => m.status === 'active') || [];

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to List
      </Button>

      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-accent" />
            <span>Read-only view — no modifications allowed.</span>
          </div>
        </CardContent>
      </Card>

      {/* Patient summary */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Full Name</p><p className="font-semibold">{patient.full_name}</p></div>
            <div><p className="text-xs text-muted-foreground">File Number</p><p className="font-medium">{patient.file_number}</p></div>
            <div><p className="text-xs text-muted-foreground">Gender</p><p className="font-medium capitalize">{patient.gender || 'N/A'}</p></div>
            <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>{patient.status}</Badge></div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="encounters" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="encounters" className="gap-1 text-xs">Encounters</TabsTrigger>
          <TabsTrigger value="diagnoses" className="gap-1 text-xs">Diagnoses</TabsTrigger>
          <TabsTrigger value="medications" className="gap-1 text-xs">Medications</TabsTrigger>
          <TabsTrigger value="therapy" className="gap-1 text-xs">Therapy</TabsTrigger>
          {screeningData && <TabsTrigger value="screening" className="gap-1 text-xs">Screening</TabsTrigger>}
        </TabsList>

        <TabsContent value="encounters">
          {!encounters?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No encounters</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {encounters.map((enc) => (
                <Card key={enc.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">#{enc.encounter_number}</Badge>
                        <span className="text-sm font-medium capitalize">{enc.clinic_type}</span>
                        <span className="text-xs text-muted-foreground">{new Date(enc.encounter_date).toLocaleDateString()}</span>
                      </div>
                      <Badge variant={enc.status === 'signed' ? 'secondary' : 'outline'} className="text-xs">{enc.status}</Badge>
                    </div>
                    {enc.chief_complaint && <p className="text-xs text-muted-foreground mt-1">CC: {enc.chief_complaint}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="diagnoses">
          {!activeDiagnoses.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No active diagnoses</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {activeDiagnoses.map(d => (
                <Card key={d.id}><CardContent className="py-3 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-mono">{d.icd_code}</Badge>
                  <span className="text-sm">{d.icd_description}</span>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="medications">
          {!activeMeds.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No active medications</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {activeMeds.map(m => (
                <Card key={m.id}><CardContent className="py-3">
                  <p className="font-medium text-sm">{m.medication_name}</p>
                  <p className="text-xs text-muted-foreground">{m.dose} · {m.frequency} · {m.route}</p>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="therapy">
          {!therapySessions?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No therapy sessions</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {therapySessions.map((s: any) => (
                <Card key={s.id}><CardContent className="py-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs">Session #{s.session_number}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(s.session_date).toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {s.subjective && <div><span className="font-semibold text-primary">S:</span> {s.subjective}</div>}
                    {s.objective && <div><span className="font-semibold text-primary">O:</span> {s.objective}</div>}
                    {s.assessment && <div><span className="font-semibold text-primary">A:</span> {s.assessment}</div>}
                    {s.plan && <div><span className="font-semibold text-primary">P:</span> {s.plan}</div>}
                  </div>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>

        {screeningData && (
          <TabsContent value="screening">
            <Card>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="font-semibold">AI Screening Results</span>
                  {(screeningData as any).severity_level && (
                    <Badge variant={(screeningData as any).severity_level === 'severe' ? 'destructive' : 'secondary'} className="text-xs capitalize">
                      {(screeningData as any).severity_level}
                    </Badge>
                  )}
                </div>
                {(screeningData as any).summary && <p className="text-sm text-foreground">{(screeningData as any).summary}</p>}
                {(screeningData as any).suggested_icd_codes?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {((screeningData as any).suggested_icd_codes as any[]).map((c: any, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{c.code} — {c.description}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function AllPatientsContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const { data: patients, isLoading } = useQuery({
    queryKey: ['all-patients-readonly', searchTerm],
    queryFn: async () => {
      let query = supabase.from('patients').select('*').order('created_at', { ascending: false });
      if (searchTerm?.trim()) {
        query = query.or(`national_id.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,file_number.ilike.%${searchTerm}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (selectedPatient) {
    return (
      <DashboardLayout title="Patient Record (Read-Only)">
        <ReadOnlyPatientView patientId={selectedPatient} onBack={() => setSelectedPatient(null)} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="All Patient Records (Read-Only)">
      <div className="space-y-6">
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-accent" />
              <span>Read-only view — you can view all patient files but cannot make any edits, add sessions, or create encounters.</span>
            </div>
          </CardContent>
        </Card>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, file number, or national ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !patients?.length ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            {searchTerm ? 'No patients matching your search.' : 'No patients registered yet.'}
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{patients.length} patient(s) found</p>
            <div className="grid gap-3">
              {patients.map(patient => (
                <Card key={patient.id} className="hover:border-primary/40 transition-colors">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{patient.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {patient.file_number}
                            {patient.national_id && ` · NID: ${patient.national_id}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={patient.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {patient.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPatient(patient.id)}
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export function AllPatientsReadOnlyPage() {
  return (
    <EMRAccessGate>
      <AllPatientsContent />
    </EMRAccessGate>
  );
}
