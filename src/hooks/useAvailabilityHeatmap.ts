import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HeatmapCell {
  day: string;
  hour: number;
  availableCount: number;
  totalCount: number;
  percentage: number;
}

export function useAvailabilityHeatmap(semesterId?: string, facultyId?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['availability-heatmap', semesterId, facultyId],
    queryFn: async () => {
      // Get active semester if not provided
      let targetSemesterId = semesterId;
      if (!targetSemesterId) {
        const { data: activeSemester } = await supabase
          .from('academic_semesters')
          .select('id')
          .eq('is_active', true)
          .single();
        targetSemesterId = activeSemester?.id;
      }

      if (!targetSemesterId) return { heatmap: [], totalVolunteers: 0 };

      // Get all active volunteers
      let volunteersQuery = supabase
        .from('volunteers')
        .select(`
          id,
          application:volunteer_applications(faculty_id)
        `)
        .eq('is_active', true);

      const { data: volunteers } = await volunteersQuery;

      // Filter by faculty if specified
      const filteredVolunteers = facultyId
        ? volunteers?.filter(v => v.application?.faculty_id === facultyId)
        : volunteers;

      const volunteerIds = filteredVolunteers?.map(v => v.id) || [];
      const totalVolunteers = volunteerIds.length;

      if (totalVolunteers === 0) return { heatmap: [], totalVolunteers: 0 };

      // Get all courses for these volunteers in the semester
      const { data: courses } = await supabase
        .from('volunteer_courses')
        .select('volunteer_id, day_of_week, start_time, end_time')
        .eq('semester_id', targetSemesterId)
        .in('volunteer_id', volunteerIds);

      // Build availability map - now considering partial hour blocks
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
      const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

      // Track busy volunteers for each hour slot (any overlap counts as busy)
      const busyMap = new Map<string, Set<string>>();

      courses?.forEach(course => {
        const startParts = course.start_time.split(':');
        const endParts = course.end_time.split(':');
        const startHour = parseInt(startParts[0]);
        const startMinute = parseInt(startParts[1] || '0');
        const endHour = parseInt(endParts[0]);
        const endMinute = parseInt(endParts[1] || '0');
        
        // For each hour slot, check if the course overlaps with ANY part of it
        // A volunteer is considered busy for an hour if they have ANY class time during that hour
        for (let h = startHour; h <= endHour; h++) {
          // Check if this hour slot has any overlap with the course
          const slotStart = h * 60; // Start of this hour in minutes
          const slotEnd = (h + 1) * 60; // End of this hour in minutes
          const courseStart = startHour * 60 + startMinute;
          const courseEnd = endHour * 60 + endMinute;
          
          // If the course overlaps with this hour slot at all, mark as busy
          if (courseStart < slotEnd && courseEnd > slotStart) {
            const key = `${course.day_of_week}-${h}`;
            if (!busyMap.has(key)) {
              busyMap.set(key, new Set());
            }
            busyMap.get(key)!.add(course.volunteer_id);
          }
        }
      });

      const heatmap: HeatmapCell[] = [];

      days.forEach(day => {
        hours.forEach(hour => {
          const key = `${day}-${hour}`;
          const busyVolunteers = busyMap.get(key)?.size || 0;
          const availableCount = totalVolunteers - busyVolunteers;
          
          heatmap.push({
            day,
            hour,
            availableCount,
            totalCount: totalVolunteers,
            percentage: Math.round((availableCount / totalVolunteers) * 100),
          });
        });
      });

      return { heatmap, totalVolunteers };
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });

  return {
    heatmap: data?.heatmap || [],
    totalVolunteers: data?.totalVolunteers || 0,
    isLoading,
  };
}
