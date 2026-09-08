// imports de jspdf removidos, se cargarán lazy para optimizar bundle size
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// 🎨 PALETAS CORPORATIVAS PREMIUM SEGÚN UNIDAD
export type ReportUnitTheme = 'BARBERIA' | 'SPA' | 'GENERAL';

export interface ReportPalette {
  primary: [number, number, number];
  primaryHex: string;
  secondary: [number, number, number];
  accent: [number, number, number];
  accentHex: string;
  textDark: [number, number, number];
  textMuted: [number, number, number];
  bgLight: [number, number, number];
  bgCard: [number, number, number];
  border: [number, number, number];
  success: [number, number, number];
  danger: [number, number, number];
  warning: [number, number, number];
}

export const THEME_PALETTES: Record<ReportUnitTheme, ReportPalette> = {
  BARBERIA: {
    primary: [30, 41, 59],         // Slate 800
    primaryHex: '#1E293B',
    secondary: [122, 10, 10],       // Deep Crimson
    accent: [185, 28, 28],          // Burgundy Accent
    accentHex: '#B91C1C',
    textDark: [15, 23, 42],         // Slate 900
    textMuted: [100, 116, 139],     // Slate 500
    bgLight: [248, 250, 252],      // Slate 50
    bgCard: [241, 245, 249],       // Slate 100
    border: [226, 232, 240],        // Slate 200
    success: [16, 185, 129],
    danger: [239, 68, 68],
    warning: [245, 158, 11]
  },
  SPA: {
    primary: [131, 24, 67],        // Pink 900 / Deep Wine
    primaryHex: '#831843',
    secondary: [212, 120, 140],    // Rose Elegant
    accent: [219, 39, 119],        // Pink 600
    accentHex: '#DB2777',
    textDark: [34, 34, 32],        // Soft Black
    textMuted: [107, 114, 128],    // Gray 500
    bgLight: [253, 242, 248],      // Pink 50
    bgCard: [252, 231, 243],       // Pink 100
    border: [251, 207, 232],       // Pink 200
    success: [16, 185, 129],
    danger: [239, 68, 68],
    warning: [245, 158, 11]
  },
  GENERAL: {
    primary: [30, 27, 75],         // Indigo 950 / Deep Navy
    primaryHex: '#1E1B4B',
    secondary: [91, 33, 182],      // Violet 800
    accent: [124, 58, 237],        // Violet 600
    accentHex: '#7C3AED',
    textDark: [15, 23, 42],        // Slate 900
    textMuted: [100, 116, 139],    // Slate 500
    bgLight: [248, 250, 252],      // Slate 50
    bgCard: [245, 243, 255],       // Violet 50
    border: [226, 232, 240],       // Slate 200
    success: [16, 185, 129],
    danger: [239, 68, 68],
    warning: [245, 158, 11]
  }
};

export function resolveReportTheme(unitNameOrCode?: string): ReportPalette {
  if (!unitNameOrCode) return THEME_PALETTES.GENERAL;
  const upper = unitNameOrCode.toUpperCase();
  if (upper.includes('SPA')) return THEME_PALETTES.SPA;
  if (upper.includes('BARBER')) return THEME_PALETTES.BARBERIA;
  return THEME_PALETTES.GENERAL;
}

export interface PdfReportOptions {
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  reportTitle?: string;
  reportSubtitle?: string;
  unit?: string;
  totalAmount?: number;
  filterInfo?: string;
  currency?: string;
  logo?: string;
  periodInfo?: {
    from: Date;
    to: Date;
    label?: string;
  };
  totals?: {
    label?: string;
    amount: number;
    currency?: string;
  };
  customStats?: Array<{ label: string; value: string | number }>;
}

/**
 * Genera y descarga un PDF PREMIUM de grado corporativo y alta legibilidad.
 */
export async function downloadPdfReport(
  filename: string,
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][],
  options?: PdfReportOptions
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const theme = resolveReportTheme(options?.unit || subtitle || title);

  const PAGE_WIDTH = 210;
  const PAGE_HEIGHT = 297;
  const MARGIN = 15;
  const contentWidth = PAGE_WIDTH - 2 * MARGIN;

  let currentY = MARGIN;

  // 1. TOP ACCENT BAR (Banda superior estética de 2.5mm)
  doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2]);
  doc.rect(MARGIN, currentY, contentWidth, 2.5, 'F');
  currentY += 6;

  // 2. BRANDING CORPORATIVO
  const businessName = options?.businessName || 'Barbería & Spa POS';
  
  // Badge / Monograma de Marca
  const badgeSize = 12;
  const badgeX = MARGIN;
  const badgeY = currentY;
  
  doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2]);
  doc.roundedRect(badgeX, badgeY, badgeSize, badgeSize, 2, 2, 'F');
  
  // Monograma texto
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const initials = businessName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'BS';
  doc.text(initials, badgeX + badgeSize / 2, badgeY + badgeSize / 2 + 3, { align: 'center' });

  // Nombre del Negocio
  doc.setTextColor(theme.textDark[0], theme.textDark[1], theme.textDark[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(businessName, badgeX + badgeSize + 4, badgeY + 5);

  // Información de Contacto / Dirección
  const contactParts = [
    options?.businessAddress,
    options?.businessPhone && `Tel: ${options.businessPhone}`,
    options?.businessEmail && `Email: ${options.businessEmail}`
  ].filter(Boolean);

  if (contactParts.length > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(theme.textMuted[0], theme.textMuted[1], theme.textMuted[2]);
    doc.text(contactParts.join('  •  '), badgeX + badgeSize + 4, badgeY + 10);
  }

  // Tag / Píldora de Fecha de Emisión en la esquina superior derecha
  const emissionDateStr = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(theme.textMuted[0], theme.textMuted[1], theme.textMuted[2]);
  doc.text(`Emitido: ${emissionDateStr}`, PAGE_WIDTH - MARGIN, badgeY + 5, { align: 'right' });

  currentY += badgeSize + 5;

  // Línea divisoria elegante
  doc.setDrawColor(theme.border[0], theme.border[1], theme.border[2]);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, currentY, PAGE_WIDTH - MARGIN, currentY);
  currentY += 5;

  // 3. TÍTULO DEL REPORTE & METADATA
  const finalTitle = (options?.reportTitle || title || 'REPORTE EJECUTIVO').toUpperCase();
  doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(finalTitle, MARGIN, currentY + 3);

  // Píldora de Unidad (si existe)
  const unitBadge = options?.unit ? options.unit.toUpperCase() : null;
  if (unitBadge) {
    const titleWidth = doc.getTextWidth(finalTitle);
    const pillX = MARGIN + titleWidth + 4;
    const pillWidth = 20;
    const pillHeight = 5;
    doc.setFillColor(theme.bgCard[0], theme.bgCard[1], theme.bgCard[2]);
    doc.roundedRect(pillX, currentY - 1, pillWidth, pillHeight, 1, 1, 'F');
    doc.setTextColor(theme.accent[0], theme.accent[1], theme.accent[2]);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(unitBadge, pillX + pillWidth / 2, currentY + 2.5, { align: 'center' });
  }

  // Subtítulo / Metadata de Filtros
  const subtitleParts = [
    options?.reportSubtitle || (subtitle !== title ? subtitle : undefined),
    options?.periodInfo && (
      options.periodInfo.label ||
      `Período: ${format(options.periodInfo.from, 'dd/MM/yyyy')} al ${format(options.periodInfo.to, 'dd/MM/yyyy')}`
    ),
    options?.filterInfo && `Filtros: ${options.filterInfo}`
  ].filter(Boolean);

  if (subtitleParts.length > 0) {
    currentY += 6;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(theme.textMuted[0], theme.textMuted[1], theme.textMuted[2]);
    doc.text(subtitleParts.join('  |  '), MARGIN, currentY + 1);
  }

  currentY += 6;

  // 4. MICRO-TARJETAS KPI / RESUMEN (si hay totales o customStats)
  const totalVal = options?.totalAmount ?? options?.totals?.amount;
  const hasStats = totalVal !== undefined || (options?.customStats && options.customStats.length > 0);

  if (hasStats) {
    const cardHeight = 12;
    doc.setFillColor(theme.bgLight[0], theme.bgLight[1], theme.bgLight[2]);
    doc.roundedRect(MARGIN, currentY, contentWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(theme.border[0], theme.border[1], theme.border[2]);
    doc.setLineWidth(0.2);
    doc.roundedRect(MARGIN, currentY, contentWidth, cardHeight, 1.5, 1.5, 'S');

    // Label
    const totalLabel = (options?.totals?.label || 'TOTAL REGISTRADO:').toUpperCase();
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(theme.textDark[0], theme.textDark[1], theme.textDark[2]);
    doc.text(totalLabel, MARGIN + 4, currentY + 7.5);

    // Registros count badge
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(theme.textMuted[0], theme.textMuted[1], theme.textMuted[2]);
    doc.text(`(${rows.length} ${rows.length === 1 ? 'registro' : 'registros'})`, MARGIN + 4 + doc.getTextWidth(totalLabel) + 3, currentY + 7.5);

    // Valor Total
    if (totalVal !== undefined) {
      const curr = options?.currency || options?.totals?.currency || 'S/';
      const formattedTotal = `${curr} ${Number(totalVal).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(theme.accent[0], theme.accent[1], theme.accent[2]);
      doc.text(formattedTotal, PAGE_WIDTH - MARGIN - 4, currentY + 8, { align: 'right' });
    }

    currentY += cardHeight + 4;
  }

  // 5. TABLA INTELIGENTE CON AUTOTABLE
  // Detección semántica de alineación por columna
  const colStyles: Record<number, { halign?: 'left' | 'center' | 'right'; fontStyle?: 'normal' | 'bold' }> = {};
  
  headers.forEach((h, idx) => {
    const hUpper = h.toUpperCase();
    if (
      hUpper.includes('MONTO') || 
      hUpper.includes('TOTAL') || 
      hUpper.includes('PRECIO') || 
      hUpper.includes('SALDO') || 
      hUpper.includes('IMPORTE') ||
      hUpper.includes('S/') ||
      hUpper.includes('$') ||
      hUpper.includes('DIFERENCIA')
    ) {
      colStyles[idx] = { halign: 'right', fontStyle: 'bold' };
    } else if (
      hUpper.includes('FECHA') || 
      hUpper.includes('HORA') || 
      hUpper.includes('ESTADO') || 
      hUpper.includes('UNIDAD') || 
      hUpper.includes('TIPO') ||
      hUpper === 'ID' ||
      hUpper === '#' ||
      hUpper.includes('CANT') ||
      hUpper.includes('STOCK') ||
      hUpper.includes('VISITAS')
    ) {
      colStyles[idx] = { halign: 'center' };
    } else {
      colStyles[idx] = { halign: 'left' };
    }
  });

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: currentY,
    margin: { left: MARGIN, right: MARGIN, bottom: 20 },
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: { top: 2.8, bottom: 2.8, left: 2.5, right: 2.5 },
      textColor: [theme.textDark[0], theme.textDark[1], theme.textDark[2]],
      lineColor: [theme.border[0], theme.border[1], theme.border[2]],
      lineWidth: 0.1,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [theme.primary[0], theme.primary[1], theme.primary[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      cellPadding: { top: 3.5, bottom: 3.5, left: 2.5, right: 2.5 },
    },
    alternateRowStyles: {
      fillColor: [theme.bgLight[0], theme.bgLight[1], theme.bgLight[2]],
    },
    columnStyles: colStyles,
    didParseCell: (data) => {
      // Formatear montos en columnas numéricas para que tengan consistencia
      if (data.section === 'body') {
        const val = String(data.cell.raw ?? '');
        const colHeader = headers[data.column.index]?.toUpperCase() || '';
        if (
          colHeader.includes('MONTO') || 
          colHeader.includes('TOTAL') || 
          colHeader.includes('PRECIO') || 
          colHeader.includes('SALDO')
        ) {
          if (!val.includes('S/') && !isNaN(Number(val)) && val.trim() !== '') {
            data.cell.text = [`S/ ${Number(val).toFixed(2)}`];
          }
        }
      }
    },
    didDrawPage: () => {
      // 🎨 FOOTER (se preserva la estructura actual solicitada)
      const footerY = PAGE_HEIGHT - MARGIN - 5;
      doc.setDrawColor(theme.border[0], theme.border[1], theme.border[2]);
      doc.setLineWidth(0.3);
      doc.line(MARGIN, footerY, PAGE_WIDTH - MARGIN, footerY);

      doc.setTextColor(theme.textMuted[0], theme.textMuted[1], theme.textMuted[2]);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'italic');
      const footerText = `© ${new Date().getFullYear()} ${businessName} - Reporte generado profesionalmente`;
      doc.text(footerText, MARGIN, footerY + 4);

      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      doc.text(`Página ${currentPage} de ${pageCount}`, PAGE_WIDTH - MARGIN, footerY + 4, { align: 'right' });
    }
  });

  // Guardar archivo
  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  doc.save(safeFilename);
}
