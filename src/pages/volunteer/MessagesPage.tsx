import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useConversations, useMessages } from '@/hooks/useMessaging';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { MessageSquare, Send, ArrowLeft, Loader2, Users, Inbox } from 'lucide-react';
import { format } from 'date-fns';

export function VolunteerMessagesPage() {
  const { conversations, isLoading, totalUnread } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const { notify, requestNotificationPermission } = useNotificationSound();

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Listen for new message events
  useEffect(() => {
    const handleNewMessage = () => {
      notify('New Message', 'You have received a new message');
    };

    window.addEventListener('new-message', handleNewMessage as EventListener);
    return () => {
      window.removeEventListener('new-message', handleNewMessage as EventListener);
    };
  }, [notify]);

  if (isLoading) {
    return (
      <DashboardLayout title="Messages">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Messages">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              Messages
              {totalUnread > 0 && (
                <Badge variant="destructive">{totalUnread}</Badge>
              )}
            </h2>
            <p className="text-muted-foreground">View and respond to messages from administrators</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {selectedConversation ? (
              <MessageThread
                conversationId={selectedConversation}
                onBack={() => setSelectedConversation(null)}
                conversations={conversations}
              />
            ) : (
              <ConversationList
                conversations={conversations}
                onSelect={setSelectedConversation}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function ConversationList({
  conversations,
  onSelect,
}: {
  conversations: any[] | undefined;
  onSelect: (id: string) => void;
}) {
  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No messages yet</h3>
        <p className="text-muted-foreground max-w-sm">
          When administrators send you messages, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="divide-y">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => onSelect(conv.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {conv.type === 'group' ? (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                ) : (
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {conv.title?.[0]?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <p className="font-medium">{conv.title || 'Admin Message'}</p>
                  <p className="text-sm text-muted-foreground">
                    {conv.last_message?.content 
                      ? conv.last_message.content.slice(0, 50) + (conv.last_message.content.length > 50 ? '...' : '')
                      : 'No messages yet'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {conv.last_message?.created_at && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(conv.last_message.created_at), 'MMM d, h:mm a')}
                  </span>
                )}
                {conv.unread_count && conv.unread_count > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {conv.unread_count}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function MessageThread({
  conversationId,
  onBack,
  conversations,
}: {
  conversationId: string;
  onBack: () => void;
  conversations: any[] | undefined;
}) {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, markAsRead } = useMessages(conversationId);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = conversations?.find((c) => c.id === conversationId);

  // Mark as read on mount
  useEffect(() => {
    markAsRead();
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessage.mutate(newMessage);
    setNewMessage('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          {conversation?.type === 'group' ? (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
          ) : (
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {conversation?.title?.[0]?.toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <p className="font-medium">{conversation?.title || 'Admin Message'}</p>
            <p className="text-sm text-muted-foreground">
              {conversation?.participants?.length || 0} participants
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages?.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages?.map((msg: any) => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] p-3 rounded-2xl ${
                    isOwn
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-medium mb-1 opacity-70">
                      {msg.sender?.first_name} {msg.sender?.last_name}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
                    }`}
                  >
                    {format(new Date(msg.created_at), 'h:mm a')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!newMessage.trim() || sendMessage.isPending}>
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
