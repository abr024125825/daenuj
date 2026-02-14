import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EMRAccessGate } from './EMRAccessGate';

function PatientListContent() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Psychologists only see assigned patients; admins/coordinators see all
  const isProvider = profile?.role === 'psychologist';

  const { data: patients, isLoading } = useQuery({
    queryKey: ['my-patients', user?.id, searchTerm, isProvider],
    queryFn: async () => {
      if (isProvider) {
        // Get assigned patient IDs first
        const { data: assignments, error: aErr } = await supabase
          .from('patient_provider_assignments')
          .select('patient_id')
          .eq('provider_id', user!.id)
          .eq('is_active', true);
        if (aErr) throw aErr;
        const patientIds = assignments?.map(a => a.patient_id) || [];
        if (patientIds.length === 0) return [];

        let query = supabase.from('patients').select('*').in('id', patientIds).order('created_at', { ascending: false });
        if (searchTerm?.trim()) {
          query = query.or(`national_id.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,file_number.ilike.%${searchTerm}%`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
      } else {
        let query = supabase.from('patients').select('*').order('created_at', { ascending: false });
        if (searchTerm?.trim()) {
          query = query.or(`national_id.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,file_number.ilike.%${searchTerm}%`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
      }
    },
    enabled: !!user,
  });

  return (
    <DashboardLayout title="Patient Records">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by National ID, Name, or File Number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !patients?.length ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            {isProvider ? 'No patients assigned to you yet. Contact the clinic coordinator.' : (searchTerm ? 'No patients found matching your search' : 'No patients registered yet.')}
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {patients.map(patient => (
              <Card
                key={patient.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/dashboard/emr/patient/${patient.id}`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{patient.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {patient.file_number} · NID: {patient.national_id}
                          {patient.gender && ` · ${patient.gender === 'male' ? 'M' : 'F'}`}
                          {patient.date_of_birth && ` · DOB: ${patient.date_of_birth}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(patient.allergies as string[])?.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />Allergies
                        </Badge>
                      )}
                      <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                        {patient.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export function PatientListPage() {
  return (
    <EMRAccessGate>
      <PatientListContent />
    </EMRAccessGate>
  );
}
