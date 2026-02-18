import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Loader2, AlertTriangle, Eye, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EMRAccessGate } from './EMRAccessGate';

function AllPatientsContent() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <DashboardLayout title="All Patient Records (Read-Only)">
      <div className="space-y-6">
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-accent" />
              <span>Read-only view — you can view all patient files but cannot make edits outside your assigned patients.</span>
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
                        <Badge variant={patient.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {patient.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/dashboard/emr/patient/${patient.id}`)}
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
