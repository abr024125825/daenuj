import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAnnouncements, useRealtimeAnnouncements } from '@/hooks/useMessaging';
import { useFaculties } from '@/hooks/useFaculties';
import { Megaphone, Plus, Trash2, Edit, Pin, Loader2, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

type Priority = 'low' | 'normal' | 'high' | 'urgent';
type TargetAudience = 'all' | 'active_only' | 'faculty_specific';

interface FormData {
  title: string;
  content: string;
  priority: Priority;
  target_audience: TargetAudience;
  target_faculty_id: string | null;
  is_pinned: boolean;
  is_active: boolean;
  expires_at: string | null;
}

export function AnnouncementsWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { unreadCount } = useAnnouncements();
  
  useRealtimeAnnouncements();

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          Announcements
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
          <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </Button>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <AnnouncementsSection />
        </CardContent>
      )}
    </Card>
  );
}

function AnnouncementsSection() {
  const { allAnnouncements, allLoading, createAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncements();
  const { data: faculties } = useFaculties();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    priority: 'normal',
    target_audience: 'all',
    target_faculty_id: null,
    is_pinned: false,
    is_active: true,
    expires_at: null,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      target_audience: 'all',
      target_faculty_id: null,
      is_pinned: false,
      is_active: true,
      expires_at: null,
    });
    setEditingAnnouncement(null);
  };

  const handleSubmit = () => {
    if (editingAnnouncement) {
      updateAnnouncement.mutate({ id: editingAnnouncement.id, ...formData });
    } else {
      createAnnouncement.mutate(formData);
    }
    setIsCreateOpen(false);
    resetForm();
  };

  const openEdit = (announcement: any) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      target_audience: announcement.target_audience,
      target_faculty_id: announcement.target_faculty_id || null,
      is_pinned: announcement.is_pinned,
      is_active: announcement.is_active,
      expires_at: announcement.expires_at ? announcement.expires_at.split('T')[0] : null,
    });
    setIsCreateOpen(true);
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-700',
    normal: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  if (allLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Announcement title..."
                />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your announcement..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v as Priority }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target</Label>
                  <Select 
                    value={formData.target_audience} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, target_audience: v as TargetAudience }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active_only">Active Only</SelectItem>
                      <SelectItem value="faculty_specific">Faculty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.target_audience === 'faculty_specific' && (
                <div>
                  <Label>Select Faculty</Label>
                  <Select 
                    value={formData.target_faculty_id || ''} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, target_faculty_id: v || null }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {faculties?.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_pinned}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_pinned: checked }))}
                  />
                  <Label>Pin</Label>
                </div>
                <div className="flex-1">
                  <Input
                    type="date"
                    value={formData.expires_at || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value || null }))}
                    placeholder="Expiry"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!formData.title || !formData.content}>
                {editingAnnouncement ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-2 pr-4">
          {allAnnouncements?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Megaphone className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No announcements yet</p>
            </div>
          ) : (
            allAnnouncements?.map(announcement => (
              <div 
                key={announcement.id} 
                className={`p-3 rounded-lg border ${!announcement.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {announcement.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                      <span className="font-medium text-sm truncate">{announcement.title}</span>
                      <Badge className={`${priorityColors[announcement.priority]} text-xs`}>{announcement.priority}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{announcement.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(announcement)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteAnnouncement.mutate(announcement.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
