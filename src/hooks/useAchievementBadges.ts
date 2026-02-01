import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AchievementBadge {
  id: string;
  volunteer_id: string;
  badge_type: string;
  semester_id: string | null;
  earned_at: string;
  hours_at_achievement: number;
  created_at: string;
}

export interface AchievementCertificate {
  id: string;
  volunteer_id: string;
  badge_id: string;
  certificate_number: string;
  achievement_type: string;
  hours_achieved: number;
  issued_at: string;
}

export function useAchievementBadges(volunteerId?: string) {
  const { data: badges, isLoading } = useQuery({
    queryKey: ['achievement-badges', volunteerId],
    queryFn: async () => {
      if (!volunteerId) return [];
      const { data, error } = await supabase
        .from('achievement_badges')
        .select(`
          *,
          semester:academic_semesters(name)
        `)
        .eq('volunteer_id', volunteerId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!volunteerId,
  });

  return { badges, isLoading };
}

export function useAchievementCertificates(volunteerId?: string) {
  const { data: certificates, isLoading } = useQuery({
    queryKey: ['achievement-certificates', volunteerId],
    queryFn: async () => {
      if (!volunteerId) return [];
      const { data, error } = await supabase
        .from('achievement_certificates')
        .select(`
          *,
          badge:achievement_badges(badge_type, semester:academic_semesters(name))
        `)
        .eq('volunteer_id', volunteerId)
        .order('issued_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!volunteerId,
  });

  return { certificates, isLoading };
}

export function useCheckAndAwardBadges() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      volunteerId,
      totalHours,
      opportunitiesCompleted,
      semesterId,
      semesterTarget,
      cumulativeTarget,
    }: {
      volunteerId: string;
      totalHours: number;
      opportunitiesCompleted: number;
      semesterId?: string;
      semesterTarget: number;
      cumulativeTarget: number;
    }) => {
      const badgesToAward: Array<{
        volunteer_id: string;
        badge_type: string;
        semester_id: string | null;
        hours_at_achievement: number;
      }> = [];

      // Check semester target
      if (semesterId && totalHours >= semesterTarget) {
        badgesToAward.push({
          volunteer_id: volunteerId,
          badge_type: 'semester_target',
          semester_id: semesterId,
          hours_at_achievement: totalHours,
        });
      }

      // Check cumulative target
      if (semesterId && totalHours >= cumulativeTarget) {
        badgesToAward.push({
          volunteer_id: volunteerId,
          badge_type: 'cumulative_target',
          semester_id: semesterId,
          hours_at_achievement: totalHours,
        });
      }

      // Check first opportunity
      if (opportunitiesCompleted >= 1) {
        badgesToAward.push({
          volunteer_id: volunteerId,
          badge_type: 'first_opportunity',
          semester_id: null,
          hours_at_achievement: totalHours,
        });
      }

      // Check 10 opportunities
      if (opportunitiesCompleted >= 10) {
        badgesToAward.push({
          volunteer_id: volunteerId,
          badge_type: 'ten_opportunities',
          semester_id: null,
          hours_at_achievement: totalHours,
        });
      }

      // Check 50 hours
      if (totalHours >= 50) {
        badgesToAward.push({
          volunteer_id: volunteerId,
          badge_type: 'fifty_hours',
          semester_id: null,
          hours_at_achievement: totalHours,
        });
      }

      // Check 100 hours
      if (totalHours >= 100) {
        badgesToAward.push({
          volunteer_id: volunteerId,
          badge_type: 'hundred_hours',
          semester_id: null,
          hours_at_achievement: totalHours,
        });
      }

      const newBadges: any[] = [];

      // Award badges and issue certificates
      for (const badge of badgesToAward) {
        const { data: existingBadge } = await supabase
          .from('achievement_badges')
          .select('id')
          .eq('volunteer_id', badge.volunteer_id)
          .eq('badge_type', badge.badge_type)
          .eq('semester_id', badge.semester_id)
          .maybeSingle();

        if (!existingBadge) {
          const { data: newBadge, error: badgeError } = await supabase
            .from('achievement_badges')
            .insert(badge)
            .select()
            .single();

          if (badgeError) throw badgeError;

          if (newBadge) {
            newBadges.push(newBadge);

            // Generate certificate number
            const certNumber = `ACH-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

            // Issue achievement certificate
            await supabase
              .from('achievement_certificates')
              .insert({
                volunteer_id: badge.volunteer_id,
                badge_id: newBadge.id,
                certificate_number: certNumber,
                achievement_type: badge.badge_type,
                hours_achieved: badge.hours_at_achievement,
              });
          }
        }
      }

      return newBadges;
    },
    onSuccess: (newBadges) => {
      if (newBadges.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['achievement-badges'] });
        queryClient.invalidateQueries({ queryKey: ['achievement-certificates'] });
        toast({
          title: '🎉 New Achievement!',
          description: `You've earned ${newBadges.length} new badge${newBadges.length > 1 ? 's' : ''}!`,
        });
      }
    },
    onError: (error: any) => {
      console.error('Error awarding badges:', error);
    },
  });
}

export function useAllAchievementBadges() {
  const { data: badges, isLoading } = useQuery({
    queryKey: ['all-achievement-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_badges')
        .select(`
          *,
          volunteer:volunteers(
            id,
            total_hours,
            application:volunteer_applications(
              first_name,
              father_name,
              family_name,
              university_id,
              faculty:faculties(name)
            )
          ),
          semester:academic_semesters(name)
        `)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return { badges, isLoading };
}
