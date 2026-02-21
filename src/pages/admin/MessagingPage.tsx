import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useConversations, useMessages } from '@/hooks/useMessaging';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare, Send, Plus, Search, Users, ArrowLeft, Clock, CheckCheck
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';

function formatMessageTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

function formatFullTime(dateStr: string) {
  return format(new Date(dateStr), 'h:mm a');
}

function formatDateHeader(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMMM d, yyyy');
}

/* ─── Conversation List ─── */
function ConversationList({
  conversations,
  isLoading,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
}: {
  conversations: any[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}) {
  const filtered = conversations?.filter(c =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
            No conversations yet
          </div>
        ) : (
          filtered.map(conv => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors",
                selectedId === conv.id && "bg-primary/5 border-l-2 border-l-primary"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "text-sm truncate",
                    conv.unread_count > 0 ? "font-semibold text-foreground" : "font-medium text-foreground"
                  )}>
                    {conv.title || 'Untitled'}
                  </p>
                  {conv.last_message && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {conv.last_message.content}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {conv.last_message && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatMessageTime(conv.last_message.created_at)}
                    </span>
                  )}
                  {conv.unread_count > 0 && (
                    <Badge variant="default" className="h-5 min-w-[20px] flex items-center justify-center text-[10px] px-1.5">
                      {conv.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </ScrollArea>
    </div>
  );
}

/* ─── Chat View ─── */
function ChatView({
  conversationId,
  conversationTitle,
  onBack,
}: {
  conversationId: string;
  conversationTitle: string;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, markAsRead } = useMessages(conversationId);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markAsRead();
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text) return;
    setNewMessage('');
    sendMessage.mutate(text);
  };

  // Group messages by date
  const groupedMessages: { date: string; msgs: any[] }[] = [];
  messages?.forEach(msg => {
    const date = format(new Date(msg.created_at), 'yyyy-MM-dd');
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) {
      last.msgs.push(msg);
    } else {
      groupedMessages.push({ date, msgs: [msg] });
    }
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{conversationTitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <p className="text-center text-muted-foreground text-sm py-8">Loading messages...</p>
        ) : groupedMessages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          groupedMessages.map(group => (
            <div key={group.date}>
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase">
                  {formatDateHeader(group.msgs[0].created_at)}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              {group.msgs.map(msg => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={cn("flex mb-2", isMine ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[75%] px-3.5 py-2 rounded-2xl text-sm",
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    )}>
                      {!isMine && msg.sender && (
                        <p className="text-[10px] font-semibold mb-0.5 opacity-70">
                          {msg.sender.first_name} {msg.sender.last_name}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className={cn(
                        "text-[10px] mt-1 text-right",
                        isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                      )}>
                        {formatFullTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-card">
        <form
          onSubmit={e => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <Input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sendMessage.isPending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || sendMessage.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ─── New Conversation Dialog ─── */
function NewConversationDialog({ onCreated }: { onCreated: (id: string) => void }) {
  const { user } = useAuth();
  const { createConversation } = useConversations();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [firstMessage, setFirstMessage] = useState('');
  const [search, setSearch] = useState('');

  const { data: allUsers } = useQuery({
    queryKey: ['all-profiles-messaging'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, role')
        .order('first_name');
      if (error) throw error;
      return data?.filter(p => p.user_id !== user?.id) || [];
    },
    enabled: open,
  });

  const filteredUsers = allUsers?.filter(u =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleCreate = async () => {
    if (selectedUsers.length === 0) return;

    const conv = await createConversation.mutateAsync({
      type: selectedUsers.length > 1 ? 'group' : 'direct',
      title: title || undefined,
      participantIds: selectedUsers,
    });

    // Send first message if provided
    if (firstMessage.trim() && conv?.id) {
      await supabase.from('messages').insert({
        conversation_id: conv.id,
        sender_id: user?.id,
        content: firstMessage.trim(),
      });
    }

    setOpen(false);
    setTitle('');
    setSelectedUsers([]);
    setFirstMessage('');
    setSearch('');
    if (conv?.id) onCreated(conv.id);
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> New
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Title (optional)</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Conversation title..." />
          </div>
          <div>
            <Label>Add People</Label>
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="mb-2"
            />
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedUsers.map(uid => {
                  const u = allUsers?.find(p => p.user_id === uid);
                  return (
                    <Badge key={uid} variant="secondary" className="cursor-pointer gap-1" onClick={() => toggleUser(uid)}>
                      {u?.first_name} {u?.last_name} ×
                    </Badge>
                  );
                })}
              </div>
            )}
            <ScrollArea className="h-40 border rounded-lg">
              {filteredUsers.map(u => (
                <button
                  key={u.user_id}
                  onClick={() => toggleUser(u.user_id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center justify-between",
                    selectedUsers.includes(u.user_id) && "bg-primary/5"
                  )}
                >
                  <div>
                    <p className="font-medium">{u.first_name} {u.last_name}</p>
                    <p className="text-xs text-muted-foreground">{u.role} · {u.email}</p>
                  </div>
                  {selectedUsers.includes(u.user_id) && (
                    <CheckCheck className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </ScrollArea>
          </div>
          <div>
            <Label>First Message (optional)</Label>
            <Textarea
              value={firstMessage}
              onChange={e => setFirstMessage(e.target.value)}
              placeholder="Write your first message..."
              rows={2}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={selectedUsers.length === 0 || createConversation.isPending}
            className="w-full"
          >
            {createConversation.isPending ? 'Creating...' : 'Start Conversation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Page ─── */
export function MessagingPage() {
  const { conversations, isLoading } = useConversations();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedConv = conversations?.find(c => c.id === selectedConvId);

  return (
    <DashboardLayout title="Messages">
      <div className="h-[calc(100vh-8rem)] bg-card border border-border rounded-xl overflow-hidden flex">
        {/* Left: Conversation List */}
        <div className={cn(
          "w-full lg:w-80 border-r border-border flex flex-col shrink-0",
          selectedConvId ? "hidden lg:flex" : "flex"
        )}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Conversations</h2>
            <NewConversationDialog onCreated={id => setSelectedConvId(id)} />
          </div>
          <ConversationList
            conversations={conversations || []}
            isLoading={isLoading}
            selectedId={selectedConvId}
            onSelect={setSelectedConvId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Right: Chat View */}
        <div className={cn(
          "flex-1 flex flex-col",
          !selectedConvId ? "hidden lg:flex" : "flex"
        )}>
          {selectedConvId && selectedConv ? (
            <ChatView
              conversationId={selectedConvId}
              conversationTitle={selectedConv.title || 'Conversation'}
              onBack={() => setSelectedConvId(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
