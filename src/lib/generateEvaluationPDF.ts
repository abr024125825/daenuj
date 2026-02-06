import jsPDF from 'jspdf';
import logoImage from '@/assets/logo.webp';
import { format } from 'date-fns';

interface EvaluationData {
  opportunityTitle: string;
  opportunityDate: string;
  location: string;
  evaluations: {
    volunteerName: string;
    ratings: { category: string; score: number }[];
    comments: string | null;
    createdAt: string;
    type: 'supervisor_rating' | 'volunteer_feedback';
  }[];
  summary: {
    totalEvaluations: number;
    averageRating: number;
    categoryAverages: { category: string; average: number }[];
  };
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

// Helper function to truncate text
function truncateText(doc: jsPDF, text: string, maxWidth: number): string {
  if (!text) return '';
  if (doc.getTextWidth(text) <= maxWidth) return text;
  
  let truncated = text;
  while (doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

export async function generateEvaluationPDF(data: EvaluationData): Promise<void> {
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
  doc.setFontSize(14);
  doc.text('OPPORTUNITY EVALUATION', 42, 18);
  doc.setFontSize(18);
  doc.text('REPORT', 42, 28);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Dean of Student Affairs', 42, 38);
  doc.text('University of Jordan', 42, 44);

  // Report date on right
  const reportDate = format(new Date(), 'MMMM dd, yyyy');
  doc.setFontSize(8);
  doc.text(reportDate, pageWidth - margin, 46, { align: 'right' });

  yPos = 62;

  // Opportunity Info Section
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('OPPORTUNITY DETAILS', margin, yPos);
  
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setLineWidth(1);
  doc.line(margin, yPos + 2, margin + 45, yPos + 2);
  
  yPos += 10;

  // Info box
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 22, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.text(truncateText(doc, data.opportunityTitle, pageWidth - margin * 2 - 10), margin + 5, yPos + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  doc.text(`Date: ${data.opportunityDate}`, margin + 5, yPos + 15);
  doc.text(`Location: ${truncateText(doc, data.location, 80)}`, margin + 70, yPos + 15);

  yPos += 30;

  // Summary Statistics
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('EVALUATION SUMMARY', margin, yPos);
  
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos + 2, margin + 42, yPos + 2);
  
  yPos += 10;

  // Summary stats boxes
  const boxWidth = (pageWidth - margin * 2 - 10) / 3;
  const boxHeight = 22;

  const summaryStats = [
    { label: 'Total Evaluations', value: data.summary.totalEvaluations.toString(), color: colors.primary },
    { label: 'Average Rating', value: `${data.summary.averageRating.toFixed(1)}/5`, color: colors.secondary },
    { label: 'Satisfaction', value: `${Math.round((data.summary.averageRating / 5) * 100)}%`, color: colors.info },
  ];

  summaryStats.forEach((stat, index) => {
    const x = margin + (boxWidth + 5) * index;
    
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 2, 2, 'F');
    
    doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.roundedRect(x, yPos, boxWidth, 4, 2, 2, 'F');
    doc.rect(x, yPos + 2, boxWidth, 2, 'F');
    
    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(stat.value, x + boxWidth / 2, yPos + 13, { align: 'center' });
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.text(stat.label, x + boxWidth / 2, yPos + 19, { align: 'center' });
  });

  yPos += boxHeight + 10;

  // Category Averages
  if (data.summary.categoryAverages.length > 0) {
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('RATINGS BY CATEGORY', margin, yPos);
    
    yPos += 7;

    const barMaxWidth = pageWidth - margin * 2 - 60;
    
    data.summary.categoryAverages.forEach((cat) => {
      const barWidth = Math.max((cat.average / 5) * barMaxWidth, 2);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.text(truncateText(doc, cat.category, 45), margin, yPos + 4);
      
      // Bar background
      doc.setFillColor(230, 230, 230);
      doc.roundedRect(margin + 48, yPos, barMaxWidth, 5, 1, 1, 'F');
      
      // Bar fill - color based on score
      const barColor = cat.average >= 4 ? colors.secondary : cat.average >= 3 ? colors.accent : colors.danger;
      doc.setFillColor(barColor[0], barColor[1], barColor[2]);
      doc.roundedRect(margin + 48, yPos, barWidth, 5, 1, 1, 'F');
      
      // Score
      doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
      doc.text(`${cat.average.toFixed(1)}/5`, pageWidth - margin, yPos + 4, { align: 'right' });
      
      yPos += 8;
    });

    yPos += 5;
  }

  // Individual Evaluations
  if (data.evaluations.length > 0) {
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DETAILED EVALUATIONS', margin, yPos);
    
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos + 2, margin + 38, yPos + 2);
    
    yPos += 8;

    // Table header
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 7, 2, 2, 'F');
    
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(7);
    doc.text('Volunteer', margin + 5, yPos + 5);
    doc.text('Type', margin + 55, yPos + 5);
    doc.text('Avg Rating', margin + 85, yPos + 5);
    doc.text('Date', pageWidth - margin - 25, yPos + 5);
    
    yPos += 7;

    // Table rows
    data.evaluations.slice(0, 12).forEach((evaluation, index) => {
      if (yPos > pageHeight - 40) {
        // Add new page if needed
        doc.addPage();
        yPos = margin;
      }

      const bgColor = index % 2 === 0 ? colors.light : colors.white;
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.rect(margin, yPos, pageWidth - margin * 2, 6, 'F');
      
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      
      // Name
      doc.text(truncateText(doc, evaluation.volunteerName, 45), margin + 5, yPos + 4);
      
      // Type
      const typeLabel = evaluation.type === 'supervisor_rating' ? 'Supervisor' : 'Volunteer';
      const typeColor = evaluation.type === 'supervisor_rating' ? colors.primary : colors.info;
      doc.setTextColor(typeColor[0], typeColor[1], typeColor[2]);
      doc.text(typeLabel, margin + 55, yPos + 4);
      
      // Avg Rating
      const avgRating = evaluation.ratings.reduce((sum, r) => sum + r.score, 0) / evaluation.ratings.length;
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`${avgRating.toFixed(1)}/5`, margin + 85, yPos + 4);
      
      // Date
      doc.setFont('helvetica', 'normal');
      doc.text(format(new Date(evaluation.createdAt), 'MMM dd'), pageWidth - margin - 25, yPos + 4);
      
      yPos += 6;

      // Comments if any
      if (evaluation.comments) {
        doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
        doc.rect(margin, yPos, pageWidth - margin * 2, 5, 'F');
        
        doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'italic');
        doc.text(`"${truncateText(doc, evaluation.comments, pageWidth - margin * 2 - 10)}"`, margin + 5, yPos + 3.5);
        
        yPos += 5;
      }
    });
  }

  // Footer
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');
  
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFontSize(7);
  doc.text('Dean of Student Affairs - University of Jordan', pageWidth / 2, pageHeight - 8, { align: 'center' });
  doc.setFontSize(6);
  doc.text('Evaluation Report - Generated automatically', pageWidth / 2, pageHeight - 4, { align: 'center' });

  // Save the PDF
  const sanitizedTitle = data.opportunityTitle.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30);
  doc.save(`evaluation-report-${sanitizedTitle}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
