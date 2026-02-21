import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Brain, Send, Loader2, AlertTriangle, CheckCircle2, UserPlus, Calendar, Shield } from 'lucide-react';
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
  instruments_used?: string[];
  instrument_scores?: Record<string, number>;
  risk_level?: string;
  domains_assessed?: string[];
}

function parseScreeningResult(text: string): ScreeningResult | null {
  const match = text.match(/```screening_result\s*([\s\S]*?)```/);
  if (!match) return null;
  try { return JSON.parse(match[1]); } catch { return null; }
}

function stripScreeningBlock(text: string): string {
  return text.replace(/```screening_result[\s\S]*?```/, '').trim();
}

// Separate summary page component
function ScreeningSummaryPage({ result, sessionId, onRequestFile, onHome }: {
  result: ScreeningResult;
  sessionId: string;
  onRequestFile: () => void;
  onHome: () => void;
}) {
  const severityColor = (s: string): 'destructive' | 'default' | 'secondary' | 'outline' => {
    if (s === 'severe') return 'destructive';
    if (s === 'moderate') return 'default';
    if (s === 'mild') return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Screening Assessment Results
            </CardTitle>
            <Badge variant={severityColor(result.severity)} className="capitalize">
              {result.severity}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-foreground leading-relaxed" dir="auto">{result.summary}</p>

          {result.instruments_used && result.instruments_used.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Instruments Administered:</p>
              <div className="flex flex-wrap gap-1.5">
                {result.instruments_used.map((inst, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {inst}
                    {result.instrument_scores?.[inst] != null && (
                      <span className="ml-1 font-mono">({result.instrument_scores[inst]})</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {result.suggested_icd_codes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Suggested Diagnostic Indicators (ICD-10):</p>
              <div className="flex flex-wrap gap-2">
                {result.suggested_icd_codes.map((c, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    <span className="font-mono mr-1">{c.code}</span>— {c.description}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
            <p className="text-sm text-foreground" dir="auto">
              <AlertTriangle className="h-4 w-4 inline-block mr-1 text-accent" />
              {result.recommendation}
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            ⚠️ This is an initial screening and not a medical diagnosis. Please consult a qualified mental health professional for a comprehensive evaluation.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md hover:border-primary/40 transition-all" onClick={onRequestFile}>
          <CardContent className="p-6 text-center space-y-3">
            <UserPlus className="h-8 w-8 mx-auto text-primary" />
            <h3 className="font-semibold">Open a Medical File</h3>
            <p className="text-xs text-muted-foreground">Submit a request to open a medical file and be assigned to a psychologist</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={onHome}>
          <CardContent className="p-6 text-center space-y-3">
            <ArrowLeft className="h-8 w-8 mx-auto text-muted-foreground" />
            <h3 className="font-semibold">Return to Home</h3>
            <p className="text-xs text-muted-foreground">Your result has been recorded anonymously</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// File open request form
function FileOpenRequestForm({ result, sessionId, onDone, onCancel }: {
  result: ScreeningResult;
  sessionId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '', dob: '', national_id: '', email: '', phone: '', gender: '',
  });

  const handleRegister = async () => {
    if (!regForm.name) { toast({ title: 'Full name is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const { error: reqErr } = await supabase.from('file_open_requests' as any).insert({
        session_id: sessionId,
        student_name: regForm.name,
        student_email: regForm.email || null,
        student_phone: regForm.phone || null,
        student_dob: regForm.dob || null,
        student_national_id: regForm.national_id || null,
        gender: regForm.gender || null,
        screening_summary: result?.summary || null,
        suggested_icd_codes: result?.suggested_icd_codes || [],
        severity_level: result?.severity || null,
        status: 'pending',
      });
      if (reqErr) throw reqErr;

      await supabase.from('screening_results').update({
        is_anonymous: false,
        student_name: regForm.name,
        student_email: regForm.email,
        student_phone: regForm.phone,
      } as any).eq('session_id', sessionId);

      toast({
        title: 'Request submitted successfully',
        description: 'Your file opening request has been sent to a psychologist for review.',
      });
      onDone();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Open a Medical File — Registration</CardTitle>
        <CardDescription>
          Please fill in your information in English. Your request will be reviewed by a psychologist.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Full Name (in English) *</Label>
            <Input value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Ahmed Mohammed Al-Hassan" />
          </div>
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Input type="date" value={regForm.dob} onChange={e => setRegForm(f => ({ ...f, dob: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={regForm.gender} onValueChange={v => setRegForm(f => ({ ...f, gender: v }))}>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>National ID</Label>
            <Input value={regForm.national_id} onChange={e => setRegForm(f => ({ ...f, national_id: e.target.value }))} placeholder="National ID number" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} placeholder="+966..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Email</Label>
            <Input type="email" value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button className="flex-1" onClick={handleRegister} disabled={saving || !regForm.name}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Calendar className="h-4 w-4 mr-2" />
            Submit File Request
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ScreeningTestPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState<'chat' | 'summary' | 'register'>('chat');
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  };

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
      if (resp.status === 429) toast({ title: 'Please try again later', variant: 'destructive' });
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
            scrollToBottom();
          }
        } catch { /* partial chunk */ }
      }
    }

    const sr = parseScreeningResult(assistantText);
    if (sr) {
      setResult(sr);
      // Navigate to summary page after a brief delay
      setTimeout(() => setStep('summary'), 500);
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

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;
    const userMsg: Msg = { role: 'user', content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    scrollToBottom();
    try {
      await streamChat(newMessages);
    } catch (e) {
      console.error(e);
      toast({ title: 'An error occurred. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const starters = [
    "I've been feeling very anxious lately",
    "I'm having trouble sleeping and concentrating",
    "I feel sad and hopeless most of the time",
    "I'm struggling with stress and overwhelm",
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Brain className="h-5 w-5 text-primary" />
            <h1 className="font-semibold text-foreground">Adaptive Psychological Screening</h1>
          </div>
          <Badge variant="outline" className="gap-1 text-xs">
            <Shield className="h-3 w-3" /> Confidential
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {step === 'chat' && (
          <Card className="flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
            <CardHeader className="pb-3 shrink-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Psychological Assessment Chat
              </CardTitle>
              <CardDescription>
                Answer honestly. This is a confidential initial screening — not a final diagnosis.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-0 min-h-0">
              <ScrollArea className="flex-1 px-4 min-h-0" ref={scrollRef}>
                <div className="space-y-4 py-4">
                  {messages.length === 0 && (
                    <div className="text-center py-8 space-y-4">
                      <Brain className="h-12 w-12 mx-auto text-primary/30" />
                      <p className="text-muted-foreground text-sm">Start by describing what's been bothering you, or choose a topic:</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {starters.map(q => (
                          <Button key={q} variant="outline" size="sm" onClick={() => send(q)} className="text-xs">
                            {q}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                      }`}>
                        {m.role === 'assistant' ? stripScreeningBlock(m.content) : m.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs text-muted-foreground">Analyzing your response...</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t shrink-0 flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type your message..."
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  disabled={isLoading}
                  className="flex-1"
                  dir="auto"
                />
                <Button size="icon" onClick={() => send()} disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'summary' && result && (
          <ScreeningSummaryPage
            result={result}
            sessionId={sessionId}
            onRequestFile={() => setStep('register')}
            onHome={() => navigate('/')}
          />
        )}

        {step === 'register' && result && (
          <FileOpenRequestForm
            result={result}
            sessionId={sessionId}
            onDone={() => navigate('/')}
            onCancel={() => setStep('summary')}
          />
        )}
      </main>
    </div>
  );
}
