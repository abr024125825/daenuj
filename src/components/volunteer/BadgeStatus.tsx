import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IdCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  KeyRound,
  Loader2,
  Calendar,
  MapPin,
} from 'lucide-react';
import { useVolunteerBadges } from '@/hooks/useBadgeTransactions';
import { useBadgeTransactions } from '@/hooks/useBadgeTransactions';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

interface BadgeStatusProps {
  volunteerId: string;
}

export function BadgeStatus({ volunteerId }: BadgeStatusProps) {
  const { badges, isLoading } = useVolunteerBadges(volunteerId);
  const queryClient = useQueryClient();
  const [checkoutDialog, setCheckoutDialog] = useState<{ open: boolean; badge: any }>({
    open: false,
    badge: null,
  });
  const [enteredCode, setEnteredCode] = useState('');
  const [checkoutCondition, setCheckoutCondition] = useState<'good' | 'damaged'>('good');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { confirmCheckout } = useBadgeTransactions(checkoutDialog.badge?.opportunity_id);

  const handleConfirmCheckout = async () => {
    if (!checkoutDialog.badge || !enteredCode.trim()) {
      setError('Please enter the checkout code');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await confirmCheckout.mutateAsync({
        transactionId: checkoutDialog.badge.id,
        code: enteredCode.toUpperCase(),
        condition: checkoutCondition,
      });
      
      // Invalidate volunteer badges query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['volunteer-badges', volunteerId] });
      
      setCheckoutDialog({ open: false, badge: null });
      setEnteredCode('');
      setCheckoutCondition('good');
    } catch (err: any) {
      setError(err.message || 'Failed to confirm checkout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Checkout</Badge>;
      case 'checked_out':
        return <Badge variant="default"><IdCard className="h-3 w-3 mr-1" />Checked Out</Badge>;
      case 'returned':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Returned</Badge>;
      case 'lost':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Lost</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!badges || badges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IdCard className="h-5 w-5" />
            Badge/Vest Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <IdCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No badge transactions yet</p>
            <p className="text-sm mt-2">Badges will appear here when you're assigned to an opportunity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IdCard className="h-5 w-5" />
            Badge/Vest Status
          </CardTitle>
          <CardDescription>
            Track your badge checkout and return status for volunteer opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {badges.map((badge: any) => (
            <Card key={badge.id} className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold">{badge.opportunity?.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {badge.opportunity?.date && format(new Date(badge.opportunity.date), 'MMM dd, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {badge.opportunity?.location}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(badge.status)}
                </div>

                {badge.status === 'pending' && (
                  <div className="mt-4 p-3 rounded-lg bg-muted">
                    <p className="text-sm mb-2">Enter the checkout code provided by the supervisor to confirm badge receipt:</p>
                    <Button 
                      size="sm"
                      onClick={() => setCheckoutDialog({ open: true, badge })}
                    >
                      <KeyRound className="h-4 w-4 mr-2" />
                      Enter Checkout Code
                    </Button>
                  </div>
                )}

                {badge.status === 'checked_out' && (
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Checked Out</p>
                      <p className="font-medium">
                        {badge.checkout_time && format(new Date(badge.checkout_time), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Condition</p>
                      <p className="font-medium capitalize">{badge.checkout_condition}</p>
                    </div>
                  </div>
                )}

                {(badge.status === 'returned' || badge.status === 'lost') && (
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Checked Out</p>
                      <p className="font-medium">
                        {badge.checkout_time && format(new Date(badge.checkout_time), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Returned</p>
                      <p className="font-medium">
                        {badge.return_time && format(new Date(badge.return_time), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Return Condition</p>
                      <p className={`font-medium capitalize ${badge.return_condition === 'lost' ? 'text-destructive' : ''}`}>
                        {badge.return_condition}
                      </p>
                    </div>
                    {badge.return_code && (
                      <div>
                        <p className="text-muted-foreground">Confirmation Code</p>
                        <code className="font-mono">{badge.return_code}</code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Checkout Confirmation Dialog */}
      <Dialog open={checkoutDialog.open} onOpenChange={(open) => {
        setCheckoutDialog({ open, badge: open ? checkoutDialog.badge : null });
        if (!open) {
          setEnteredCode('');
          setError('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Badge Checkout</DialogTitle>
            <DialogDescription>
              Enter the checkout code provided by the supervisor to confirm you received the badge/vest
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Checkout Code</Label>
              <Input
                className="mt-1 font-mono text-lg tracking-wider uppercase"
                placeholder="Enter 6-character code"
                value={enteredCode}
                onChange={(e) => {
                  setEnteredCode(e.target.value.toUpperCase());
                  setError('');
                }}
                maxLength={6}
              />
              {error && <p className="text-sm text-destructive mt-1">{error}</p>}
            </div>
            <div>
              <Label>Badge Condition</Label>
              <Select value={checkoutCondition} onValueChange={(v: 'good' | 'damaged') => setCheckoutCondition(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good Condition</SelectItem>
                  <SelectItem value="damaged">Damaged (Report Issue)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutDialog({ open: false, badge: null })}>
              Cancel
            </Button>
            <Button onClick={handleConfirmCheckout} disabled={isSubmitting || enteredCode.length < 6}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
