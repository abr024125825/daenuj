import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ArrowLeft, Plus, Activity, Pill, Brain, FileText, ClipboardList, TestTube, ArrowRightLeft, ScrollText, Shield } from 'lucide-react';
import { usePatient, usePatientAlerts, useDiagnoses, usePatientMedications, useEncounters } from '@/hooks/useEMR';
import { EncountersTab } from '@/components/emr/EncountersTab';
import { DiagnosesTab } from '@/components/emr/DiagnosesTab';
import { MedicationsTab } from '@/components/emr/MedicationsTab';
import { TherapySessionsTab } from '@/components/emr/TherapySessionsTab';
import { RiskAssessmentsTab } from '@/components/emr/RiskAssessmentsTab';
import { LabsTab } from '@/components/emr/LabsTab';
import { ReferralsTab } from '@/components/emr/ReferralsTab';
import { DocumentsTab } from '@/components/emr/DocumentsTab';
import { AuditTrailTab } from '@/components/emr/AuditTrailTab';

function PatientSummary({ patientId }: { patientId: string }) {
  const { data: patient, isLoading } = usePatient(patientId);
  const { data: alerts } = usePatientAlerts(patientId);
  const { data: diagnoses } = useDiagnoses(patientId);
  const { data: medications } = usePatientMedications(patientId);
  const { data: encounters } = useEncounters(patientId);

  const activeDiagnoses = diagnoses?.filter(d => d.status === 'active') || [];
  const activeMeds = medications?.filter(m => m.status === 'active') || [];
  const highRiskAlerts = alerts?.filter(a => a.severity === 'high' || a.severity === 'critical') || [];
  const lastEncounter = encounters?.[0];

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!patient) return null;

  const age = patient.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="space-y-3">
      {/* Critical Alerts Bar */}
      {highRiskAlerts.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-2 flex-wrap">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <span className="font-semibold text-destructive text-sm">ALERTS:</span>
          {highRiskAlerts.map(a => (
            <Badge key={a.id} variant="destructive" className="text-xs">{a.alert_type}: {a.description}</Badge>
          ))}
        </div>
      )}

      {/* Patient Info Grid */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Full Name</p>
              <p className="font-semibold text-foreground">{patient.full_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">National ID</p>
              <p className="font-medium text-foreground">{patient.national_id}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Age / Gender</p>
              <p className="font-medium text-foreground">{age ? `${age}y` : 'N/A'} / {patient.gender === 'male' ? 'M' : patient.gender === 'female' ? 'F' : 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Marital Status</p>
              <p className="font-medium text-foreground capitalize">{patient.marital_status || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">File Number</p>
              <p className="font-medium text-foreground">{patient.file_number}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Last Visit</p>
              <p className="font-medium text-foreground">
                {lastEncounter ? new Date(lastEncounter.encounter_date).toLocaleDateString() : 'None'}
              </p>
            </div>
          </div>

          {/* Allergies, Chronic, Active Dx, Active Meds */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Allergies</p>
              <div className="flex flex-wrap gap-1">
                {(patient.allergies as string[])?.length > 0
                  ? (patient.allergies as string[]).map((a, i) => <Badge key={i} variant="destructive" className="text-xs">{a}</Badge>)
                  : <span className="text-xs text-muted-foreground">None recorded</span>}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Chronic Problems</p>
              <div className="flex flex-wrap gap-1">
                {(patient.chronic_problems as string[])?.length > 0
                  ? (patient.chronic_problems as string[]).map((c, i) => <Badge key={i} variant="outline" className="text-xs">{c}</Badge>)
                  : <span className="text-xs text-muted-foreground">None</span>}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Active Diagnoses</p>
              <div className="flex flex-wrap gap-1">
                {activeDiagnoses.length > 0
                  ? activeDiagnoses.slice(0, 3).map(d => <Badge key={d.id} variant="secondary" className="text-xs">{d.icd_code}</Badge>)
                  : <span className="text-xs text-muted-foreground">None</span>}
                {activeDiagnoses.length > 3 && <Badge variant="secondary" className="text-xs">+{activeDiagnoses.length - 3}</Badge>}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Current Medications</p>
              <div className="flex flex-wrap gap-1">
                {activeMeds.length > 0
                  ? activeMeds.slice(0, 3).map(m => <Badge key={m.id} variant="outline" className="text-xs">{m.medication_name}</Badge>)
                  : <span className="text-xs text-muted-foreground">None</span>}
                {activeMeds.length > 3 && <Badge variant="outline" className="text-xs">+{activeMeds.length - 3}</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PatientMasterFile() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { data: patient } = usePatient(patientId);

  if (!patientId) return null;

  return (
    <DashboardLayout title={patient?.full_name || 'Patient File'}>
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/emr')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Patients
        </Button>

        {/* Sticky Summary */}
        <div className="sticky top-16 z-20 bg-background pb-2">
          <PatientSummary patientId={patientId} />
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="encounters" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted p-1">
            <TabsTrigger value="encounters" className="gap-1 text-xs sm:text-sm"><ClipboardList className="h-4 w-4" /> Encounters</TabsTrigger>
            <TabsTrigger value="diagnoses" className="gap-1 text-xs sm:text-sm"><Activity className="h-4 w-4" /> Diagnoses</TabsTrigger>
            <TabsTrigger value="medications" className="gap-1 text-xs sm:text-sm"><Pill className="h-4 w-4" /> Medications</TabsTrigger>
            <TabsTrigger value="therapy" className="gap-1 text-xs sm:text-sm"><Brain className="h-4 w-4" /> Therapy</TabsTrigger>
            <TabsTrigger value="risk" className="gap-1 text-xs sm:text-sm"><AlertTriangle className="h-4 w-4" /> Risk</TabsTrigger>
            <TabsTrigger value="labs" className="gap-1 text-xs sm:text-sm"><TestTube className="h-4 w-4" /> Labs</TabsTrigger>
            <TabsTrigger value="referrals" className="gap-1 text-xs sm:text-sm"><ArrowRightLeft className="h-4 w-4" /> Referrals</TabsTrigger>
            <TabsTrigger value="documents" className="gap-1 text-xs sm:text-sm"><FileText className="h-4 w-4" /> Documents</TabsTrigger>
            <TabsTrigger value="audit" className="gap-1 text-xs sm:text-sm"><Shield className="h-4 w-4" /> Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="encounters"><EncountersTab patientId={patientId} /></TabsContent>
          <TabsContent value="diagnoses"><DiagnosesTab patientId={patientId} /></TabsContent>
          <TabsContent value="medications"><MedicationsTab patientId={patientId} /></TabsContent>
          <TabsContent value="therapy"><TherapySessionsTab patientId={patientId} /></TabsContent>
          <TabsContent value="risk"><RiskAssessmentsTab patientId={patientId} /></TabsContent>
          <TabsContent value="labs"><LabsTab patientId={patientId} /></TabsContent>
          <TabsContent value="referrals"><ReferralsTab patientId={patientId} /></TabsContent>
          <TabsContent value="documents"><DocumentsTab patientId={patientId} /></TabsContent>
          <TabsContent value="audit"><AuditTrailTab patientId={patientId} /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
