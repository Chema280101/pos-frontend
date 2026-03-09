/**
 * Helpers para exportación de reportes: Excel (ExcelJS) y PDF (jsPDF).
 * Uso: import { exportToExcel, exportToPdf } from '@/lib/export';
 */

import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';

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
  ws.addRow(headers);
  rows.forEach((row) => ws.addRow(row));
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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
}

/**
 * Genera y descarga un PDF con una tabla de datos.
 */
export function exportToPdf({
  title,
  filename = 'reporte.pdf',
  headers,
  rows,
  periodLabel,
}: PdfExportOptions): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW =
    (doc as unknown as { internal?: { pageSize?: { getWidth?: () => number } } }).internal?.pageSize?.getWidth?.() ??
    210;
  let y = 20;

  doc.setFontSize(16);
  doc.text(title, 14, y);
  y += 10;
  if (periodLabel) {
    doc.setFontSize(10);
    doc.text(periodLabel, 14, y);
    y += 8;
  }
  doc.setFontSize(10);

  const colW = (pageW - 28) / headers.length;
  headers.forEach((h, i) => {
    doc.text(String(h), 14 + i * colW, y);
  });
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y + 2, pageW - 14, y + 2);
  y += 8;

  rows.forEach((row) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    row.forEach((cell, i) => {
      doc.text(String(cell ?? ''), 14 + i * colW, y);
    });
    y += 6;
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
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
