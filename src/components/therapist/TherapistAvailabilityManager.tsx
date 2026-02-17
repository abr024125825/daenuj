import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Loader2, Clock, CalendarOff } from 'lucide-react';
import { format } from 'date-fns';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function TherapistAvailabilityManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day_of_week: '0',
    start_time: '09:00',
    end_time: '10:00',
    slot_duration_minutes: '30',
    booking_window_days: '7',
  });
  const [leaveForm, setLeaveForm] = useState({ start_date: '', end_date: '', reason: '' });

  const { data: slots, isLoading } = useQuery({
    queryKey: ['my-availability', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('therapist_availability_slots')
        .select('*')
        .eq('provider_id', user!.id)
        .order('day_of_week')
        .order('start_time');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: leaves } = useQuery({
    queryKey: ['my-leaves', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('therapist_leaves')
        .select('*')
        .eq('provider_id', user!.id)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addSlot = useMutation({
    mutationFn: async (slot: any) => {
      const { error } = await supabase.from('therapist_availability_slots').insert({
        provider_id: user!.id,
        day_of_week: parseInt(slot.day_of_week),
        start_time: slot.start_time,
        end_time: slot.end_time,
        slot_duration_minutes: parseInt(slot.slot_duration_minutes),
        booking_window_days: parseInt(slot.booking_window_days),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-availability'] });
      toast({ title: 'Availability slot added' });
      setIsAddOpen(false);
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteSlot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('therapist_availability_slots').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-availability'] });
      toast({ title: 'Slot removed' });
    },
  });

  const toggleSlot = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('therapist_availability_slots').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-availability'] }),
  });

  const addLeave = useMutation({
    mutationFn: async (leave: any) => {
      const { error } = await supabase.from('therapist_leaves').insert({
        provider_id: user!.id,
        ...leave,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-leaves'] });
      toast({ title: 'Leave scheduled' });
      setIsLeaveOpen(false);
      setLeaveForm({ start_date: '', end_date: '', reason: '' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteLeave = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('therapist_leaves').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-leaves'] });
      toast({ title: 'Leave cancelled' });
    },
  });

  return (
    <div className="space-y-6">
      {/* Availability Slots */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                My Availability Schedule
              </CardTitle>
              <CardDescription>
                Set your available time slots for patient appointments. Patients can only book within the booking window you specify.
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Slot
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : !slots?.length ? (
            <p className="text-center text-muted-foreground py-8">No availability slots configured. Add slots to allow patients to book appointments.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Session Duration</TableHead>
                  <TableHead>Booking Window</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((slot: any) => (
                  <TableRow key={slot.id}>
                    <TableCell className="font-medium">{DAY_NAMES[slot.day_of_week]}</TableCell>
                    <TableCell>{slot.start_time}</TableCell>
                    <TableCell>{slot.end_time}</TableCell>
                    <TableCell>{slot.slot_duration_minutes} min</TableCell>
                    <TableCell>{slot.booking_window_days} days ahead</TableCell>
                    <TableCell>
                      <Switch
                        checked={slot.is_active}
                        onCheckedChange={(checked) => toggleSlot.mutate({ id: slot.id, is_active: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteSlot.mutate(slot.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Leave Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarOff className="h-5 w-5" />
                Leave / Unavailable Dates
              </CardTitle>
              <CardDescription>
                Mark dates when you are unavailable. No appointments will be bookable during these periods.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setIsLeaveOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Leave
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!leaves?.length ? (
            <p className="text-center text-muted-foreground py-4">No upcoming leaves scheduled.</p>
          ) : (
            <div className="space-y-2">
              {leaves.map((leave: any) => (
                <div key={leave.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{leave.start_date} → {leave.end_date}</span>
                    {leave.reason && <span className="text-muted-foreground ml-2">({leave.reason})</span>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteLeave.mutate(leave.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Slot Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability Slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Day of Week</Label>
              <Select value={newSlot.day_of_week} onValueChange={v => setNewSlot(s => ({ ...s, day_of_week: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAY_NAMES.map((name, i) => (
                    <SelectItem key={i} value={String(i)}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={newSlot.start_time} onChange={e => setNewSlot(s => ({ ...s, start_time: e.target.value }))} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={newSlot.end_time} onChange={e => setNewSlot(s => ({ ...s, end_time: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Session Duration (minutes)</Label>
                <Input type="number" value={newSlot.slot_duration_minutes} onChange={e => setNewSlot(s => ({ ...s, slot_duration_minutes: e.target.value }))} />
              </div>
              <div>
                <Label>Booking Window (days ahead)</Label>
                <Input type="number" value={newSlot.booking_window_days} onChange={e => setNewSlot(s => ({ ...s, booking_window_days: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={() => addSlot.mutate(newSlot)} disabled={addSlot.isPending}>
              {addSlot.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Leave Dialog */}
      <Dialog open={isLeaveOpen} onOpenChange={setIsLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={leaveForm.start_date} onChange={e => setLeaveForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={leaveForm.end_date} onChange={e => setLeaveForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Input value={leaveForm.reason} onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeaveOpen(false)}>Cancel</Button>
            <Button onClick={() => addLeave.mutate(leaveForm)} disabled={addLeave.isPending || !leaveForm.start_date || !leaveForm.end_date}>
              {addLeave.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
