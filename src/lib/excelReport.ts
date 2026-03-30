import { Workbook } from 'exceljs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Genera un archivo Excel PREMIUM con diseño corporativo, branding y colores temáticos.
 */
export async function downloadExcelReport(
  filename: string,
  sheetName: string,
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
  }
): Promise<void> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet(sheetName, { views: [{ state: 'frozen', ySplit: 6 }] });

  // 🎨 COLORES TEMÁTICOS PREMIUM
  const colors = {
    primary: 'FF8B5CF6',      // Púrpura premium
    secondary: 'FF06B6D4',    // Cian secundario
    accent: 'FFF59E0B',       // Ámbar acento
    success: 'FF10B981',      // Verde éxito
    warning: 'FFF59E0B',      // Ámber advertencia
    danger: 'FFEF4444',       // Rojo peligro
    dark: 'FF1F2937',         // Oscuro
    light: 'FFF9FAFB',        // Claro
    border: 'FFE5E7EB'        // Bordes
  };

  // 🎯 CONFIGURACIÓN DE ANCHO DE COLUMNAS
  const columnWidths = [15, 25, 12, 15, 15, 20, 15]; // ID, Motivo, Monto, Unidad, Método, Usuario, Fecha
  columnWidths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  // 🎨 HEADER CORPORATIVO PREMIUM (Filas 1-6)
  // Fila 1: Espacio vacío
  sheet.getRow(1).height = 8;

  // Fila 2: Nombre del negocio
  const businessRow = sheet.getRow(2);
  businessRow.height = 25;
  const businessCell = sheet.getCell('A2');
  businessCell.value = options?.businessName || 'Barbería & Spa POS';
  businessCell.font = { 
    bold: true, 
    size: 18, 
    color: { argb: colors.primary },
    name: 'Arial'
  };
  businessCell.alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.mergeCells('A2:G2');

  // Fila 3: Información de contacto
  if (options?.businessAddress || options?.businessPhone || options?.businessEmail) {
    const contactRow = sheet.getRow(3);
    contactRow.height = 20;
    const contactCell = sheet.getCell('A3');
    const contactInfo = [
      options?.businessAddress,
      options?.businessPhone && `📞 ${options.businessPhone}`,
      options?.businessEmail && `✉️ ${options.businessEmail}`
    ].filter(Boolean).join(' | ');
    contactCell.value = contactInfo;
    contactCell.font = { 
      size: 10, 
      color: { argb: colors.dark },
      italic: true
    };
    contactCell.alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.mergeCells('A3:G3');
  }

  // Fila 4: Línea separadora
  const lineRow = sheet.getRow(4);
  lineRow.height = 15;

  // Fila 5: Título del reporte
  const titleRow = sheet.getRow(5);
  titleRow.height = 22;
  const titleCell = sheet.getCell('A5');
  titleCell.value = options?.reportTitle || 'REPORTE DE GASTOS';
  titleCell.font = { 
    bold: true, 
    size: 14, 
    color: { argb: colors.dark },
    name: 'Arial'
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.mergeCells('A5:G5');

  // Fila 6: Subtítulo y metadata
  const subtitleRow = sheet.getRow(6);
  subtitleRow.height = 18;
  const subtitleCell = sheet.getCell('A6');
  const reportDate = format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
  const subtitle = [
    options?.reportSubtitle,
    `Generado: ${reportDate}`,
    options?.filterInfo && `Filtros: ${options.filterInfo}`
  ].filter(Boolean).join(' | ');
  subtitleCell.value = subtitle;
  subtitleCell.font = { 
    size: 9, 
    color: { argb: colors.dark },
    italic: true
  };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.mergeCells('A6:G6');

  // 🎨 FILA DE CABECERAS DE DATOS (Fila 7)
  const headerRow = sheet.getRow(7);
  headerRow.height = 20;
  headerRow.eachCell((cell, colNumber) => {
    if (colNumber <= headers.length) {
      cell.value = headers[colNumber - 1];
      cell.font = { 
        bold: true, 
        size: 11, 
        color: { argb: 'FFFFFFFF' },
        name: 'Arial'
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.primary }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: colors.border } },
        left: { style: 'thin', color: { argb: colors.border } },
        bottom: { style: 'thin', color: { argb: colors.border } },
        right: { style: 'thin', color: { argb: colors.border } }
      };
    }
  });

  // 🎨 FILAS DE DATOS CON COLORES TEMÁTICOS
  rows.forEach((row, rowIndex) => {
    const dataRow = sheet.getRow(rowIndex + 8);
    dataRow.height = 18;
    
    row.forEach((cellValue, colIndex) => {
      const excelCell = dataRow.getCell(colIndex + 1);
      
      // 🎯 DETECCIÓN Y CONVERSIÓN DE TIPOS DE DATOS
      let processedValue: string | number | Date = cellValue;
      let numFmt: string | undefined;
      
      // Detectar fechas en varios formatos
      if (typeof cellValue === 'string') {
        const datePatterns = [
          /^\d{1,2}\/\d{1,2}\/\d{4}$/, // DD/MM/YYYY
          /^\d{1,2}-\d{1,2}-\d{4}$/, // DD-MM-YYYY
          /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
          /^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}$/, // DD/MM/YYYY HH:MM
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO datetime
        ];
        
        const isDate = datePatterns.some(pattern => pattern.test(cellValue));
        if (isDate) {
          const date = new Date(cellValue);
          if (!isNaN(date.getTime())) {
            processedValue = date;
            numFmt = 'dd/mm/yyyy'; // Formato de fecha español
          }
        }
        // Detectar montos con símbolos de moneda
        else if (/^[S/$]?\s*[\d,]+\.?\d*$/.test(cellValue) || /^[\d,]+\.?\d*\s*S\/?$/.test(cellValue)) {
          const cleanNumber = cellValue.replace(/[S/$\s,]/g, '');
          const number = parseFloat(cleanNumber);
          if (!isNaN(number)) {
            processedValue = number;
            numFmt = '"S/" #,##0.00'; // Formato de moneda peruana
          }
        }
        // Detectar números puros
        else if (/^[\d,]+\.?\d*$/.test(cellValue)) {
          const number = parseFloat(cellValue.replace(/,/g, ''));
          if (!isNaN(number)) {
            processedValue = number;
            numFmt = '#,##0.00'; // Formato numérico
          }
        }
      }
      // Si ya es número, aplicar formato
      else if (typeof cellValue === 'number') {
        numFmt = '#,##0.00';
      }
      
      excelCell.value = processedValue;
      
      // 🎯 COLORES POR COLUMNA
      let bgColor = 'FFFFFFFF'; // Blanco por defecto
      let fontColor = colors.dark;
      let alignment: { vertical: 'middle' | 'top' | 'bottom', horizontal: 'left' | 'center' | 'right' } = { vertical: 'middle', horizontal: 'left' };
      
      switch (colIndex) {
        case 0: // ID - Gris claro
          bgColor = 'FFF9FAFB';
          fontColor = colors.dark;
          break;
        case 1: // Motivo/Descripción - Blanco
          bgColor = 'FFFFFFFF';
          fontColor = colors.dark;
          break;
        case 2: // Monto - Ámbar claro si es positivo
          bgColor = 'FFFEF3C7';
          fontColor = colors.warning;
          alignment = { vertical: 'middle', horizontal: 'right' };
          if (numFmt) {
            numFmt = '"S/" #,##0.00';
          }
          break;
        case 3: // Unidad - Azul claro
          bgColor = 'FFDBEAFE';
          fontColor = colors.secondary;
          alignment = { vertical: 'middle', horizontal: 'center' };
          break;
        case 4: // Método - Púrpura claro
          bgColor = 'FFFAE8FF';
          fontColor = colors.primary;
          alignment = { vertical: 'middle', horizontal: 'center' };
          break;
        case 5: // Usuario - Verde claro
          bgColor = 'FFD1FAE5';
          fontColor = colors.success;
          alignment = { vertical: 'middle', horizontal: 'left' };
          break;
        case 6: // Fecha - Naranja claro
          bgColor = 'FFFED7AA';
          fontColor = colors.accent;
          alignment = { vertical: 'middle', horizontal: 'center' };
          if (!numFmt && typeof processedValue === 'string' && processedValue.includes('/')) {
            // Si es fecha pero no se detectó como Date, mantener como texto con formato
            alignment = { vertical: 'middle', horizontal: 'center' };
          }
          break;
        default: // Columnas adicionales - Blanco
          bgColor = 'FFFFFFFF';
          fontColor = colors.dark;
          break;
      }
      
      // Aplicar formato de número si se detectó
      if (numFmt) {
        excelCell.numFmt = numFmt;
      }
      
      excelCell.font = { 
        size: 10, 
        color: { argb: fontColor },
        name: 'Arial'
      };
      excelCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      };
      excelCell.alignment = alignment;
      excelCell.border = {
        top: { style: 'thin', color: { argb: colors.border } },
        left: { style: 'thin', color: { argb: colors.border } },
        bottom: { style: 'thin', color: { argb: colors.border } },
        right: { style: 'thin', color: { argb: colors.border } }
      };
    });
  });

  // 🎨 FOOTER CON TOTALES Y ESTADÍSTICAS
  const footerStartRow = rows.length + 9;
  
  // Fila vacía de separación
  sheet.getRow(footerStartRow).height = 10;
  
  // Fila de totales
  const totalRow = sheet.getRow(footerStartRow + 1);
  totalRow.height = 22;
  
  // Celdas de total
  const totalLabelCell = sheet.getCell(`E${footerStartRow + 1}`);
  totalLabelCell.value = 'TOTAL:';
  totalLabelCell.font = { 
    bold: true, 
    size: 12, 
    color: { argb: colors.dark },
    name: 'Arial'
  };
  totalLabelCell.alignment = { vertical: 'middle', horizontal: 'right' };
  totalLabelCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: colors.warning }
  };
  
  const totalValueCell = sheet.getCell(`F${footerStartRow + 1}`);
  totalValueCell.value = options?.totalAmount || 0;
  totalValueCell.font = { 
    bold: true, 
    size: 14, 
    color: { argb: colors.warning },
    name: 'Arial'
  };
  totalValueCell.alignment = { vertical: 'middle', horizontal: 'right' };
  totalValueCell.numFmt = '"S/" #,##0.00';
  totalValueCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: colors.warning }
  };
  
  // Fusionar celdas de total
  sheet.mergeCells(`E${footerStartRow + 1}:G${footerStartRow + 1}`);
  
  // 🎨 FOOTER ADICIONAL
  const footerRow = sheet.getRow(footerStartRow + 3);
  footerRow.height = 15;
  const footerCell = sheet.getCell(`A${footerStartRow + 3}`);
  footerCell.value = `© ${new Date().getFullYear()} ${options?.businessName || 'Barbería & Spa POS'} - Reporte generado automáticamente`;
  footerCell.font = { 
    size: 8, 
    color: { argb: colors.dark },
    italic: true
  };
  footerCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.mergeCells(`A${footerStartRow + 3}:G${footerStartRow + 3}`);

  // 🎯 PROTECCIÓN Y CONFIGURACIÓN FINAL
  sheet.protect('', {
    selectLockedCells: false,
    selectUnlockedCells: false
  });

  // 📥 GENERAR Y DESCARGAR ARCHIVO
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
