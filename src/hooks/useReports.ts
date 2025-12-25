import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useReportsData() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['reports-stats'],
    queryFn: async () => {
      const [volunteersRes, opportunitiesRes, certificatesRes, attendanceRes] = await Promise.all([
        supabase.from('volunteers').select('id, total_hours, opportunities_completed, is_active, created_at'),
        supabase.from('opportunities').select('id, status, date, required_volunteers'),
        supabase.from('certificates').select('id, hours, issued_at'),
        supabase.from('attendance').select('id, check_in_time'),
      ]);

      const volunteers = volunteersRes.data || [];
      const opportunities = opportunitiesRes.data || [];
      const certificates = certificatesRes.data || [];
      const attendance = attendanceRes.data || [];

      const totalVolunteers = volunteers.length;
      const activeVolunteers = volunteers.filter(v => v.is_active).length;
      const totalHours = volunteers.reduce((sum, v) => sum + (v.total_hours || 0), 0);
      const totalOpportunities = opportunities.length;
      const completedOpportunities = opportunities.filter(o => o.status === 'completed').length;
      const totalCertificates = certificates.length;
      const totalAttendance = attendance.length;

      return {
        totalVolunteers,
        activeVolunteers,
        totalHours,
        totalOpportunities,
        completedOpportunities,
        totalCertificates,
        totalAttendance,
      };
    },
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['reports-monthly'],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: volunteers } = await supabase
        .from('volunteers')
        .select('created_at')
        .gte('created_at', sixMonthsAgo.toISOString());

      const { data: certificates } = await supabase
        .from('certificates')
        .select('issued_at, hours')
        .gte('issued_at', sixMonthsAgo.toISOString());

      // Group by month
      const months: { [key: string]: { volunteers: number; hours: number; certificates: number } } = {};
      
      const getMonthKey = (date: string) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      };

      volunteers?.forEach(v => {
        const key = getMonthKey(v.created_at);
        if (!months[key]) months[key] = { volunteers: 0, hours: 0, certificates: 0 };
        months[key].volunteers++;
      });

      certificates?.forEach(c => {
        const key = getMonthKey(c.issued_at);
        if (!months[key]) months[key] = { volunteers: 0, hours: 0, certificates: 0 };
        months[key].hours += Number(c.hours) || 0;
        months[key].certificates++;
      });

      // Convert to array and sort
      return Object.entries(months)
        .map(([month, data]) => ({
          month,
          ...data,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
    },
  });

  const { data: facultyBreakdown, isLoading: facultyLoading } = useQuery({
    queryKey: ['reports-faculty'],
    queryFn: async () => {
      const { data } = await supabase
        .from('volunteer_applications')
        .select(`
          faculty:faculties(name)
        `)
        .eq('status', 'approved');

      const counts: { [key: string]: number } = {};
      data?.forEach(app => {
        const faculty = (app.faculty as any)?.name || 'Unknown';
        counts[faculty] = (counts[faculty] || 0) + 1;
      });

      return Object.entries(counts).map(([name, count]) => ({ name, count }));
    },
  });

  const { data: topVolunteers, isLoading: topLoading } = useQuery({
    queryKey: ['reports-top-volunteers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('volunteers')
        .select(`
          id,
          total_hours,
          opportunities_completed,
          application:volunteer_applications(first_name, family_name)
        `)
        .order('total_hours', { ascending: false })
        .limit(10);

      return data;
    },
  });

  return {
    stats,
    monthlyData,
    facultyBreakdown,
    topVolunteers,
    isLoading: statsLoading || monthlyLoading || facultyLoading || topLoading,
  };
}
