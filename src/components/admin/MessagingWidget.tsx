import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAnnouncements, useConversations, useMessages, useRealtimeAnnouncements } from '@/hooks/useMessaging';
import { useVolunteers } from '@/hooks/useVolunteers';
import { useFaculties } from '@/hooks/useFaculties';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { Megaphone, MessageSquare, Plus, Send, Trash2, Edit, Pin, Users, Loader2, X, ChevronRight, ArrowLeft, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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

export function MessagingWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { totalUnread } = useConversations();
  const { unreadCount: announcementUnread } = useAnnouncements();
  const { notify, requestNotificationPermission } = useNotificationSound();
  
  // Enable realtime updates for announcements
  useRealtimeAnnouncements();
  
  const totalNotifications = totalUnread + announcementUnread;

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Listen for new message events
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent) => {
      notify('New Message', 'You have received a new message');
    };

    window.addEventListener('new-message', handleNewMessage as EventListener);
    return () => {
      window.removeEventListener('new-message', handleNewMessage as EventListener);
    };
  }, [notify]);

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Messaging & Announcements
          {totalNotifications > 0 && (
            <Badge variant="destructive" className="ml-2">
              {totalNotifications}
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
          <Tabs defaultValue="announcements" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="announcements" className="gap-2">
                <Megaphone className="h-4 w-4" />
                Announcements
              </TabsTrigger>
              <TabsTrigger value="messages" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Direct Messages
              </TabsTrigger>
            </TabsList>

            <TabsContent value="announcements">
              <AnnouncementsSection />
            </TabsContent>

            <TabsContent value="messages">
              <DirectMessagesSection />
            </TabsContent>
          </Tabs>
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

function DirectMessagesSection() {
  const { user } = useAuth();
  const { conversations, isLoading, createConversation } = useConversations();
  const { volunteers } = useVolunteers();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreateConversation = () => {
    if (selectedVolunteers.length === 0) return;
    
    createConversation.mutate({
      type: selectedVolunteers.length > 1 ? 'group' : 'direct',
      participantIds: selectedVolunteers,
    }, {
      onSuccess: (data) => {
        setSelectedConversation(data.id);
        setIsNewMessageOpen(false);
        setSelectedVolunteers([]);
        setSearchTerm('');
      }
    });
  };

  const filteredVolunteers = volunteers?.filter(v => {
    const app = v.application as any;
    const name = `${app?.first_name || ''} ${app?.family_name || ''}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || app?.university_id?.includes(searchTerm);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedConversation) {
    return (
      <MessageThread 
        conversationId={selectedConversation} 
        onBack={() => setSelectedConversation(null)}
        conversations={conversations}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <ScrollArea className="h-[250px] border rounded-md p-2">
                {filteredVolunteers?.map(v => {
                  const app = v.application as any;
                  const isSelected = selectedVolunteers.includes(v.user_id);
                  return (
                    <div
                      key={v.id}
                      className={`p-2 rounded cursor-pointer flex items-center justify-between mb-1 ${
                        isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                      }`}
                      onClick={() => {
                        setSelectedVolunteers(prev => 
                          isSelected 
                            ? prev.filter(id => id !== v.user_id)
                            : [...prev, v.user_id]
                        );
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {app?.first_name?.[0]}{app?.family_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{app?.first_name} {app?.family_name}</p>
                          <p className="text-xs text-muted-foreground">{app?.university_id}</p>
                        </div>
                      </div>
                      {isSelected && <Badge variant="secondary" className="text-xs">Selected</Badge>}
                    </div>
                  );
                })}
              </ScrollArea>
              {selectedVolunteers.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedVolunteers.length} selected
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsNewMessageOpen(false); setSelectedVolunteers([]); setSearchTerm(''); }}>
                Cancel
              </Button>
              <Button onClick={handleCreateConversation} disabled={selectedVolunteers.length === 0}>
                Start
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[300px]">
        {conversations?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-1 pr-4">
            {conversations?.map(conv => (
              <div
                key={conv.id}
                className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedConversation(conv.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {conv.type === 'group' ? (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                    ) : (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {conv.title?.[0] || 'C'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <p className="text-sm font-medium">{conv.title || 'Conversation'}</p>
                      <p className="text-xs text-muted-foreground">
                        {conv.participants?.length || 0} participants
                      </p>
                    </div>
                  </div>
                  {conv.unread_count && conv.unread_count > 0 && (
                    <Badge variant="default" className="text-xs">{conv.unread_count}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function MessageThread({ 
  conversationId, 
  onBack,
  conversations 
}: { 
  conversationId: string; 
  onBack: () => void;
  conversations: any[] | undefined;
}) {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, markAsRead } = useMessages(conversationId);
  const [newMessage, setNewMessage] = useState('');
  
  const conversation = conversations?.find(c => c.id === conversationId);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessage.mutate(newMessage);
    setNewMessage('');
  };

  // Mark as read on mount
  useState(() => {
    markAsRead();
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="font-medium text-sm">{conversation?.title || 'Conversation'}</p>
          <p className="text-xs text-muted-foreground">{conversation?.participants?.length || 0} participants</p>
        </div>
      </div>

      <ScrollArea className="h-[250px] border rounded-lg p-3">
        {messages?.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No messages yet
          </div>
        ) : (
          <div className="space-y-2">
            {messages?.map((msg: any) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-2 rounded-lg ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {!isOwn && (
                      <p className="text-xs font-medium mb-1">
                        {msg.sender?.first_name} {msg.sender?.last_name}
                      </p>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1"
        />
        <Button size="icon" onClick={handleSend} disabled={!newMessage.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
