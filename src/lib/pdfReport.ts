import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// 🎨 CONSTANTES PREMIUM
const MARGIN = 20;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const ROW_HEIGHT = 8;
const HEADER_ROW_HEIGHT = 10;
const FONT_SIZE = 9;
const FONT_SIZE_TITLE = 18;
const FONT_SIZE_SUBTITLE = 12;
const FONT_SIZE_HEADER = 10;

// 🎯 COLORES TEMÁTICOS PREMIUM
const colors = {
  primary: [139, 92, 246],      // Púrpura premium
  secondary: [6, 182, 212],     // Cian secundario
  accent: [245, 158, 11],       // Ámbar acento
  success: [16, 185, 129],      // Verde éxito
  warning: [245, 158, 11],      // Ámber advertencia
  danger: [239, 68, 68],        // Rojo peligro
  dark: [31, 41, 55],           // Oscuro
  light: [249, 250, 251],      // Claro
  border: [229, 231, 235]       // Bordes
};

/**
 * Genera un PDF PREMIUM con diseño corporativo, branding y colores temáticos.
 * @param businessName Opcional: nombre del negocio (línea superior)
 */
export function downloadPdfReport(
  filename: string,
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][],
  options?: {
    businessName?: string;
    businessAddress?: string;
    businessPhone?: string;
    businessEmail?: string;
    reportTitle?: string;
    reportSubtitle?: string;
    totalAmount?: number;
    filterInfo?: string;
    currency?: string;
    logo?: string; // URL del logo si está disponible
  }
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const contentWidth = PAGE_WIDTH - 2 * MARGIN;
  const colCount = headers.length;
  const colWidth = contentWidth / colCount;

  let y = MARGIN;

  // 🎨 HEADER CORPORATIVO PREMIUM
  // Línea superior decorativa
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 3;

  // Logo simulado y nombre del negocio
  if (options?.businessName) {
    // Logo simulado (círculo con iniciales)
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.circle(MARGIN + 5, y + 4, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const initials = options.businessName.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
    doc.text(initials, MARGIN + 5, y + 6, { align: 'center' });

    // Nombre del negocio
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFontSize(FONT_SIZE_TITLE);
    doc.setFont('helvetica', 'bold');
    doc.text(options.businessName, MARGIN + 12, y + 6);
    y += 10;

    // Información de contacto
    if (options.businessAddress || options.businessPhone || options.businessEmail) {
      doc.setFontSize(FONT_SIZE_HEADER);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      const contactInfo = [
        options.businessAddress,
        options.businessPhone && `📞 ${options.businessPhone}`,
        options.businessEmail && `✉️ ${options.businessEmail}`
      ].filter(Boolean).join(' | ');
      
      // Truncar si es muy largo
      if (doc.getTextWidth(contactInfo) > contentWidth) {
        let truncated = contactInfo;
        while (doc.getTextWidth(truncated + '...') > contentWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
        }
        doc.text(truncated + '...', MARGIN, y);
      } else {
        doc.text(contactInfo, MARGIN, y);
      }
      y += 8;
    }
  }

  // Línea separadora
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 6;

  // 🎯 TÍTULO DEL REPORTE
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(FONT_SIZE_TITLE);
  doc.setFont('helvetica', 'bold');
  const reportTitle = options?.reportTitle || title;
  doc.text(reportTitle, MARGIN, y);
  
  // Subtítulo con metadata
  if (subtitle || options?.reportSubtitle || options?.filterInfo) {
    y += 6;
    doc.setFontSize(FONT_SIZE_SUBTITLE);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    const reportDate = format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    const reportSubtitle = [
      options?.reportSubtitle || subtitle,
      `Generado: ${reportDate}`,
      options?.filterInfo && `Filtros: ${options.filterInfo}`
    ].filter(Boolean).join(' | ');
    
    // Truncar si es muy largo
    if (doc.getTextWidth(reportSubtitle) > contentWidth) {
      let truncated = reportSubtitle;
      while (doc.getTextWidth(truncated + '...') > contentWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
      }
      doc.text(truncated + '...', MARGIN, y);
    } else {
      doc.text(reportSubtitle, MARGIN, y);
    }
  }
  y += 8;

  // Línea después del título
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 6;

  // 🎨 ESTADÍSTICAS PREMIUM (si hay total)
  if (options?.totalAmount !== undefined) {
    // Fondo de estadísticas
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(MARGIN, y, contentWidth, 15, 2, 2, 'F');
    
    // Estadísticas
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFontSize(FONT_SIZE_HEADER);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL DEL REPORTE:', MARGIN + 5, y + 8);
    
    doc.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
    doc.setFontSize(FONT_SIZE_TITLE);
    doc.text(`${options.currency || 'S/'} ${options.totalAmount.toFixed(2)}`, PAGE_WIDTH - MARGIN - 5, y + 8, { align: 'right' });
    
    y += 20;
  }

  // 🎨 CABECERA DE TABLA PREMIUM
  const maxY = PAGE_HEIGHT - MARGIN - ROW_HEIGHT - 20; // Espacio extra para footer

  // Fondo de cabecera
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(MARGIN, y, contentWidth, HEADER_ROW_HEIGHT, 2, 2, 'F');
  
  // Texto de cabecera
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONT_SIZE_HEADER);
  headers.forEach((h, i) => {
    const x = MARGIN + i * colWidth + 2;
    doc.text(truncate(h, colWidth - 4, doc), x, y + HEADER_ROW_HEIGHT / 2 + 1);
  });
  y += HEADER_ROW_HEIGHT;

  // Línea después de cabecera
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 2;

  // 🎨 FILAS DE DATOS CON COLORES ALTERNADOS
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SIZE);
  let rowCount = 0;

  for (const row of rows) {
    if (y > maxY) {
      // Nueva página
      doc.addPage();
      y = MARGIN;
      
      // Header en nueva página
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.roundedRect(MARGIN, y, contentWidth, HEADER_ROW_HEIGHT, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(FONT_SIZE_HEADER);
      headers.forEach((h, i) => {
        const x = MARGIN + i * colWidth + 2;
        doc.text(truncate(h, colWidth - 4, doc), x, y + HEADER_ROW_HEIGHT / 2 + 1);
      });
      y += HEADER_ROW_HEIGHT;
      
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.setLineWidth(0.3);
      doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
      y += 2;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONT_SIZE);
    }

    // 🎨 Fondo alternado para filas
    if (rowCount % 2 === 0) {
      doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
      doc.roundedRect(MARGIN, y - 1, contentWidth, ROW_HEIGHT + 1, 1, 1, 'F');
    }

    // 🎯 COLORES POR COLUMNA
    row.forEach((cell, i) => {
      const x = MARGIN + i * colWidth + 2;
      let cellColor = colors.dark;
      
      switch (i) {
        case 0: // ID - Gris
          cellColor = colors.dark;
          break;
        case 1: // Motivo - Oscuro
          cellColor = colors.dark;
          break;
        case 2: // Monto - Ámbar
          cellColor = colors.warning;
          break;
        case 3: // Unidad - Azul
          cellColor = colors.secondary;
          break;
        case 4: // Usuario - Verde
          cellColor = colors.success;
          break;
        case 5: // Fecha - Gris
          cellColor = colors.dark;
          break;
      }
      
      doc.setTextColor(cellColor[0], cellColor[1], cellColor[2]);
      
      // Formato especial para montos
      let cellText = String(cell);
      if (i === 2 && typeof cell === 'number') {
        cellText = `${options?.currency || 'S/'} ${cell.toFixed(2)}`;
        doc.text(cellText, x, y, { align: 'right' });
      } else {
        doc.text(truncate(cellText, colWidth - 4, doc), x, y);
      }
    });
    
    y += ROW_HEIGHT;
    rowCount++;
  }

  // 🎨 FOOTER PREMIUM
  const footerY = PAGE_HEIGHT - MARGIN - 10;
  
  // Línea superior del footer
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, footerY, PAGE_WIDTH - MARGIN, footerY);
  
  // Información del footer
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const footerText = `© ${new Date().getFullYear()} ${options?.businessName || 'Barbería & Spa POS'} - Página ${doc.getNumberOfPages()} - Reporte generado automáticamente`;
  doc.text(footerText, MARGIN, footerY + 5);

  // 📥 GUARDAR PDF
  doc.save(filename);
}

function truncate(str: string, maxWidthMm: number, doc: jsPDF): string {
  if (doc.getTextWidth(str) <= maxWidthMm) return str;
  let s = str;
  while (s.length > 0 && doc.getTextWidth(s + '…') > maxWidthMm) s = s.slice(0, -1);
  return s + '…';
}
