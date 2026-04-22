import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Banknote, CreditCard, ArrowRightLeft, Smartphone, Receipt, TrendingDown, Vault, ShoppingCart, Lock, Unlock, FileDown, PlusCircle, TrendingUp, DollarSign, Clock, AlertCircle, CheckCircle, Calculator, FileText, Eye, Search, Filter, X, Calendar, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUnitStore } from '@/store/unitStore';
import { DataTable, type Column, type Action } from '@/components/ui/DataTable';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { generateProfessionalPdf } from '@/lib/professionalPdf';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  type CashRegister, 
  type CashRegisterListResponse,
  type BusinessUnit,
  type CashRegisterOpen
} from '@/types/cash';
import { CashRegisterStatus } from './CashRegisterStatus';
import { CashRegisterOperations } from './CashRegisterOperations';

// Importar CashRegisterMetrics
import { CashRegisterMetrics } from './CashRegisterMetrics';
import { CashClosingArqueo } from './CashClosingArqueo';

export function CashRegisterPage(): JSX.Element {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const unit = activeUnit === 'BARBERIA' ? 'BARBERIA' : 'SPA';
  const [openingAmount, setOpeningAmount] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [closeSignature, setCloseSignature] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReason, setExpenseReason] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('other');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState('CASH');
  const [showClose, setShowClose] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [showCashEntry, setShowCashEntry] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [cashReason, setCashReason] = useState('');
  const [cashType, setCashType] = useState('');
  const [detailsModal, setDetailsModal] = useState(false);
  const [selectedRegister, setSelectedRegister] = useState<any>(null);

  // Success confirmation state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Date range filter states
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(subDays(new Date(), 7)));
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date()));
  const [unitFilter, setUnitFilter] = useState<string>('');
  
  // Additional filter states
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [amountRangeFilter, setAmountRangeFilter] = useState<string>('');
  const [employeeFilter, setEmployeeFilter] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);

  // Helper function to close all modals
  const closeAllModals = () => {
    setShowClose(false);
    setShowExpense(false);
    setShowCashEntry(false);
    setDetailsModal(false);
  };

  // Modal open functions with auto-close
  const openCloseModal = () => {
    closeAllModals();
    setShowClose(true);
  };

  const openExpenseModal = () => {
    closeAllModals();
    setShowExpense(true);
  };

  const openCashEntryModal = () => {
    closeAllModals();
    setShowCashEntry(true);
  };
  const DENOMINATIONS = [
    200, 100, 50, 20, 10,
    5, 2, 1,
    0.5, 0.2, 0.1
  ];
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const totalDeclared = DENOMINATIONS.reduce((acc, denom) => {
    return acc + (quantities[denom] || 0) * denom;
  }, 0);

  const { data: openRegister, isLoading } = useQuery({
    queryKey: ['cash-register-open', unit],
    queryFn: async (): Promise<CashRegisterOpen | null> => {
      const { data } = await api.get<CashRegisterOpen | null>(`/api/cash-register/open?unit=${unit}`);
      return data;
    },
  });

  const { data: registersData = { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } } } = useQuery<CashRegisterListResponse>({
    queryKey: ['cash-registers', unit],
    queryFn: async (): Promise<CashRegisterListResponse> => {
      const { data } = await api.get<CashRegisterListResponse>(`/api/cash-register?unit=${unit}&limit=20`);
      return data;
    },
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 10 * 60 * 1000, // 10 minutos garbage collection
    refetchInterval: 30 * 1000, // Polling cada 30 segundos
    refetchOnWindowFocus: false, // No refetch al cambiar de ventana
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });

  const { data: summary } = useQuery({
    queryKey: ['cash-summary', openRegister?.id],
    enabled: !!openRegister?.id,
    queryFn: async () => {
      const { data } = await api.get(
        `/api/cash-register/${openRegister!.id}/summary`
      );
      return data;
    },
  });

  const openMutation = useMutation({
    mutationFn: async () => {
      // Obtener hora local de Perú (UTC-5)
      const now = new Date();
      const peruTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
      
      await api.post('/api/cash-register/open', {
        unit,
        openingAmount: Number(openingAmount),
        openedAt: peruTime.toISOString(), // Hora real de Perú (UTC-5)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-open', unit] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-history', unit] });
      setSuccessMessage('¡Caja abierta exitosamente!');
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);
      setOpeningAmount('');
    },
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      if (!openRegister?.id) return;

      const denominations = DENOMINATIONS.map((d) => ({
        denomination: d,
        quantity: quantities[d] || 0,
      }));

      await api.post(`/api/cash-register/${openRegister.id}/close`, {
        denominations,
        closingNotes: closeNotes.trim() || undefined,
        closedBySignature: closeSignature.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-open', unit] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-history', unit] });
      setSuccessMessage('¡Caja cerrada exitosamente!');
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);
      setShowClose(false);
      setQuantities({});
      setCloseNotes('');
      setCloseSignature('');
    },
  });

  const expenseMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        registerId: openRegister?.id,
        amount: Number(expenseAmount),
        reason: expenseReason.trim(),
        category: expenseCategory,
        paymentMethod: expensePaymentMethod,
      };

      await api.post(`/api/cash-register/${openRegister?.id}/expense`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-open', unit] });
      setSuccessMessage('¡Egreso registrado exitosamente!');
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);
      setShowExpense(false);
      setExpenseAmount('');
      setExpenseReason('');
      setExpenseCategory('other');
      setExpensePaymentMethod('CASH');
    },
  });

  const cashEntryMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/income', {
        amount: Number(cashAmount),
        reason: cashReason.trim(),
        type: cashType || 'OTRO',
        unit: unit, // Enviar la unidad en lugar del ID
        enteredBy: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-open', unit] });
      queryClient.invalidateQueries({ queryKey: ['cash-summary', openRegister?.id] });
      queryClient.invalidateQueries({ queryKey: ['income'] }); // Invalidar tabla de ingresos
      setSuccessMessage('¡Ingreso registrado exitosamente!');
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);
      setShowCashEntry(false);
      setCashAmount('');
      setCashReason('');
      setCashType('');
    },
  });

  const canOpen = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';

  // DataTable columns for history
  const historyColumns: Column<any>[] = [
    {
      key: 'openedAt',
      header: 'Fecha Apertura',
      sortable: true,
      render: (row) => {
        const date = new Date(row.openedAt);
        // Custom formatting for "2 mar. 2026" and "12:00 a. m."
        const day = date.getDate();
        const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        
        return (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-[var(--unit-text-muted)]" />
            <div className="text-sm">
              <div className="font-medium text-[var(--unit-text-muted)]">
                {day} {month}. {year}
              </div>
              <div className="text-[var(--unit-text-muted)]">
                {displayHours}:{displayMinutes} {ampm}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'openingAmount',
      header: 'Monto Inicial',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-[var(--unit-text-muted)] tabular-nums">
          S/ {Number(row.openingAmount).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
          row.status === 'OPEN' 
            ? 'bg-emerald-100 text-emerald-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.status === 'OPEN' ? (
            <>
              <Unlock className="h-3 w-3" />
              Abierta
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" />
              Cerrada
            </>
          )}
        </span>
      ),
    },
    {
      key: 'difference',
      header: 'Diferencia',
      sortable: true,
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          {row.difference === 0 ? (
            <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          )}
          <span className={`font-semibold tabular-nums ${
            row.difference !== 0 ? 'text-red-500' : 'text-emerald-600'
          }`}>
            {row.difference >= 0 ? '+' : ''}S/ {Number(row.difference || 0).toFixed(2)}
          </span>
        </div>
      ),
    },
  ];

  const historyActions: Action<any>[] = [
    {
      label: 'Ver detalles',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row) => {
        setSelectedRegister(row);
        setDetailsModal(true);
      },
      className: 'text-blue-600 hover:bg-blue-50',
    },
    {
      label: 'Imprimir PDF',
      icon: <FileDown className="h-4 w-4" />,
      onClick: (row) => {
        // Generate PDF for specific register
        generatePDF(row);
      },
      className: 'text-red-600 hover:bg-red-50',
      disabled: (row) => row.status === 'OPEN',
    },
  ];

  // Safe number conversion to prevent NaN
  const safeNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  function generatePDF(register: any) {
    // Usar la función profesional unificada
    generateProfessionalPdf({
      filename: `reporte-caja-${register.id}-${format(new Date(), 'yyyy-MM-dd')}`,
      title: 'REPORTE DE CAJA',
      subtitle: `Unidad: ${register.unit} | ID: ${register.id} | Estado: ${register.status === 'OPEN' ? 'Abierta' : 'Cerrada'}`,
      headers: ['Concepto', 'Monto (S/)', 'Fecha/Hora'],
      rows: [
        ['Monto Inicial', safeNumber(register.openingAmount).toFixed(2), register.openedAt ? format(new Date(register.openedAt), "dd/MM/yyyy HH:mm", { locale: es }) : 'N/A'],
        ['Ventas Efectivo', safeNumber(register.cashSales).toFixed(2), ''],
        ['Ventas Tarjeta', safeNumber(register.cardSales).toFixed(2), ''],
        ['Ventas Transferencia', safeNumber(register.transferSales).toFixed(2), ''],
        ['Ventas Billetera Digital', safeNumber(register.walletSales).toFixed(2), ''],
        ['Egresos', safeNumber(register.expenses).toFixed(2), ''],
        ['Ingresos Extra', safeNumber(register.cashEntries).toFixed(2), ''],
        ['Monto Final', safeNumber(register.closingAmount).toFixed(2), register.closedAt ? format(new Date(register.closedAt), "dd/MM/yyyy HH:mm", { locale: es }) : 'N/A'],
        ['Diferencia', safeNumber(register.difference).toFixed(2), '']
      ],
      periodInfo: register.openedAt ? {
        from: new Date(register.openedAt),
        to: register.closedAt ? new Date(register.closedAt) : new Date()
      } : undefined,
      totals: {
        label: 'MONTO FINAL CAJA',
        amount: safeNumber(register.closingAmount),
        currency: 'S/'
      },
      businessInfo: {
        name: 'Barbería & Spa POS',
        address: 'Dirección del negocio',
        phone: 'Teléfono de contacto',
        email: 'email@negocio.com'
      },
      includeLogo: true
    });
  }

  function generateClosePdf(
    registerId: string,
    unit: string,
    summary: any,
    denominations: Record<number, number>,
    closeSignature: string,
    closeNotes: string
  ) {
    // Usar el nuevo PDF de cierre de caja profesional
    import('@/lib/cashCloseReceipt').then((module: any) => {
      const { printCashCloseReceipt } = module;
      // @ts-ignore - El tipo se importa dinámicamente
      const cashCloseData = {
        unit: unit as 'BARBERIA' | 'SPA',
        registerId,
        openedAt: new Date().toISOString(), // Debería venir del backend
        closedAt: new Date().toISOString(),
        openedBy: 'Usuario', // Debería venir del backend
        closedBy: closeSignature,
        openingAmount: summary.opening || 0,
        cashFromSales: summary.cashFromSales || 0,
        cardSales: summary.card || 0,
        transferSales: summary.transfer || 0,
        walletSales: summary.wallet || 0,
        totalSales: (summary.cashFromSales || summary.cash || 0) + (summary.card || 0) + (summary.transfer || 0) + (summary.wallet || 0),
        manualIncome: summary.cashEntries || 0,
        expenses: summary.expenses || 0,
        expectedCash: summary.expectedCash || 0,
        closingDeclared: Object.entries(denominations).reduce((sum, [denom, qty]) => sum + (Number(denom) * Number(qty)), 0),
        difference: 0, // Debería calcularse
        denominations: Object.entries(denominations).map(([denom, qty]) => ({
          denomination: Number(denom),
          quantity: Number(qty)
        })),
        closingNotes: closeNotes,
        businessName: 'Barbería y Spa POS',
        businessAddress: 'Dirección del negocio',
        businessPhone: 'Teléfono de contacto',
      };

      console.log('🔍 DEBUG - Datos para nuevo PDF:', cashCloseData);
      printCashCloseReceipt(cashCloseData);
    }).catch(error => {
      console.error('Error al cargar el módulo del PDF:', error);
    });
  }

  const kpiCards = summary
    ? [
        { label: 'Efectivo', value: summary.cashFromSales || 0, icon: Banknote, color: 'text-emerald-600' },
        { label: 'Tarjeta', value: summary.card, icon: CreditCard, color: 'text-blue-600' },
        { label: 'Transferencia', value: summary.transfer, icon: ArrowRightLeft, color: 'text-violet-600' },
        { label: 'Billetera', value: summary.wallet, icon: Smartphone, color: 'text-orange-600' },
        { label: 'Gastos', value: summary.expenses, icon: TrendingDown, color: 'text-red-500' },
        { label: 'Esperado', value: summary.expectedCash, icon: Vault, color: 'text-[var(--unit-accent)]' },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)] relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto p-6">
        {/* Premium Header - Agenda Style */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
              <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
              <span className="text-sm font-medium text-[var(--unit-text)]">
                Sistema de Caja
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Caja Registradora</h1>
            <p className="text-[var(--unit-text-muted)]">
              Gestiona operaciones financieras con control total
            </p>
          </div>

        {/* Cash Register Metrics - Nueva sección de métricas espectaculares */}
        <CashRegisterMetrics cashRegisters={registersData?.data || []} />

        {isLoading ? (
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
                <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-emerald-500/20"></div>
              </div>
              <p className="mt-4 text-sm text-[var(--unit-text-muted)]">Cargando estado de caja...</p>
            </div>
          </div>
        ) : openRegister ? (
          <div className="space-y-8">
            {/* Premium Status Banner */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-6 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent"></div>
              <div className="relative flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/30 shadow-lg">
                  <div className="relative">
                    <Unlock className="h-7 w-7 text-emerald-600" />
                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-sm"></div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-[var(--unit-text)]">Caja Abierta</h3>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[var(--unit-text-muted)]">
                    <span>Monto inicial: <span className="font-bold text-emerald-600">S/ {openRegister.openingAmount.toFixed(2)}</span></span>
                    <span className="text-emerald-500">•</span>
                    <span>Apertura: {new Date(openRegister.openedAt).toLocaleString('es-PE', { timeZone: 'America/Lima' })}</span>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-right">
                    <p className="text-xs text-[var(--unit-text-muted)]">Estado actual</p>
                    <p className="text-sm font-bold text-emerald-600">Operativa</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Essential KPIs Only */}
            {summary && (
              <div className="space-y-8">
                {/* Payment Methods Breakdown */}
                <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-8">
                  <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10">
                          <CreditCard className="h-5 w-5 text-[var(--unit-accent)]" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--unit-text)]">Métodos de Pago</h3>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--unit-accent)]/10 px-3 py-1 text-xs font-bold text-[var(--unit-accent)]">
                        Desglose de ventas
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 p-4 transition-all hover:shadow-lg hover:scale-[1.02] group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/30 shadow-md">
                            <Banknote className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-[var(--unit-text-muted)]">Efectivo</p>
                            <p className="font-bold text-lg text-[var(--unit-text)] tabular-nums">S/ {(summary.cashFromSales || 0).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 p-4 transition-all hover:shadow-lg hover:scale-[1.02] group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/30 shadow-md">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-[var(--unit-text-muted)]">Tarjeta</p>
                            <p className="font-bold text-lg text-[var(--unit-text)] tabular-nums">S/ {summary.card.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 p-4 transition-all hover:shadow-lg hover:scale-[1.02] group">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/30 shadow-md">
                            <ArrowRightLeft className="h-5 w-5 text-violet-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-[var(--unit-text-muted)]">Transferencia</p>
                            <p className="font-bold text-lg text-[var(--unit-text)] tabular-nums">S/ {summary.transfer.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 p-4 transition-all hover:shadow-lg hover:scale-[1.02] group">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/30 shadow-md">
                            <Smartphone className="h-5 w-5 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-[var(--unit-text-muted)]">Billetera</p>
                            <p className="font-bold text-lg text-[var(--unit-text)] tabular-nums">S/ {summary.wallet.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Premium Actions Section */}
            {canOpen && (
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button
                  type="button"
                  onClick={openCloseModal}
                  className="relative flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 px-8 py-4 text-sm font-bold text-white shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02] hover:from-amber-600 hover:to-amber-700 active:scale-[0.98] group"
                >
                  <Lock className="h-5 w-5" />
                  <span>Cerrar Caja</span>
                  <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                <button
                  type="button"
                  onClick={openExpenseModal}
                  className="relative flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 px-8 py-4 text-sm font-bold text-white shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02] hover:from-red-600 hover:to-red-700 active:scale-[0.98] group"
                >
                  <PlusCircle className="h-5 w-5" />
                  <span>Registrar Gasto</span>
                  <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                <button
                  type="button"
                  onClick={openCashEntryModal}
                  className="relative flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-8 py-4 text-sm font-bold text-white shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02] hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.98] group"
                >
                  <DollarSign className="h-5 w-5" />
                  <span>Ingresar Efectivo</span>
                  <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              </div>
            )}

            {/* Enhanced Close Form */}
            {showClose && (
              <div className="rounded-[var(--unit-border-radius)] border-2 border-[var(--unit-border)] bg-[var(--unit-surface-elevated) shadow-[var(--unit-shadow-lg)] overflow-hidden">
                {/* Form Header */}
                <div className="border-b border-[var(--unit-border)] bg-gradient-to-r from-amber-500/10 to-amber-600/5 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15">
                      <Lock className="h-5 w-5 text-amber-600" />
            </div>
                  <div>
                      <h3 className="text-lg font-semibold text-[var(--unit-text-muted)]">Cerrar Caja</h3>
                      <p className="text-sm text-[var(--unit-text-muted)]">Registra el conteo físico del efectivo</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Arqueo de Caja - Desglose completo */}
                  {summary && (
                    <div className="mb-6">
                      <CashClosingArqueo
                        denominations={quantities}
                        expectedCash={summary.expectedCash}
                        opening={summary.opening}
                        totalSales={summary.totalSales}
                        cash={summary.cash}
                        cashFromSales={summary.cashFromSales || 0}
                        card={summary.card}
                        transfer={summary.transfer}
                        wallet={summary.wallet}
                        expenses={summary.expenses}
                        cashEntries={summary.cashEntries || 0}
                        cashExpenses={summary.cashExpenses || 0}
                        cardExpenses={summary.cardExpenses || 0}
                        transferExpenses={summary.transferExpenses || 0}
                        walletExpenses={summary.walletExpenses || 0}
                      />
                    </div>
                  )}

                  <div className="space-y-4 mb-6">
                    {/* Denominations Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {DENOMINATIONS.map((denom) => (
                        <div key={denom} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--unit-surface)] border border-[var(--unit-border)]">
                          <div className="flex min-w-[80px] items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-surface-elevated)] to-[var(--unit-surface)] border border-[var(--unit-border)] px-3 py-2">
                            <span className="font-bold text-[var(--unit-text)]">S/ {denom.toFixed(2)}</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            value={quantities[denom] || ''}
                            onChange={(e) => setQuantities((prev) => ({ ...prev, [denom]: Number(e.target.value) || 0 }))}
                            className="flex-1 rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-[var(--unit-surface-elevated)] to-[var(--unit-surface)] px-3 py-2 text-center font-medium text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                            placeholder="0"
                          />
                          <div className="flex min-w-[80px] justify-end rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 px-3 py-2">
                            <span className="font-semibold text-emerald-700 tabular-nums">
                            S/ {((quantities[denom] || 0) * denom).toFixed(2)}
                          </span>
                        </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary Section */}
                    <div className="border-t border-[var(--unit-border)] pt-4 space-y-3">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-[var(--unit-surface)]">
                        <span className="font-semibold text-[var(--unit-text-muted)]">Total contado</span>
                        <span className="font-heading text-xl font-bold text-[var(--unit-text-muted)] tabular-nums">
                          S/ {totalDeclared.toFixed(2)}
                        </span>
                      </div>
                        {summary && (
                        <div className="flex justify-between items-center p-3 rounded-lg bg-[var(--unit-surface)]">
                          <span className="font-semibold text-[var(--unit-text-muted)]">Diferencia</span>
                          <div className="flex items-center gap-2">
                            {totalDeclared - summary.expectedCash === 0 ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className={`font-heading text-lg font-bold tabular-nums ${
                              totalDeclared - summary.expectedCash === 0 ? 'text-emerald-600' : 'text-red-500'
                            }`}>
                              {totalDeclared - summary.expectedCash >= 0 ? '+' : ''}S/ {(totalDeclared - summary.expectedCash).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        )}
                      </div>
                    </div>

                  {/* Signature and Notes */}
                  <div className="space-y-4 mb-6">
                  <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--unit-text-muted)]">
                        Firma (nombre) *
                      </label>
                    <input
                      value={closeSignature}
                      onChange={(e) => setCloseSignature(e.target.value)}
                        placeholder="Nombre de quien cierra la caja"
                        className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-[var(--unit-surface-elevated)] to-[var(--unit-surface)] px-4 py-3 text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    />
                  </div>
                  <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--unit-text-muted)]">
                        Notas de cierre
                      </label>
                    <textarea
                      value={closeNotes}
                      onChange={(e) => setCloseNotes(e.target.value)}
                        placeholder="Ej: Cierre correcto, faltante en caja, cliente especial, etc."
                        className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-[var(--unit-surface-elevated)] to-[var(--unit-surface)] px-4 py-3 text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all resize-none"
                        rows={3}
                    />
                  </div>
                </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      closeMutation.mutate();
                      if (summary && openRegister) {
                        generateClosePdf(openRegister.id, unit, summary, quantities, closeSignature, closeNotes);
                      }
                    }}
                      disabled={!closeSignature.trim() || closeMutation.isPending || (summary && Math.abs(totalDeclared - summary.expectedCash) > 50)}
                      className="inline-flex items-center justify-center gap-2 rounded-[var(--unit-border-radius)] bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-3 text-sm font-semibold text-white shadow-[var(--unit-shadow)] transition-all hover:shadow-lg hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                      {closeMutation.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Cerrando...
                        </>
                      ) : (
                        <>
                          <FileDown className="h-4 w-4" />
                          Cerrar y generar PDF
                        </>
                      )}
                  </button>
                    <button
                      type="button"
                      onClick={() => setShowClose(false)}
                      className="rounded-[var(--unit-border-radius)] border border-[var(--unit-border)] px-6 py-3 text-sm font-medium text-[var(--unit-accent)] transition-all hover:bg-[var(--unit-accent)] hover:text-white active:scale-[0.98]"
                    >
                    Cancelar
                  </button>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Expense Form */}
            {showExpense && (
              <div className="rounded-[var(--unit-border-radius)] border-2 border-[var(--unit-border)] bg-[var(--unit-surface-elevated) shadow-[var(--unit-shadow-lg)] overflow-hidden">
                {/* Form Header */}
                <div className="border-b border-[var(--unit-border)] bg-gradient-to-r from-red-500/10 to-red-600/5 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    </div>
                  <div>
                      <h3 className="text-lg font-semibold text-[var(--unit-text-muted)]">Registrar Gasto</h3>
                      <p className="text-sm text-[var(--unit-text-muted)]">Registra un egreso de caja</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--unit-text-muted)]">
                        Monto (S/) *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--unit-text-muted)]" />
                    <input
                      type="number"
                          step="0.10"
                          min="0.00"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                          className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-[var(--unit-surface-elevated)] to-[var(--unit-surface)] pl-10 pr-4 py-3 text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                          placeholder="0.00"
                    />
                      </div>
                  </div>
                  <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--unit-text-muted)]">
                        Categoría
                      </label>
                      <select
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value)}
                        className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-[var(--unit-surface-elevated)] to-[var(--unit-surface)] px-4 py-3 text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all appearance-none cursor-pointer"
                      >
                        <option value="other">Otros</option>
                        <option value="supplies">Insumos</option>
                        <option value="services">Servicios</option>
                        <option value="maintenance">Mantenimiento</option>
                        <option value="rent">Alquiler</option>
                        <option value="utilities">Servicios básicos</option>
                        <option value="marketing">Marketing</option>
                        <option value="office">Oficina</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--unit-text-muted)]">
                        Método de Pago
                      </label>
                      <select
                        value={expensePaymentMethod}
                        onChange={(e) => setExpensePaymentMethod(e.target.value)}
                        className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-[var(--unit-surface-elevated)] to-[var(--unit-surface)] px-4 py-3 text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all appearance-none cursor-pointer"
                      >
                        <option value="CASH">Efectivo</option>
                        <option value="CARD">Tarjeta</option>
                        <option value="TRANSFER">Transferencia</option>
                        <option value="DIGITAL_WALLET">Billetera Digital</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--unit-text-muted)]">
                        Motivo *
                      </label>
                    <input
                      value={expenseReason}
                      onChange={(e) => setExpenseReason(e.target.value)}
                        placeholder="Ej: Compra de insumos, pago de servicios, etc."
                        className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-[var(--unit-surface-elevated)] to-[var(--unit-surface)] px-4 py-3 text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    />
                  </div>
                </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => expenseMutation.mutate()}
                    disabled={!expenseAmount || Number(expenseAmount) <= 0 || !expenseReason.trim() || expenseMutation.isPending}
                      className="inline-flex items-center justify-center gap-2 rounded-[var(--unit-border-radius)] bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 text-sm font-semibold text-white shadow-[var(--unit-shadow)] transition-all hover:shadow-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                      {expenseMutation.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Registrando...
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4" />
                          Registrar gasto
                        </>
                      )}
                  </button>
                    <button
                      type="button"
                      onClick={() => setShowExpense(false)}
                      className="rounded-[var(--unit-border-radius)] border border-[var(--unit-border)] px-6 py-3 text-sm font-medium text-[var(--unit-accent)] transition-all hover:bg-[var(--unit-accent)] hover:text-white active:scale-[0.98]"
                    >
                    Cancelar
                  </button>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Cash Entry Form */}
            {showCashEntry && (
              <div className="rounded-[var(--unit-border-radius)] border-2 border-[var(--unit-border)] bg-[var(--unit-surface-elevated)] shadow-[var(--unit-shadow-lg)] overflow-hidden">
                {/* Form Header */}
                <div className="border-b border-[var(--unit-border)] bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--unit-text-muted)]">Ingresar Efectivo</h3>
                      <p className="text-sm text-[var(--unit-text-muted)]">Registra efectivo manual en caja</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--unit-text-muted)]">
                        Monto (S/) *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--unit-text-muted)]" />
                        <input
                          type="number"
                          step="0.00"
                          min="0.00"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-[var(--unit-surface-elevated)] to-[var(--unit-surface)] pl-10 pr-4 py-3 text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--unit-text-muted)]">
                        Motivo *
                      </label>
                      <input
                        value={cashReason}
                        onChange={(e) => setCashReason(e.target.value)}
                        placeholder="Ej: Venta fuera del sistema, depósito bancario, ajuste..."
                        className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-[var(--unit-surface-elevated)] to-[var(--unit-surface)] px-4 py-3 text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--unit-text-muted)]">
                        Tipo de Ingreso
                      </label>
                      <select
                        value={cashType}
                        onChange={(e) => setCashType(e.target.value)}
                        className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-[var(--unit-surface-elevated)] to-[var(--unit-surface)] px-4 py-3 text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="VENTA_EXTERNA">Venta Externa</option>
                        <option value="AJUSTE_CAJA">Ajuste de Caja</option>
                        <option value="DEPOSITO">Depósito</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => cashEntryMutation.mutate()}
                      disabled={!cashAmount || Number(cashAmount) <= 0 || !cashReason.trim() || cashEntryMutation.isPending}
                      className="inline-flex items-center justify-center gap-2 rounded-[var(--unit-border-radius)] bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-[var(--unit-shadow)] transition-all hover:shadow-lg hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {cashEntryMutation.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Registrando...
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-4 w-4" />
                          Ingresar efectivo
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCashEntry(false)}
                      className="rounded-[var(--unit-border-radius)] border border-[var(--unit-border)] px-6 py-3 text-sm font-medium text-[var(--unit-accent)] transition-all hover:bg-[var(--unit-primary)] hover:text-white active:scale-[0.98]"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : canOpen ? (
          /* Open Register */
          <div className="rounded-[var(--unit-border-radius)] border border-[var(--unit-border)] bg-[var(--unit-surface-elevated) shadow-[var(--unit-shadow-lg)] overflow-hidden">
            {/* Header */}
            <div className="border-b border-[var(--unit-border)] bg-gradient-to-r from-blue-500/10 to-blue-600/5 px-6 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/15 mx-auto mb-4">
                <Vault className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--unit-text)] mb-2">Abrir Caja</h3>
              <p className="text-[var(--unit-text-muted)]">No hay caja abierta para {unit}. Ingresa el monto inicial para comenzar.</p>
            </div>

            <div className="p-8">
              <div className="mx-auto max-w-md">
                <div className="space-y-4">
              <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--unit-text-muted)]">
                      Monto inicial (S/) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--unit-text-muted)]" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={openingAmount}
                  onChange={(e) => setOpeningAmount(e.target.value)}
                        className="w-full rounded-[var(--unit-radius-sm)] border border-[var(--unit-border)] bg-[var(--unit-surface-elevated] pl-12 pr-4 py-4 text-center font-heading text-2xl text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50"
                        placeholder="0.00"
                />
              </div>
                  </div>
              <button
                type="button"
                onClick={() => openMutation.mutate()}
                disabled={!openingAmount || Number(openingAmount) < 0 || openMutation.isPending}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-[var(--unit-border-radius)] bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-sm font-semibold text-white shadow-[var(--unit-shadow)] transition-all hover:shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                    {openMutation.isPending ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Abriendo caja...
                      </>
                    ) : (
                      <>
                        <Unlock className="h-5 w-5" />
                Abrir caja
                      </>
                    )}
              </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* No Access Section */
          <div className="rounded-[var(--unit-border-radius)] border border-[var(--unit-border)] bg-[var(--unit-surface-elevated)] p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 mx-auto mb-4">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--unit-text)] mb-2">Acceso Restringido</h3>
            <p className="text-[var(--unit-text-muted)]">No hay caja abierta. Solo Recepción o Admin pueden abrir la caja.</p>
          </div>
        )}

        {/* Enhanced History Section with Custom Filters */}
        {history && Array.isArray(history) && history.length > 0 && (
          <div className="mt-12">
            {/* History Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[var(--unit-accent)]" />
                <h2 className="text-lg font-semibold text-[var(--unit-text-muted)]">Historial de Cajas</h2>
              </div>
              <span className="text-xs text-[var(--unit-text-muted)]">Registros de apertura y cierre</span>
            </div>

            {/* Filters Block */}
            <div className="rounded-[var(--unit-border-radius)] border border-[var(--unit-border)] bg-[var(--unit-surface-elevated)] p-6 mb-8">
              {/* Filter Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-[var(--unit-text)]" />
                  <h3 className="text-sm font-semibold text-[var(--unit-text)]">Filtros de Historial</h3>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--unit-text)] hover:text-[var(--unit-text)] hover:bg-[var(--unit-surface)] hover:text-[var(--unit-surface-elevated)] rounded-lg transition-colors"
                >
                  {showFilters ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Ocultar filtros
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Mostrar filtros
                    </>
                  )}
                </button>
              </div>

              {/* Filter Content - Conditional Rendering */}
              {showFilters && (
                <>

              {/* Date Range Filter - FIRST */}
              <DateRangeFilter
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={(date: Date | null) => date && setDateFrom(date)}
                onDateToChange={(date: Date | null) => date && setDateTo(date)}
                unit={unitFilter}
                onUnitChange={setUnitFilter}
                showUnitFilter={false} // Already have unit filter below
                showStatusFilter={false}
                className="mb-6"
              />

              {/* Filter Controls - SECOND */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--unit-text)] uppercase tracking-wider">Estado</label>
                  <select
                    value={statusFilter}
                    className="w-full rounded-[var(--unit-radius-sm)] border border-[var(--unit-border)] bg-white px-3 py-2 text-sm text-[var(--unit-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    <option value="OPEN">Abiertas</option>
                    <option value="CLOSED">Cerradas</option>
                  </select>
                </div>

                {/* Unit Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--unit-text)] uppercase tracking-wider">Unidad</label>
                  <select
                    value={unitFilter}
                    className="w-full rounded-[var(--unit-radius-sm)] border border-[var(--unit-border)] bg-white px-3 py-2 text-sm text-[var(--unit-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]"
                    onChange={(e) => setUnitFilter(e.target.value)}
                  >
                    <option value="">Todas las unidades</option>
                    <option value="SPA">SPA</option>
                    <option value="BARBERIA">Barbería</option>
                  </select>
                </div>

                {/* Amount Range Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--unit-text)] uppercase tracking-wider">Rango de monto</label>
                  <select
                    value={amountRangeFilter}
                    className="w-full rounded-[var(--unit-radius-sm)] border border-[var(--unit-border)] bg-white px-3 py-2 text-sm text-[var(--unit-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]"
                    onChange={(e) => setAmountRangeFilter(e.target.value)}
                  >
                    <option value="">Todos los montos</option>
                    <option value="0-100">S/ 0 - 100</option>
                    <option value="100-500">S/ 100 - 500</option>
                    <option value="500-1000">S/ 500 - 1000</option>
                    <option value="1000+">S/ 1000+</option>
                  </select>
                </div>

                {/* Employee Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--unit-text)] uppercase tracking-wider">Empleado</label>
                  <select
                    value={employeeFilter}
                    className="w-full rounded-[var(--unit-radius-sm)] border border-[var(--unit-border)] bg-white px-3 py-2 text-sm text-[var(--unit-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]"
                    onChange={(e) => setEmployeeFilter(e.target.value)}
                  >
                    <option value="">Todos los empleados</option>
                    <option value="emp1">Juan Pérez</option>
                    <option value="emp2">María García</option>
                    <option value="emp3">Carlos López</option>
                    <option value="emp4">Ana Martínez</option>
                  </select>
                </div>
              </div>

              {/* Search Bar - THIRD */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--unit-text-muted)]" />
                <input
                  type="search"
                  placeholder="Buscar por fecha, monto, empleado..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full rounded-[var(--unit-radius-sm)] border border-[var(--unit-border)] bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--unit-text-muted)] transition-all placeholder:text-[var(--unit-text-muted)]/60 focus:border-[var(--unit-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]"
                />
              </div>

              {/* Active Filters Summary */}
              {(statusFilter || unitFilter || amountRangeFilter || employeeFilter || searchFilter) && (
                <div className="mt-4 pt-4 border-t border-[var(--unit-border)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--unit-text)]">Filtros activos:</span>
                      <div className="flex gap-1">
                        {statusFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Estado: {statusFilter === 'OPEN' ? 'Abiertas' : 'Cerradas'}
                          </span>
                        )}
                        {unitFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                            Unidad: {unitFilter === 'SPA' ? 'SPA' : 'Barbería'}
                          </span>
                        )}
                        {amountRangeFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Monto: {amountRangeFilter === '0-100' ? 'S/ 0 - 100' :
                                   amountRangeFilter === '100-500' ? 'S/ 100 - 500' :
                                   amountRangeFilter === '500-1000' ? 'S/ 500 - 1000' :
                                   amountRangeFilter === '1000+' ? 'S/ 1000+' : amountRangeFilter}
                          </span>
                        )}
                        {employeeFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Empleado: {employeeFilter === 'emp1' ? 'Juan Pérez' :
                                     employeeFilter === 'emp2' ? 'María García' :
                                     employeeFilter === 'emp3' ? 'Carlos López' :
                                     employeeFilter === 'emp4' ? 'Ana Martínez' : employeeFilter}
                          </span>
                        )}
                        {searchFilter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Búsqueda: {searchFilter}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setStatusFilter('');
                        setUnitFilter('');
                        setAmountRangeFilter('');
                        setEmployeeFilter('');
                        setSearchFilter('');
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--unit-text)] hover:text-[var(--unit-text-muted)] hover:bg-[var(--unit-surface)] rounded-lg transition-colors"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                </div>
              )}
            </>
            )}
            </div>

            {/* Table Block - Separated */}
            <div className="rounded-[var(--unit-border-radius)] border border-[var(--unit-border)] bg-[var(--unit-surface-elevated)] p-6">
              {/* Table Header */}
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-[var(--unit-text)]" />
                <h3 className="text-sm font-semibold text-[var(--unit-text)]">Lista de Registros</h3>
                <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--unit-text)]">
                  {registersData.data.length} registros
                </span>
              </div>
              
              {/* DataTable */}
              <DataTable
                columns={historyColumns}
                data={registersData.data}
                keyExtractor={(row) => row.id}
                actions={historyActions}
                searchPlaceholder="" // Hidden since we have custom search
                pageSize={10}
                pageSizeOptions={[5, 10, 20, 50]}
                zebra
                className="border border-[var(--unit-border)] rounded-[var(--unit-border-radius)] overflow-hidden"
                emptyMessage="No hay registros de cajas disponibles"
              />
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {detailsModal && selectedRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border-2 border-[var(--unit-border)] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/15 to-blue-600/10">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--unit-text-muted)]">Detalles de Caja</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">{selectedRegister.id}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailsModal(false)}
                className="rounded-lg p-2 text-[var(--unit-text-muted)] hover:bg-[var(--unit-primary)]/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[var(--unit-text-muted)] uppercase tracking-wider">Información General</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-[var(--unit-border)]">
                    <span className="text-sm text-[var(--unit-text-muted)]">Unidad</span>
                    <span className="font-medium text-[var(--unit-text-muted)]">{selectedRegister.unit}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--unit-border)]">
                    <span className="text-sm text-[var(--unit-text-muted)]">Estado</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      selectedRegister.status === 'OPEN' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedRegister.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--unit-border)]">
                    <span className="text-sm text-[var(--unit-text-muted)]">Apertura</span>
                    <span className="font-medium text-[var(--unit-text-muted)]">
                      {new Date(selectedRegister.openedAt).toLocaleString('es-PE', { timeZone: 'America/Lima' })}
                    </span>
                  </div>
                  {selectedRegister.closedAt && (
                    <div className="flex justify-between items-center py-2 border-b border-[var(--unit-border)]">
                      <span className="text-sm text-[var(--unit-text-muted)]">Cierre</span>
                      <span className="font-medium text-[var(--unit-text-muted)]">
                        {new Date(selectedRegister.closedAt).toLocaleString('es-PE', { timeZone: 'America/Lima' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[var(--unit-text-muted)] uppercase tracking-wider">Resumen Financiero</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-[var(--unit-border)]">
                    <span className="text-sm text-[var(--unit-text-muted)]">Monto Inicial</span>
                    <span className="font-semibold text-[var(--unit-text-muted)] tabular-nums">
                      S/ {safeNumber(selectedRegister.openingAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--unit-border)]">
                    <span className="text-sm text-[var(--unit-text-muted)]">Ventas Efectivo</span>
                    <span className="font-semibold text-emerald-600 tabular-nums">
                      S/ {safeNumber(selectedRegister.cashSales).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--unit-border)]">
                    <span className="text-sm text-[var(--unit-text-muted)]">Ventas Tarjeta</span>
                    <span className="font-semibold text-blue-600 tabular-nums">
                      S/ {safeNumber(selectedRegister.cardSales).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--unit-border)]">
                    <span className="text-sm text-[var(--unit-text-muted)]">Ventas Transferencia</span>
                    <span className="font-semibold text-purple-600 tabular-nums">
                      S/ {safeNumber(selectedRegister.transferSales).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--unit-border)]">
                    <span className="text-sm text-[var(--unit-text-muted)]">Ventas Billetera Digital</span>
                    <span className="font-semibold text-orange-600 tabular-nums">
                      S/ {safeNumber(selectedRegister.walletSales).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--unit-border)]">
                    <span className="text-sm text-[var(--unit-text-muted)]">Egresos</span>
                    <span className="font-semibold text-red-600 tabular-nums">
                      S/ {safeNumber(selectedRegister.expenses).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--unit-border)]">
                    <span className="text-sm text-[var(--unit-text-muted)]">Ingresos Extra</span>
                    <span className="font-semibold text-emerald-600 tabular-nums">
                      S/ {safeNumber(selectedRegister.cashEntries).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--unit-border)]">
                    <span className="text-sm text-[var(--unit-text-muted)]">Monto Final</span>
                    <span className="font-semibold text-[var(--unit-text-muted)] tabular-nums">
                      S/ {safeNumber(selectedRegister.closingAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-[var(--unit-text-muted)]">Diferencia</span>
                    <span className={`font-semibold tabular-nums ${
                      safeNumber(selectedRegister.difference) !== 0 ? 'text-red-500' : 'text-emerald-600'
                    }`}>
                      {safeNumber(selectedRegister.difference) >= 0 ? '+' : ''}S/ {safeNumber(selectedRegister.difference).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-[var(--unit-border)]">
              <button
                onClick={() => generatePDF(selectedRegister)}
                disabled={selectedRegister.status === 'OPEN'}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium shadow-[var(--unit-shadow)] transition-all hover:shadow-lg active:scale-[0.98] ${
                  selectedRegister.status === 'OPEN'
                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                }`}
              >
                <FileDown className="h-4 w-4 inline mr-2" />
                Generar PDF
              </button>
              <button
                onClick={() => setDetailsModal(false)}
                className="flex-1 rounded-lg border border-[var(--unit-border)] px-4 py-2 text-sm font-medium text-[var(--unit-accent)] bg-[var(--unit-text)] hover:bg-[var(--unit-primary)] hover:text-[var(--unit-text)] transition-colors"
              >
                Cerrar
              </button>
            </div>
            </div>
          </div>
        )}

        {/* Success Message Toast */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 z-50 animate-pulse">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl shadow-lg border-2 border-green-400/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="font-medium">{successMessage}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
