import jsPDF from 'jspdf';
import logoImage from '@/assets/logo-transparent.png';

interface FacultyReportData {
  facultyName: string;
  stats: {
    totalVolunteers: number;
    activeVolunteers: number;
    totalHours: number;
    completedOpportunities: number;
    avgRating: number;
    pendingApplications: number;
  };
  majorsDistribution: { name: string; count: number; percentage: number }[];
  topVolunteers: { name: string; universityId: string; hours: number; opportunities: number }[];
  monthlyTrend?: { month: string; volunteers: number; hours: number }[];
  yearDistribution?: { year: string; count: number }[];
}

// Professional color palette - Dean of Student Affairs Theme
const colors = {
  primary: [25, 130, 160],
  secondary: [59, 160, 190],
  accent: [234, 179, 8],
  dark: [30, 41, 59],
  muted: [100, 116, 139],
  light: [248, 250, 252],
  white: [255, 255, 255],
  danger: [239, 68, 68],
  info: [59, 130, 246],
  purple: [139, 92, 246],
};

async function getLogoBase64(bgColor?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (bgColor) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = logoImage;
  });
}

function truncateText(doc: jsPDF, text: string, maxWidth: number): string {
  if (!text) return '';
  if (doc.getTextWidth(text) <= maxWidth) return text;
  
  let truncated = text;
  while (doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

export async function generateFacultyReportPDF(data: FacultyReportData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Header
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.rect(0, 50, pageWidth, 3, 'F');

  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 12, 10, 24, 24);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FACULTY VOLUNTEER REPORT', 42, 18);
  doc.setFontSize(16);
  doc.text(truncateText(doc, data.facultyName.toUpperCase(), 100), 42, 30);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Dean of Student Affairs', 42, 40);
  doc.text('University of Jordan', 42, 46);

  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.setFontSize(8);
  doc.text(reportDate, pageWidth - margin, 46, { align: 'right' });

  yPos = 62;

  // Executive Summary
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('EXECUTIVE SUMMARY', margin, yPos);
  
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setLineWidth(1);
  doc.line(margin, yPos + 2, margin + 45, yPos + 2);
  
  yPos += 12;

  // Stats boxes - Row 1
  const boxWidth = (pageWidth - margin * 2 - 10) / 3;
  const boxHeight = 28;
  
  const row1Stats = [
    { label: 'Total Volunteers', value: data.stats.totalVolunteers.toString(), color: colors.primary, icon: 'users' },
    { label: 'Active Volunteers', value: data.stats.activeVolunteers.toString(), color: colors.secondary, icon: 'check' },
    { label: 'Pending Applications', value: data.stats.pendingApplications.toString(), color: colors.accent, icon: 'file' },
  ];

  row1Stats.forEach((stat, index) => {
    const x = margin + (boxWidth + 5) * index;
    
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 2, 2, 'F');
    
    doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.roundedRect(x, yPos, boxWidth, 4, 2, 2, 'F');
    doc.rect(x, yPos + 2, boxWidth, 2, 'F');
    
    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(stat.value, x + boxWidth / 2, yPos + 16, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.text(stat.label, x + boxWidth / 2, yPos + 23, { align: 'center' });
  });

  yPos += boxHeight + 6;

  // Stats boxes - Row 2
  const row2Stats = [
    { label: 'Total Hours', value: data.stats.totalHours.toLocaleString(), color: colors.info },
    { label: 'Opportunities Completed', value: data.stats.completedOpportunities.toString(), color: colors.purple },
    { label: 'Average Rating', value: data.stats.avgRating.toFixed(1) + '/5', color: colors.danger },
  ];

  row2Stats.forEach((stat, index) => {
    const x = margin + (boxWidth + 5) * index;
    
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 2, 2, 'F');
    
    doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.roundedRect(x, yPos, boxWidth, 4, 2, 2, 'F');
    doc.rect(x, yPos + 2, boxWidth, 2, 'F');
    
    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(stat.value, x + boxWidth / 2, yPos + 16, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.text(stat.label, x + boxWidth / 2, yPos + 23, { align: 'center' });
  });

  yPos += boxHeight + 10;

  // Majors Distribution
  if (data.majorsDistribution && data.majorsDistribution.length > 0) {
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('VOLUNTEERS BY MAJOR', margin, yPos);
    
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos + 2, margin + 42, yPos + 2);
    
    yPos += 8;

    const maxCount = Math.max(...data.majorsDistribution.map(m => m.count), 1);
    const barMaxWidth = pageWidth - margin * 2 - 75;

    data.majorsDistribution.slice(0, 6).forEach((major) => {
      const barWidth = Math.max((major.count / maxCount) * barMaxWidth, 2);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.text(truncateText(doc, major.name, 55), margin, yPos + 4);
      
      doc.setFillColor(230, 230, 230);
      doc.roundedRect(margin + 50, yPos, barMaxWidth, 5, 1, 1, 'F');
      
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.roundedRect(margin + 50, yPos, barWidth, 5, 1, 1, 'F');
      
      doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
      doc.text(`${major.count} (${major.percentage}%)`, pageWidth - margin, yPos + 4, { align: 'right' });
      
      yPos += 8;
    });

    yPos += 6;
  }

  // Top Volunteers Table
  if (data.topVolunteers && data.topVolunteers.length > 0) {
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOP PERFORMING VOLUNTEERS', margin, yPos);
    
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos + 2, margin + 52, yPos + 2);
    
    yPos += 6;

    // Table header
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 7, 2, 2, 'F');
    
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(8);
    doc.text('#', margin + 5, yPos + 5);
    doc.text('Volunteer Name', margin + 15, yPos + 5);
    doc.text('University ID', margin + 75, yPos + 5);
    doc.text('Hours', pageWidth - margin - 30, yPos + 5);
    doc.text('Opps', pageWidth - margin - 5, yPos + 5, { align: 'right' });
    
    yPos += 7;

    data.topVolunteers.slice(0, 10).forEach((volunteer, index) => {
      const bgColor = index % 2 === 0 ? colors.light : colors.white;
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.rect(margin, yPos, pageWidth - margin * 2, 6, 'F');
      
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.setFontSize(7);
      
      if (index < 3) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
      } else {
        doc.setFont('helvetica', 'normal');
      }
      doc.text((index + 1).toString(), margin + 5, yPos + 4);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.text(truncateText(doc, volunteer.name, 55), margin + 15, yPos + 4);
      doc.text(volunteer.universityId, margin + 75, yPos + 4);
      
      doc.setFont('helvetica', 'bold');
      doc.text(volunteer.hours.toString(), pageWidth - margin - 30, yPos + 4);
      
      doc.setFont('helvetica', 'normal');
      doc.text(volunteer.opportunities.toString(), pageWidth - margin - 5, yPos + 4, { align: 'right' });
      
      yPos += 6;
    });
  }

  // Academic Year Distribution
  if (data.yearDistribution && data.yearDistribution.length > 0) {
    yPos += 8;
    
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('VOLUNTEERS BY ACADEMIC YEAR', margin, yPos);
    
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos + 2, margin + 58, yPos + 2);
    
    yPos += 8;

    const totalYearCount = data.yearDistribution.reduce((sum, y) => sum + y.count, 0);
    const yearBoxWidth = (pageWidth - margin * 2 - 20) / Math.min(data.yearDistribution.length, 5);
    
    data.yearDistribution.slice(0, 5).forEach((year, index) => {
      const x = margin + (yearBoxWidth + 4) * index;
      const percentage = totalYearCount > 0 ? Math.round((year.count / totalYearCount) * 100) : 0;
      
      doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
      doc.roundedRect(x, yPos, yearBoxWidth, 20, 2, 2, 'F');
      
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(year.count.toString(), x + yearBoxWidth / 2, yPos + 10, { align: 'center' });
      
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
      doc.text(`${year.year} (${percentage}%)`, x + yearBoxWidth / 2, yPos + 16, { align: 'center' });
    });
  }

  // Footer
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');
  
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFontSize(7);
  doc.text('Dean of Student Affairs - University of Jordan', pageWidth / 2, pageHeight - 8, { align: 'center' });
  doc.setFontSize(6);
  doc.text(`Faculty Report - Generated on ${reportDate}`, pageWidth / 2, pageHeight - 4, { align: 'center' });

  doc.save(`${data.facultyName.replace(/\s+/g, '-').toLowerCase()}-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

export async function generateFacultyVolunteersListPDF(data: {
  facultyName: string;
  volunteers: { name: string; universityId: string; major: string; hours: number; status: string }[];
}): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Header
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');

  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 12, 8, 20, 20);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('VOLUNTEERS LIST', 38, 18);
  doc.setFontSize(10);
  doc.text(data.facultyName, 38, 28);

  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(reportDate, pageWidth - margin, 35, { align: 'right' });

  yPos = 50;

  // Summary
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Total Volunteers: ${data.volunteers.length}`, margin, yPos);
  
  const activeCount = data.volunteers.filter(v => v.status === 'Active').length;
  doc.text(`Active: ${activeCount}`, margin + 50, yPos);
  
  yPos += 8;

  // Table header
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 7, 1, 1, 'F');
  
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFontSize(7);
  doc.text('#', margin + 3, yPos + 5);
  doc.text('Name', margin + 10, yPos + 5);
  doc.text('University ID', margin + 60, yPos + 5);
  doc.text('Major', margin + 90, yPos + 5);
  doc.text('Hours', pageWidth - margin - 25, yPos + 5);
  doc.text('Status', pageWidth - margin - 5, yPos + 5, { align: 'right' });
  
  yPos += 7;

  const rowHeight = 5.5;
  const maxRowsPerPage = Math.floor((pageHeight - yPos - 20) / rowHeight);

  data.volunteers.forEach((volunteer, index) => {
    if (index > 0 && index % maxRowsPerPage === 0) {
      doc.addPage();
      yPos = 20;
      
      // Repeat header on new page
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 7, 1, 1, 'F');
      
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.setFontSize(7);
      doc.text('#', margin + 3, yPos + 5);
      doc.text('Name', margin + 10, yPos + 5);
      doc.text('University ID', margin + 60, yPos + 5);
      doc.text('Major', margin + 90, yPos + 5);
      doc.text('Hours', pageWidth - margin - 25, yPos + 5);
      doc.text('Status', pageWidth - margin - 5, yPos + 5, { align: 'right' });
      
      yPos += 7;
    }

    const bgColor = index % 2 === 0 ? colors.light : colors.white;
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.rect(margin, yPos, pageWidth - margin * 2, rowHeight, 'F');
    
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    
    doc.text((index + 1).toString(), margin + 3, yPos + 4);
    doc.text(truncateText(doc, volunteer.name, 45), margin + 10, yPos + 4);
    doc.text(volunteer.universityId, margin + 60, yPos + 4);
    doc.text(truncateText(doc, volunteer.major, 35), margin + 90, yPos + 4);
    doc.text(volunteer.hours.toString(), pageWidth - margin - 25, yPos + 4);
    
    // Status badge
    const statusColor = volunteer.status === 'Active' ? colors.secondary : colors.muted;
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(volunteer.status, pageWidth - margin - 5, yPos + 4, { align: 'right' });
    
    yPos += rowHeight;
  });

  // Footer on last page
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFontSize(7);
  doc.text('Dean of Student Affairs - University of Jordan', pageWidth / 2, pageHeight - 5, { align: 'center' });

  doc.save(`${data.facultyName.replace(/\s+/g, '-').toLowerCase()}-volunteers-list-${new Date().toISOString().split('T')[0]}.pdf`);
}

export async function generateFacultyHoursReportPDF(data: {
  facultyName: string;
  totalHours: number;
  volunteers: { name: string; universityId: string; hours: number; opportunities: number }[];
}): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Header
  doc.setFillColor(colors.info[0], colors.info[1], colors.info[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');

  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 12, 8, 20, 20);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('VOLUNTEER HOURS SUMMARY', 38, 18);
  doc.setFontSize(10);
  doc.text(data.facultyName, 38, 28);

  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(reportDate, pageWidth - margin, 35, { align: 'right' });

  yPos = 50;

  // Total hours highlight
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 20, 3, 3, 'F');
  
  doc.setTextColor(colors.info[0], colors.info[1], colors.info[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text(data.totalHours.toLocaleString(), pageWidth / 2, yPos + 13, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  doc.text('Total Volunteer Hours', pageWidth / 2, yPos + 18, { align: 'center' });

  yPos += 28;

  // Table
  doc.setFillColor(colors.info[0], colors.info[1], colors.info[2]);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 7, 1, 1, 'F');
  
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFontSize(7);
  doc.text('#', margin + 5, yPos + 5);
  doc.text('Volunteer Name', margin + 15, yPos + 5);
  doc.text('University ID', margin + 80, yPos + 5);
  doc.text('Hours', pageWidth - margin - 30, yPos + 5);
  doc.text('Opportunities', pageWidth - margin - 5, yPos + 5, { align: 'right' });
  
  yPos += 7;

  data.volunteers.forEach((volunteer, index) => {
    const bgColor = index % 2 === 0 ? colors.light : colors.white;
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.rect(margin, yPos, pageWidth - margin * 2, 6, 'F');
    
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    doc.text((index + 1).toString(), margin + 5, yPos + 4);
    doc.text(truncateText(doc, volunteer.name, 60), margin + 15, yPos + 4);
    doc.text(volunteer.universityId, margin + 80, yPos + 4);
    
    doc.setFont('helvetica', 'bold');
    doc.text(volunteer.hours.toString(), pageWidth - margin - 30, yPos + 4);
    
    doc.setFont('helvetica', 'normal');
    doc.text(volunteer.opportunities.toString(), pageWidth - margin - 5, yPos + 4, { align: 'right' });
    
    yPos += 6;
  });

  // Footer
  doc.setFillColor(colors.info[0], colors.info[1], colors.info[2]);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFontSize(7);
  doc.text('Dean of Student Affairs - University of Jordan', pageWidth / 2, pageHeight - 5, { align: 'center' });

  doc.save(`${data.facultyName.replace(/\s+/g, '-').toLowerCase()}-hours-report-${new Date().toISOString().split('T')[0]}.pdf`);
}
