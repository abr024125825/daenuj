import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useElection, useElectionStats } from '@/hooks/useElections';
import { BarChart3, Users, Vote, Box, TrendingUp } from 'lucide-react';

export function ElectionResultsPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const { data: election } = useElection(electionId);
  const { data: stats } = useElectionStats(electionId);

  if (!election || !stats) return <DashboardLayout title="Results"><div className="animate-pulse h-96" /></DashboardLayout>;

  return (
    <DashboardLayout title="Election Results">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Election Results: {election.name}
          </h1>
          {election.name_ar && <p className="text-muted-foreground font-cairo" dir="rtl">نتائج: {election.name_ar}</p>}
          <p className="text-xs text-muted-foreground mt-1">Auto-refreshing every 5 seconds / تحديث تلقائي كل 5 ثوانٍ</p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-3xl font-bold">{stats.totalVoters.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total Voters / إجمالي الناخبين</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Vote className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
              <div className="text-3xl font-bold text-emerald-600">{stats.totalVoted.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Checked In / تم التأشير</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-amber-600 mb-2" />
              <div className="text-3xl font-bold">{(stats.totalVoters - stats.totalVoted).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Remaining / المتبقي</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-bold text-primary">{stats.percentage}%</div>
              <p className="text-xs text-muted-foreground mt-1">Turnout / نسبة المشاركة</p>
              <Progress value={stats.percentage} className="mt-3 h-3" />
            </CardContent>
          </Card>
        </div>

        {/* Per-Box Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              Results by Box / النتائج حسب الصندوق
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.boxStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No voting boxes configured</p>
              ) : (
                stats.boxStats.map(box => (
                  <div key={box.id} className="border rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{box.name}</h3>
                        {box.name_ar && <p className="text-xs text-muted-foreground font-cairo" dir="rtl">{box.name_ar}</p>}
                        {box.location && <p className="text-xs text-muted-foreground">{box.location}</p>}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{box.percentage}%</div>
                      </div>
                    </div>
                    <Progress value={box.percentage} className="h-3 mb-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{box.voted} / {box.total} checked in</span>
                      <span>{box.total - box.voted} remaining</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
