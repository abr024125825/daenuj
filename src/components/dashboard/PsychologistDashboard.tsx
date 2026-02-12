import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Brain,
  Calendar,
  FileText,
  ArrowRight,
  Loader2,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PsychSessionTemplates } from '@/components/psych/PsychSessionTemplates';

export function PsychologistDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['psych-profiles-count', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('psychological_profiles')
        .select('id, status');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['psych-sessions-all', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('psychological_sessions')
        .select('*')
        .order('session_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isLoading = profilesLoading || sessionsLoading;

  const totalProfiles = profiles?.length || 0;
  const activeProfiles = profiles?.filter(p => p.status === 'active').length || 0;
  const totalSessions = sessions?.length || 0;

  if (isLoading) {
    return (
      <DashboardLayout title="Psychologist Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Psychologist Dashboard">
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/psych-profiles')}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Student Profiles</p>
                  <p className="text-3xl font-bold mt-2">{totalProfiles}</p>
                  <Badge variant="secondary" className="mt-2">{activeProfiles} Active</Badge>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <p className="text-3xl font-bold mt-2">{totalSessions}</p>
                  <Badge variant="secondary" className="mt-2">Recorded</Badge>
                </div>
                <div className="p-3 rounded-xl bg-accent/10 text-accent">
                  <Brain className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Privacy</p>
                  <p className="text-lg font-bold mt-2">Protected</p>
                  <Badge variant="outline" className="mt-2">
                    <Shield className="h-3 w-3 mr-1" />
                    Confidential
                  </Badge>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Shield className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session Templates & Snippets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Session Templates & Clinical Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PsychSessionTemplates sessions={sessions || []} />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/dashboard/psych-profiles')}
              >
                <Users className="h-6 w-6 text-primary" />
                <span>View Profiles</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/dashboard/psych-profiles')}
              >
                <FileText className="h-6 w-6 text-primary" />
                <span>New Session</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => {
                  const { exportSessionsToJSON, downloadLocalFile } = require('@/lib/psychSessionTemplates');
                  if (sessions && sessions.length > 0) {
                    const json = exportSessionsToJSON(sessions);
                    downloadLocalFile(json, `psych-sessions-${new Date().toISOString().split('T')[0]}.json`);
                  }
                }}
              >
                <Calendar className="h-6 w-6 text-primary" />
                <span>Export Data</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
