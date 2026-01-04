import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Shield, Search, Loader2, BarChart3, Eye, Clock, TrendingUp, Calendar } from 'lucide-react';
import { useCertificateVerifications } from '@/hooks/useCertificateVerifications';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

export function CertificateVerificationsPage() {
  const { verifications, isLoading } = useCertificateVerifications();
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate statistics
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const weekAgo = subDays(today, 7);
  const monthAgo = subDays(today, 30);

  const todayCount = verifications?.filter((v) => 
    isWithinInterval(new Date(v.verified_at), { start: todayStart, end: todayEnd })
  ).length || 0;

  const weekCount = verifications?.filter((v) => 
    new Date(v.verified_at) >= weekAgo
  ).length || 0;

  const monthCount = verifications?.filter((v) => 
    new Date(v.verified_at) >= monthAgo
  ).length || 0;

  // Get unique certificates verified
  const uniqueCertificates = new Set(verifications?.map(v => v.certificate_id)).size;

  // Filter verifications
  const filteredVerifications = verifications?.filter((v) => {
    const certNumber = v.certificate?.certificate_number || '';
    const volunteerName = `${v.certificate?.volunteer?.application?.first_name || ''} ${v.certificate?.volunteer?.application?.family_name || ''}`;
    const opportunityTitle = v.certificate?.opportunity?.title || '';
    
    return certNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
           volunteerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           opportunityTitle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Group verifications by certificate for most verified
  const certVerificationCounts = verifications?.reduce((acc: Record<string, { count: number; certNumber: string; volunteerName: string }>, v) => {
    const certId = v.certificate_id;
    if (!acc[certId]) {
      acc[certId] = {
        count: 0,
        certNumber: v.certificate?.certificate_number || '',
        volunteerName: `${v.certificate?.volunteer?.application?.first_name || ''} ${v.certificate?.volunteer?.application?.family_name || ''}`,
      };
    }
    acc[certId].count++;
    return acc;
  }, {});

  const topVerified = Object.values(certVerificationCounts || {})
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (isLoading) {
    return (
      <DashboardLayout title="سجلات التحقق">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="سجلات التحقق">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold">سجلات التحقق من الشهادات</h2>
            <p className="text-muted-foreground">
              متابعة عمليات التحقق من صحة الشهادات
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{verifications?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">إجمالي عمليات التحقق</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <Clock className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{todayCount}</p>
                  <p className="text-sm text-muted-foreground">اليوم</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{weekCount}</p>
                  <p className="text-sm text-muted-foreground">آخر 7 أيام</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <Shield className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{uniqueCertificates}</p>
                  <p className="text-sm text-muted-foreground">شهادات فريدة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Verified Certificates */}
        {topVerified.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                الشهادات الأكثر تحققاً
              </CardTitle>
              <CardDescription>
                الشهادات التي تم التحقق منها أكثر من مرة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topVerified.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">{item.certNumber}</Badge>
                      <span className="text-sm">{item.volunteerName}</span>
                    </div>
                    <Badge variant="secondary">{item.count} مرة</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  سجل عمليات التحقق
                </CardTitle>
                <CardDescription>
                  آخر 100 عملية تحقق
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الشهادة</TableHead>
                  <TableHead>اسم المتطوع</TableHead>
                  <TableHead>النشاط</TableHead>
                  <TableHead>تاريخ التحقق</TableHead>
                  <TableHead>المتصفح</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVerifications?.map((verification) => (
                  <TableRow key={verification.id}>
                    <TableCell className="font-mono text-sm">
                      {verification.certificate?.certificate_number || '-'}
                    </TableCell>
                    <TableCell>
                      {verification.certificate?.volunteer?.application?.first_name}{' '}
                      {verification.certificate?.volunteer?.application?.family_name}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {verification.certificate?.opportunity?.title || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(verification.verified_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">
                      {verification.user_agent 
                        ? verification.user_agent.substring(0, 50) + '...'
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {(!filteredVerifications || filteredVerifications.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      لا توجد عمليات تحقق بعد
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
