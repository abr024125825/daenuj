import jsPDF from 'jspdf';
import logoImage from '@/assets/logo-transparent.png';
import { DisabilityExamStats } from '@/hooks/useDisabilityExamStats';

interface DisabilityReportData {
  stats: DisabilityExamStats;
  semesterName: string;
  academicYear: string;
  disabilityTypes: { name: string; count: number }[];
  specialNeeds: { name: string; count: number }[];
  monthlyExams: { month: string; total: number; completed: number }[];
  topVolunteers: { name: string; completed: number; total: number }[];
}

const colors = {
  primary: [25, 130, 160] as [number, number, number],
  accent: [234, 179, 8] as [number, number, number],
  dark: [30, 41, 59] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  light: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  success: [34, 150, 100] as [number, number, number],
  warning: [234, 140, 20] as [number, number, number],
};

async function getLogoBase64(): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas ctx');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = logoImage;
  });
}

function drawHeader(doc: jsPDF, logoBase64: string) {
  // Blue header bar
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, 210, 38, 'F');
  // Gold accent
  doc.setFillColor(...colors.accent);
  doc.rect(0, 38, 210, 2, 'F');

  // Logo
  try {
    doc.addImage(logoBase64, 'PNG', 12, 6, 26, 26);
  } catch {}

  // Title
  doc.setTextColor(...colors.white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Disability Services Report', 44, 17);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Dean of Student Affairs · University of Jordan', 44, 24);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 44, 31);
}

function drawFooter(doc: jsPDF, page: number, totalPages: number) {
  const y = 285;
  doc.setDrawColor(...colors.muted);
  doc.line(15, y, 195, y);
  doc.setFontSize(7);
  doc.setTextColor(...colors.muted);
  doc.text('University of Jordan · Dean of Student Affairs · Disability Services', 15, y + 4);
  doc.text(`Page ${page} of ${totalPages}`, 195, y + 4, { align: 'right' });
}

function drawSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFillColor(...colors.primary);
  doc.rect(15, y, 3, 8, 'F');
  doc.setTextColor(...colors.dark);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 22, y + 6);
  return y + 14;
}

function drawStatBox(doc: jsPDF, x: number, y: number, w: number, label: string, value: string, color: [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.roundedRect(x, y, w, 22, 2, 2, 'F');
  doc.setTextColor(...colors.white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(value, x + w / 2, y + 10, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(label, x + w / 2, y + 17, { align: 'center' });
}

function drawTable(doc: jsPDF, headers: string[], rows: string[][], y: number, colWidths: number[]) {
  const startX = 15;
  const rowH = 7;

  // Header
  doc.setFillColor(...colors.primary);
  let x = startX;
  headers.forEach((h, i) => {
    doc.rect(x, y, colWidths[i], rowH, 'F');
    x += colWidths[i];
  });
  doc.setTextColor(...colors.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  x = startX;
  headers.forEach((h, i) => {
    doc.text(h, x + 3, y + 5);
    x += colWidths[i];
  });
  y += rowH;

  // Rows
  rows.forEach((row, ri) => {
    const bg = ri % 2 === 0 ? colors.light : colors.white;
    doc.setFillColor(...bg);
    x = startX;
    row.forEach((_, ci) => {
      doc.rect(x, y, colWidths[ci], rowH, 'F');
      x += colWidths[ci];
    });
    doc.setTextColor(...colors.dark);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    x = startX;
    row.forEach((cell, ci) => {
      doc.text(cell, x + 3, y + 5);
      x += colWidths[ci];
    });
    y += rowH;
  });

  return y;
}

export async function generateDisabilityReportPDF(data: DisabilityReportData) {
  const doc = new jsPDF();
  const logoBase64 = await getLogoBase64();
  const totalPages = 2;

  // ═══ Page 1 ═══
  drawHeader(doc, logoBase64);

  // Semester info
  let y = 48;
  doc.setTextColor(...colors.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.semesterName} — ${data.academicYear}`, 15, y);
  y += 10;

  // KPI Boxes
  const boxW = 42;
  const gap = 3;
  const sx = 15;
  drawStatBox(doc, sx, y, boxW, 'Active Students', String(data.stats.activeStudents), colors.primary);
  drawStatBox(doc, sx + boxW + gap, y, boxW, 'Total Exams', String(data.stats.totalExams), [59, 130, 170]);
  drawStatBox(doc, sx + (boxW + gap) * 2, y, boxW, 'Coverage Rate', `${data.stats.coverageRate}%`, colors.success);
  drawStatBox(doc, sx + (boxW + gap) * 3, y, boxW, 'Completed', String(data.stats.completedExams), colors.warning);
  y += 30;

  // Status Breakdown
  y = drawSectionTitle(doc, 'Exam Status Summary', y);
  const statusRows = [
    ['Pending', String(data.stats.pendingExams), pct(data.stats.pendingExams, data.stats.totalExams)],
    ['Assigned', String(data.stats.assignedExams), pct(data.stats.assignedExams, data.stats.totalExams)],
    ['Confirmed', String(data.stats.confirmedExams), pct(data.stats.confirmedExams, data.stats.totalExams)],
    ['Completed', String(data.stats.completedExams), pct(data.stats.completedExams, data.stats.totalExams)],
    ['Cancelled', String(data.stats.cancelledExams), pct(data.stats.cancelledExams, data.stats.totalExams)],
  ];
  y = drawTable(doc, ['Status', 'Count', 'Percentage'], statusRows, y, [60, 60, 60]);
  y += 8;

  // Disability Types
  if (data.disabilityTypes.length > 0) {
    y = drawSectionTitle(doc, 'Student Disability Types', y);
    const typeRows = data.disabilityTypes.map(t => [t.name, String(t.count)]);
    y = drawTable(doc, ['Disability Type', 'Students'], typeRows, y, [120, 60]);
    y += 8;
  }

  // Special Needs
  if (data.specialNeeds.length > 0) {
    y = drawSectionTitle(doc, 'Special Needs Distribution', y);
    const needRows = data.specialNeeds.map(n => [n.name, String(n.count)]);
    y = drawTable(doc, ['Need Type', 'Students'], needRows, y, [120, 60]);
  }

  drawFooter(doc, 1, totalPages);

  // ═══ Page 2 ═══
  doc.addPage();
  drawHeader(doc, logoBase64);
  y = 48;

  // Monthly Trends
  if (data.monthlyExams.length > 0) {
    y = drawSectionTitle(doc, 'Monthly Exam Trends', y);
    const monthRows = data.monthlyExams.map(m => [m.month, String(m.total), String(m.completed), pct(m.completed, m.total)]);
    y = drawTable(doc, ['Month', 'Total', 'Completed', 'Completion %'], monthRows, y, [50, 40, 40, 50]);
    y += 8;
  }

  // Top Volunteers
  if (data.topVolunteers.length > 0) {
    y = drawSectionTitle(doc, 'Top Volunteers — Disability Support', y);
    const volRows = data.topVolunteers.map((v, i) => [
      `#${i + 1}`, v.name, String(v.completed), String(v.total), pct(v.completed, v.total),
    ]);
    y = drawTable(doc, ['Rank', 'Volunteer', 'Completed', 'Assigned', 'Rate'], volRows, y, [20, 60, 30, 30, 40]);
    y += 8;
  }

  // Summary
  y = drawSectionTitle(doc, 'Summary', y);
  doc.setTextColor(...colors.dark);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const summaryLines = [
    `• Total registered students with disabilities: ${data.stats.totalStudents} (${data.stats.activeStudents} active)`,
    `• Total exams managed this semester: ${data.stats.totalExams}`,
    `• Volunteer assignment coverage rate: ${data.stats.coverageRate}%`,
    `• Total volunteer assignments: ${data.stats.totalAssignments}`,
    `• Exam completion rate: ${pct(data.stats.completedExams, data.stats.totalExams)}`,
  ];
  summaryLines.forEach(line => {
    doc.text(line, 22, y);
    y += 6;
  });

  drawFooter(doc, 2, totalPages);

  doc.save(`Disability_Report_${data.semesterName.replace(/\s/g, '_')}_${data.academicYear}.pdf`);
}

function pct(part: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}
