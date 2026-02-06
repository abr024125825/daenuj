import jsPDF from 'jspdf';
import logoImage from '@/assets/logo.webp';

interface ReportData {
  stats: {
    totalVolunteers: number;
    activeVolunteers: number;
    totalHours: number;
    totalOpportunities: number;
    completedOpportunities: number;
    totalCertificates: number;
    totalAttendance: number;
  };
  monthlyData: { month: string; volunteers: number; hours: number; certificates: number }[];
  facultyBreakdown: { name: string; count: number }[];
  topVolunteers: { name: string; hours: number; opportunities: number }[];
}

// Professional color palette - consistent with all reports
const colors = {
  primary: [16, 78, 58],
  secondary: [34, 197, 94],
  accent: [234, 179, 8],
  dark: [30, 41, 59],
  muted: [100, 116, 139],
  light: [248, 250, 252],
  white: [255, 255, 255],
  danger: [239, 68, 68],
};

// Convert image to base64
async function getLogoBase64(): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
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

// Helper function to truncate text with ellipsis
function truncateText(doc: jsPDF, text: string, maxWidth: number): string {
  if (!text) return '';
  if (doc.getTextWidth(text) <= maxWidth) return text;
  
  let truncated = text;
  while (doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

export async function generateReportPDF(data: ReportData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Header with gradient effect
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.rect(0, 50, pageWidth, 3, 'F');

  // Try to add logo
  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 12, 10, 24, 24);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  // Header text
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('VOLUNTEER PROGRAM', 42, 18);
  doc.setFontSize(20);
  doc.text('ANNUAL REPORT', 42, 30);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Dean of Student Affairs', 42, 40);
  doc.text('University of Jordan', 42, 46);

  // Report date on right
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.setFontSize(8);
  doc.text(reportDate, pageWidth - margin, 46, { align: 'right' });

  yPos = 62;

  // Executive Summary Section
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('EXECUTIVE SUMMARY', margin, yPos);
  
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setLineWidth(1);
  doc.line(margin, yPos + 2, margin + 45, yPos + 2);
  
  yPos += 12;

  // Key Statistics boxes - Primary row
  const boxWidth = (pageWidth - margin * 2 - 15) / 4;
  const boxHeight = 24;
  const primaryStats = [
    { label: 'Total Volunteers', value: data.stats.totalVolunteers.toString(), color: colors.primary },
    { label: 'Active Volunteers', value: data.stats.activeVolunteers.toString(), color: colors.secondary },
    { label: 'Total Hours', value: data.stats.totalHours.toString(), color: colors.danger },
    { label: 'Certificates', value: data.stats.totalCertificates.toString(), color: colors.dark },
  ];

  primaryStats.forEach((stat, index) => {
    const x = margin + (boxWidth + 5) * index;
    
    // Box background
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 2, 2, 'F');
    
    // Top accent bar
    doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.roundedRect(x, yPos, boxWidth, 4, 2, 2, 'F');
    doc.rect(x, yPos + 2, boxWidth, 2, 'F');
    
    // Value
    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(stat.value, x + boxWidth / 2, yPos + 14, { align: 'center' });
    
    // Label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.text(stat.label, x + boxWidth / 2, yPos + 20, { align: 'center' });
  });

  yPos += boxHeight + 8;

  // Secondary stats row
  const secondaryStats = [
    { label: 'Total Opportunities', value: data.stats.totalOpportunities.toString() },
    { label: 'Completed', value: data.stats.completedOpportunities.toString() },
    { label: 'Attendance Records', value: data.stats.totalAttendance.toString() },
    { label: 'Engagement Rate', value: `${Math.round((data.stats.activeVolunteers / Math.max(data.stats.totalVolunteers, 1)) * 100)}%` },
  ];

  secondaryStats.forEach((stat, index) => {
    const x = margin + (boxWidth + 5) * index;
    
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(x, yPos, boxWidth, 18, 2, 2, 'F');
    
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(stat.value, x + boxWidth / 2, yPos + 9, { align: 'center' });
    
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.text(stat.label, x + boxWidth / 2, yPos + 14, { align: 'center' });
  });

  yPos += 28;

  // Faculty Breakdown Section
  if (data.facultyBreakdown && data.facultyBreakdown.length > 0) {
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('VOLUNTEERS BY FACULTY', margin, yPos);
    
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos + 2, margin + 42, yPos + 2);
    
    yPos += 8;

    const maxCount = Math.max(...data.facultyBreakdown.map(f => f.count), 1);
    const barMaxWidth = pageWidth - margin * 2 - 65;
    const maxNameWidth = 55;

    data.facultyBreakdown.slice(0, 5).forEach((faculty) => {
      const barWidth = Math.max((faculty.count / maxCount) * barMaxWidth, 2);
      
      // Faculty name - truncated
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.text(truncateText(doc, faculty.name, maxNameWidth), margin, yPos + 4);
      
      // Bar background
      doc.setFillColor(230, 230, 230);
      doc.roundedRect(margin + 48, yPos, barMaxWidth, 5, 1, 1, 'F');
      
      // Bar fill
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.roundedRect(margin + 48, yPos, barWidth, 5, 1, 1, 'F');
      
      // Count
      doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
      doc.text(faculty.count.toString(), pageWidth - margin, yPos + 4, { align: 'right' });
      
      yPos += 8;
    });

    yPos += 5;
  }

  // Top Volunteers Section
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
    doc.text('Hours', pageWidth - margin - 35, yPos + 5);
    doc.text('Opportunities', pageWidth - margin - 5, yPos + 5, { align: 'right' });
    
    yPos += 7;

    // Table rows
    const maxVolNameWidth = pageWidth - margin * 2 - 65;
    data.topVolunteers.slice(0, 8).forEach((volunteer, index) => {
      const bgColor = index % 2 === 0 ? colors.light : colors.white;
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.rect(margin, yPos, pageWidth - margin * 2, 5.5, 'F');
      
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      
      // Rank with medal emojis for top 3
      const rankText = index === 0 ? '1' : index === 1 ? '2' : index === 2 ? '3' : (index + 1).toString();
      if (index < 3) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
      }
      doc.text(rankText, margin + 5, yPos + 4);
      
      // Reset to normal
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      
      // Name - truncated
      doc.text(truncateText(doc, volunteer.name, maxVolNameWidth), margin + 15, yPos + 4);
      
      // Hours
      doc.setFont('helvetica', 'bold');
      doc.text(volunteer.hours.toString(), pageWidth - margin - 35, yPos + 4);
      
      // Opportunities
      doc.setFont('helvetica', 'normal');
      doc.text(volunteer.opportunities.toString(), pageWidth - margin - 5, yPos + 4, { align: 'right' });
      
      yPos += 5.5;
    });
  }

  // Footer
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');
  
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFontSize(7);
  doc.text('Dean of Student Affairs - University of Jordan', pageWidth / 2, pageHeight - 8, { align: 'center' });
  doc.setFontSize(6);
  doc.text('This is an official report generated automatically', pageWidth / 2, pageHeight - 4, { align: 'center' });

  // Save the PDF
  doc.save(`volunteer-report-${new Date().toISOString().split('T')[0]}.pdf`);
}
