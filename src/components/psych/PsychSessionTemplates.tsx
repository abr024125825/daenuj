import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Brain,
  Heart,
  AlertTriangle,
  FileText,
  Copy,
  Download,
  Search,
  Zap,
  ClipboardCopy,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  SESSION_TEMPLATES,
  TEXT_SNIPPETS,
  SessionTemplate,
  TextSnippet,
  exportSessionsToJSON,
  downloadLocalFile,
} from '@/lib/psychSessionTemplates';

interface PsychSessionTemplatesProps {
  onApplyTemplate?: (sections: { title: string; content: string }[]) => void;
  onInsertSnippet?: (text: string) => void;
  sessions?: any[];
}

export function PsychSessionTemplates({ onApplyTemplate, onInsertSnippet, sessions }: PsychSessionTemplatesProps) {
  const { toast } = useToast();
  const [previewTemplate, setPreviewTemplate] = useState<SessionTemplate | null>(null);
  const [snippetSearch, setSnippetSearch] = useState('');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CBT': return Brain;
      case 'Supportive': return Heart;
      case 'Crisis': return AlertTriangle;
      default: return FileText;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'CBT': return 'default';
      case 'Supportive': return 'secondary';
      case 'Crisis': return 'destructive';
      default: return 'outline';
    }
  };

  const handleApplyTemplate = (template: SessionTemplate) => {
    if (onApplyTemplate) {
      onApplyTemplate(template.sections.map(s => ({
        title: s.title,
        content: s.defaultContent,
      })));
    }
    setPreviewTemplate(null);
    toast({ title: 'Template Applied', description: `${template.name} loaded into session form` });
  };

  const handleCopySnippet = (snippet: TextSnippet) => {
    navigator.clipboard.writeText(snippet.text);
    if (onInsertSnippet) {
      onInsertSnippet(snippet.text);
    }
    toast({ title: 'Copied', description: `${snippet.label} copied to clipboard` });
  };

  const handleExportLocal = () => {
    if (!sessions || sessions.length === 0) {
      toast({ title: 'No Data', description: 'No sessions to export', variant: 'destructive' });
      return;
    }
    const json = exportSessionsToJSON(sessions);
    const date = new Date().toISOString().split('T')[0];
    downloadLocalFile(json, `psych-sessions-${date}.json`);
    toast({ title: 'Exported', description: 'Sessions saved locally to your computer' });
  };

  const filteredSnippets = TEXT_SNIPPETS.filter(s =>
    s.label.toLowerCase().includes(snippetSearch.toLowerCase()) ||
    s.shortcut.toLowerCase().includes(snippetSearch.toLowerCase()) ||
    s.category.toLowerCase().includes(snippetSearch.toLowerCase())
  );

  const snippetCategories = [...new Set(TEXT_SNIPPETS.map(s => s.category))];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="templates">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="snippets" className="gap-2">
            <Zap className="h-4 w-4" />
            Snippets
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-2">
            <Download className="h-4 w-4" />
            Local Export
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SESSION_TEMPLATES.map(template => {
              const Icon = getTypeIcon(template.type);
              return (
                <Card
                  key={template.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/30"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant={getTypeBadgeVariant(template.type) as any}>
                        {template.type}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-3">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {template.sections.slice(0, 4).map((section, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                          {section.title}
                        </div>
                      ))}
                      {template.sections.length > 4 && (
                        <p className="text-xs text-muted-foreground pl-3.5">
                          +{template.sections.length - 4} more sections
                        </p>
                      )}
                    </div>
                    <Button className="w-full mt-4" variant="outline" size="sm">
                      Preview & Apply
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Snippets Tab */}
        <TabsContent value="snippets" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search snippets or type shortcut (e.g. /mse)..."
              value={snippetSearch}
              onChange={(e) => setSnippetSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {snippetCategories.map(category => {
            const categorySnippets = filteredSnippets.filter(s => s.category === category);
            if (categorySnippets.length === 0) return null;
            return (
              <Card key={category}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">{category}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {categorySnippets.map(snippet => (
                    <div
                      key={snippet.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Badge variant="outline" className="font-mono text-xs shrink-0">
                          {snippet.shortcut}
                        </Badge>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{snippet.label}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-md">
                            {snippet.text.substring(0, 80)}...
                          </p>
                        </div>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleCopySnippet(snippet)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ClipboardCopy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy to clipboard</TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Local Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Local Data Export
              </CardTitle>
              <CardDescription>
                Download session data to your computer. Data is saved locally and never uploaded to the server.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border bg-muted/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Export as JSON</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Export all session records as a structured JSON file. This file can be
                      imported into other systems or used for offline record-keeping.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {sessions?.length || 0} sessions available for export
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={handleExportLocal} disabled={!sessions || sessions.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Download Sessions (JSON)
              </Button>

              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Privacy Note:</strong> Exported files are saved directly to your computer.
                  No data is transmitted to any external server. Handle exported files according to
                  your institution's data protection policies.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewTemplate && (() => {
                const Icon = getTypeIcon(previewTemplate.type);
                return <Icon className="h-5 w-5" />;
              })()}
              {previewTemplate?.name}
            </DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {previewTemplate?.sections.map((section, i) => (
              <div key={i} className="space-y-2">
                <Label className="font-medium">{section.title}</Label>
                <Textarea
                  value={section.defaultContent}
                  readOnly
                  className="min-h-[80px] text-sm font-mono bg-muted/50"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={() => previewTemplate && handleApplyTemplate(previewTemplate)}>
              <Copy className="h-4 w-4 mr-2" />
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
