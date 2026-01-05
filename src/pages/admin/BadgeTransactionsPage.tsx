import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  IdCard,
  Search,
  Download,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Calendar,
  MapPin,
  X,
  Trash2,
} from 'lucide-react';
import { useAllBadgeTransactions } from '@/hooks/useAllBadgeTransactions';
import { format } from 'date-fns';

export function BadgeTransactionsPage() {
  const { transactions, isLoading, stats, opportunities, refetch, deleteTransaction } = useAllBadgeTransactions();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [opportunityFilter, setOpportunityFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter(t => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const volunteerName = `${t.volunteer?.application?.first_name || ''} ${t.volunteer?.application?.father_name || ''} ${t.volunteer?.application?.family_name || ''}`.toLowerCase();
        const universityId = t.volunteer?.application?.university_id?.toLowerCase() || '';
        const opportunityTitle = t.opportunity?.title?.toLowerCase() || '';
        const checkoutCode = t.checkout_code?.toLowerCase() || '';
        
        if (!volunteerName.includes(query) && 
            !universityId.includes(query) && 
            !opportunityTitle.includes(query) &&
            !checkoutCode.includes(query)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && t.status !== statusFilter) {
        return false;
      }

      // Opportunity filter
      if (opportunityFilter !== 'all' && t.opportunity_id !== opportunityFilter) {
        return false;
      }

      // Condition filter
      if (conditionFilter !== 'all') {
        if (conditionFilter === 'damaged') {
          if (t.checkout_condition !== 'damaged' && t.return_condition !== 'damaged') {
            return false;
          }
        } else if (conditionFilter === 'good') {
          if (t.checkout_condition !== 'good' && t.return_condition !== 'good') {
            return false;
          }
        }
      }

      // Date filter
      if (dateFrom) {
        const transactionDate = new Date(t.created_at);
        if (transactionDate < new Date(dateFrom)) {
          return false;
        }
      }
      if (dateTo) {
        const transactionDate = new Date(t.created_at);
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        if (transactionDate > endDate) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, searchQuery, statusFilter, opportunityFilter, conditionFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setOpportunityFilter('all');
    setConditionFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || opportunityFilter !== 'all' || conditionFilter !== 'all' || dateFrom || dateTo;

  const handleDeleteTransaction = async () => {
    if (!selectedTransactionId) return;
    await deleteTransaction.mutateAsync(selectedTransactionId);
    setDeleteDialogOpen(false);
    setSelectedTransactionId(null);
  };

  const exportToCSV = () => {
    const headers = [
      'Volunteer Name',
      'University ID',
      'Phone',
      'Email',
      'Opportunity',
      'Opportunity Date',
      'Location',
      'Checkout Code',
      'Status',
      'Checkout Time',
      'Checkout Condition',
      'Return Time',
      'Return Condition',
      'Return Code',
      'Notes',
    ];
    
    const rows = filteredTransactions.map(t => [
      `${t.volunteer?.application?.first_name || ''} ${t.volunteer?.application?.father_name || ''} ${t.volunteer?.application?.family_name || ''}`,
      t.volunteer?.application?.university_id || '',
      t.volunteer?.application?.phone_number || '',
      t.volunteer?.application?.university_email || '',
      t.opportunity?.title || '',
      t.opportunity?.date || '',
      t.opportunity?.location || '',
      t.checkout_code,
      t.status,
      t.checkout_time ? format(new Date(t.checkout_time), 'yyyy-MM-dd HH:mm') : '',
      t.checkout_condition || '',
      t.return_time ? format(new Date(t.return_time), 'yyyy-MM-dd HH:mm') : '',
      t.return_condition || '',
      t.return_code || '',
      t.notes || '',
    ]);

    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `badge-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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

  const getConditionBadge = (condition: string | null) => {
    if (!condition) return null;
    switch (condition) {
      case 'good':
        return <Badge variant="outline" className="text-green-600 border-green-600">Good</Badge>;
      case 'damaged':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Damaged</Badge>;
      case 'lost':
        return <Badge variant="destructive">Lost</Badge>;
      default:
        return <Badge variant="secondary">{condition}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Badge Transactions">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Badge Transactions">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-muted-foreground">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{stats.checkedOut}</p>
              <p className="text-sm text-muted-foreground">Checked Out</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.returned}</p>
              <p className="text-sm text-muted-foreground">Returned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-destructive">{stats.lost}</p>
              <p className="text-sm text-muted-foreground">Lost</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{stats.damaged}</p>
              <p className="text-sm text-muted-foreground">Damaged</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <Label>Search</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Name, ID, opportunity, or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="checked_out">Checked Out</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Opportunity Filter */}
              <div>
                <Label>Opportunity</Label>
                <Select value={opportunityFilter} onValueChange={setOpportunityFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Opportunities</SelectItem>
                    {opportunities.map((opp: any) => (
                      <SelectItem key={opp.id} value={opp.id}>
                        {opp.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  className="mt-1"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              {/* Date To */}
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  className="mt-1"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <IdCard className="h-5 w-5" />
                Badge Transactions
              </CardTitle>
              <Badge variant="secondary">
                {filteredTransactions.length} of {stats.total} transactions
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <IdCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No badge transactions found</p>
                {hasActiveFilters && (
                  <Button variant="link" size="sm" onClick={clearFilters}>
                    Clear filters to see all transactions
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Volunteer</TableHead>
                      <TableHead>University ID</TableHead>
                      <TableHead>Opportunity</TableHead>
                      <TableHead>Checkout Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Checkout</TableHead>
                      <TableHead>Return</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>
                              {transaction.volunteer?.application?.first_name}{' '}
                              {transaction.volunteer?.application?.father_name}{' '}
                              {transaction.volunteer?.application?.family_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {transaction.volunteer?.application?.phone_number}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {transaction.volunteer?.application?.university_id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.opportunity?.title}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {transaction.opportunity?.date && format(new Date(transaction.opportunity.date), 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="px-2 py-1 rounded bg-muted font-mono text-sm">
                            {transaction.checkout_code}
                          </code>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell>
                          {transaction.checkout_time ? (
                            <div className="text-sm">
                              <p>{format(new Date(transaction.checkout_time), 'MMM dd, HH:mm')}</p>
                              {getConditionBadge(transaction.checkout_condition)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {transaction.return_time ? (
                            <div className="text-sm">
                              <p>{format(new Date(transaction.return_time), 'MMM dd, HH:mm')}</p>
                              {getConditionBadge(transaction.return_condition)}
                              {transaction.return_code && (
                                <code className="block mt-1 text-xs text-muted-foreground">
                                  {transaction.return_code}
                                </code>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground max-w-32 truncate">
                            {transaction.notes || '-'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedTransactionId(transaction.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Badge Transaction</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this badge transaction? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTransaction}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
