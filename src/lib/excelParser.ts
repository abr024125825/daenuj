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

export interface StudentOption {
  university_id: string;
  student_name: string;
}

export function generateExamsTemplate(students: StudentOption[] = []): void {
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
  ];
  
  // Create main worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  
  // Predefined options
  const specialNeedsOptions = [
    'reader',
    'scribe', 
    'sign_language',
    'extra_time',
    'separate_room',
    'computer',
    'large_print',
    'reader,scribe',
    'reader,extra_time',
    'scribe,extra_time',
  ];
  
  const durationOptions = ['30', '45', '60', '90', '120', '150', '180'];
  const extraTimeOptions = ['0', '15', '30', '45', '60', '90'];
  const commonLocations = ['Room 101', 'Room 102', 'Room 103', 'Lab A', 'Lab B', 'Main Hall'];
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];
  
  // Create a reference sheet for dropdown data
  const refData: string[][] = [];
  const maxRows = Math.max(
    students.length, 
    specialNeedsOptions.length, 
    durationOptions.length,
    extraTimeOptions.length,
    commonLocations.length,
    timeSlots.length
  );
  
  // Headers for reference sheet
  refData.push(['Students', 'Special Needs', 'Duration', 'Extra Time', 'Locations', 'Time Slots']);
  
  for (let i = 0; i < maxRows; i++) {
    refData.push([
      students[i] ? `${students[i].university_id} - ${students[i].student_name}` : '',
      specialNeedsOptions[i] || '',
      durationOptions[i] || '',
      extraTimeOptions[i] || '',
      commonLocations[i] || '',
      timeSlots[i] || '',
    ]);
  }
  
  const refWs = XLSX.utils.aoa_to_sheet(refData);
  
  // Add data validation for dropdowns (using Excel formulas)
  const dataRows = 100; // Pre-create validations for 100 rows
  
  if (students.length > 0) {
    // Student ID dropdown (Column A)
    for (let row = 2; row <= dataRows + 1; row++) {
      const cellRef = XLSX.utils.encode_cell({ r: row - 1, c: 0 });
      if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
      ws[cellRef].s = { alignment: { horizontal: 'center' } };
    }
  }
  
  // Set column widths
  ws['!cols'] = [
    { wch: 35 }, // Student ID
    { wch: 30 }, // Course Name
    { wch: 15 }, // Course Code
    { wch: 15 }, // Date
    { wch: 12 }, // Start Time
    { wch: 12 }, // End Time
    { wch: 12 }, // Duration
    { wch: 12 }, // Extra Time
    { wch: 15 }, // Location
    { wch: 25 }, // Special Needs
  ];
  
  refWs['!cols'] = [
    { wch: 40 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
  ];
  
  // Add sample data row with instructions
  const sampleRow = students.length > 0 
    ? [`${students[0].university_id} - ${students[0].student_name}`, 'Introduction to CS', 'CS101', '2025-03-15', '09:00', '11:00', '120', '30', 'Room 101', 'reader,scribe']
    : ['12345678', 'Introduction to CS', 'CS101', '2025-03-15', '09:00', '11:00', '120', '30', 'Room 101', 'reader,scribe'];
  
  XLSX.utils.sheet_add_aoa(ws, [sampleRow], { origin: 'A2' });
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Exams');
  XLSX.utils.book_append_sheet(wb, refWs, 'Reference Data');
  
  // Add instructions sheet
  const instructionsData = [
    ['INSTRUCTIONS / تعليمات'],
    [''],
    ['1. Student ID: Copy from "Reference Data" sheet, Column A (Students)'],
    ['   الرقم الجامعي: انسخ من ورقة "Reference Data"، العمود A'],
    [''],
    ['2. Course Name: Enter the course name'],
    ['   اسم المادة: أدخل اسم المادة'],
    [''],
    ['3. Course Code: Enter the course code (optional)'],
    ['   رمز المادة: أدخل رمز المادة (اختياري)'],
    [''],
    ['4. Exam Date: Use format YYYY-MM-DD (e.g., 2025-03-15)'],
    ['   تاريخ الامتحان: استخدم صيغة YYYY-MM-DD'],
    [''],
    ['5. Start/End Time: Use 24h format HH:MM (e.g., 09:00)'],
    ['   الوقت: استخدم صيغة 24 ساعة HH:MM'],
    [''],
    ['6. Duration: Select from Reference Data sheet'],
    ['   المدة: اختر من ورقة Reference Data'],
    [''],
    ['7. Special Needs Options:'],
    ['   reader - قارئ'],
    ['   scribe - كاتب'],
    ['   sign_language - لغة إشارة'],
    ['   extra_time - وقت إضافي'],
    ['   separate_room - غرفة منفصلة'],
    ['   computer - حاسوب'],
    ['   large_print - طباعة كبيرة'],
    ['   (Use comma to combine, e.g., reader,scribe)'],
  ];
  
  const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
  instructionsWs['!cols'] = [{ wch: 60 }];
  XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');
  
  XLSX.writeFile(wb, 'disability_exams_template.xlsx');
}
