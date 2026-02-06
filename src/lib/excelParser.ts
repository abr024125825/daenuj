import * as XLSX from 'xlsx';

export interface ParsedStudent {
  student_name: string;
  university_id: string;
  disability_type?: string;
  disability_code?: string;
  contact_phone?: string;
  contact_email?: string;
  notes?: string;
}

export interface ParsedExam {
  student_university_id: string;
  course_name: string;
  course_code?: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  extra_time_minutes?: number;
  location?: string;
  special_needs?: string[];
  special_needs_notes?: string;
}

export function parseStudentsExcel(file: File): Promise<ParsedStudent[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        
        if (jsonData.length < 2) {
          reject(new Error('Excel file is empty or has no data rows'));
          return;
        }
        
        const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
        const students: ParsedStudent[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;
          
          const getValue = (colNames: string[]): string | undefined => {
            for (const colName of colNames) {
              const index = headers.findIndex(h => h.includes(colName));
              if (index !== -1 && row[index]) {
                return String(row[index]).trim();
              }
            }
            return undefined;
          };
          
          const studentName = getValue(['name', 'student_name', 'اسم', 'الاسم']);
          const universityId = getValue(['id', 'university_id', 'رقم', 'الرقم الجامعي']);
          
          if (studentName && universityId) {
            students.push({
              student_name: studentName,
              university_id: universityId,
              disability_type: getValue(['disability_type', 'type', 'نوع الإعاقة', 'الإعاقة']),
              disability_code: getValue(['code', 'disability_code', 'الكود', 'رمز']),
              contact_phone: getValue(['phone', 'contact_phone', 'هاتف', 'الهاتف', 'رقم الهاتف']),
              contact_email: getValue(['email', 'contact_email', 'بريد', 'الإيميل', 'البريد']),
              notes: getValue(['notes', 'ملاحظات']),
            });
          }
        }
        
        resolve(students);
      } catch (error) {
        reject(new Error('Failed to parse Excel file: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function parseExamsExcel(file: File): Promise<ParsedExam[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];
        
        if (jsonData.length < 2) {
          reject(new Error('Excel file is empty or has no data rows'));
          return;
        }
        
        const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
        const exams: ParsedExam[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;
          
          const getValue = (colNames: string[]): string | undefined => {
            for (const colName of colNames) {
              const index = headers.findIndex(h => h.includes(colName));
              if (index !== -1 && row[index] !== undefined && row[index] !== null) {
                return String(row[index]).trim();
              }
            }
            return undefined;
          };
          
          const getNumericValue = (colNames: string[]): number | undefined => {
            const val = getValue(colNames);
            if (val) {
              const num = parseInt(val, 10);
              return isNaN(num) ? undefined : num;
            }
            return undefined;
          };
          
          const studentId = getValue(['student_id', 'university_id', 'رقم الطالب', 'الرقم الجامعي']);
          const courseName = getValue(['course_name', 'course', 'المادة', 'اسم المادة']);
          const examDate = getValue(['date', 'exam_date', 'التاريخ', 'تاريخ الامتحان']);
          const startTime = getValue(['start_time', 'start', 'وقت البداية', 'البداية']);
          const endTime = getValue(['end_time', 'end', 'وقت النهاية', 'النهاية']);
          const durationMin = getNumericValue(['duration', 'duration_minutes', 'المدة', 'الدورة']);
          
          if (studentId && courseName && examDate && startTime && endTime) {
            // Parse special needs (comma-separated)
            const specialNeedsStr = getValue(['special_needs', 'needs', 'الاحتياجات', 'احتياجات خاصة']);
            const specialNeeds = specialNeedsStr 
              ? specialNeedsStr.split(',').map(s => s.trim().toLowerCase().replace(/\s+/g, '_'))
              : undefined;
            
            // Parse date - handle Excel date serial numbers
            let parsedDate = examDate;
            if (!isNaN(Number(examDate))) {
              // Excel stores dates as serial numbers
              const excelDate = XLSX.SSF.parse_date_code(Number(examDate));
              parsedDate = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
            }
            
            // Parse time - handle Excel time formats
            const parseTime = (timeVal: string): string => {
              if (!isNaN(Number(timeVal))) {
                // Excel time as decimal
                const totalMinutes = Math.round(Number(timeVal) * 24 * 60);
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
              }
              return timeVal;
            };
            
            exams.push({
              student_university_id: studentId,
              course_name: courseName,
              course_code: getValue(['course_code', 'code', 'رمز المادة', 'الرمز']),
              exam_date: parsedDate,
              start_time: parseTime(startTime),
              end_time: parseTime(endTime),
              duration_minutes: durationMin || 60,
              extra_time_minutes: getNumericValue(['extra_time', 'extra_time_minutes', 'الوقت الإضافي']),
              location: getValue(['location', 'room', 'المكان', 'القاعة']),
              special_needs: specialNeeds,
              special_needs_notes: getValue(['special_needs_notes', 'notes', 'ملاحظات']),
            });
          }
        }
        
        resolve(exams);
      } catch (error) {
        reject(new Error('Failed to parse Excel file: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function generateStudentsTemplate(): void {
  const headers = [
    'Student Name / اسم الطالب',
    'University ID / الرقم الجامعي',
    'Disability Type / نوع الإعاقة',
    'Disability Code / رمز الإعاقة',
    'Phone / الهاتف',
    'Email / البريد',
    'Notes / ملاحظات',
  ];
  
  const sampleData = [
    ['محمد أحمد', '12345678', 'بصرية', 'V1', '0501234567', 'student@example.com', 'ملاحظات إضافية'],
  ];
  
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  
  // Set column widths
  ws['!cols'] = headers.map(() => ({ wch: 25 }));
  
  XLSX.writeFile(wb, 'disability_students_template.xlsx');
}

export function generateExamsTemplate(): void {
  const headers = [
    'Student ID / الرقم الجامعي',
    'Course Name / اسم المادة',
    'Course Code / رمز المادة',
    'Exam Date / تاريخ الامتحان',
    'Start Time / وقت البداية',
    'End Time / وقت النهاية',
    'Duration (min) / المدة',
    'Extra Time (min) / وقت إضافي',
    'Location / المكان',
    'Special Needs / الاحتياجات',
    'Notes / ملاحظات',
  ];
  
  const sampleData = [
    ['12345678', 'Introduction to Programming', 'CS101', '2025-03-15', '09:00', '11:00', '120', '30', 'Room 101', 'reader,scribe', 'يحتاج قارئ وكاتب'],
  ];
  
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Exams');
  
  // Set column widths
  ws['!cols'] = headers.map(() => ({ wch: 25 }));
  
  XLSX.writeFile(wb, 'disability_exams_template.xlsx');
}
