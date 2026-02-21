import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar, Clock, Trash2, Search, Download, Loader2, Filter } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';

export function AppointmentManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['therapist-appointments', user?.id, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select('*, patients(full_name, file_number)')
        .eq('provider_id', user!.id)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['therapist-appointments'] });
      qc.invalidateQueries({ queryKey: ['today-schedule'] });
      qc.invalidateQueries({ queryKey: ['upcoming-appointments'] });
      toast({ title: 'Appointment deleted' });
      setDeleteTarget(null);
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });

  const filtered = appointments?.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.patients as any)?.full_name?.toLowerCase().includes(q) ||
      (a.patients as any)?.file_number?.toLowerCase().includes(q)
    );
  });

  const handleDownloadAll = () => {
    if (!filtered || filtered.length === 0) return;

    const rows = filtered.map(a => ({
      Date: a.appointment_date,
      Time: a.appointment_time,
      Patient: (a.patients as any)?.full_name || 'Unknown',
      FileNumber: (a.patients as any)?.file_number || '',
      Type: a.appointment_type,
      Status: a.status,
      Duration: `${a.duration_minutes} min`,
      Notes: a.notes || '',
    }));

    const headers = Object.keys(rows[0]).join(',');
    const csv = [headers, ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `appointments_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadWeekly = () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

    const weekAppts = appointments?.filter(a => {
      const d = new Date(a.appointment_date + 'T00:00:00');
      return d >= weekStart && d <= weekEnd;
    }) || [];

    // Build weekly schedule report
    let report = `Weekly Session Schedule\n`;
    report += `Week: ${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}\n`;
    report += `Generated: ${format(now, 'MMM dd, yyyy h:mm a')}\n`;
    report += `${'─'.repeat(60)}\n\n`;

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayAppts = weekAppts.filter(a => a.appointment_date === dayStr)
        .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));

      report += `${format(day, 'EEEE, MMMM dd')}\n`;
      if (dayAppts.length === 0) {
        report += `  No appointments\n`;
      } else {
        dayAppts.forEach(a => {
          report += `  ${a.appointment_time} | ${(a.patients as any)?.full_name || 'Unknown'} | ${a.appointment_type} | ${a.duration_minutes}min | ${a.status}\n`;
        });
      }
      report += `\n`;
    }

    report += `${'─'.repeat(60)}\n`;
    report += `Total appointments this week: ${weekAppts.length}\n`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weekly_schedule_${format(weekStart, 'yyyy-MM-dd')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'scheduled': return 'secondary';
      case 'confirmed': return 'default';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      case 'in_progress': return 'default';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Appointment Management
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={handleDownloadWeekly} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Weekly Report
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadAll} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patient name or file number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map(appt => (
              <div key={appt.id} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/30 transition-colors">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">
                      {(appt.patients as any)?.full_name || 'Unknown'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {(appt.patients as any)?.file_number}
                    </Badge>
                    <Badge variant={statusColor(appt.status) as any} className="text-xs capitalize">
                      {appt.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(appt.appointment_date + 'T00:00:00'), 'EEE, MMM dd yyyy')}</span>
                    <Clock className="h-3 w-3" />
                    <span>{appt.appointment_time}</span>
                    <span>·</span>
                    <span>{appt.duration_minutes} min</span>
                    <span>·</span>
                    <span className="capitalize">{appt.appointment_type?.replace('_', ' ')}</span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => setDeleteTarget(appt.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No appointments found</p>
        )}

        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this appointment? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteTarget && deleteAppointment.mutate(deleteTarget)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteAppointment.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
