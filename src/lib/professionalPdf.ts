/**
 * Generador de PDF profesional corporativo unificado.
 * Compatible con todas las opciones anteriores y potenciado con jspdf-autotable.
 */

import { downloadPdfReport, type PdfReportOptions, type ReportPalette, resolveReportTheme } from './pdfReport';

export interface ProfessionalPdfOptions {
  filename: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  businessInfo?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
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
  unitColors?: {
    primary: string;
    secondary: string;
  };
  unit?: string;
  includeLogo?: boolean;
  customStyles?: {
    headerColor?: [number, number, number];
    alternateRowColor?: [number, number, number];
  };
}

/**
 * Genera un PDF profesional con diseño corporativo completo.
 */
export function generateProfessionalPdf(options: ProfessionalPdfOptions): void {
  const pdfOptions: PdfReportOptions = {
    businessName: options.businessInfo?.name,
    businessAddress: options.businessInfo?.address,
    businessPhone: options.businessInfo?.phone,
    businessEmail: options.businessInfo?.email,
    reportTitle: options.title,
    reportSubtitle: options.subtitle,
    unit: options.unit,
    periodInfo: options.periodInfo,
    totals: options.totals,
    totalAmount: options.totals?.amount,
    currency: options.totals?.currency,
  };

  downloadPdfReport(
    options.filename,
    options.title,
    options.subtitle || '',
    options.headers,
    options.rows,
    pdfOptions
  );
}

export { resolveReportTheme, type ReportPalette };
