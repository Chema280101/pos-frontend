/**
 * Helpers para exportación de reportes: Excel (ExcelJS) y PDF (Profesional).
 * Uso: import { exportToExcel, exportToPdf } from '@/lib/export';
 */

import ExcelJS from 'exceljs';
import { generateProfessionalPdf, type ProfessionalPdfOptions } from './professionalPdf';

export interface ExcelExportOptions {
  sheetName?: string;
  filename?: string;
  headers: string[];
  rows: (string | number)[][];
}

/**
 * Genera y descarga un archivo Excel con una hoja de datos.
 */
export async function exportToExcel({
  sheetName = 'Datos',
  filename = 'reporte.xlsx',
  headers,
  rows,
}: ExcelExportOptions): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName, { views: [{ state: 'frozen', ySplit: 1 }] });
  
  // Agregar headers con styling
  const headerRow = ws.addRow(headers);
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });
  
  // Agregar filas de datos con tipos correctos
  rows.forEach((row) => {
    const dataRow = ws.addRow(row);
    dataRow.eachCell((cell, colNumber) => {
      // Aplicar tipos de dato según el contenido
      const cellValue = cell.value;
      
      // Detectar y convertir fechas
      if (typeof cellValue === 'string') {
        // Intentar parsear como fecha en formato español
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
            cell.value = date;
            cell.numFmt = 'dd/mm/yyyy'; // Formato de fecha español
          }
        }
        // Detectar montos (números con símbolos de moneda)
        else if (/^[S/$]?\s*[\d,]+\.?\d*$/.test(cellValue) || /^[\d,]+\.?\d*\s*S\/?$/.test(cellValue)) {
          const cleanNumber = cellValue.replace(/[S/$\s,]/g, '');
          const number = parseFloat(cleanNumber);
          if (!isNaN(number)) {
            cell.value = number;
            cell.numFmt = '"S/" #,##0.00'; // Formato de moneda peruana
            cell.alignment = { horizontal: 'right' };
          }
        }
        // Detectar números puros
        else if (/^[\d,]+\.?\d*$/.test(cellValue)) {
          const number = parseFloat(cellValue.replace(/,/g, ''));
          if (!isNaN(number)) {
            cell.value = number;
            cell.numFmt = '#,##0.00'; // Formato numérico
            cell.alignment = { horizontal: 'right' };
          }
        }
        // Texto normal
        else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      }
      // Si ya es número, aplicar formato
      else if (typeof cellValue === 'number') {
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right' };
      }
      
      // Bordes para todas las celdas
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
      };
    });
  });
  
  // Auto-ajustar ancho de columnas
  ws.columns.forEach((column) => {
    if (column.eachCell) {
      let maxLength = 0;
      column.eachCell({ includeEmpty: false }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    }
  });
  
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface PdfExportOptions {
  title: string;
  filename?: string;
  headers: string[];
  rows: (string | number)[][];
  periodLabel?: string;
  businessInfo?: ProfessionalPdfOptions['businessInfo'];
  unitColors?: ProfessionalPdfOptions['unitColors'];
  totals?: ProfessionalPdfOptions['totals'];
}

/**
 * Genera y descarga un PDF con diseño profesional completo.
 * Ahora utiliza la función unificada de PDF profesional con logo, encabezado, estilos y footer.
 */
export function exportToPdf({
  title,
  filename = 'reporte.pdf',
  headers,
  rows,
  periodLabel,
  businessInfo,
  unitColors,
  totals,
}: PdfExportOptions): void {
  // Convertir el formato antiguo al nuevo formato profesional
  const professionalOptions: ProfessionalPdfOptions = {
    filename,
    title,
    headers,
    rows,
    subtitle: periodLabel,
    businessInfo: businessInfo || {
      name: 'Barbería & Spa POS',
      address: 'Dirección del negocio',
      phone: 'Teléfono de contacto',
      email: 'email@negocio.com'
    },
    includeLogo: true,
    totals: totals || (rows.length > 0 ? {
      label: 'TOTAL REGISTROS',
      amount: rows.length,
      currency: ''
    } : undefined),
    unitColors,
  };

  generateProfessionalPdf(professionalOptions);
}

/**
 * Escapa una celda para CSV (comillas si contiene coma, salto o comilla).
 */
export function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Genera y descarga un CSV desde headers y filas.
 */
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const line = (row: (string | number)[]) => row.map(escapeCsvCell).join(',');
  const csv = [line(headers), ...rows.map((row) => line(row))].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
