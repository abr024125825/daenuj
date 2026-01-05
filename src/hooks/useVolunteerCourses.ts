import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface VolunteerCourse {
  id: string;
  volunteer_id: string;
  semester_id: string;
  course_code: string;
  course_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export function useVolunteerCourses(volunteerId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['volunteer-courses', volunteerId],
    queryFn: async () => {
      if (!volunteerId) return [];

      const { data, error } = await supabase
        .from('volunteer_courses')
        .select('*, semester:academic_semesters(*)')
        .eq('volunteer_id', volunteerId)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      return data as (VolunteerCourse & { semester: any })[];
    },
    enabled: !!volunteerId,
  });

  // Get volunteer schedule submission status
  const { data: volunteerData } = useQuery({
    queryKey: ['volunteer-schedule-status', volunteerId],
    queryFn: async () => {
      if (!volunteerId) return null;

      const { data, error } = await supabase
        .from('volunteers')
        .select('schedule_submitted_at, schedule_submitted_for_semester')
        .eq('id', volunteerId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!volunteerId,
  });

  const addCourse = useMutation({
    mutationFn: async (course: Omit<VolunteerCourse, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('volunteer_courses')
        .insert(course);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-courses', volunteerId] });
      toast({ title: 'Success', description: 'Course added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateCourse = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VolunteerCourse> & { id: string }) => {
      const { error } = await supabase
        .from('volunteer_courses')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-courses', volunteerId] });
      toast({ title: 'Success', description: 'Course updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCourse = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('volunteer_courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-courses', volunteerId] });
      toast({ title: 'Success', description: 'Course deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const clearSemesterCourses = useMutation({
    mutationFn: async (semesterId: string) => {
      if (!volunteerId) throw new Error('Volunteer ID required');

      const { error } = await supabase
        .from('volunteer_courses')
        .delete()
        .eq('volunteer_id', volunteerId)
        .eq('semester_id', semesterId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-courses', volunteerId] });
      toast({ title: 'Success', description: 'Schedule cleared for new semester' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Submit schedule (lock it)
  const submitSchedule = useMutation({
    mutationFn: async (semesterId: string) => {
      if (!volunteerId) throw new Error('Volunteer ID required');

      const { error } = await supabase
        .from('volunteers')
        .update({
          schedule_submitted_at: new Date().toISOString(),
          schedule_submitted_for_semester: semesterId,
        })
        .eq('id', volunteerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-schedule-status', volunteerId] });
      toast({ title: 'Success', description: 'Schedule submitted successfully. It is now locked.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Admin function to unlock a volunteer's schedule
  const unlockSchedule = useMutation({
    mutationFn: async () => {
      if (!volunteerId) throw new Error('Volunteer ID required');

      const { error } = await supabase
        .from('volunteers')
        .update({
          schedule_submitted_at: null,
          schedule_submitted_for_semester: null,
        })
        .eq('id', volunteerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-schedule-status', volunteerId] });
      toast({ title: 'Success', description: 'Schedule unlocked for editing' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Check if schedule is locked for a semester
  const isScheduleLocked = (semesterId: string) => {
    return volunteerData?.schedule_submitted_for_semester === semesterId;
  };

  return {
    courses,
    isLoading,
    addCourse,
    updateCourse,
    deleteCourse,
    clearSemesterCourses,
    submitSchedule,
    unlockSchedule,
    isScheduleLocked,
    scheduleSubmittedAt: volunteerData?.schedule_submitted_at,
  };
}

// Hook to get all volunteers with their availability for a specific time slot
export function useVolunteerAvailability(opportunityDate?: string, startTime?: string, endTime?: string) {
  const { data: availableVolunteers, isLoading } = useQuery({
    queryKey: ['volunteer-availability', opportunityDate, startTime, endTime],
    queryFn: async () => {
      if (!opportunityDate || !startTime || !endTime) return { available: [], unavailable: [] };

      // Get the day of week from the date
      const date = new Date(opportunityDate);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = days[date.getDay()];

      // Get active semester
      const { data: activeSemester } = await supabase
        .from('academic_semesters')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!activeSemester) {
        return { available: [], unavailable: [], noActiveSemester: true };
      }

      // Get all active volunteers with their courses for the active semester
      const { data: volunteers, error } = await supabase
        .from('volunteers')
        .select(`
          id,
          user_id,
          application:volunteer_applications(
            first_name,
            father_name,
            family_name,
            university_id,
            interests,
            phone_number,
            university_email,
            faculty:faculties(name),
            major:majors(name)
          )
        `)
        .eq('is_active', true);

      if (error) throw error;

      // Get all courses for the specific day and semester
      const { data: allCourses } = await supabase
        .from('volunteer_courses')
        .select('volunteer_id, start_time, end_time')
        .eq('semester_id', activeSemester.id)
        .eq('day_of_week', dayOfWeek);

      const coursesMap = new Map<string, Array<{ start: string; end: string }>>();
      allCourses?.forEach(course => {
        const existing = coursesMap.get(course.volunteer_id) || [];
        existing.push({ start: course.start_time, end: course.end_time });
        coursesMap.set(course.volunteer_id, existing);
      });

      const available: any[] = [];
      const unavailable: any[] = [];

      volunteers?.forEach(volunteer => {
        const courses = coursesMap.get(volunteer.id) || [];
        
        // Check if any course conflicts with the opportunity time
        const hasConflict = courses.some(course => {
          // Convert times to comparable format
          const courseStart = course.start;
          const courseEnd = course.end;
          
          // Check for overlap: course overlaps if it starts before opportunity ends AND ends after opportunity starts
          return courseStart < endTime && courseEnd > startTime;
        });

        if (hasConflict) {
          unavailable.push(volunteer);
        } else {
          available.push(volunteer);
        }
      });

      return { available, unavailable, dayOfWeek };
    },
    enabled: !!opportunityDate && !!startTime && !!endTime,
  });

  return { availableVolunteers, isLoading };
}
