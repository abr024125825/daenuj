import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  X
} from 'lucide-react';
import { ParsedStudent, ParsedExam, generateStudentsTemplate, generateExamsTemplate, StudentOption } from '@/lib/excelParser';

interface ExcelUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'students' | 'exams';
  onUpload: (data: ParsedStudent[] | ParsedExam[]) => Promise<void>;
  parseFile: (file: File) => Promise<ParsedStudent[] | ParsedExam[]>;
  students?: StudentOption[];
}

export function ExcelUploadDialog({ 
  open, 
  onOpenChange, 
  type, 
  onUpload,
  parseFile,
  students = [],
}: ExcelUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedStudent[] | ParsedExam[] | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setParsedData(null);
    setIsParsing(true);

    try {
      const data = await parseFile(selectedFile);
      if (data.length === 0) {
        setError('لم يتم العثور على بيانات صالحة في الملف');
      } else {
        setParsedData(data);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpload = async () => {
    if (!parsedData) return;

    setIsUploading(true);
    try {
      await onUpload(parsedData);
      onOpenChange(false);
      resetState();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (type === 'students') {
      generateStudentsTemplate();
    } else {
      generateExamsTemplate(students);
    }
  };

  const resetState = () => {
    setFile(null);
    setParsedData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {type === 'students' ? 'رفع الطلاب من Excel' : 'رفع الامتحانات من Excel'}
          </DialogTitle>
          <DialogDescription>
            ارفع ملف Excel يحتوي على {type === 'students' ? 'بيانات الطلاب' : 'بيانات الامتحانات'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Download Template Button */}
          <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            تحميل قالب Excel
          </Button>

          {/* File Upload Area */}
          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            {isParsing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">جاري قراءة الملف...</p>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="h-10 w-10 text-primary" />
                <p className="font-medium">{file.name}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    resetState();
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  إزالة
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">اضغط لاختيار ملف أو اسحب الملف هنا</p>
                <p className="text-xs text-muted-foreground">.xlsx, .xls</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Parsed Data Preview */}
          {parsedData && parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  تم العثور على {parsedData.length} {type === 'students' ? 'طالب' : 'امتحان'}
                </span>
              </div>
              
              <ScrollArea className="h-48 border rounded-lg">
                <div className="p-3 space-y-2">
                  {type === 'students' 
                    ? (parsedData as ParsedStudent[]).map((student, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <p className="font-medium">{student.student_name}</p>
                            <p className="text-sm text-muted-foreground">{student.university_id}</p>
                          </div>
                          {student.disability_type && (
                            <Badge variant="secondary">{student.disability_type}</Badge>
                          )}
                        </div>
                      ))
                    : (parsedData as ParsedExam[]).map((exam, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <p className="font-medium">{exam.course_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {exam.student_university_id} - {exam.exam_date}
                            </p>
                          </div>
                          <Badge variant="outline">{exam.start_time} - {exam.end_time}</Badge>
                        </div>
                      ))
                  }
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            إلغاء
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!parsedData || parsedData.length === 0 || isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            رفع {parsedData?.length || 0} {type === 'students' ? 'طالب' : 'امتحان'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
