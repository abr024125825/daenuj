import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useFacultyReportsData() {
  const { profile } = useAuth();
  const facultyId = profile?.faculty_id;

  // Faculty info
  const { data: facultyInfo, isLoading: facultyLoading } = useQuery({
    queryKey: ['faculty-report-info', facultyId],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      if (!facultyId) return null;
      const { data, error } = await supabase
        .from('faculties')
        .select('*')
        .eq('id', facultyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!facultyId,
  });

  // Comprehensive statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['faculty-report-stats', facultyId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!facultyId) return null;

      const { data: applications } = await supabase
        .from('volunteer_applications')
        .select(`
          id,
          academic_year,
          status,
          volunteers(id, total_hours, opportunities_completed, rating, is_active)
        `)
        .eq('faculty_id', facultyId);

      const approvedApps = applications?.filter(a => a.status === 'approved') || [];
      const pendingApps = applications?.filter(a => a.status === 'pending') || [];

      const totalVolunteers = approvedApps.length;
      const activeVolunteers = approvedApps.filter(a => a.volunteers?.is_active).length;
      const totalHours = approvedApps.reduce((sum, a) => sum + (a.volunteers?.total_hours || 0), 0);
      const completedOpportunities = approvedApps.reduce((sum, a) => sum + (a.volunteers?.opportunities_completed || 0), 0);
      
      const ratings = approvedApps.filter(a => a.volunteers?.rating).map(a => a.volunteers?.rating as number);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      // Academic year distribution
      const yearCounts: Record<string, number> = {};
      approvedApps.forEach(app => {
        const year = app.academic_year || 'Unknown';
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      });
      const yearDistribution = Object.entries(yearCounts)
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => a.year.localeCompare(b.year));

      return {
        totalVolunteers,
        activeVolunteers,
        totalHours,
        completedOpportunities,
        avgRating,
        pendingApplications: pendingApps.length,
        inactiveVolunteers: totalVolunteers - activeVolunteers,
        yearDistribution,
      };
    },
    enabled: !!facultyId,
  });

  // Majors distribution with volunteer count
  const { data: majorsDistribution = [], isLoading: majorsLoading } = useQuery({
    queryKey: ['faculty-majors-distribution', facultyId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!facultyId) return [];
      
      const { data: majors } = await supabase
        .from('majors')
        .select('id, name')
        .eq('faculty_id', facultyId);

      if (!majors) return [];

      const { data: applications } = await supabase
        .from('volunteer_applications')
        .select('major_id')
        .eq('faculty_id', facultyId)
        .eq('status', 'approved');

      const majorCounts: Record<string, number> = {};
      applications?.forEach(app => {
        majorCounts[app.major_id] = (majorCounts[app.major_id] || 0) + 1;
      });

      const totalCount = applications?.length || 0;
      
      return majors
        .map(major => ({
          id: major.id,
          name: major.name,
          count: majorCounts[major.id] || 0,
          percentage: totalCount > 0 ? Math.round(((majorCounts[major.id] || 0) / totalCount) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);
    },
    enabled: !!facultyId,
  });

  // Top volunteers with details
  const { data: topVolunteers = [], isLoading: topLoading } = useQuery({
    queryKey: ['faculty-top-volunteers', facultyId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!facultyId) return [];

      const { data } = await supabase
        .from('volunteer_applications')
        .select(`
          first_name,
          father_name,
          family_name,
          university_id,
          major:majors(name),
          volunteers(id, total_hours, opportunities_completed, is_active)
        `)
        .eq('faculty_id', facultyId)
        .eq('status', 'approved');

      return (data || [])
        .filter(v => v.volunteers)
        .map(v => ({
          id: v.volunteers?.id,
          name: `${v.first_name} ${v.father_name} ${v.family_name}`,
          universityId: v.university_id,
          major: (v.major as any)?.name || 'Unknown',
          hours: v.volunteers?.total_hours || 0,
          opportunities: v.volunteers?.opportunities_completed || 0,
          isActive: v.volunteers?.is_active || false,
        }))
        .sort((a, b) => b.hours - a.hours);
    },
    enabled: !!facultyId,
  });

  // Monthly trend data
  const { data: monthlyTrend = [], isLoading: trendLoading } = useQuery({
    queryKey: ['faculty-monthly-trend', facultyId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!facultyId) return [];

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: applications } = await supabase
        .from('volunteer_applications')
        .select('created_at, volunteers(total_hours)')
        .eq('faculty_id', facultyId)
        .eq('status', 'approved')
        .gte('created_at', sixMonthsAgo.toISOString());

      const monthData: Record<string, { volunteers: number; hours: number }> = {};
      
      applications?.forEach(app => {
        const date = new Date(app.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthData[key]) {
          monthData[key] = { volunteers: 0, hours: 0 };
        }
        monthData[key].volunteers++;
        monthData[key].hours += (app.volunteers as any)?.total_hours || 0;
      });

      return Object.entries(monthData)
        .map(([month, data]) => ({
          month,
          monthLabel: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          ...data,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
    },
    enabled: !!facultyId,
  });

  // All volunteers list for export
  const { data: allVolunteers = [], isLoading: allVolunteersLoading } = useQuery({
    queryKey: ['faculty-all-volunteers', facultyId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!facultyId) return [];

      const { data } = await supabase
        .from('volunteer_applications')
        .select(`
          first_name,
          father_name,
          family_name,
          university_id,
          major:majors(name),
          volunteers(id, total_hours, opportunities_completed, is_active)
        `)
        .eq('faculty_id', facultyId)
        .eq('status', 'approved');

      return (data || [])
        .filter(v => v.volunteers)
        .map(v => ({
          name: `${v.first_name} ${v.father_name} ${v.family_name}`,
          universityId: v.university_id,
          major: (v.major as any)?.name || 'Unknown',
          hours: v.volunteers?.total_hours || 0,
          status: v.volunteers?.is_active ? 'Active' : 'Inactive',
        }));
    },
    enabled: !!facultyId,
  });

  return {
    facultyInfo,
    stats,
    majorsDistribution,
    topVolunteers,
    monthlyTrend,
    allVolunteers,
    isLoading: facultyLoading || statsLoading || majorsLoading || topLoading || trendLoading || allVolunteersLoading,
  };
}
