import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  target_audience: 'all' | 'active_only' | 'faculty_specific';
  target_faculty_id: string | null;
  is_pinned: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  is_read?: boolean;
}

interface Conversation {
  id: string;
  type: 'direct' | 'opportunity' | 'group';
  opportunity_id: string | null;
  title: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants?: Array<{
    user_id: string;
    last_read_at: string | null;
    profile?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  }>;
  last_message?: Message;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export function useAnnouncements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data: announcementsData, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get read statuses
      if (user) {
        const { data: reads } = await supabase
          .from('announcement_reads')
          .select('announcement_id')
          .eq('user_id', user.id);

        const readIds = new Set(reads?.map(r => r.announcement_id) || []);
        return (announcementsData as Announcement[]).map(a => ({
          ...a,
          is_read: readIds.has(a.id)
        }));
      }

      return announcementsData as Announcement[];
    },
    enabled: !!user,
  });

  const { data: allAnnouncements, isLoading: allLoading } = useQuery({
    queryKey: ['all-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Announcement[];
    },
  });

  const createAnnouncement = useMutation({
    mutationFn: async (announcement: Omit<Announcement, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'is_read'>) => {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: announcement.title,
          content: announcement.content,
          priority: announcement.priority,
          target_audience: announcement.target_audience,
          target_faculty_id: announcement.target_faculty_id,
          is_pinned: announcement.is_pinned,
          is_active: announcement.is_active,
          expires_at: announcement.expires_at,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['all-announcements'] });
      toast({ title: 'Announcement created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create announcement', description: error.message, variant: 'destructive' });
    },
  });

  const updateAnnouncement = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Announcement> & { id: string }) => {
      const { data, error } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['all-announcements'] });
      toast({ title: 'Announcement updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update announcement', description: error.message, variant: 'destructive' });
    },
  });

  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['all-announcements'] });
      toast({ title: 'Announcement deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete announcement', description: error.message, variant: 'destructive' });
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (announcementId: string) => {
      const { error } = await supabase
        .from('announcement_reads')
        .insert({
          announcement_id: announcementId,
          user_id: user?.id,
        });

      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  return {
    announcements,
    allAnnouncements,
    isLoading,
    allLoading,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    markAsRead,
    unreadCount: announcements?.filter(a => !a.is_read).length || 0,
  };
}

export function useConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner(user_id, last_read_at)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Fetch additional data for each conversation
      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conv) => {
          // Get last message
          const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          // Get unread count
          const participant = conv.conversation_participants?.find(
            (p: { user_id: string }) => p.user_id === user?.id
          );
          
          let unreadCount = 0;
          if (participant?.last_read_at) {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .gt('created_at', participant.last_read_at)
              .neq('sender_id', user?.id);
            unreadCount = count || 0;
          } else {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .neq('sender_id', user?.id);
            unreadCount = count || 0;
          }

          return {
            ...conv,
            last_message: messages?.[0] || null,
            unread_count: unreadCount,
          };
        })
      );

      return conversationsWithDetails as Conversation[];
    },
    enabled: !!user,
  });

  const createConversation = useMutation({
    mutationFn: async ({ type, title, participantIds, opportunityId }: {
      type: 'direct' | 'opportunity' | 'group';
      title?: string;
      participantIds: string[];
      opportunityId?: string;
    }) => {
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type,
          title,
          opportunity_id: opportunityId || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants (including creator)
      const allParticipants = [...new Set([...participantIds, user?.id])];
      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert(
          allParticipants.map(userId => ({
            conversation_id: conversation.id,
            user_id: userId,
          }))
        );

      if (partError) throw partError;

      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({ title: 'Conversation created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create conversation', description: error.message, variant: 'destructive' });
    },
  });

  return {
    conversations,
    isLoading,
    createConversation,
    totalUnread: conversations?.reduce((sum, c) => sum + (c.unread_count || 0), 0) || 0,
  };
}

export function useMessages(conversationId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch sender profiles
      const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      return (data || []).map(m => ({
        ...m,
        sender: profileMap.get(m.sender_id),
      })) as Message[];
    },
    enabled: !!conversationId,
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          
          // Notify if message is from someone else
          if (payload.new && (payload.new as any).sender_id !== user?.id) {
            // Trigger notification event
            window.dispatchEvent(new CustomEvent('new-message', { 
              detail: { 
                conversationId, 
                message: payload.new 
              } 
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient, user?.id]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user?.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast({ title: 'Failed to send message', description: error.message, variant: 'destructive' });
    },
  });

  const markAsRead = async () => {
    if (!user) return;
    
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  return {
    messages,
    isLoading,
    sendMessage,
    markAsRead,
  };
}

// Hook for real-time announcements subscription
export function useRealtimeAnnouncements() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('announcements-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['announcements'] });
          queryClient.invalidateQueries({ queryKey: ['all-announcements'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
