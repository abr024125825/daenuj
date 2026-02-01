import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Trophy, Clock, Award, Star, Zap, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface AchievementBadge {
  id: string;
  badge_type: string;
  earned_at: string;
  hours_at_achievement: number;
}

const BADGE_CONFIG = {
  semester_target: {
    icon: Target,
    label: 'Semester Achiever',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  cumulative_target: {
    icon: Trophy,
    label: 'Cumulative Achiever',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  first_opportunity: {
    icon: Star,
    label: 'First Step',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  ten_opportunities: {
    icon: Zap,
    label: '10 Opportunities',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  fifty_hours: {
    icon: Clock,
    label: '50 Hours',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  hundred_hours: {
    icon: Award,
    label: '100 Hours',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
};

export function HoursProgressWidget() {
  const { user } = useAuth();

  // Get volunteer record with hours
  const { data: volunteer, isLoading: volunteerLoading } = useQuery({
    queryKey: ['my-volunteer-progress', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('volunteers')
        .select('id, total_hours, opportunities_completed')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Get active semester targets
  const { data: activeSemester, isLoading: semesterLoading } = useQuery({
    queryKey: ['active-semester-targets'],
    queryFn: async () => {
      const { data } = await supabase
        .from('academic_semesters')
        .select('id, name, target_volunteer_hours, cumulative_target_hours')
        .eq('is_active', true)
        .single();
      return data;
    },
  });

  // Get earned badges
  const { data: badges, isLoading: badgesLoading } = useQuery({
    queryKey: ['my-achievement-badges', volunteer?.id],
    queryFn: async () => {
      if (!volunteer?.id) return [];
      const { data } = await supabase
        .from('achievement_badges')
        .select('*')
        .eq('volunteer_id', volunteer.id)
        .order('earned_at', { ascending: false });
      return data as AchievementBadge[];
    },
    enabled: !!volunteer?.id,
  });

  // Check and award new badges automatically
  useQuery({
    queryKey: ['check-badges', volunteer?.id, volunteer?.total_hours, volunteer?.opportunities_completed],
    queryFn: async () => {
      if (!volunteer?.id || !activeSemester) return null;

      const totalHours = volunteer.total_hours || 0;
      const opportunities = volunteer.opportunities_completed || 0;
      const semesterTarget = activeSemester.target_volunteer_hours || 20;
      const cumulativeTarget = activeSemester.cumulative_target_hours || 50;

      const badgesToCheck = [];

      // Check semester target
      if (totalHours >= semesterTarget) {
        badgesToCheck.push({
          volunteer_id: volunteer.id,
          badge_type: 'semester_target',
          semester_id: activeSemester.id,
          hours_at_achievement: totalHours,
        });
      }

      // Check cumulative target
      if (totalHours >= cumulativeTarget) {
        badgesToCheck.push({
          volunteer_id: volunteer.id,
          badge_type: 'cumulative_target',
          semester_id: activeSemester.id,
          hours_at_achievement: totalHours,
        });
      }

      // Check first opportunity
      if (opportunities >= 1) {
        badgesToCheck.push({
          volunteer_id: volunteer.id,
          badge_type: 'first_opportunity',
          semester_id: null,
          hours_at_achievement: totalHours,
        });
      }

      // Check 10 opportunities
      if (opportunities >= 10) {
        badgesToCheck.push({
          volunteer_id: volunteer.id,
          badge_type: 'ten_opportunities',
          semester_id: null,
          hours_at_achievement: totalHours,
        });
      }

      // Check 50 hours
      if (totalHours >= 50) {
        badgesToCheck.push({
          volunteer_id: volunteer.id,
          badge_type: 'fifty_hours',
          semester_id: null,
          hours_at_achievement: totalHours,
        });
      }

      // Check 100 hours
      if (totalHours >= 100) {
        badgesToCheck.push({
          volunteer_id: volunteer.id,
          badge_type: 'hundred_hours',
          semester_id: null,
          hours_at_achievement: totalHours,
        });
      }

      // Insert new badges (upsert to avoid duplicates)
      for (const badge of badgesToCheck) {
        await supabase
          .from('achievement_badges')
          .upsert(badge, { onConflict: 'volunteer_id,badge_type,semester_id' })
          .select();
      }

      return badgesToCheck;
    },
    enabled: !!volunteer?.id && !!activeSemester,
    staleTime: 60 * 1000,
  });

  const isLoading = volunteerLoading || semesterLoading || badgesLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalHours = volunteer?.total_hours || 0;
  const semesterTarget = activeSemester?.target_volunteer_hours || 20;
  const cumulativeTarget = activeSemester?.cumulative_target_hours || 50;

  const semesterProgress = Math.min((totalHours / semesterTarget) * 100, 100);
  const cumulativeProgress = Math.min((totalHours / cumulativeTarget) * 100, 100);

  const semesterAchieved = totalHours >= semesterTarget;
  const cumulativeAchieved = totalHours >= cumulativeTarget;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Hours Progress
        </CardTitle>
        <CardDescription>
          Track your progress towards volunteer hour targets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Semester Target Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Semester Target</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {totalHours} / {semesterTarget} hours
              </span>
              {semesterAchieved && (
                <Badge variant="default" className="gap-1">
                  <Trophy className="h-3 w-3" />
                  Achieved!
                </Badge>
              )}
            </div>
          </div>
          <Progress value={semesterProgress} className="h-3" />
          {!semesterAchieved && (
            <p className="text-xs text-muted-foreground">
              {(semesterTarget - totalHours).toFixed(1)} more hours to reach the semester target
            </p>
          )}
        </div>

        {/* Cumulative Target Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">Cumulative Target</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {totalHours} / {cumulativeTarget} hours
              </span>
              {cumulativeAchieved && (
                <Badge variant="secondary" className="gap-1 bg-warning/10 text-warning border-warning">
                  <Award className="h-3 w-3" />
                  Achieved!
                </Badge>
              )}
            </div>
          </div>
          <Progress value={cumulativeProgress} className="h-3" />
          {!cumulativeAchieved && (
            <p className="text-xs text-muted-foreground">
              {(cumulativeTarget - totalHours).toFixed(1)} more hours to reach the cumulative target
            </p>
          )}
        </div>

        {/* Achievement Badges */}
        {badges && badges.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Earned Badges
            </p>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => {
                const config = BADGE_CONFIG[badge.badge_type as keyof typeof BADGE_CONFIG];
                if (!config) return null;
                const Icon = config.icon;
                return (
                  <Badge
                    key={badge.id}
                    variant="outline"
                    className={`gap-1 ${config.bgColor} ${config.color} border-current`}
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Next Milestones */}
        {!cumulativeAchieved && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Next Milestones</p>
            <div className="space-y-1">
              {!semesterAchieved && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Target className="h-3 w-3" />
                  Semester Target: {semesterTarget - totalHours} hours remaining
                </p>
              )}
              {totalHours < 50 && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  50 Hours Badge: {50 - totalHours} hours remaining
                </p>
              )}
              {totalHours < 100 && totalHours >= 50 && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Award className="h-3 w-3" />
                  100 Hours Badge: {100 - totalHours} hours remaining
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
