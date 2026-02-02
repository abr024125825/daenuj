import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MatchedOpportunity {
  opportunity: any;
  matchScore: number;
  matchReasons: string[];
  isAvailable: boolean;
  conflictReason?: string;
}

export function useOpportunityMatching() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['opportunity-matching', user?.id],
    queryFn: async () => {
      if (!user) return { matches: [], volunteer: null };

      // Get volunteer record with application data
      const { data: volunteer } = await supabase
        .from('volunteers')
        .select(`
          id,
          user_id,
          total_hours,
          application:volunteer_applications(
            faculty_id,
            interests,
            skills,
            major:majors(name)
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (!volunteer) return { matches: [], volunteer: null };

      // Get active semester
      const { data: activeSemester } = await supabase
        .from('academic_semesters')
        .select('id')
        .eq('is_active', true)
        .single();

      // Get volunteer's courses for availability check
      const { data: courses } = await supabase
        .from('volunteer_courses')
        .select('day_of_week, start_time, end_time')
        .eq('volunteer_id', volunteer.id)
        .eq('semester_id', activeSemester?.id || '');

      // Get volunteer's exam schedules
      const { data: exams } = await supabase
        .from('exam_schedules')
        .select('exam_date, start_time, end_time')
        .eq('volunteer_id', volunteer.id)
        .eq('semester_id', activeSemester?.id || '');

      // Get published opportunities that volunteer hasn't registered for
      const { data: registeredOps } = await supabase
        .from('opportunity_registrations')
        .select('opportunity_id')
        .eq('volunteer_id', volunteer.id);

      const registeredIds = new Set(registeredOps?.map(r => r.opportunity_id) || []);

      const { data: opportunities } = await supabase
        .from('opportunities')
        .select(`
          *,
          faculty:faculties(id, name),
          registrations:opportunity_registrations(count)
        `)
        .eq('status', 'published')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      const volunteerInterests = volunteer.application?.interests || [];
      const volunteerSkills = volunteer.application?.skills || [];
      const volunteerFacultyId = volunteer.application?.faculty_id;

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      const rawMatches = (opportunities || [])
        .filter(opp => !registeredIds.has(opp.id))
        .map(opp => {
          let matchScore = 0;
          const matchReasons: string[] = [];

          // Check faculty restriction
          if (opp.faculty_restriction) {
            if (opp.faculty_restriction === volunteerFacultyId) {
              matchScore += 30;
              matchReasons.push('Your faculty event');
            } else {
              // Not eligible for this opportunity
              return null;
            }
          }

          // Check interest match
          const targetInterests = opp.target_interests || [];
          const interestMatches = volunteerInterests.filter((i: string) => 
            targetInterests.some((ti: string) => ti.toLowerCase() === i.toLowerCase())
          );
          if (interestMatches.length > 0) {
            matchScore += Math.min(interestMatches.length * 15, 40);
            matchReasons.push(`Matches ${interestMatches.length} of your interests`);
          }

          // Check availability
          const oppDate = new Date(opp.date);
          const dayOfWeek = days[oppDate.getDay()];
          
          const hasCourseConflict = courses?.some(course => {
            if (course.day_of_week !== dayOfWeek) return false;
            return course.start_time < opp.end_time && course.end_time > opp.start_time;
          });

          const hasExamConflict = exams?.some(exam => {
            if (exam.exam_date !== opp.date) return false;
            return exam.start_time < opp.end_time && exam.end_time > opp.start_time;
          });

          const isAvailable = !hasCourseConflict && !hasExamConflict;

          if (isAvailable) {
            matchScore += 20;
            matchReasons.push('You are available');
          }

          // Check spots available
          const registeredCount = opp.registrations?.[0]?.count || 0;
          const spotsAvailable = opp.required_volunteers - registeredCount;
          if (spotsAvailable > 0) {
            matchScore += 10;
            matchReasons.push(`${spotsAvailable} spots available`);
          }

          // Base score for being published
          matchScore += 10;

          return {
            opportunity: opp,
            matchScore,
            matchReasons,
            isAvailable,
            conflictReason: hasCourseConflict ? 'Class scheduled' : hasExamConflict ? 'Exam scheduled' : undefined,
          } as MatchedOpportunity;
        });

      const matches: MatchedOpportunity[] = rawMatches
        .filter((m): m is MatchedOpportunity => m !== null)
        .sort((a, b) => b.matchScore - a.matchScore);

      return { matches, volunteer };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return {
    matches: data?.matches || [],
    volunteer: data?.volunteer,
    isLoading,
  };
}
