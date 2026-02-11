import jsPDF from 'jspdf';
import logoImage from '@/assets/logo-transparent.png';
import QRCode from 'qrcode';

interface DisabilityCertificateData {
  volunteerName: string;
  totalHours: number;
  certificateNumber: string;
  issuedAt: string;
  assignmentsCount: number;
  studentsHelped: number;
  dateRange?: { start: string; end: string };
}

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

async function generateQRCodeBase64(certificateNumber: string): Promise<string> {
  const verifyUrl = `${window.location.origin}/verify?cert=${certificateNumber}`;
  return await QRCode.toDataURL(verifyUrl, {
    width: 150,
    margin: 1,
    color: { dark: '#145064', light: '#ffffff' },
  });
}

// Draw the international accessibility symbol (wheelchair icon)
function drawAccessibilitySymbol(doc: jsPDF, cx: number, cy: number, size: number, color: number[]) {
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setFillColor(color[0], color[1], color[2]);
  const s = size;
  // Head circle
  doc.circle(cx + s * 0.05, cy - s * 0.35, s * 0.1, 'F');
  // Body line
  doc.setLineWidth(s * 0.06);
  doc.line(cx + s * 0.05, cy - s * 0.25, cx + s * 0.05, cy + s * 0.05);
  // Arm
  doc.line(cx + s * 0.05, cy - s * 0.1, cx + s * 0.25, cy - s * 0.1);
  doc.line(cx + s * 0.25, cy - s * 0.1, cx + s * 0.3, cy + s * 0.15);
  // Wheel
  doc.setFillColor(255, 255, 255);
  doc.circle(cx - s * 0.05, cy + s * 0.15, s * 0.2, 'S');
  // Leg
  doc.line(cx + s * 0.05, cy + s * 0.05, cx - s * 0.1, cy + s * 0.25);
}

// Draw a heart with hands symbol (care/support)
function drawHeartHands(doc: jsPDF, cx: number, cy: number, size: number, color: number[]) {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(size * 0.04);
  const s = size * 0.5;
  // Simplified heart shape using lines
  doc.circle(cx - s * 0.2, cy - s * 0.1, s * 0.22, 'F');
  doc.circle(cx + s * 0.2, cy - s * 0.1, s * 0.22, 'F');
  // Triangle bottom of heart
  doc.setFillColor(color[0], color[1], color[2]);
  const x1 = cx - s * 0.42;
  const y1 = cy - s * 0.02;
  const x2 = cx + s * 0.42;
  const y2 = cy - s * 0.02;
  const x3 = cx;
  const y3 = cy + s * 0.45;
  doc.triangle(x1, y1, x2, y2, x3, y3, 'F');
}

// Draw a star
function drawStar(doc: jsPDF, cx: number, cy: number, outerR: number, innerR: number, color: number[]) {
  doc.setFillColor(color[0], color[1], color[2]);
  const points: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / 2) + (i * Math.PI / 5);
    points.push([cx + r * Math.cos(angle), cy - r * Math.sin(angle)]);
  }
  // Draw using lines
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.3);
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];
    doc.line(points[i][0], points[i][1], next[0], next[1]);
  }
}

export async function generateDisabilityCertificatePDF(data: DisabilityCertificateData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Color palette
  const deepBlue = [20, 80, 100];
  const brightTeal = [25, 150, 180];
  const gold = [212, 175, 55];
  const inclusionPurple = [100, 60, 150];
  const warmOrange = [230, 126, 34];
  const softGreen = [39, 174, 96];
  const slate = [51, 65, 85];
  const white = [255, 255, 255];
  const lightBg = [248, 250, 252];

  // === BACKGROUND ===
  // Deep blue gradient background
  for (let i = 0; i < pageHeight; i += 1) {
    const ratio = i / pageHeight;
    const r = Math.floor(deepBlue[0] + (15) * ratio);
    const g = Math.floor(deepBlue[1] - 10 * ratio);
    const b = Math.floor(deepBlue[2] + 20 * ratio);
    doc.setFillColor(r, g, b);
    doc.rect(0, i, pageWidth, 1, 'F');
  }

  // === MAIN CARD ===
  const cardMargin = 14;
  const cardWidth = pageWidth - cardMargin * 2;
  const cardHeight = pageHeight - cardMargin * 2 - 12;

  // White card
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(cardMargin, cardMargin, cardWidth, cardHeight, 6, 6, 'F');

  // === BORDERS ===
  // Gold outer border
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(2);
  doc.roundedRect(cardMargin + 3, cardMargin + 3, cardWidth - 6, cardHeight - 6, 5, 5, 'S');

  // Teal inner border
  doc.setDrawColor(brightTeal[0], brightTeal[1], brightTeal[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(cardMargin + 7, cardMargin + 7, cardWidth - 14, cardHeight - 14, 4, 4, 'S');

  // === CORNER DECORATIONS with accessibility theme ===
  // Top-left: accessibility symbol
  drawAccessibilitySymbol(doc, cardMargin + 14, cardMargin + 15, 5, brightTeal);

  // Top-right: heart hands
  drawHeartHands(doc, pageWidth - cardMargin - 14, cardMargin + 14, 8, inclusionPurple);

  // Bottom corners: decorative L-shapes with gold
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(1.5);
  const cSize = 14;
  // Bottom-left
  doc.line(cardMargin + 9, cardMargin + cardHeight - 9, cardMargin + 9 + cSize, cardMargin + cardHeight - 9);
  doc.line(cardMargin + 9, cardMargin + cardHeight - 9, cardMargin + 9, cardMargin + cardHeight - 9 - cSize);
  // Bottom-right
  doc.line(pageWidth - cardMargin - 9, cardMargin + cardHeight - 9, pageWidth - cardMargin - 9 - cSize, cardMargin + cardHeight - 9);
  doc.line(pageWidth - cardMargin - 9, cardMargin + cardHeight - 9, pageWidth - cardMargin - 9, cardMargin + cardHeight - 9 - cSize);

  // === TOP ACCESSIBILITY BANNER ===
  const bannerY = cardMargin + 12;
  const bannerH = 8;
  doc.setFillColor(235, 248, 252);
  doc.roundedRect(cardMargin + 30, bannerY, cardWidth - 60, bannerH, 2, 2, 'F');

  // Small accessibility icons across the top
  const iconColors = [brightTeal, inclusionPurple, warmOrange, softGreen, gold];
  const iconSpacing = (cardWidth - 80) / 6;
  for (let i = 0; i < 5; i++) {
    const iconX = cardMargin + 50 + i * iconSpacing;
    drawStar(doc, iconX, bannerY + bannerH / 2, 2.5, 1.2, iconColors[i]);
  }

  // === LOGO ===
  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 12, 24, 24, 24);
  } catch (e) {
    console.warn('Logo load failed:', e);
  }

  // === HEADER TEXT ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(deepBlue[0], deepBlue[1], deepBlue[2]);
  doc.text('DEAN OF STUDENT AFFAIRS', pageWidth / 2, 52, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text('The University of Jordan', pageWidth / 2, 57, { align: 'center' });

  // === TITLE BADGE with accessibility symbol ===
  const titleY = 61;
  const titleW = 160;
  const titleH = 18;
  const titleX = pageWidth / 2 - titleW / 2;

  // Gradient-like badge background
  doc.setFillColor(deepBlue[0], deepBlue[1], deepBlue[2]);
  doc.roundedRect(titleX, titleY, titleW, titleH, 3, 3, 'F');

  // Purple accent strip on left
  doc.setFillColor(inclusionPurple[0], inclusionPurple[1], inclusionPurple[2]);
  doc.roundedRect(titleX, titleY, 5, titleH, 3, 0, 'F');
  doc.rect(titleX + 3, titleY, 2, titleH, 'F');

  // Orange accent strip on right
  doc.setFillColor(warmOrange[0], warmOrange[1], warmOrange[2]);
  doc.roundedRect(titleX + titleW - 5, titleY, 5, titleH, 0, 3, 'F');
  doc.rect(titleX + titleW - 5, titleY, 2, titleH, 'F');

  // Accessibility wheelchair icon in the badge
  drawAccessibilitySymbol(doc, titleX + 16, titleY + 10, 5, white);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(white[0], white[1], white[2]);
  doc.text('DISABILITY SUPPORT SERVICE', pageWidth / 2 + 5, titleY + 8, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text('CERTIFICATE OF APPRECIATION', pageWidth / 2 + 5, titleY + 14, { align: 'center' });

  // === DECORATIVE DIVIDER ===
  const divY = titleY + titleH + 4;
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.6);
  doc.line(pageWidth / 2 - 60, divY, pageWidth / 2 - 5, divY);
  doc.line(pageWidth / 2 + 5, divY, pageWidth / 2 + 60, divY);
  // Center heart
  drawHeartHands(doc, pageWidth / 2, divY, 6, gold);

  // === PRESENTED TO ===
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text('This certificate is proudly presented to', pageWidth / 2, divY + 8, { align: 'center' });

  // === VOLUNTEER NAME ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(deepBlue[0], deepBlue[1], deepBlue[2]);
  doc.text(data.volunteerName, pageWidth / 2, divY + 19, { align: 'center' });

  // Name underline with gradient effect
  const nameWidth = doc.getTextWidth(data.volunteerName);
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(1.2);
  doc.line(pageWidth / 2 - nameWidth / 2, divY + 22, pageWidth / 2 + nameWidth / 2, divY + 22);
  // Teal accent line below
  doc.setDrawColor(brightTeal[0], brightTeal[1], brightTeal[2]);
  doc.setLineWidth(0.4);
  doc.line(pageWidth / 2 - nameWidth / 2 + 5, divY + 24, pageWidth / 2 + nameWidth / 2 - 5, divY + 24);

  // === SERVICE DESCRIPTION ===
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text('In recognition of outstanding volunteer service and compassionate support to', pageWidth / 2, divY + 31, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(inclusionPurple[0], inclusionPurple[1], inclusionPurple[2]);
  doc.text('Students with Disabilities — Exam Assistance Program', pageWidth / 2, divY + 38, { align: 'center' });

  // === STATISTICS CARDS ===
  const statsY = divY + 44;
  const cardW = 48;
  const cardGap = 10;
  const statsCards = [
    { label: 'Volunteer Hours', value: `${data.totalHours.toFixed(1)}`, color: brightTeal, icon: '⏱' },
    { label: 'Exams Assisted', value: `${data.assignmentsCount}`, color: deepBlue, icon: '📋' },
    { label: 'Students Supported', value: `${data.studentsHelped}`, color: inclusionPurple, icon: '♿' },
  ];

  const totalStatsWidth = statsCards.length * cardW + (statsCards.length - 1) * cardGap;
  const startX = pageWidth / 2 - totalStatsWidth / 2;

  statsCards.forEach((card, idx) => {
    const x = startX + idx * (cardW + cardGap);

    // Card background
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.roundedRect(x, statsY, cardW, 24, 3, 3, 'F');

    // Top colored accent
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.roundedRect(x, statsY, cardW, 5, 3, 3, 'F');
    doc.rect(x, statsY + 3, cardW, 2, 'F');

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.value, x + cardW / 2, statsY + 14, { align: 'center' });

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(card.label, x + cardW / 2, statsY + 20, { align: 'center' });
  });

  // === DATE RANGE ===
  let nextY = statsY + 28;
  if (data.dateRange) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(
      `Service Period: ${data.dateRange.start} — ${data.dateRange.end}`,
      pageWidth / 2,
      nextY,
      { align: 'center' }
    );
    nextY += 5;
  }

  // === APPRECIATION MESSAGE ===
  const msgY = nextY + 2;
  const qrSize = 22;
  const qrX = pageWidth - cardMargin - qrSize - 18;
  const qrY = msgY - 2;
  const msgMaxW = qrX - (cardMargin + 25) - 10;

  // Message box with subtle background
  doc.setFillColor(248, 245, 255); // very light purple tint
  doc.roundedRect(cardMargin + 20, msgY - 4, msgMaxW + 10, 18, 2, 2, 'F');
  
  // Small heart icon before message
  drawHeartHands(doc, cardMargin + 25, msgY + 2, 5, inclusionPurple);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(
    'Your empathy, patience, and dedication to ensuring equal examination opportunities for students with disabilities exemplify the true spirit of inclusive community service. Thank you for making a difference.',
    cardMargin + 32,
    msgY,
    { maxWidth: msgMaxW - 5 }
  );

  // === QR CODE ===
  try {
    const qrCodeBase64 = await generateQRCodeBase64(data.certificateNumber);
    // QR container
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.roundedRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 13, 3, 3, 'F');
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.8);
    doc.roundedRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 13, 3, 3, 'S');
    doc.addImage(qrCodeBase64, 'PNG', qrX, qrY, qrSize, qrSize);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(deepBlue[0], deepBlue[1], deepBlue[2]);
    doc.text('Scan to Verify', qrX + qrSize / 2, qrY + qrSize + 5, { align: 'center' });
    // Small accessibility icon near QR
    drawAccessibilitySymbol(doc, qrX + qrSize / 2, qrY + qrSize + 9, 3, brightTeal);
  } catch (e) {
    console.warn('QR code generation failed:', e);
  }

  // === FOOTER ===
  const footerY = pageHeight - 12;
  doc.setFillColor(deepBlue[0], deepBlue[1], deepBlue[2]);
  doc.rect(0, footerY, pageWidth, 12, 'F');

  // Purple accent line above footer
  doc.setFillColor(inclusionPurple[0], inclusionPurple[1], inclusionPurple[2]);
  doc.rect(0, footerY, pageWidth, 1.5, 'F');

  // Footer text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(white[0], white[1], white[2]);
  doc.text(`Certificate No: ${data.certificateNumber}`, 15, footerY + 7);
  doc.text(`Issued: ${data.issuedAt}`, pageWidth - 15, footerY + 7, { align: 'right' });

  // Center footer with accessibility emphasis
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text(
    '♿ Disability Support Service Certificate • Inclusive Education Initiative',
    pageWidth / 2,
    footerY + 5,
    { align: 'center' }
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(200, 200, 200);
  doc.text(
    'Verify at: ' + window.location.origin + '/verify',
    pageWidth / 2,
    footerY + 9,
    { align: 'center' }
  );

  doc.save(`disability-support-certificate-${data.certificateNumber}.pdf`);
}
