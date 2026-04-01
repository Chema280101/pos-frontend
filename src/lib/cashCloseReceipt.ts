/**
 * Genera el HTML del PDF de cierre de caja en español con diseño profesional
 */

export interface CashCloseData {
  unit: string;
  registerId: string;
  openedAt: string;
  closedAt: string;
  openedBy: string;
  closedBy: string;
  openingAmount: number;
  cashFromSales: number;
  cardSales: number;
  transferSales: number;
  walletSales: number;
  totalSales: number;
  manualIncome: number;
  expenses: number;
  expectedCash: number;
  closingDeclared: number;
  difference: number;
  denominations: Array<{ denomination: number; quantity: number }>;
  closingNotes?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessLogo?: string;
}

function formatDate(s: string): string {
  const d = new Date(s);
  return d.toLocaleString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatCurrency(amount: number): string {
  return `S/ ${amount.toFixed(2)}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildCashCloseReceiptHtml(data: CashCloseData): string {
  const denominationsRows = data.denominations
    .filter(d => d.quantity > 0)
    .sort((a, b) => b.denomination - a.denomination)
    .map(d => `
      <tr>
        <td class="denomination">S/ ${d.denomination.toFixed(2)}</td>
        <td class="quantity">${d.quantity}</td>
        <td class="subtotal">${formatCurrency(d.denomination * d.quantity)}</td>
      </tr>
    `).join('');

  const denominationsTotal = data.denominations.reduce((sum, d) => sum + (d.denomination * d.quantity), 0);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>CIERRE DE CAJA - ${data.unit}</title>
  <style>
    @media print {
      @page {
        margin: 10mm;
        size: A4;
        orientation: portrait;
      }
      body {
        margin: 0;
        padding: 0;
        font-size: 10pt;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-inside: avoid;
      }
    }
    
    * {
      box-sizing: border-box;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    body {
      margin: 0;
      padding: 20px;
      background: white;
      color: #333;
      line-height: 1.4;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      position: relative;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.15"/><circle cx="20" cy="60" r="0.5" fill="white" opacity="0.15"/><circle cx="80" cy="40" r="0.5" fill="white" opacity="0.15"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
      opacity: 0.1;
    }
    
    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      display: block;
      background: white;
      border-radius: 50%;
      padding: 10px;
      position: relative;
      z-index: 1;
    }
    
    .logo-placeholder {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.2);
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
      color: white;
      position: relative;
      z-index: 1;
    }
    
    h1 {
      font-size: 28px;
      margin: 0 0 10px;
      text-align: center;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      position: relative;
      z-index: 1;
    }
    
    .subtitle {
      font-size: 14px;
      text-transform: uppercase;
      margin-top: 5px;
      font-weight: 500;
      letter-spacing: 1px;
      opacity: 0.9;
      position: relative;
      z-index: 1;
    }
    
    .info-section {
      padding: 25px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      background: white;
      border-radius: 6px;
      border-left: 4px solid #667eea;
    }
    
    .info-label {
      font-weight: 600;
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .info-value {
      font-weight: 700;
      color: #333;
      font-size: 14px;
    }
    
    .main-content {
      padding: 30px;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #333;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .summary-item {
      background: white;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      transition: transform 0.2s ease;
    }
    
    .summary-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    
    .summary-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .summary-value {
      font-size: 24px;
      font-weight: 700;
      color: #333;
    }
    
    .summary-value.positive {
      color: #28a745;
    }
    
    .summary-value.negative {
      color: #dc3545;
    }
    
    .denominations-section {
      margin-bottom: 30px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    
    thead {
      background: #667eea;
      color: white;
    }
    
    th {
      padding: 15px;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 12px;
    }
    
    td {
      padding: 12px 15px;
      border-bottom: 1px solid #e9ecef;
      font-size: 14px;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    tr:hover {
      background: #f8f9fa;
    }
    
    .denomination {
      font-weight: 600;
      color: #333;
    }
    
    .quantity {
      text-align: center;
      font-weight: 600;
    }
    
    .subtotal {
      text-align: right;
      font-weight: 700;
      color: #333;
    }
    
    .totals-section {
      background: #f8f9fa;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      font-size: 16px;
    }
    
    .total-row:not(:last-child) {
      border-bottom: 1px solid #e9ecef;
    }
    
    .total-label {
      font-weight: 600;
      color: #666;
    }
    
    .total-value {
      font-weight: 700;
      color: #333;
    }
    
    .total-row.final {
      font-size: 20px;
      font-weight: 700;
      color: #333;
      border-top: 2px solid #667eea;
      border-bottom: 2px solid #667eea;
      padding: 15px 0;
      margin-top: 10px;
    }
    
    .total-value.positive {
      color: #28a745;
    }
    
    .total-value.negative {
      color: #dc3545;
    }
    
    .notes-section {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }
    
    .notes-title {
      font-weight: 600;
      color: #856404;
      margin-bottom: 10px;
    }
    
    .notes-content {
      color: #856404;
      line-height: 1.5;
    }
    
    .footer {
      background: #f8f9fa;
      padding: 25px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    
    .footer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 20px;
    }
    
    .signature-box {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 40px 20px 20px;
      text-align: center;
      background: white;
    }
    
    .signature-title {
      font-weight: 600;
      color: #666;
      margin-bottom: 20px;
      font-size: 12px;
      text-transform: uppercase;
    }
    
    .signature-line {
      border-bottom: 1px solid #333;
      margin-bottom: 10px;
      height: 30px;
    }
    
    .signature-name {
      font-weight: 600;
      color: #333;
    }
    
    .generated-info {
      font-size: 11px;
      color: #666;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
    }
    
    @media print {
      .container {
        box-shadow: none;
        border: none;
      }
      
      .header {
        background: #667eea !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .summary-item:hover {
        transform: none;
        box-shadow: none;
      }
      
      tr:hover {
        background: transparent;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      ${data.businessLogo ? `<img src="${escapeHtml(data.businessLogo)}" alt="Logo" class="logo" />` : `<div class="logo-placeholder">${data.unit === 'BARBERIA' ? 'BARBERÍA' : 'SPA'}</div>`}
      <h1>CIERRE DE CAJA</h1>
      <div class="subtitle">${data.unit === 'BARBERIA' ? 'BARBERÍA' : 'SPA'} - ${new Date().toLocaleDateString('es-PE')}</div>
    </div>
    
    <!-- Info Section -->
    <div class="info-section">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Unidad</span>
          <span class="info-value">${data.unit === 'BARBERIA' ? 'Barbería' : 'SPA'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">ID Caja</span>
          <span class="info-value">${data.registerId.slice(-8)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Fecha Apertura</span>
          <span class="info-value">${formatDate(data.openedAt)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Fecha Cierre</span>
          <span class="info-value">${formatDate(data.closedAt)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Abierto por</span>
          <span class="info-value">${escapeHtml(data.openedBy)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Cerrado por</span>
          <span class="info-value">${escapeHtml(data.closedBy)}</span>
        </div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="main-content">
      <!-- Summary Grid -->
      <h2 class="section-title">Resumen de Operaciones</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-label">Monto Apertura</div>
          <div class="summary-value">${formatCurrency(data.openingAmount)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Ventas Efectivo</div>
          <div class="summary-value positive">${formatCurrency(data.cashFromSales)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Ventas Tarjeta</div>
          <div class="summary-value positive">${formatCurrency(data.cardSales)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Transferencias</div>
          <div class="summary-value positive">${formatCurrency(data.transferSales)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Billetera Digital</div>
          <div class="summary-value positive">${formatCurrency(data.walletSales)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Ventas</div>
          <div class="summary-value positive">${formatCurrency(data.totalSales)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Ingresos Manuales</div>
          <div class="summary-value positive">${formatCurrency(data.manualIncome || 0)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Gastos</div>
          <div class="summary-value negative">${formatCurrency(data.expenses)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Efectivo Esperado</div>
          <div class="summary-value">${formatCurrency(data.expectedCash)}</div>
        </div>
      </div>
      
      <!-- Denominations Section -->
      <div class="denominations-section page-break">
        <h2 class="section-title">Desglose de Denominaciones</h2>
        <table>
          <thead>
            <tr>
              <th>Denominación</th>
              <th>Cantidad</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${denominationsRows}
          </tbody>
        </table>
      </div>
      
      <!-- Totals Section -->
      <div class="totals-section page-break">
        <h2 class="section-title">Cálculo de Cierre</h2>
        <div class="total-row">
          <span class="total-label">Monto de Apertura</span>
          <span class="total-value">${formatCurrency(data.openingAmount)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Efectivo de Ventas</span>
          <span class="total-value positive">${formatCurrency(data.cashFromSales)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Total Ventas</span>
          <span class="total-value positive">${formatCurrency(data.totalSales)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Gastos</span>
          <span class="total-value negative">${formatCurrency(data.expenses)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Efectivo Esperado</span>
          <span class="total-value">${formatCurrency(data.expectedCash)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Total Declarado</span>
          <span class="total-value">${formatCurrency(denominationsTotal)}</span>
        </div>
        <div class="total-row final">
          <span class="total-label">Diferencia</span>
          <span class="total-value ${data.difference >= 0 ? 'positive' : 'negative'}">
            ${data.difference >= 0 ? '+' : ''}${formatCurrency(data.difference)}
          </span>
        </div>
      </div>
      
      <!-- Notes Section -->
      ${data.closingNotes ? `
        <div class="notes-section page-break">
          <div class="notes-title">Notas de Cierre</div>
          <div class="notes-content">${escapeHtml(data.closingNotes)}</div>
        </div>
      ` : ''}
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-grid">
        <div class="signature-box">
          <div class="signature-title">Firma Quien Abrió</div>
          <div class="signature-line"></div>
          <div class="signature-name">${escapeHtml(data.openedBy)}</div>
        </div>
        <div class="signature-box">
          <div class="signature-title">Firma Quien Cerró</div>
          <div class="signature-line"></div>
          <div class="signature-name">${escapeHtml(data.closedBy)}</div>
        </div>
      </div>
      <div class="generated-info">
        Generado el ${new Date().toLocaleDateString('es-PE', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })} a las ${new Date().toLocaleTimeString('es-PE', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  </div>
  
  <script>
    window.onload = function() { 
      window.print(); 
      window.onafterprint = function() { 
        window.close(); 
      }; 
    };
  </script>
</body>
</html>`;
}

export function printCashCloseReceipt(data: CashCloseData): string | null {
  // Forzar nueva versión para evitar cache
  const timestamp = new Date().getTime();
  const html = buildCashCloseReceiptHtml(data);
  const htmlWithTimestamp = html.replace('</head>', `  <meta name="cache-bust" content="${timestamp}"></head>`);
  
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    return htmlWithTimestamp;
  }
  win.document.write(htmlWithTimestamp);
  win.document.close();
  return null;
}
