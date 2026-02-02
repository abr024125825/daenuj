import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { useVolunteerMonthlyHours } from '@/hooks/useLeaderboard';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface HoursProgressChartProps {
  volunteerId: string | undefined;
  chartType?: 'area' | 'bar';
}

const chartConfig: ChartConfig = {
  hours: {
    label: 'Monthly Hours',
    color: 'hsl(var(--primary))',
  },
  cumulative: {
    label: 'Cumulative Hours',
    color: 'hsl(var(--chart-2))',
  },
};

export function HoursProgressChart({ volunteerId, chartType = 'area' }: HoursProgressChartProps) {
  const { data: monthlyData, isLoading } = useVolunteerMonthlyHours(volunteerId);

  const stats = useMemo(() => {
    if (!monthlyData?.length) return null;
    
    const totalHours = monthlyData.reduce((sum, m) => sum + m.hours, 0);
    const avgHours = totalHours / monthlyData.length;
    const maxHours = Math.max(...monthlyData.map(m => m.hours));
    const trend = monthlyData.length >= 2 
      ? monthlyData[monthlyData.length - 1].hours - monthlyData[monthlyData.length - 2].hours 
      : 0;

    return { totalHours, avgHours, maxHours, trend };
  }, [monthlyData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Hours Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!monthlyData || monthlyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Hours Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-3 opacity-20" />
            <p>No volunteer hours data available yet</p>
            <p className="text-sm">Start participating in opportunities to see your progress!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Monthly Hours Progress
          </CardTitle>
          {stats && (
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-primary">{stats.totalHours.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Total Hours</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-primary">{stats.avgHours.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Avg/Month</div>
              </div>
              <div className="text-center">
                <div className={`font-bold ${stats.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.trend >= 0 ? '+' : ''}{stats.trend.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Trend</div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          {chartType === 'area' ? (
            <AreaChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}h`}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
              />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#hoursGradient)"
                animationDuration={1500}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#cumulativeGradient)"
                animationDuration={2000}
                animationEasing="ease-out"
              />
            </AreaChart>
          ) : (
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}h`}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
              />
              <Bar
                dataKey="hours"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </BarChart>
          )}
        </ChartContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Monthly Hours</span>
          </div>
          {chartType === 'area' && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-chart-2" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
              <span className="text-muted-foreground">Cumulative Hours</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
