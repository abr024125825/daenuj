import jsPDF from 'jspdf';
import logoImage from '@/assets/logo-transparent.png';
import QRCode from 'qrcode';
import { format } from 'date-fns';

interface DisabilityCertificateData {
  volunteerName: string;
  totalHours: number;
  certificateNumber: string;
  issuedAt: string;
  assignmentsCount: number;
  studentsHelped: number;
  dateRange?: { start: string; end: string };
}

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

async function generateQRCodeBase64(certificateNumber: string): Promise<string> {
  const verifyUrl = `${window.location.origin}/verify?cert=${certificateNumber}`;
  return await QRCode.toDataURL(verifyUrl, {
    width: 150,
    margin: 1,
    color: { dark: '#145064', light: '#ffffff' },
  });
}

export async function generateDisabilityCertificatePDF(data: DisabilityCertificateData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Color palette - Disability Support themed
  const deepTeal = [20, 80, 100];
  const brightTeal = [25, 140, 170];
  const gold = [234, 179, 8];
  const warmPurple = [120, 80, 160];
  const slate = [51, 65, 85];
  const white = [255, 255, 255];

  // Background gradient - deep teal to lighter
  for (let i = 0; i < pageHeight; i += 2) {
    const ratio = i / pageHeight;
    const r = Math.floor(deepTeal[0] + (240 - deepTeal[0]) * ratio * 0.25);
    const g = Math.floor(deepTeal[1] + (240 - deepTeal[1]) * ratio * 0.25);
    const b = Math.floor(deepTeal[2] + (240 - deepTeal[2]) * ratio * 0.25);
    doc.setFillColor(r, g, b);
    doc.rect(0, i, pageWidth, 2, 'F');
  }

  // Main certificate card
  const cardMargin = 16;
  const cardWidth = pageWidth - cardMargin * 2;
  const cardHeight = pageHeight - cardMargin * 2 - 14;

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(cardMargin, cardMargin, cardWidth, cardHeight, 8, 8, 'F');

  // Gold outer border
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(2.5);
  doc.roundedRect(cardMargin + 4, cardMargin + 4, cardWidth - 8, cardHeight - 8, 6, 6, 'S');

  // Inner decorative border
  doc.setDrawColor(brightTeal[0], brightTeal[1], brightTeal[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(cardMargin + 8, cardMargin + 8, cardWidth - 16, cardHeight - 16, 4, 4, 'S');

  // Decorative corner elements
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(1.5);
  const cornerSize = 18;
  const corners = [
    { x: cardMargin + 10, y: cardMargin + 10 },
    { x: pageWidth - cardMargin - 10, y: cardMargin + 10 },
    { x: cardMargin + 10, y: cardMargin + cardHeight - 10 },
    { x: pageWidth - cardMargin - 10, y: cardMargin + cardHeight - 10 },
  ];
  // Top-left
  doc.line(corners[0].x, corners[0].y, corners[0].x + cornerSize, corners[0].y);
  doc.line(corners[0].x, corners[0].y, corners[0].x, corners[0].y + cornerSize);
  // Top-right
  doc.line(corners[1].x, corners[1].y, corners[1].x - cornerSize, corners[1].y);
  doc.line(corners[1].x, corners[1].y, corners[1].x, corners[1].y + cornerSize);
  // Bottom-left
  doc.line(corners[2].x, corners[2].y, corners[2].x + cornerSize, corners[2].y);
  doc.line(corners[2].x, corners[2].y, corners[2].x, corners[2].y - cornerSize);
  // Bottom-right
  doc.line(corners[3].x, corners[3].y, corners[3].x - cornerSize, corners[3].y);
  doc.line(corners[3].x, corners[3].y, corners[3].x, corners[3].y - cornerSize);

  // Logo
  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 13, 22, 26, 26);
  } catch (e) {
    console.warn('Logo load failed:', e);
  }

  // Organization
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(deepTeal[0], deepTeal[1], deepTeal[2]);
  doc.text('DEAN OF STUDENT AFFAIRS', pageWidth / 2, 53, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text('University of Jordan', pageWidth / 2, 59, { align: 'center' });

  // Certificate badge
  doc.setFillColor(deepTeal[0], deepTeal[1], deepTeal[2]);
  doc.roundedRect(pageWidth / 2 - 72, 63, 144, 16, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(white[0], white[1], white[2]);
  doc.text('CERTIFICATE OF DISABILITY SUPPORT', pageWidth / 2, 72, { align: 'center' });
  doc.setFontSize(7);
  doc.text('VOLUNTEER SERVICE', pageWidth / 2, 77, { align: 'center' });

  // Decorative line with accessibility symbol
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - 70, 83, pageWidth / 2 + 70, 83);
  doc.setFillColor(warmPurple[0], warmPurple[1], warmPurple[2]);
  doc.circle(pageWidth / 2, 83, 2, 'F');

  // Certification text
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text('This certificate is proudly awarded to', pageWidth / 2, 91, { align: 'center' });

  // Volunteer name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(deepTeal[0], deepTeal[1], deepTeal[2]);
  doc.text(data.volunteerName, pageWidth / 2, 103, { align: 'center' });

  // Name underline
  const nameWidth = doc.getTextWidth(data.volunteerName);
  doc.setDrawColor(brightTeal[0], brightTeal[1], brightTeal[2]);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - nameWidth / 2, 106, pageWidth / 2 + nameWidth / 2, 106);

  // Service description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text('for dedicated and compassionate volunteer service supporting', pageWidth / 2, 114, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(warmPurple[0], warmPurple[1], warmPurple[2]);
  doc.text('Students with Disabilities - Exam Assistance Program', pageWidth / 2, 122, { align: 'center' });

  // Statistics cards
  const statsY = 130;
  const cardW = 50;
  const statsCards = [
    { label: 'Total Hours', value: `${data.totalHours.toFixed(1)}`, color: brightTeal },
    { label: 'Exams Assisted', value: `${data.assignmentsCount}`, color: deepTeal },
    { label: 'Students Helped', value: `${data.studentsHelped}`, color: warmPurple },
  ];

  const startX = pageWidth / 2 - ((statsCards.length * cardW + (statsCards.length - 1) * 8) / 2);

  statsCards.forEach((card, idx) => {
    const x = startX + idx * (cardW + 8);

    // Card bg
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, statsY, cardW, 22, 3, 3, 'F');

    // Top accent
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.roundedRect(x, statsY, cardW, 4, 3, 3, 'F');
    doc.rect(x, statsY + 2, cardW, 2, 'F');

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.value, x + cardW / 2, statsY + 13, { align: 'center' });

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(card.label, x + cardW / 2, statsY + 19, { align: 'center' });
  });

  // Date range if provided
  if (data.dateRange) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(
      `Service Period: ${data.dateRange.start} — ${data.dateRange.end}`,
      pageWidth / 2,
      statsY + 28,
      { align: 'center' }
    );
  }

  // Appreciation message
  const msgY = data.dateRange ? statsY + 34 : statsY + 30;

  const qrSize = 22;
  const qrX = pageWidth - cardMargin - qrSize - 20;
  const qrY = msgY - 3;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  const msgMaxW = qrX - (cardMargin + 25) - 10;
  doc.text(
    'In recognition of your empathy, dedication, and invaluable support to students with disabilities during their examinations. Your selfless contribution exemplifies the true spirit of community service.',
    cardMargin + 25,
    msgY,
    { maxWidth: msgMaxW }
  );

  // QR Code
  try {
    const qrCodeBase64 = await generateQRCodeBase64(data.certificateNumber);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 12, 3, 3, 'F');
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.8);
    doc.roundedRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 12, 3, 3, 'S');
    doc.addImage(qrCodeBase64, 'PNG', qrX, qrY, qrSize, qrSize);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(deepTeal[0], deepTeal[1], deepTeal[2]);
    doc.text('Scan to Verify', qrX + qrSize / 2, qrY + qrSize + 5, { align: 'center' });
  } catch (e) {
    console.warn('QR code generation failed:', e);
  }

  // Footer
  doc.setFillColor(deepTeal[0], deepTeal[1], deepTeal[2]);
  doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(white[0], white[1], white[2]);
  doc.text(`Certificate No: ${data.certificateNumber}`, 15, pageHeight - 5);
  doc.text(`Issued: ${data.issuedAt}`, pageWidth - 15, pageHeight - 5, { align: 'right' });
  doc.text(
    'Disability Support Certificate • Verify at: ' + window.location.origin + '/verify',
    pageWidth / 2,
    pageHeight - 5,
    { align: 'center' }
  );

  doc.save(`disability-support-certificate-${data.certificateNumber}.pdf`);
}
