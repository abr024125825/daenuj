import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Brain, Send, Loader2, AlertTriangle, CheckCircle2, UserPlus, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/screening-chat`;

type Msg = { role: 'user' | 'assistant'; content: string };

interface ScreeningResult {
  completed: boolean;
  severity: string;
  suggested_icd_codes: { code: string; description: string }[];
  summary: string;
  recommendation: string;
}

function parseScreeningResult(text: string): ScreeningResult | null {
  const match = text.match(/```screening_result\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function stripScreeningBlock(text: string): string {
  return text.replace(/```screening_result[\s\S]*?```/, '').trim();
}

export default function ScreeningTestPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const streamChat = useCallback(async (allMessages: Msg[]) => {
    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages }),
    });

    if (!resp.ok || !resp.body) {
      if (resp.status === 429) toast({ title: 'يرجى المحاولة لاحقاً', variant: 'destructive' });
      throw new Error('Stream failed');
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let assistantText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buf.indexOf('\n')) !== -1) {
        let line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (!line.startsWith('data: ') || line.trim() === '') continue;
        const json = line.slice(6).trim();
        if (json === '[DONE]') break;
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantText += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
              }
              return [...prev, { role: 'assistant', content: assistantText }];
            });
          }
        } catch { /* partial */ }
      }
    }

    // Check for screening result
    const sr = parseScreeningResult(assistantText);
    if (sr) {
      setResult(sr);
      // Save anonymous result
      await supabase.from('screening_results').insert({
        session_id: sessionId,
        questions_answered: allMessages,
        suggested_icd_codes: sr.suggested_icd_codes,
        severity_level: sr.severity,
        summary: sr.summary,
        is_anonymous: true,
      } as any);
    }
  }, [sessionId, toast]);

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    try {
      await streamChat(newMessages);
    } catch (e) {
      console.error(e);
      toast({ title: 'حدث خطأ', description: 'يرجى المحاولة مرة أخرى', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regForm.name) return;
    setSaving(true);
    try {
      // Create patient
      const firstLetter = regForm.name.trim()[0]?.toUpperCase() || 'X';
      const currentMonth = new Date().getMonth() + 1;
      let semester: number;
      if (currentMonth >= 9 || currentMonth === 1) semester = 1;
      else if (currentMonth >= 2 && currentMonth <= 6) semester = 2;
      else semester = 3;
      const year = new Date().getFullYear().toString();

      const { data: fileNumber, error: fnError } = await supabase.rpc('generate_file_number', {
        _first_letter: firstLetter, _year: year, _semester: semester,
      });
      if (fnError) throw fnError;

      const { data: patient, error: pErr } = await supabase.from('patients').insert({
        full_name: regForm.name,
        file_number: fileNumber,
        email: regForm.email || null,
        phone: regForm.phone || null,
        status: 'active',
      } as any).select().single();
      if (pErr) throw pErr;

      // Update screening result with patient info
      await supabase.from('screening_results').update({
        patient_id: patient.id,
        is_anonymous: false,
        student_name: regForm.name,
        student_email: regForm.email,
        student_phone: regForm.phone,
      } as any).eq('session_id', sessionId);

      toast({
        title: 'تم التسجيل بنجاح',
        description: `رقم الملف: ${fileNumber} - يمكنك حجز موعد الآن`,
      });
      setShowRegister(false);
      navigate(`/book-appointment`);
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const severityColor = (s: string) => {
    if (s === 'severe') return 'destructive';
    if (s === 'moderate') return 'default';
    if (s === 'mild') return 'secondary';
    return 'outline';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Brain className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-foreground">اختبار الفحص النفسي التكيفي</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {!result ? (
          <Card className="h-[calc(100vh-140px)] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                محادثة الفحص النفسي
              </CardTitle>
              <CardDescription>
                أجب على الأسئلة بصدق. هذا فحص أولي وليس تشخيصاً نهائياً. جميع إجاباتك سرية.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
              <ScrollArea className="flex-1 px-6" ref={scrollRef}>
                <div className="space-y-4 py-4">
                  {messages.length === 0 && (
                    <div className="text-center py-12 space-y-3">
                      <Brain className="h-12 w-12 mx-auto text-primary/30" />
                      <p className="text-muted-foreground">ابدأ بكتابة ما تشعر به أو ما يقلقك</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {['أشعر بالقلق', 'لدي مشاكل في النوم', 'أشعر بالحزن', 'I feel stressed'].map(q => (
                          <Button key={q} variant="outline" size="sm" onClick={() => { setInput(q); }}>
                            {q}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}>
                        {m.role === 'assistant' ? stripScreeningBlock(m.content) : m.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="اكتب رسالتك..."
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  disabled={isLoading}
                  className="flex-1"
                  dir="auto"
                />
                <Button size="icon" onClick={send} disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Result Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    نتيجة الفحص الأولي
                  </CardTitle>
                  <Badge variant={severityColor(result.severity)}>
                    {result.severity === 'minimal' && 'طبيعي'}
                    {result.severity === 'mild' && 'خفيف'}
                    {result.severity === 'moderate' && 'متوسط'}
                    {result.severity === 'severe' && 'شديد'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground leading-relaxed" dir="auto">{result.summary}</p>
                
                {result.suggested_icd_codes.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">المؤشرات التشخيصية المقترحة:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.suggested_icd_codes.map((c, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {c.code}: {c.description}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-sm text-foreground" dir="auto">
                    <AlertTriangle className="h-4 w-4 inline-block ml-1 text-accent" />
                    {result.recommendation}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  ⚠️ هذا فحص أولي وليس تشخيصاً طبياً. يُنصح بمراجعة أخصائي نفسي للحصول على تقييم شامل.
                </p>
              </CardContent>
            </Card>

            {/* Action Cards */}
            {!showRegister ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowRegister(true)}>
                  <CardContent className="p-6 text-center space-y-3">
                    <UserPlus className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="font-semibold">فتح ملف طبي وحجز موعد</h3>
                    <p className="text-xs text-muted-foreground">سجل بياناتك لفتح ملف وحجز موعد مع أخصائي</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/')}>
                  <CardContent className="p-6 text-center space-y-3">
                    <ArrowLeft className="h-8 w-8 mx-auto text-muted-foreground" />
                    <h3 className="font-semibold">العودة للصفحة الرئيسية</h3>
                    <p className="text-xs text-muted-foreground">تم تسجيل نتيجتك بشكل مجهول في الإحصائيات</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">تسجيل البيانات</CardTitle>
                  <CardDescription>أدخل بياناتك لفتح ملف طبي وحجز موعد</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>الاسم الكامل (بالإنجليزية) *</Label>
                    <Input value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name in English" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <Input type="email" value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>الهاتف</Label>
                      <Input value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleRegister} disabled={saving || !regForm.name}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Calendar className="h-4 w-4 mr-2" />
                    فتح ملف وحجز موعد
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
