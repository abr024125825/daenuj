import * as XLSX from 'xlsx';

export interface ParsedStudent {
  student_name: string;
  university_id: string;
  disability_type?: string;
  disability_code?: string;
  contact_phone?: string;
  contact_email?: string;
  notes?: string;
  special_needs?: string[];
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

export interface StudentOption {
  university_id: string;
  student_name: string;
  special_needs?: string[];
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
            // Parse special needs (comma-separated)
            const specialNeedsStr = getValue(['special_needs', 'needs', 'الاحتياجات', 'احتياجات خاصة']);
            const specialNeeds = specialNeedsStr 
              ? specialNeedsStr.split(',').map(s => s.trim().toLowerCase().replace(/\s+/g, '_'))
              : undefined;
            
            students.push({
              student_name: studentName,
              university_id: universityId,
              disability_type: getValue(['disability_type', 'type', 'نوع الإعاقة', 'الإعاقة']),
              disability_code: getValue(['code', 'disability_code', 'الكود', 'رمز']),
              contact_phone: getValue(['phone', 'contact_phone', 'هاتف', 'الهاتف', 'رقم الهاتف']),
              contact_email: getValue(['email', 'contact_email', 'بريد', 'الإيميل', 'البريد']),
              notes: getValue(['notes', 'ملاحظات']),
              special_needs: specialNeeds,
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

export function parseExamsExcel(file: File, students?: StudentOption[]): Promise<ParsedExam[]> {
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
          
          let studentId = getValue(['student_id', 'university_id', 'student', 'رقم الطالب', 'الرقم الجامعي']);
          
          // Handle dropdown format: "12345678 - Student Name"
          if (studentId && studentId.includes(' - ')) {
            studentId = studentId.split(' - ')[0].trim();
          }
          
          const courseName = getValue(['course_name', 'course', 'المادة', 'اسم المادة']);
          const examDate = getValue(['date', 'exam_date', 'التاريخ', 'تاريخ الامتحان']);
          const startTime = getValue(['start_time', 'start', 'وقت البداية', 'البداية']);
          const endTime = getValue(['end_time', 'end', 'وقت النهاية', 'النهاية']);
          const durationMin = getNumericValue(['duration', 'duration_minutes', 'المدة', 'الدورة']);
          
          if (studentId && courseName && examDate && startTime && endTime) {
            // Parse special needs - check if explicit or use student default
            let specialNeedsStr = getValue(['special_needs', 'needs', 'الاحتياجات', 'احتياجات خاصة']);
            let specialNeeds: string[] | undefined;
            
            if (specialNeedsStr && specialNeedsStr.toLowerCase() !== 'use student default') {
              specialNeeds = specialNeedsStr.split(',').map(s => s.trim().toLowerCase().replace(/\s+/g, '_'));
            } else if (students) {
              // Use student's default special needs
              const student = students.find(s => s.university_id === studentId);
              if (student?.special_needs) {
                specialNeeds = student.special_needs;
              }
            }
            
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
  const wb = XLSX.utils.book_new();
  
  // Main data sheet
  const headers = [
    'Student Name',
    'University ID',
    'Disability Type',
    'Disability Code',
    'Phone',
    'Email',
    'Special Needs',
    'Notes',
  ];
  
  const sampleData = [
    ['Ahmed Mohammed', '12345678', 'Visual', 'V1', '0501234567', 'student@ju.edu.jo', 'reader,scribe', 'Additional notes'],
    ['Sara Ali', '23456789', 'Hearing', 'H1', '0509876543', 'sara@ju.edu.jo', 'sign_language', ''],
  ];
  
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  
  // Set column widths
  ws['!cols'] = headers.map(() => ({ wch: 20 }));
  
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  
  // Reference sheet with valid options
  const refHeaders = ['Disability Types', 'Special Needs Options'];
  const refData = [
    ['Visual', 'reader'],
    ['Hearing', 'scribe'],
    ['Motor', 'sign_language'],
    ['Learning', 'extra_time'],
    ['Cognitive', 'separate_room'],
    ['Multiple', 'assistive_technology'],
    ['Other', 'companion'],
    ['', 'other'],
  ];
  
  const refWs = XLSX.utils.aoa_to_sheet([refHeaders, ...refData]);
  refWs['!cols'] = [{ wch: 20 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, refWs, 'Reference');
  
  XLSX.writeFile(wb, 'disability_students_template.xlsx');
}

export function generateExamsTemplate(students: StudentOption[] = []): void {
  const wb = XLSX.utils.book_new();
  
  // Main data sheet headers
  const headers = [
    'Student',
    'Course Name',
    'Course Code',
    'Exam Date',
    'Start Time',
    'End Time',
    'Duration (min)',
    'Extra Time (min)',
    'Location',
    'Special Needs',
  ];
  
  // Create main worksheet with sample data
  const sampleStudent = students.length > 0 
    ? `${students[0].university_id} - ${students[0].student_name}`
    : '12345678 - Sample Student';
  
  const sampleData = [
    [sampleStudent, 'Introduction to CS', 'CS101', '2025-03-15', '09:00', '11:00', 120, 30, 'Room 101', 'reader,scribe'],
  ];
  
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 35 }, // Student
    { wch: 25 }, // Course Name
    { wch: 12 }, // Course Code
    { wch: 12 }, // Date
    { wch: 10 }, // Start Time
    { wch: 10 }, // End Time
    { wch: 12 }, // Duration
    { wch: 12 }, // Extra Time
    { wch: 15 }, // Location
    { wch: 30 }, // Special Needs
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Exams');
  
  // Reference sheet with students and options
  const refHeaders = ['Students (Copy to Column A)', 'Special Needs', 'Duration Options', 'Extra Time Options', 'Locations', 'Time Slots'];
  
  const specialNeedsOptions = ['reader', 'scribe', 'sign_language', 'extra_time', 'separate_room', 'assistive_technology', 'companion', 'other', 'Use Student Default'];
  const durationOptions = ['30', '45', '60', '90', '120', '150', '180'];
  const extraTimeOptions = ['0', '15', '30', '45', '60', '90'];
  const locations = ['Room 101', 'Room 102', 'Room 103', 'Lab A', 'Lab B', 'Main Hall', 'Library Room 1'];
  const timeSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
  
  const maxRows = Math.max(students.length, specialNeedsOptions.length, durationOptions.length, extraTimeOptions.length, locations.length, timeSlots.length);
  
  const refData: string[][] = [];
  for (let i = 0; i < maxRows; i++) {
    const studentLabel = students[i] 
      ? `${students[i].university_id} - ${students[i].student_name}${students[i].special_needs?.length ? ' [' + students[i].special_needs?.join(',') + ']' : ''}`
      : '';
    refData.push([
      studentLabel,
      specialNeedsOptions[i] || '',
      durationOptions[i] || '',
      extraTimeOptions[i] || '',
      locations[i] || '',
      timeSlots[i] || '',
    ]);
  }
  
  const refWs = XLSX.utils.aoa_to_sheet([refHeaders, ...refData]);
  refWs['!cols'] = [
    { wch: 50 }, // Students
    { wch: 25 }, // Special Needs
    { wch: 15 }, // Duration
    { wch: 15 }, // Extra Time
    { wch: 18 }, // Locations
    { wch: 12 }, // Time Slots
  ];
  
  XLSX.utils.book_append_sheet(wb, refWs, 'Reference');
  
  XLSX.writeFile(wb, 'disability_exams_template.xlsx');
}
