import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Textarea } from '@/components/ui/textarea';
import {
  IdCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  RefreshCw,
  Loader2,
  KeyRound,
  ArrowLeftRight,
  FileSpreadsheet,
} from 'lucide-react';
import { useBadgeTransactions } from '@/hooks/useBadgeTransactions';
import { format } from 'date-fns';

interface BadgeManagementProps {
  opportunityId: string;
  opportunityTitle: string;
  registrations: any[];
}

export function BadgeManagement({ 
  opportunityId, 
  opportunityTitle,
  registrations 
}: BadgeManagementProps) {
  const {
    transactions,
    isLoading,
    stats,
    initializeBadges,
    adminConfirmCheckout,
    confirmReturn,
  } = useBadgeTransactions(opportunityId);

  const [activeTab, setActiveTab] = useState('pending');
  const [checkoutDialog, setCheckoutDialog] = useState<{ open: boolean; transaction: any }>({ 
    open: false, 
    transaction: null 
  });
  const [returnDialog, setReturnDialog] = useState<{ open: boolean; transaction: any }>({ 
    open: false, 
    transaction: null 
  });
  const [checkoutCondition, setCheckoutCondition] = useState<'good' | 'damaged'>('good');
  const [returnCondition, setReturnCondition] = useState<'good' | 'damaged' | 'lost'>('good');
  const [returnNotes, setReturnNotes] = useState('');

  const approvedRegistrations = registrations?.filter((r: any) => r.status === 'approved') || [];

  const handleInitializeBadges = () => {
    const regs = approvedRegistrations.map((r: any) => ({
      volunteerId: r.volunteer_id,
      registrationId: r.id,
    }));
    initializeBadges.mutate(regs);
  };

  const handleConfirmCheckout = () => {
    if (!checkoutDialog.transaction) return;
    adminConfirmCheckout.mutate({
      transactionId: checkoutDialog.transaction.id,
      condition: checkoutCondition,
    });
    setCheckoutDialog({ open: false, transaction: null });
    setCheckoutCondition('good');
  };

  const handleConfirmReturn = () => {
    if (!returnDialog.transaction) return;
    confirmReturn.mutate({
      transactionId: returnDialog.transaction.id,
      condition: returnCondition,
      notes: returnNotes,
    });
    setReturnDialog({ open: false, transaction: null });
    setReturnCondition('good');
    setReturnNotes('');
  };

  const exportToCSV = (data: any[], filename: string) => {
    const headers = ['Name', 'University ID', 'Phone', 'Status', 'Checkout Code', 'Checkout Time', 'Checkout Condition', 'Return Time', 'Return Condition', 'Notes'];
    const rows = data.map((t: any) => [
      `${t.volunteer?.application?.first_name || ''} ${t.volunteer?.application?.father_name || ''} ${t.volunteer?.application?.family_name || ''}`,
      t.volunteer?.application?.university_id || '',
      t.volunteer?.application?.phone_number || '',
      t.status,
      t.checkout_code,
      t.checkout_time ? format(new Date(t.checkout_time), 'yyyy-MM-dd HH:mm') : '',
      t.checkout_condition || '',
      t.return_time ? format(new Date(t.return_time), 'yyyy-MM-dd HH:mm') : '',
      t.return_condition || '',
      t.notes || '',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
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

  const filteredTransactions = transactions?.filter((t: any) => {
    if (activeTab === 'all') return true;
    return t.status === activeTab;
  }) || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IdCard className="h-5 w-5" />
              Badge/Vest Management
            </CardTitle>
            <CardDescription>
              Track badge checkout and return for {opportunityTitle}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleInitializeBadges}
              disabled={initializeBadges.isPending}
            >
              {initializeBadges.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Generate Codes
            </Button>
            <Button 
              variant="outline"
              onClick={() => exportToCSV(transactions || [], `badges-${opportunityTitle}`)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mt-4">
          <div className="p-3 rounded-lg bg-muted text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary text-center">
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 text-center">
            <p className="text-2xl font-bold text-primary">{stats.checkedOut}</p>
            <p className="text-xs text-muted-foreground">Checked Out</p>
          </div>
          <div className="p-3 rounded-lg bg-green-100 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.returned}</p>
            <p className="text-xs text-muted-foreground">Returned</p>
          </div>
          <div className="p-3 rounded-lg bg-destructive/10 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.lost}</p>
            <p className="text-xs text-muted-foreground">Lost</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="checked_out">Checked Out ({stats.checkedOut})</TabsTrigger>
            <TabsTrigger value="returned">Returned ({stats.returned})</TabsTrigger>
            <TabsTrigger value="lost">Lost ({stats.lost})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <IdCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transactions in this category</p>
                {stats.total === 0 && (
                  <p className="text-sm mt-2">Click "Generate Codes" to create checkout codes for approved volunteers</p>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Volunteer</TableHead>
                    <TableHead>University ID</TableHead>
                    <TableHead>Checkout Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Checkout</TableHead>
                    <TableHead>Return</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.volunteer?.application?.first_name} {transaction.volunteer?.application?.father_name} {transaction.volunteer?.application?.family_name}
                      </TableCell>
                      <TableCell className="font-mono">
                        {transaction.volunteer?.application?.university_id}
                      </TableCell>
                      <TableCell>
                        <code className="px-2 py-1 rounded bg-muted font-mono text-sm">
                          {transaction.checkout_code}
                        </code>
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        {transaction.checkout_time ? (
                          <div className="text-sm">
                            <p>{format(new Date(transaction.checkout_time), 'MMM dd, HH:mm')}</p>
                            <p className="text-muted-foreground capitalize">{transaction.checkout_condition}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.return_time ? (
                          <div className="text-sm">
                            <p>{format(new Date(transaction.return_time), 'MMM dd, HH:mm')}</p>
                            <p className="text-muted-foreground capitalize">{transaction.return_condition}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {transaction.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setCheckoutDialog({ open: true, transaction })}
                            >
                              <KeyRound className="h-3 w-3 mr-1" />
                              Checkout
                            </Button>
                          )}
                          {transaction.status === 'checked_out' && (
                            <Button
                              size="sm"
                              onClick={() => setReturnDialog({ open: true, transaction })}
                            >
                              <ArrowLeftRight className="h-3 w-3 mr-1" />
                              Return
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialog.open} onOpenChange={(open) => setCheckoutDialog({ open, transaction: open ? checkoutDialog.transaction : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Badge Checkout</DialogTitle>
            <DialogDescription>
              Confirm badge checkout for {checkoutDialog.transaction?.volunteer?.application?.first_name} {checkoutDialog.transaction?.volunteer?.application?.family_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Checkout Code</Label>
              <code className="block mt-1 px-3 py-2 rounded bg-muted font-mono text-lg">
                {checkoutDialog.transaction?.checkout_code}
              </code>
            </div>
            <div>
              <Label>Badge Condition</Label>
              <Select value={checkoutCondition} onValueChange={(v: 'good' | 'damaged') => setCheckoutCondition(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good Condition</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutDialog({ open: false, transaction: null })}>
              Cancel
            </Button>
            <Button onClick={handleConfirmCheckout} disabled={adminConfirmCheckout.isPending}>
              {adminConfirmCheckout.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnDialog.open} onOpenChange={(open) => setReturnDialog({ open, transaction: open ? returnDialog.transaction : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Badge Return</DialogTitle>
            <DialogDescription>
              Confirm badge return for {returnDialog.transaction?.volunteer?.application?.first_name} {returnDialog.transaction?.volunteer?.application?.family_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Return Condition</Label>
              <Select value={returnCondition} onValueChange={(v: 'good' | 'damaged' | 'lost') => setReturnCondition(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good Condition</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea 
                className="mt-1"
                placeholder="Add any notes about the return..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialog({ open: false, transaction: null })}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmReturn} 
              disabled={confirmReturn.isPending}
              variant={returnCondition === 'lost' ? 'destructive' : 'default'}
            >
              {confirmReturn.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {returnCondition === 'lost' ? 'Mark as Lost' : 'Confirm Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
