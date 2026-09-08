// exceljs import removido para carga lazy (dynamic import)
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface ExcelReportOptions {
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
  periodInfo?: {
    from: Date;
    to: Date;
  };
}

interface ExcelThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  textDark: string;
  textMuted: string;
  bgLight: string;
  bgCard: string;
  border: string;
}

function resolveExcelTheme(unitOrTitle?: string): ExcelThemeColors {
  const upper = (unitOrTitle || '').toUpperCase();
  if (upper.includes('SPA')) {
    return {
      primary: 'FF831843',    // Deep Rose / Wine
      secondary: 'FFD4788C',  // Rose
      accent: 'FFDB2777',     // Pink 600
      textDark: 'FF222220',   // Soft Black
      textMuted: 'FF6B7280',  // Gray 500
      bgLight: 'FFFDF2F8',    // Light Pink
      bgCard: 'FFFCE7F3',     // Card Pink
      border: 'FFFBCFE8'      // Border Pink
    };
  }
  if (upper.includes('BARBER')) {
    return {
      primary: 'FF1E293B',    // Slate 800
      secondary: 'FF7A0A0A',  // Crimson
      accent: 'FFB91C1C',     // Burgundy
      textDark: 'FF0F172A',   // Slate 900
      textMuted: 'FF64748B',  // Slate 500
      bgLight: 'FFF8FAFC',    // Slate 50
      bgCard: 'FFF1F5F9',     // Slate 100
      border: 'FFE2E8F0'      // Slate 200
    };
  }
  return {
    primary: 'FF1E1B4B',      // Indigo 950
    secondary: 'FF5B21B6',    // Violet 800
    accent: 'FF7C3AED',       // Violet 600
    textDark: 'FF0F172A',     // Slate 900
    textMuted: 'FF64748B',    // Slate 500
    bgLight: 'FFF8FAFC',      // Slate 50
    bgCard: 'FFF5F3FF',       // Violet 50
    border: 'FFE2E8F0'        // Slate 200
  };
}

/**
 * Genera un archivo Excel PREMIUM de grado corporativo con tipografía,
 * formato numérico inteligente y paletas temáticas.
 */
export async function downloadExcelReport(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number)[][],
  options?: ExcelReportOptions
): Promise<void> {
  const { Workbook } = await import('exceljs');
  
  const workbook = new Workbook();
  const safeSheetName = (sheetName || 'Reporte').slice(0, 31);
  const theme = resolveExcelTheme(options?.unit || options?.reportSubtitle || options?.reportTitle || sheetName);

  const colCount = Math.max(headers.length, 6);
  const lastColLetter = String.fromCharCode(64 + Math.min(colCount, 26));

  const sheet = workbook.addWorksheet(safeSheetName, {
    views: [{ state: 'frozen', ySplit: 7, showGridLines: true }],
  });

  // 1. HEADER CORPORATIVO (Filas 1-6)
  sheet.getRow(1).height = 10;

  // Fila 2: Nombre del negocio
  const businessRow = sheet.getRow(2);
  businessRow.height = 28;
  const businessCell = sheet.getCell('A2');
  businessCell.value = (options?.businessName || 'Barbería & Spa POS').toUpperCase();
  businessCell.font = {
    bold: true,
    size: 16,
    color: { argb: theme.primary },
    name: 'Segoe UI'
  };
  businessCell.alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.mergeCells(`A2:${lastColLetter}2`);

  // Fila 3: Información de contacto
  const contactInfo = [
    options?.businessAddress,
    options?.businessPhone && `Tel: ${options.businessPhone}`,
    options?.businessEmail && `Email: ${options.businessEmail}`
  ].filter(Boolean).join('  •  ');

  if (contactInfo) {
    const contactRow = sheet.getRow(3);
    contactRow.height = 18;
    const contactCell = sheet.getCell('A3');
    contactCell.value = contactInfo;
    contactCell.font = {
      size: 9.5,
      color: { argb: theme.textMuted },
      name: 'Segoe UI'
    };
    contactCell.alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.mergeCells(`A3:${lastColLetter}3`);
  }

  // Fila 4: Título del reporte
  const titleRow = sheet.getRow(4);
  titleRow.height = 24;
  const titleCell = sheet.getCell('A4');
  const finalTitle = (options?.reportTitle || sheetName || 'REPORTE EJECUTIVO').toUpperCase();
  titleCell.value = finalTitle;
  titleCell.font = {
    bold: true,
    size: 12.5,
    color: { argb: theme.primary },
    name: 'Segoe UI'
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.mergeCells(`A4:${lastColLetter}4`);

  // Fila 5: Metadata (Fecha de emisión, período, filtros)
  const metaRow = sheet.getRow(5);
  metaRow.height = 18;
  const metaCell = sheet.getCell('A5');
  const reportDate = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });
  const metaParts = [
    options?.unit && `UNIDAD: ${options.unit.toUpperCase()}`,
    options?.reportSubtitle,
    options?.periodInfo && `Período: ${format(options.periodInfo.from, 'dd/MM/yyyy')} al ${format(options.periodInfo.to, 'dd/MM/yyyy')}`,
    `Generado: ${reportDate}`,
    options?.filterInfo && `Filtros: ${options.filterInfo}`
  ].filter(Boolean);

  metaCell.value = metaParts.join('  |  ');
  metaCell.font = {
    size: 9,
    color: { argb: theme.textMuted },
    italic: true,
    name: 'Segoe UI'
  };
  metaCell.alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.mergeCells(`A5:${lastColLetter}5`);

  // Fila 6: Espacio divisor
  sheet.getRow(6).height = 8;

  // 2. CABECERAS DE TABLA (Fila 7)
  const headerRow = sheet.getRow(7);
  headerRow.height = 25;

  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h.toUpperCase();
    cell.font = {
      bold: true,
      size: 10,
      color: { argb: 'FFFFFFFF' },
      name: 'Segoe UI'
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: theme.primary }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    cell.border = {
      top: { style: 'medium', color: { argb: theme.primary } },
      left: { style: 'thin', color: { argb: '33FFFFFF' } },
      bottom: { style: 'medium', color: { argb: theme.primary } },
      right: { style: 'thin', color: { argb: '33FFFFFF' } }
    };
  });

  // Track max lengths for smart auto-sizing
  const colLengths: number[] = headers.map(h => h.length);

  // 3. FILAS DE DATOS CON FORMATO INTELIGENTE (Fila 8 en adelante)
  rows.forEach((row, rowIndex) => {
    const dataRow = sheet.getRow(rowIndex + 8);
    dataRow.height = 20;
    const isEven = rowIndex % 2 === 0;
    const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    row.forEach((cellValue, colIndex) => {
      const excelCell = dataRow.getCell(colIndex + 1);
      const colHeader = (headers[colIndex] || '').toUpperCase();

      let processedValue: string | number | Date = cellValue;
      let numFmt: string | undefined;
      let alignment: { vertical: 'middle', horizontal: 'left' | 'center' | 'right' } = {
        vertical: 'middle',
        horizontal: 'left'
      };

      // Detección y conversión de tipos
      if (typeof cellValue === 'number') {
        processedValue = cellValue;
        if (
          colHeader.includes('MONTO') ||
          colHeader.includes('TOTAL') ||
          colHeader.includes('PRECIO') ||
          colHeader.includes('SALDO') ||
          colHeader.includes('IMPORTE') ||
          colHeader.includes('DIFERENCIA')
        ) {
          numFmt = '"S/" #,##0.00';
          alignment.horizontal = 'right';
        } else if (colHeader.includes('%') || colHeader.includes('PORCENTAJE') || colHeader.includes('PCT')) {
          numFmt = '0.0%';
          alignment.horizontal = 'right';
        } else {
          numFmt = '#,##0';
          alignment.horizontal = 'center';
        }
      } else if (typeof cellValue === 'string') {
        const valTrimmed = cellValue.trim();

        // 1. Fechas ISO o formatos español
        const isIsoDate = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/.test(valTrimmed);
        const isSpanishDate = /^\d{1,2}\/\d{1,2}\/\d{4}/.test(valTrimmed);
        const isDashDate = /^\d{1,2}-\d{1,2}-\d{4}/.test(valTrimmed);

        if (isIsoDate || isSpanishDate || isDashDate) {
          const parsedDate = new Date(valTrimmed);
          if (!isNaN(parsedDate.getTime())) {
            processedValue = parsedDate;
            numFmt = valTrimmed.includes(':') ? 'dd/mm/yyyy hh:mm' : 'dd/mm/yyyy';
            alignment.horizontal = 'center';
          }
        }
        // 2. Moneda "S/ 100.00" o similar
        else if (/^[S/$]?\s*-?[\d,]+\.?\d*$/.test(valTrimmed) || /^-?[\d,]+\.?\d*\s*S\/?$/.test(valTrimmed)) {
          const clean = valTrimmed.replace(/[S/$\s]/g, '').replace(/,/g, '');
          const parsedNum = parseFloat(clean);
          if (!isNaN(parsedNum) && (colHeader.includes('MONTO') || colHeader.includes('TOTAL') || colHeader.includes('PRECIO') || colHeader.includes('SALDO') || valTrimmed.includes('S/'))) {
            processedValue = parsedNum;
            numFmt = '"S/" #,##0.00';
            alignment.horizontal = 'right';
          }
        }
        // 3. Números puros
        else if (/^-?[\d,]+(\.\d+)?$/.test(valTrimmed)) {
          const parsedNum = parseFloat(valTrimmed.replace(/,/g, ''));
          if (!isNaN(parsedNum)) {
            processedValue = parsedNum;
            if (colHeader.includes('MONTO') || colHeader.includes('PRECIO') || colHeader.includes('SALDO')) {
              numFmt = '"S/" #,##0.00';
              alignment.horizontal = 'right';
            } else if (colHeader.includes('ID') || colHeader.includes('#') || colHeader.includes('CANT') || colHeader.includes('STOCK')) {
              numFmt = '#,##0';
              alignment.horizontal = 'center';
            }
          }
        }
        // 4. Centrado para códigos, IDs, estados
        if (
          colHeader.includes('ESTADO') ||
          colHeader.includes('UNIDAD') ||
          colHeader.includes('TIPO') ||
          colHeader === 'ID' ||
          colHeader === '#'
        ) {
          alignment.horizontal = 'center';
        }
      }

      excelCell.value = processedValue;
      if (numFmt) excelCell.numFmt = numFmt;

      excelCell.font = {
        size: 9.5,
        color: { argb: theme.textDark },
        name: 'Segoe UI'
      };

      excelCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBgColor }
      };

      excelCell.alignment = alignment;
      excelCell.border = {
        top: { style: 'thin', color: { argb: theme.border } },
        left: { style: 'thin', color: { argb: theme.border } },
        bottom: { style: 'thin', color: { argb: theme.border } },
        right: { style: 'thin', color: { argb: theme.border } }
      };

      // Track length
      const strLen = String(cellValue ?? '').length;
      if (strLen > (colLengths[colIndex] || 0)) {
        colLengths[colIndex] = strLen;
      }
    });
  });

  // 4. APLICAR ANCHOS DE COLUMNA AUTOMÁTICOS
  colLengths.forEach((maxLen, idx) => {
    const col = sheet.getColumn(idx + 1);
    col.width = Math.min(Math.max(maxLen + 4, 14), 55);
  });

  // 5. RESUMEN / TOTALES (si se especifica totalAmount)
  const footerStartRow = rows.length + 9;
  if (options?.totalAmount !== undefined) {
    sheet.getRow(footerStartRow).height = 24;
    const totalLabelCell = sheet.getCell(`A${footerStartRow}`);
    totalLabelCell.value = 'TOTAL GENERAL:';
    totalLabelCell.font = { bold: true, size: 10.5, color: { argb: theme.primary }, name: 'Segoe UI' };
    totalLabelCell.alignment = { vertical: 'middle', horizontal: 'left' };

    const totalValCell = sheet.getCell(`B${footerStartRow}`);
    totalValCell.value = options.totalAmount;
    totalValCell.numFmt = '"S/" #,##0.00';
    totalValCell.font = { bold: true, size: 11, color: { argb: theme.accent }, name: 'Segoe UI' };
    totalValCell.alignment = { vertical: 'middle', horizontal: 'left' };
  }

  // 6. FOOTER (se preserva la estructura actual solicitada)
  const copyrightRowIndex = footerStartRow + (options?.totalAmount !== undefined ? 2 : 1);
  const footerRow = sheet.getRow(copyrightRowIndex);
  footerRow.height = 16;
  const footerCell = sheet.getCell(`A${copyrightRowIndex}`);
  footerCell.value = `© ${new Date().getFullYear()} ${options?.businessName || 'Barbería & Spa POS'} - Reporte generado automáticamente`;
  footerCell.font = {
    size: 8.5,
    color: { argb: theme.textMuted },
    italic: true,
    name: 'Segoe UI'
  };
  footerCell.alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.mergeCells(`A${copyrightRowIndex}:${lastColLetter}${copyrightRowIndex}`);

  // 7. GENERAR Y DESCARGAR ARCHIVO
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
