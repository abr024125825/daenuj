import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award, Clock, Target, Star } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { cn } from '@/lib/utils';

interface LeaderboardWidgetProps {
  currentVolunteerId?: string;
  limit?: number;
}

export function LeaderboardWidget({ currentVolunteerId, limit = 10 }: LeaderboardWidgetProps) {
  const { data: leaderboard, isLoading } = useLeaderboard(limit);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white border-0';
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white border-0';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Top Volunteers Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {leaderboard?.map((entry, index) => {
            const isCurrentUser = entry.id === currentVolunteerId;
            const initials = entry.volunteerName
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={entry.id}
                className={cn(
                  'flex items-center gap-4 p-4 transition-all hover:bg-muted/50',
                  isCurrentUser && 'bg-primary/5 border-l-4 border-l-primary',
                  entry.rank <= 3 && 'bg-gradient-to-r from-background to-muted/30'
                )}
                style={{
                  animation: `slideInFromLeft 0.3s ease-out ${index * 0.05}s both`,
                }}
              >
                {/* Rank */}
                <div className="flex h-10 w-10 items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Avatar */}
                <Avatar className={cn(
                  'h-10 w-10 ring-2 ring-offset-2 ring-offset-background',
                  entry.rank === 1 && 'ring-yellow-500',
                  entry.rank === 2 && 'ring-gray-400',
                  entry.rank === 3 && 'ring-amber-600',
                  entry.rank > 3 && 'ring-muted'
                )}>
                  <AvatarFallback className={cn(
                    'text-sm font-semibold',
                    entry.rank <= 3 && 'bg-primary text-primary-foreground'
                  )}>
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'font-medium truncate',
                      isCurrentUser && 'text-primary font-semibold'
                    )}>
                      {entry.volunteerName}
                    </span>
                    {isCurrentUser && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {entry.totalHours.toFixed(1)}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {entry.opportunitiesCompleted} ops
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {entry.badgesCount} badges
                    </span>
                  </div>
                </div>

                {/* Stats Badge */}
                {entry.rank <= 3 && (
                  <Badge className={getRankBadgeColor(entry.rank)}>
                    {entry.totalHours.toFixed(1)} hrs
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {(!leaderboard || leaderboard.length === 0) && (
          <div className="p-8 text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No volunteers on the leaderboard yet</p>
          </div>
        )}
      </CardContent>

      <style>{`
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </Card>
  );
}
