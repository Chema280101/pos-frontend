import 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      startY?: number;
      head?: string[][];
      body?: (string | number)[][];
      [key: string]: unknown;
    }) => void;
    lastAutoTable: { finalY: number };
  }
}
