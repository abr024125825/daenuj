import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Calendar, FileText, Activity, ShieldAlert, BarChart3, TrendingUp, Brain, Clock, PieChart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';

function useEMRStats() {
  return useQuery({
    queryKey: ['emr-admin-stats'],
    queryFn: async () => {
      const [patientsRes, encountersRes, appointmentsRes, providersRes, screeningRes, therapyRes, diagnosesRes, riskRes] = await Promise.all([
        supabase.from('patients').select('id, status, gender, created_at', { count: 'exact', head: false }),
        supabase.from('encounters').select('id, status, clinic_type, visit_type, encounter_date, created_at', { count: 'exact', head: false }),
        supabase.from('appointments').select('id, status, appointment_type, appointment_date', { count: 'exact', head: false }),
        supabase.from('patient_provider_assignments').select('id, provider_id, is_active', { count: 'exact', head: false }),
        supabase.from('screening_results').select('id, severity_level, is_anonymous, suggested_icd_codes, created_at', { count: 'exact', head: false }),
        supabase.from('emr_therapy_sessions').select('id, session_date', { count: 'exact', head: false }),
        Promise.resolve(supabase.from('patient_diagnoses' as any).select('id, icd_code, status', { count: 'exact', head: false })).catch(() => ({ data: [] as any[], error: null })),
        supabase.from('risk_assessments').select('id, risk_level, assessed_at', { count: 'exact', head: false }),
      ]);

      const patients = patientsRes.data || [];
      const encounters = encountersRes.data || [];
      const appointments = appointmentsRes.data || [];
      const assignments = providersRes.data || [];
      const screenings = screeningRes.data || [];
      const therapySessions = therapyRes.data || [];
      const diagnoses = (diagnosesRes as any).data || [];
      const risks = riskRes.data || [];

      const activePatients = patients.filter(p => p.status === 'active').length;
      const maleCount = patients.filter(p => p.gender === 'male').length;
      const femaleCount = patients.filter(p => p.gender === 'female').length;

      const openEncounters = encounters.filter(e => e.status === 'open').length;
      const signedEncounters = encounters.filter(e => e.status === 'signed').length;

      const scheduledAppts = appointments.filter(a => a.status === 'scheduled').length;
      const completedAppts = appointments.filter(a => a.status === 'completed').length;
      const cancelledAppts = appointments.filter(a => a.status === 'cancelled').length;

      const today = new Date().toISOString().split('T')[0];
      const todayAppts = appointments.filter(a => a.appointment_date === today).length;

      const activeAssignments = assignments.filter(a => a.is_active).length;
      const uniqueProviders = new Set(assignments.filter(a => a.is_active).map(a => a.provider_id)).size;

      // Screening stats
      const anonymousScreenings = screenings.filter(s => s.is_anonymous).length;
      const registeredScreenings = screenings.filter(s => !s.is_anonymous).length;
      const severityCounts: Record<string, number> = {};
      screenings.forEach(s => {
        const level = s.severity_level || 'unknown';
        severityCounts[level] = (severityCounts[level] || 0) + 1;
      });

      // Top ICD codes from screenings
      const icdCounts: Record<string, number> = {};
      screenings.forEach(s => {
        const codes = (s.suggested_icd_codes as any[]) || [];
        codes.forEach(c => {
          const key = `${c.code}: ${c.description}`;
          icdCounts[key] = (icdCounts[key] || 0) + 1;
        });
      });
      const topICDs = Object.entries(icdCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

      // Risk assessment stats
      const highRisk = risks.filter(r => r.risk_level === 'high' || r.risk_level === 'critical').length;

      // Monthly trend
      const monthlyPatients: Record<string, number> = {};
      patients.forEach(p => {
        const month = p.created_at?.substring(0, 7);
        if (month) monthlyPatients[month] = (monthlyPatients[month] || 0) + 1;
      });
      const monthlyEncounters: Record<string, number> = {};
      encounters.forEach(e => {
        const month = e.encounter_date?.substring(0, 7);
        if (month) monthlyEncounters[month] = (monthlyEncounters[month] || 0) + 1;
      });

      // Last 6 months
      const months: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push(d.toISOString().substring(0, 7));
      }

      return {
        totalPatients: patients.length,
        activePatients,
        maleCount,
        femaleCount,
        totalEncounters: encounters.length,
        openEncounters,
        signedEncounters,
        totalAppointments: appointments.length,
        scheduledAppts,
        completedAppts,
        cancelledAppts,
        todayAppts,
        activeAssignments,
        uniqueProviders,
        totalScreenings: screenings.length,
        anonymousScreenings,
        registeredScreenings,
        severityCounts,
        topICDs,
        totalTherapySessions: therapySessions.length,
        totalDiagnoses: diagnoses.length,
        highRisk,
        totalRisks: risks.length,
        monthlyPatients,
        monthlyEncounters,
        months,
      };
    },
  });
}

export function EMRStatsPage() {
  const { data: stats, isLoading } = useEMRStats();

  if (isLoading) {
    return (
      <DashboardLayout title="EMR Statistics">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const conversionRate = stats?.totalScreenings
    ? Math.round((stats.registeredScreenings / stats.totalScreenings) * 100)
    : 0;

  return (
    <DashboardLayout title="EMR Statistics & Analytics">
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            For patient privacy, admin access is limited to aggregate statistics only. Patient names and personal details are not displayed.
          </p>
        </div>

        {/* Main Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard icon={<Users className="h-5 w-5" />} label="Total Patients" value={stats?.totalPatients || 0} sub={`${stats?.activePatients || 0} active`} />
          <StatCard icon={<FileText className="h-5 w-5" />} label="Encounters" value={stats?.totalEncounters || 0} sub={`${stats?.openEncounters || 0} open`} />
          <StatCard icon={<Calendar className="h-5 w-5" />} label="Appointments" value={stats?.totalAppointments || 0} sub={`${stats?.todayAppts || 0} today`} />
          <StatCard icon={<Activity className="h-5 w-5" />} label="Providers" value={stats?.uniqueProviders || 0} sub={`${stats?.activeAssignments || 0} assignments`} />
          <StatCard icon={<Brain className="h-5 w-5" />} label="Screenings" value={stats?.totalScreenings || 0} sub={`${conversionRate}% registered`} />
          <StatCard icon={<Clock className="h-5 w-5" />} label="Therapy Sessions" value={stats?.totalTherapySessions || 0} sub="SOAP notes" />
        </div>

        {/* Second Row - Detailed Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Demographics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <PieChart className="h-4 w-4" /> Demographics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <BarRow label="Male" value={stats?.maleCount || 0} total={stats?.totalPatients || 1} color="bg-blue-500" />
              <BarRow label="Female" value={stats?.femaleCount || 0} total={stats?.totalPatients || 1} color="bg-pink-500" />
              <BarRow label="Not Set" value={(stats?.totalPatients || 0) - (stats?.maleCount || 0) - (stats?.femaleCount || 0)} total={stats?.totalPatients || 1} color="bg-muted-foreground" />
            </CardContent>
          </Card>

          {/* Encounter Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" /> Encounter Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <BarRow label="Open" value={stats?.openEncounters || 0} total={stats?.totalEncounters || 1} color="bg-yellow-500" />
              <BarRow label="Signed" value={stats?.signedEncounters || 0} total={stats?.totalEncounters || 1} color="bg-green-500" />
              <BarRow label="Other" value={(stats?.totalEncounters || 0) - (stats?.openEncounters || 0) - (stats?.signedEncounters || 0)} total={stats?.totalEncounters || 1} color="bg-muted-foreground" />
            </CardContent>
          </Card>

          {/* Appointment Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Appointment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <BarRow label="Scheduled" value={stats?.scheduledAppts || 0} total={stats?.totalAppointments || 1} color="bg-blue-500" />
              <BarRow label="Completed" value={stats?.completedAppts || 0} total={stats?.totalAppointments || 1} color="bg-green-500" />
              <BarRow label="Cancelled" value={stats?.cancelledAppts || 0} total={stats?.totalAppointments || 1} color="bg-red-500" />
            </CardContent>
          </Card>

          {/* Risk Overview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Risk & Safety
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Assessments</span>
                <Badge variant="outline">{stats?.totalRisks || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">High/Critical Risk</span>
                <Badge variant="destructive">{stats?.highRisk || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Diagnoses</span>
                <Badge variant="secondary">{stats?.totalDiagnoses || 0}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Screening Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4" /> Screening Severity Distribution
              </CardTitle>
              <CardDescription>Results from AI-powered adaptive screening</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {['minimal', 'mild', 'moderate', 'severe'].map(level => (
                <BarRow
                  key={level}
                  label={level === 'minimal' ? 'Minimal' : level === 'mild' ? 'Mild' : level === 'moderate' ? 'Moderate' : 'Severe'}
                  value={stats?.severityCounts[level] || 0}
                  total={stats?.totalScreenings || 1}
                  color={level === 'severe' ? 'bg-red-500' : level === 'moderate' ? 'bg-orange-500' : level === 'mild' ? 'bg-yellow-500' : 'bg-green-500'}
                />
              ))}
              <div className="pt-2 border-t flex justify-between text-xs text-muted-foreground">
                <span>Anonymous: {stats?.anonymousScreenings || 0}</span>
                <span>Registered: {stats?.registeredScreenings || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Top Suggested ICD Codes
              </CardTitle>
              <CardDescription>Most common screening indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats?.topICDs && stats.topICDs.length > 0 ? (
                stats.topICDs.map(([code, count], i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground truncate max-w-[75%]">{code}</span>
                    <Badge variant="outline" className="text-xs">{count}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No screening data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Monthly Trends (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-2">
              {stats?.months.map(month => (
                <div key={month} className="text-center space-y-2">
                  <div className="space-y-1">
                    <div className="h-16 flex flex-col justify-end gap-1">
                      <div
                        className="bg-primary/80 rounded-t-sm mx-auto w-6"
                        style={{ height: `${Math.max(4, ((stats.monthlyPatients[month] || 0) / Math.max(1, ...Object.values(stats.monthlyPatients))) * 60)}px` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{month.slice(5)}</p>
                  </div>
                  <div className="text-xs font-medium">{stats.monthlyPatients[month] || 0}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">New patients per month</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-[10px] text-muted-foreground">{sub}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BarRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
