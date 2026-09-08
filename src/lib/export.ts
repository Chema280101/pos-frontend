/**
 * Helpers unificados para exportación de reportes: Excel (ExcelJS), PDF (jsPDF + autoTable) y CSV.
 * Uso: import { exportToExcel, exportToPdf, exportToCsv } from '@/lib/export';
 */

import { downloadExcelReport, type ExcelReportOptions } from './excelReport';
import { downloadPdfReport, type PdfReportOptions } from './pdfReport';
import { generateProfessionalPdf, type ProfessionalPdfOptions } from './professionalPdf';

export interface ExcelExportOptions {
  sheetName?: string;
  filename?: string;
  headers: string[];
  rows: (string | number)[][];
  businessInfo?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  unit?: string;
  totalAmount?: number;
  reportSubtitle?: string;
}

/**
 * Genera y descarga un archivo Excel con diseño corporativo premium.
 */
export async function exportToExcel({
  sheetName = 'Reporte',
  filename = 'reporte.xlsx',
  headers,
  rows,
  businessInfo,
  unit,
  totalAmount,
  reportSubtitle,
}: ExcelExportOptions): Promise<void> {
  await downloadExcelReport(
    filename,
    sheetName,
    headers,
    rows,
    {
      businessName: businessInfo?.name,
      businessAddress: businessInfo?.address,
      businessPhone: businessInfo?.phone,
      businessEmail: businessInfo?.email,
      reportTitle: sheetName,
      reportSubtitle,
      unit,
      totalAmount,
    }
  );
}

export interface PdfExportOptions {
  title: string;
  filename?: string;
  headers: string[];
  rows: (string | number)[][];
  periodLabel?: string;
  businessInfo?: ProfessionalPdfOptions['businessInfo'];
  unitColors?: ProfessionalPdfOptions['unitColors'];
  unit?: string;
  totals?: ProfessionalPdfOptions['totals'];
}

/**
 * Genera y descarga un PDF con diseño profesional corporativo completo.
 */
export function exportToPdf({
  title,
  filename = 'reporte.pdf',
  headers,
  rows,
  periodLabel,
  businessInfo,
  unit,
  totals,
}: PdfExportOptions): void {
  downloadPdfReport(
    filename,
    title,
    periodLabel || '',
    headers,
    rows,
    {
      businessName: businessInfo?.name || 'Barbería & Spa POS',
      businessAddress: businessInfo?.address,
      businessPhone: businessInfo?.phone,
      businessEmail: businessInfo?.email,
      reportTitle: title,
      reportSubtitle: periodLabel,
      unit,
      totals,
      totalAmount: totals?.amount,
    }
  );
}

/**
 * Escapa una celda para CSV (comillas si contiene coma, salto o comilla).
 */
export function escapeCsvCell(value: string | number): string {
  const s = String(value ?? '');
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
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export { generateProfessionalPdf };
