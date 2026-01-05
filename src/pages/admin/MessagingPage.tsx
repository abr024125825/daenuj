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
import { useAnnouncements, useConversations, useMessages } from '@/hooks/useMessaging';
import { useVolunteers } from '@/hooks/useVolunteers';
import { useFaculties } from '@/hooks/useFaculties';
import { useAuth } from '@/contexts/AuthContext';
import { Megaphone, MessageSquare, Plus, Send, Trash2, Edit, Pin, Users, Mail, Loader2 } from 'lucide-react';
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

export default function MessagingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messaging & Communication</h1>
          <p className="text-muted-foreground">Manage announcements and direct messages</p>
        </div>
      </div>

      <Tabs defaultValue="announcements" className="space-y-4">
        <TabsList>
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
          <AnnouncementsTab />
        </TabsContent>

        <TabsContent value="messages">
          <DirectMessagesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AnnouncementsTab() {
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
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
                  rows={4}
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
                  <Label>Target Audience</Label>
                  <Select 
                    value={formData.target_audience} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, target_audience: v as TargetAudience }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Volunteers</SelectItem>
                      <SelectItem value="active_only">Active Only</SelectItem>
                      <SelectItem value="faculty_specific">Specific Faculty</SelectItem>
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
                      <SelectValue placeholder="Select faculty..." />
                    </SelectTrigger>
                    <SelectContent>
                      {faculties?.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Expiry Date (Optional)</Label>
                <Input
                  type="date"
                  value={formData.expires_at || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value || null }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_pinned}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_pinned: checked }))}
                />
                <Label>Pin to top</Label>
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

      <div className="space-y-3">
        {allAnnouncements?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No announcements yet</p>
            </CardContent>
          </Card>
        ) : (
          allAnnouncements?.map(announcement => (
            <Card key={announcement.id} className={!announcement.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {announcement.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                      <h3 className="font-semibold truncate">{announcement.title}</h3>
                      <Badge className={priorityColors[announcement.priority]}>{announcement.priority}</Badge>
                      {!announcement.is_active && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{announcement.content}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created: {format(new Date(announcement.created_at), 'MMM d, yyyy')}</span>
                      {announcement.expires_at && (
                        <span>Expires: {format(new Date(announcement.expires_at), 'MMM d, yyyy')}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {announcement.target_audience === 'all' ? 'All volunteers' : 
                         announcement.target_audience === 'active_only' ? 'Active only' : 'Specific faculty'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(announcement)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteAnnouncement.mutate(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function DirectMessagesTab() {
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Search Volunteers</Label>
                    <Input
                      placeholder="Search by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-[300px] border rounded-md p-2">
                    {filteredVolunteers?.map(v => {
                      const app = v.application as any;
                      const isSelected = selectedVolunteers.includes(v.user_id);
                      return (
                        <div
                          key={v.id}
                          className={`p-2 rounded cursor-pointer flex items-center justify-between ${
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
                          <div>
                            <p className="font-medium">{app?.first_name} {app?.family_name}</p>
                            <p className="text-sm text-muted-foreground">{app?.university_id}</p>
                          </div>
                          {isSelected && <Badge variant="secondary">Selected</Badge>}
                        </div>
                      );
                    })}
                  </ScrollArea>
                  {selectedVolunteers.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedVolunteers.length} volunteer(s) selected
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewMessageOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateConversation} disabled={selectedVolunteers.length === 0}>
                    Start Conversation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <ScrollArea className="h-[500px]">
            {conversations?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              conversations?.map(conv => (
                <div
                  key={conv.id}
                  className={`p-3 rounded-lg cursor-pointer mb-1 ${
                    selectedConversation === conv.id ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedConversation(conv.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {conv.type === 'group' ? (
                        <Users className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">
                        {conv.title || (conv.type === 'direct' ? 'Direct Message' : 'Group Chat')}
                      </span>
                    </div>
                    {conv.unread_count ? (
                      <Badge variant="default" className="h-5 min-w-[20px] justify-center">
                        {conv.unread_count}
                      </Badge>
                    ) : null}
                  </div>
                  {conv.last_message && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {conv.last_message.content}
                    </p>
                  )}
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Message Thread */}
      <Card className="lg:col-span-2">
        {selectedConversation ? (
          <MessageThread conversationId={selectedConversation} />
        ) : (
          <CardContent className="flex flex-col items-center justify-center h-full">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Select a conversation to view messages</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function MessageThread({ conversationId }: { conversationId: string }) {
  const { messages, isLoading, sendMessage, markAsRead } = useMessages(conversationId);
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    markAsRead();
  }, [conversationId]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessage.mutate(newMessage);
    setNewMessage('');
  };

  if (isLoading) {
    return (
      <CardContent className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    );
  }

  return (
    <>
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg">Conversation</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-[calc(600px-60px)]">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages?.map(message => {
                const isOwn = message.sender_id === user?.id;
                return (
                  <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg p-3 ${
                      isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {!isOwn && message.sender && (
                        <p className="text-xs font-medium mb-1">
                          {message.sender.first_name} {message.sender.last_name}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {format(new Date(message.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            />
            <Button onClick={handleSend} disabled={!newMessage.trim() || sendMessage.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </>
  );
}
