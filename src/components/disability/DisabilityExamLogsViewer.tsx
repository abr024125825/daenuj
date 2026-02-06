import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { History, Loader2, UserPlus, UserMinus, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useDisabilityExamLogs } from '@/hooks/useDisabilityExamLogs';
import { format } from 'date-fns';

const ACTION_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  volunteer_assigned: { 
    label: 'Volunteer Assigned', 
    icon: <UserPlus className="h-4 w-4" />, 
    color: 'bg-blue-500' 
  },
  assignment_confirmed: { 
    label: 'Assignment Confirmed', 
    icon: <CheckCircle className="h-4 w-4" />, 
    color: 'bg-green-500' 
  },
  assignment_completed: { 
    label: 'Assignment Completed', 
    icon: <CheckCircle className="h-4 w-4" />, 
    color: 'bg-gray-500' 
  },
  assignment_cancelled: { 
    label: 'Assignment Cancelled', 
    icon: <XCircle className="h-4 w-4" />, 
    color: 'bg-red-500' 
  },
  assignment_removed: { 
    label: 'Assignment Removed', 
    icon: <UserMinus className="h-4 w-4" />, 
    color: 'bg-orange-500' 
  },
  assignment_updated: { 
    label: 'Assignment Updated', 
    icon: <RefreshCw className="h-4 w-4" />, 
    color: 'bg-purple-500' 
  },
};

export function DisabilityExamLogsViewer() {
  const { logs, isLoading } = useDisabilityExamLogs();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Activity Logs
        </CardTitle>
        <CardDescription>
          Recent activity on disability exam assignments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!logs || logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity logs yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const actionConfig = ACTION_CONFIG[log.action] || {
                  label: log.action,
                  icon: <RefreshCw className="h-4 w-4" />,
                  color: 'bg-gray-500',
                };

                return (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm">
                        <p>{format(new Date(log.performed_at), 'MMM dd, yyyy')}</p>
                        <p className="text-muted-foreground">
                          {format(new Date(log.performed_at), 'HH:mm:ss')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${actionConfig.color} text-white gap-1`}>
                        {actionConfig.icon}
                        {actionConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {log.new_value && (
                          <pre className="text-xs bg-muted p-2 rounded max-w-md overflow-auto">
                            {JSON.stringify(log.new_value, null, 2)}
                          </pre>
                        )}
                        {log.old_value && (
                          <details className="mt-1">
                            <summary className="text-xs text-muted-foreground cursor-pointer">
                              Previous value
                            </summary>
                            <pre className="text-xs bg-muted p-2 rounded max-w-md overflow-auto mt-1">
                              {JSON.stringify(log.old_value, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
