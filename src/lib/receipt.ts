/**
 * Genera el HTML del comprobante de venta y abre la ventana de impresión.
 */
const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  DIGITAL_WALLET: 'Billetera digital',
  MIXED: 'Mixto',
};

export interface ReceiptSaleData {
  saleNumber: string;
  unit: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  paymentMethod?: string | null;
  paymentDetail?: Record<string, number> | null;
  closedAt?: string | null;
  customer?: { name: string; phone: string } | null;
  items: Array<{ name: string; unitPrice: number; quantity: number; subtotal: number }>;
  /** Datos del negocio para el encabezado del comprobante */
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  /** Logo específico para la unidad de negocio */
  businessLogo?: string;
}

function formatDate(s: string | undefined | null): string {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function buildReceiptHtml(data: ReceiptSaleData): string {
  const title = (() => {
    const businessName = data.businessName?.trim();
    // Si el nombre del negocio es el genérico "Barbería y Spa", usar el específico de la unidad
    if (businessName === 'Barbería y Spa' || !businessName) {
      return data.unit === 'BARBERIA' ? 'Barman Barbería' : 'SPA';
    }
    return businessName;
  })();
  const paymentLabel = data.paymentMethod ? PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod : '—';

  const lines = data.items
    .map(
      (i) =>
        `<tr>
          <td class="name">${escapeHtml(i.name)}</td>
          <td class="qty">${i.quantity}</td>
          <td class="num">S/ ${i.unitPrice.toFixed(2)}</td>
          <td class="num">S/ ${i.subtotal.toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const mixedLines =
    data.paymentMethod === 'MIXED' && data.paymentDetail
      ? Object.entries(data.paymentDetail)
          .filter(([, v]) => v > 0)
          .map(([k, v]) => `<div>${PAYMENT_LABELS[k] ?? k}: S/ ${v.toFixed(2)}</div>`)
          .join('')
      : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Comprobante ${escapeHtml(data.saleNumber)}</title>
  <style>
    @media print {
      @page {
        margin: 0;
        size: auto;
      }
      body {
        margin: 0;
        padding: 4px;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
  <style>
    * { box-sizing: border-box; }
    body { 
      font-family: 'Courier New', monospace; 
      font-size: 10px; 
      max-width: 280px; 
      margin: 0 auto; 
      padding: 8px; 
      color: #000;
      background: white;
      line-height: 1.2;
    }
    .header {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #000;
    }
    .logo {
      width: 60px;
      height: 60px;
      margin: 0 auto 8px;
      display: block;
    }
    .logo-placeholder {
      width: 60px;
      height: 60px;
      margin: 0 auto 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f0f0;
      border: 2px solid #000;
      font-size: 8px;
      font-weight: bold;
      text-transform: uppercase;
    }
    h1 { 
      font-size: 14px; 
      margin: 0 0 4px; 
      text-align: center;
      font-weight: bold;
      text-transform: uppercase;
    }
    .subtitle {
      font-size: 8px;
      text-transform: uppercase;
      margin-top: 2px;
      font-weight: bold;
    }
    .meta { 
      text-align: center; 
      margin-bottom: 12px;
      font-size: 9px;
    }
    .sale-number {
      font-size: 12px;
      font-weight: bold;
      margin: 6px 0;
    }
    .customer-info {
      background: #f5f5f5;
      padding: 4px 6px;
      margin: 6px 0;
      border: 1px solid #000;
    }
    .customer-phone {
      font-size: 8px;
      color: #666;
      margin-top: 2px;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 8px 0;
      font-size: 9px;
    }
    thead {
      border-bottom: 2px solid #000;
    }
    th { 
      text-align: left; 
      padding: 4px 2px; 
      font-size: 8px; 
      font-weight: bold;
      text-transform: uppercase;
    }
    th:first-child {
      text-align: left;
    }
    th:nth-child(2) {
      text-align: center;
      width: 20px;
    }
    th:nth-child(3),
    th:nth-child(4) {
      text-align: right;
    }
    td { 
      padding: 2px; 
      border-bottom: 1px dashed #ccc;
      font-size: 9px;
    }
    td.name { 
      max-width: 120px;
    }
    td.qty { 
      width: 20px; 
      text-align: center;
      font-weight: bold;
    }
    td.num { 
      text-align: right; 
      white-space: nowrap;
      font-weight: bold;
    }
    .totals { 
      margin-top: 8px; 
      text-align: right;
      font-size: 9px;
    }
    .totals div { 
      padding: 2px 0;
    }
    .discount-row {
      font-weight: bold;
    }
    .total-row { 
      font-weight: bold; 
      font-size: 12px; 
      margin-top: 4px; 
      padding-top: 4px; 
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
    }
    .change-row {
      font-weight: bold;
      color: #006400;
      margin-top: 4px;
    }
    .payment { 
      margin-top: 8px; 
      padding: 4px;
      border: 1px solid #000;
      font-size: 9px;
      text-align: center;
    }
    .payment-label {
      font-weight: bold;
    }
    .mixed-detail { 
      margin-top: 4px; 
      font-size: 8px;
      text-align: left;
    }
    .thanks { 
      text-align: center; 
      margin-top: 12px; 
      font-size: 10px;
      font-weight: bold;
      padding: 4px;
      border: 1px solid #000;
    }
    .footer {
      text-align: center;
      margin-top: 8px;
      font-size: 7px;
      border-top: 1px dashed #000;
      padding-top: 4px;
    }
    @media print {
      body { 
        margin: 0;
        padding: 4px;
        font-size: 9px;
      }
      .header {
        margin-bottom: 8px;
      }
      h1 {
        font-size: 12px;
      }
      table {
        font-size: 8px;
      }
      .totals {
        font-size: 8px;
      }
      .total-row {
        font-size: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    ${data.businessLogo ? `<img src="${escapeHtml(data.businessLogo)}" alt="Logo" class="logo" />` : `<div class="logo-placeholder">${data.unit === 'BARBERIA' ? 'BARBERÍA' : 'SPA'}</div>`}
    <h1>${escapeHtml(title)}</h1>
    <div class="subtitle">COMPROBANTE DE VENTA</div>
  </div>
  
  ${(data.businessAddress?.trim() || data.businessPhone?.trim()) ? `<div class="meta">${[data.businessAddress?.trim(), data.businessPhone?.trim()].filter((t): t is string => !!t).map((t) => escapeHtml(t)).join(' · ')}</div>` : ''}
  
  <div class="meta">
    <div class="sale-number">${escapeHtml(data.saleNumber)}</div>
    <div>${formatDate(data.closedAt ?? undefined)}</div>
    <div class="customer-info">Cliente: ${data.customer ? escapeHtml(data.customer.name) : '—'}</div>
    ${data.customer && data.customer.phone ? `<div class="customer-phone">Teléfono: ${escapeHtml(data.customer.phone)}</div>` : ''}
  </div>
  
  <table>
    <thead><tr><th>Servicio</th><th>Cant</th><th>P.Unit</th><th>Subtotal</th></tr></thead>
    <tbody>${lines}</tbody>
  </table>
  
  <div class="totals">
    <div>Subtotal: S/ ${data.subtotal.toFixed(2)}</div>
    ${data.discountAmount > 0 ? `<div class="discount-row">Descuentos: -S/ ${data.discountAmount.toFixed(2)}</div>` : ''}
    <div class="total-row">Total: S/ ${data.total.toFixed(2)}</div>
    <div class="payment">
      <div><span class="payment-label">Método de pago:</span> ${escapeHtml(paymentLabel)} · S/ ${data.amountPaid.toFixed(2)}</div>
      ${mixedLines ? `<div class="mixed-detail">${mixedLines}</div>` : ''}
    </div>
    ${data.amountPaid > data.total ? `<div class="change-row">Vuelto: S/ ${(data.amountPaid - data.total).toFixed(2)}</div>` : ''}
  </div>
  
  <div class="thanks no-print">¡Gracias por su compra!</div>
  <div class="footer no-print">Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</div>
  
  <script>
    window.onload = function() { 
      // Auto-print sin mostrar diálogo de configuración
      window.print(); 
      window.onafterprint = function() { 
        window.close(); 
      }; 
    };
  </script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Abre una nueva ventana con el comprobante e inicia la impresión. Si el popup está bloqueado, devuelve el HTML para que el llamador lo muestre en un modal con iframe. */
export function printReceipt(data: ReceiptSaleData): string | null {
  const html = buildReceiptHtml(data);
  const win = window.open('', '_blank', 'width=400,height=600');
  if (!win) {
    return html;
  }
  win.document.write(html);
  win.document.close();
  return null;
}
