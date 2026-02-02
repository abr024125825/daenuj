import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  id: string;
  rank: number;
  volunteerName: string;
  totalHours: number;
  opportunitiesCompleted: number;
  badgesCount: number;
  faculty: string;
}

export function useLeaderboard(limit: number = 10) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      // Get volunteers with their applications and badges
      const { data: volunteers, error } = await supabase
        .from('volunteers')
        .select(`
          id,
          total_hours,
          opportunities_completed,
          application:volunteer_applications(
            first_name,
            family_name,
            faculty:faculties(name)
          )
        `)
        .eq('is_active', true)
        .order('total_hours', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get badge counts for each volunteer
      const volunteerIds = volunteers?.map(v => v.id) || [];
      
      const { data: badgeCounts } = await supabase
        .from('achievement_badges')
        .select('volunteer_id')
        .in('volunteer_id', volunteerIds);

      // Count badges per volunteer
      const badgeCountMap: Record<string, number> = {};
      badgeCounts?.forEach(badge => {
        badgeCountMap[badge.volunteer_id] = (badgeCountMap[badge.volunteer_id] || 0) + 1;
      });

      return (volunteers || []).map((volunteer, index) => {
        const app = volunteer.application as any;
        return {
          id: volunteer.id,
          rank: index + 1,
          volunteerName: app ? `${app.first_name} ${app.family_name}` : 'Unknown',
          totalHours: Number(volunteer.total_hours) || 0,
          opportunitiesCompleted: volunteer.opportunities_completed || 0,
          badgesCount: badgeCountMap[volunteer.id] || 0,
          faculty: app?.faculty?.name || 'Unknown',
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useVolunteerMonthlyHours(volunteerId: string | undefined) {
  return useQuery({
    queryKey: ['volunteer-monthly-hours', volunteerId],
    queryFn: async () => {
      if (!volunteerId) return [];

      // Get attendance records for the volunteer over the past 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data: attendance, error } = await supabase
        .from('attendance')
        .select(`
          check_in_time,
          check_out_time,
          opportunity:opportunities(
            start_time,
            end_time
          )
        `)
        .eq('volunteer_id', volunteerId)
        .gte('check_in_time', twelveMonthsAgo.toISOString())
        .order('check_in_time', { ascending: true });

      if (error) throw error;

      // Group by month and calculate hours
      const monthlyData: Record<string, number> = {};
      
      // Initialize all months with 0
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[key] = 0;
      }

      // Calculate hours from attendance
      attendance?.forEach(record => {
        const checkIn = new Date(record.check_in_time);
        const key = `${checkIn.getFullYear()}-${String(checkIn.getMonth() + 1).padStart(2, '0')}`;
        
        if (key in monthlyData) {
          // Calculate hours from opportunity times or check-in/out
          const opp = record.opportunity as any;
          if (opp?.start_time && opp?.end_time) {
            const [startH, startM] = opp.start_time.split(':').map(Number);
            const [endH, endM] = opp.end_time.split(':').map(Number);
            const hours = (endH + endM / 60) - (startH + startM / 60);
            monthlyData[key] += Math.max(0, hours);
          } else if (record.check_out_time) {
            const checkOut = new Date(record.check_out_time);
            const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
            monthlyData[key] += Math.max(0, Math.min(hours, 12)); // Cap at 12 hours
          }
        }
      });

      // Convert to array with cumulative hours
      const result = Object.entries(monthlyData).map(([month, hours]) => {
        const [year, monthNum] = month.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return {
          month: `${monthNames[parseInt(monthNum) - 1]} ${year.slice(2)}`,
          hours: Math.round(hours * 10) / 10,
        };
      });

      // Add cumulative hours
      let cumulative = 0;
      return result.map(item => {
        cumulative += item.hours;
        return {
          ...item,
          cumulative: Math.round(cumulative * 10) / 10,
        };
      });
    },
    enabled: !!volunteerId,
    staleTime: 5 * 60 * 1000,
  });
}
