import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useAnnouncements } from '@/hooks/useMessaging';
import { Megaphone, Pin, AlertCircle, ChevronRight, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';

export function AnnouncementsWidget() {
  const { announcements, isLoading, markAsRead, unreadCount } = useAnnouncements();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  const priorityColors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-700',
    normal: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  const priorityIcons: Record<string, React.ReactNode> = {
    urgent: <AlertCircle className="h-4 w-4 text-red-500" />,
    high: <AlertCircle className="h-4 w-4 text-orange-500" />,
  };

  const handleOpen = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    if (!announcement.is_read) {
      markAsRead.mutate(announcement.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Announcements
            </span>
            {unreadCount > 0 && (
              <Badge variant="default">{unreadCount} new</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {announcements?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Megaphone className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No announcements at the moment</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-2">
              <div className="space-y-2">
                {announcements?.map(announcement => (
                  <div
                    key={announcement.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                      !announcement.is_read ? 'bg-primary/5 border-primary/20' : ''
                    }`}
                    onClick={() => handleOpen(announcement)}
                  >
                    <div className="flex items-start gap-2">
                      {announcement.is_pinned && (
                        <Pin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      )}
                      {priorityIcons[announcement.priority]}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium text-sm ${!announcement.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {announcement.title}
                          </span>
                          <Badge className={`${priorityColors[announcement.priority]} text-xs`}>
                            {announcement.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {announcement.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAnnouncement?.is_pinned && <Pin className="h-5 w-5 text-primary" />}
              {selectedAnnouncement?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={priorityColors[selectedAnnouncement?.priority || 'normal']}>
                {selectedAnnouncement?.priority}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {selectedAnnouncement && format(new Date(selectedAnnouncement.created_at), 'MMMM d, yyyy')}
              </span>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{selectedAnnouncement?.content}</p>
            </div>
            {selectedAnnouncement?.expires_at && (
              <p className="text-xs text-muted-foreground">
                Expires: {format(new Date(selectedAnnouncement.expires_at), 'MMMM d, yyyy')}
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setSelectedAnnouncement(null)}>
              <Check className="h-4 w-4 mr-2" />
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
