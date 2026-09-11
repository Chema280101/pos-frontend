'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  UserPlus, 
  Phone, 
  CreditCard, 
  Star, 
  Sparkles, 
  Calendar, 
  Plus, 
  RefreshCw, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Lock, 
  Unlock, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  MessageCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUnitStore } from '@/store/unitStore';
import { DataTable } from '@/components/ui/DataTable';
import { TableToolbar, type QuickChip } from '@/components/ui/TableToolbar';
import { TableBadge } from '@/components/ui/TableBadge';
import { CustomerDetailDrawer } from './CustomerDetailDrawer';
import { ClientModals } from './ClientModals';
import { ClientsMetrics } from './ClientsMetrics';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import type { Client } from '@/types/client';
import { downloadExcelReport } from '@/lib/excelReport';
import { downloadPdfReport } from '@/lib/pdfReport';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ClientsPage(): JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';
  const isAdmin = user?.role === 'ADMIN';
  const { success, error: toastError } = useToast();

  // Navigation tab: 'all' | 'vip' | 'credit' | 'metrics'
  const [activeTab, setActiveTab] = useState<'all' | 'vip' | 'credit' | 'metrics'>('all');

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Modal states for credit and block
  const [creditModal, setCreditModal] = useState(false);
  const [blockModal, setBlockModal] = useState(false);
  const [selectedClientForModal, setSelectedClientForModal] = useState<Client | null>(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Clients Query (Scoped by activeUnit and search)
  const { 
    data: clientsResponse, 
    isLoading, 
    isFetching, 
    refetch 
  } = useQuery({
    queryKey: ['clients-list', activeUnit, debouncedSearch, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeUnit) params.set('unit', activeUnit);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const { data } = await api.get(`/api/clients?${params}`);
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const rawClients: Client[] = Array.isArray(clientsResponse?.data) 
    ? clientsResponse.data 
    : Array.isArray(clientsResponse) 
    ? clientsResponse 
    : [];

  // Filter clients based on active tab
  const clients = useMemo(() => {
    return rawClients.filter((c) => {
      if (activeTab === 'vip') {
        return (c._count?.appointments ?? 0) >= 5;
      }
      if (activeTab === 'credit') {
        return Number(c.creditBalance || 0) > 0;
      }
      return true;
    });
  }, [rawClients, activeTab]);

  // Metrics summary
  const metrics = useMemo(() => {
    const total = rawClients.length;
    const active = rawClients.filter((c) => !c.isBlocked).length;
    const vip = rawClients.filter((c) => (c._count?.appointments ?? 0) >= 5).length;
    const totalCredit = rawClients.reduce((sum, c) => sum + Number(c.creditBalance || 0), 0);

    return {
      total,
      active,
      vip,
      totalCredit,
    };
  }, [rawClients]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Export handlers
  const handleExportExcel = () => {
    try {
      const headers = ['Nombre', 'Teléfono', 'Saldo a Favor (S/)', 'Visitas', 'Estado', 'Notas / Preferencias'];
      const rows = clients.map((c) => [
        c.name,
        c.phone || '—',
        Number(c.creditBalance || 0).toFixed(2),
        c._count?.appointments || 0,
        c.isBlocked ? 'Bloqueado' : 'Activo',
        c.usualProducts || c.freeNotes || '',
      ]);
      downloadExcelReport(
        `clientes-${activeUnit || 'general'}-${new Date().toISOString().slice(0, 10)}.xlsx`,
        'Clientes',
        headers,
        rows,
        {
          unit: activeUnit || 'General',
          reportTitle: `DIRECTORIO DE CLIENTES - ${(activeUnit || 'GENERAL').toUpperCase()}`,
          filterInfo: activeUnit ? `Unidad: ${activeUnit}` : undefined
        }
      );
      success('Reporte Excel descargado');
    } catch {
      toastError('Error al exportar a Excel');
    }
  };

  const handleExportPdf = () => {
    try {
      const headers = ['Nombre', 'Teléfono', 'Saldo (S/)', 'Visitas', 'Estado'];
      const rows = clients.map((c) => [
        c.name,
        c.phone || '—',
        Number(c.creditBalance || 0).toFixed(2),
        c._count?.appointments || 0,
        c.isBlocked ? 'Bloqueado' : 'Activo',
      ]);
      downloadPdfReport(
        `clientes-${activeUnit || 'general'}-${new Date().toISOString().slice(0, 10)}.pdf`,
        'DIRECTORIO DE CLIENTES',
        activeUnit || 'General',
        headers,
        rows,
        {
          unit: activeUnit || 'General',
          filterInfo: activeUnit ? `Unidad: ${activeUnit}` : undefined
        }
      );
      success('Reporte PDF descargado');
    } catch {
      toastError('Error al exportar a PDF');
    }
  };

  // Table Columns
  const columns = [
    {
      key: 'name',
      header: 'Cliente',
      render: (row: Client) => {
        const isVip = (row._count?.appointments ?? 0) >= 5;
        const cleanPhone = row.phone?.replace(/\D/g, '') || '';
        const whatsappUrl = cleanPhone.length >= 9 ? `https://wa.me/51${cleanPhone.slice(-9)}` : null;

        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-[var(--unit-accent)] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-unit-sm">
              {row.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[var(--unit-text)] text-sm">{row.name}</span>
                {isVip && (
                  <span title="Cliente VIP (5+ visitas)" className="inline-flex items-center">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[var(--unit-text-muted)]">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-[var(--unit-accent)]" />
                  {row.phone}
                </span>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-0.5"
                    title="Enviar mensaje por WhatsApp"
                  >
                    <MessageCircle className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'visits',
      header: 'Visitas / Citas',
      render: (row: Client) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-slate-500/10 text-[var(--unit-text)] dark:text-slate-300 border border-slate-500/20">
          {row._count?.appointments || 0} visitas
        </span>
      ),
    },
    {
      key: 'creditBalance',
      header: 'Saldo a Favor',
      render: (row: Client) => {
        const balance = Number(row.creditBalance || 0);
        return (
          <TableBadge type={balance > 0 ? 'unit-spa' : 'status-default'} className="font-mono">
            S/ {balance.toFixed(2)}
          </TableBadge>
        );
      },
    },
    {
      key: 'notes',
      header: 'Preferencias / Notas',
      render: (row: Client) => (
        <span className="text-xs text-[var(--unit-text-muted)] max-w-xs truncate block" title={row.usualProducts || row.freeNotes || ''}>
          {row.usualProducts || row.freeNotes || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: Client) => (
        <TableBadge type={row.isBlocked ? 'status-inactive' : 'status-active'}>
          {row.isBlocked ? 'Bloqueado' : 'Activo'}
        </TableBadge>
      ),
    },
  ];

  // Actions
  const actions = [
    {
      label: 'Ver Ficha',
      variant: 'view' as const,
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Client) => {
        setSelectedClientId(row.id);
        setDrawerOpen(true);
      },
    },
    {
      label: 'Editar',
      variant: 'edit' as const,
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: Client) => {
        router.push(`/clients/${row.id}/edit`);
      },
      disabled: () => !canEdit,
    },
    {
      label: 'Abonar Saldo',
      variant: 'success' as const,
      icon: <CreditCard className="h-4 w-4" />,
      onClick: (row: Client) => {
        setSelectedClientForModal(row);
        setCreditModal(true);
      },
      disabled: () => !canEdit,
    },
    ...(isAdmin ? [{
      label: 'Bloquear / Desbloquear',
      variant: 'delete' as const,
      icon: <Lock className="h-4 w-4" />,
      onClick: (row: Client) => {
        setSelectedClientForModal(row);
        setBlockModal(true);
      },
      disabled: () => !isAdmin,
    }] : []),
  ];

  return (
    <div className="min-h-screen bg-[var(--unit-surface)]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Top Header & Fast Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--unit-border)]/40 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] text-xs font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--unit-accent)] animate-pulse" />
                Directorio • {activeUnit === 'BARBERIA' ? 'Barbería' : 'SPA'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--unit-text)] tracking-tight">
              Directorio de Clientes
            </h1>
            <p className="text-xs sm:text-sm text-[var(--unit-text-muted)]">
              Historial de citas, fidelización, saldos a favor y preferencias por unidad
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-1 sm:pb-0">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm"
              title="Actualizar datos"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin text-[var(--unit-accent)]")} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm"
              title="Exportar a Excel"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit-sm"
              title="Exportar a PDF"
            >
              <FileText className="h-4 w-4 text-rose-600" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            {canEdit && (
              <Link
                href="/clients/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white text-xs font-bold transition-all shadow-unit active:scale-[0.98]"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Nuevo Cliente</span>
                <span className="sm:hidden">Nuevo</span>
              </Link>
            )}
          </div>
        </div>

        {/* Ergonomic Micro Status Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Total Clientes</p>
              <p className="text-lg font-bold text-[var(--unit-text)]">{metrics.total}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Clientes Activos</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{metrics.active}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Clientes VIP</p>
              <p className="text-lg font-bold text-amber-600">{metrics.vip}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center gap-3">
            <div className="h-9 w-9 rounded-unit bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Saldo a Favor</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400 font-mono">
                S/ {metrics.totalCredit.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher & Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Tab navigation pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--unit-surface-elevated)] rounded-unit-lg border border-[var(--unit-border)]/40 w-full sm:w-fit overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-4 py-2 rounded-unit text-xs font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap',
                activeTab === 'all'
                  ? 'bg-[var(--unit-accent)] text-white shadow-unit-sm'
                  : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
              )}
            >
              <Users className="h-3.5 w-3.5" />
              Todos ({metrics.total})
            </button>

            <button
              onClick={() => setActiveTab('vip')}
              className={cn(
                'px-4 py-2 rounded-unit text-xs font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap',
                activeTab === 'vip'
                  ? 'bg-[var(--unit-accent)] text-white shadow-unit-sm'
                  : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
              )}
            >
              <Star className="h-3.5 w-3.5 fill-current" />
              Clientes VIP ({metrics.vip})
            </button>

            <button
              onClick={() => setActiveTab('credit')}
              className={cn(
                'px-4 py-2 rounded-unit text-xs font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap',
                activeTab === 'credit'
                  ? 'bg-[var(--unit-accent)] text-white shadow-unit-sm'
                  : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
              )}
            >
              <CreditCard className="h-3.5 w-3.5" />
              Con Saldo a Favor
            </button>

            <button
              onClick={() => setActiveTab('metrics')}
              className={cn(
                'px-4 py-2 rounded-unit text-xs font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap',
                activeTab === 'metrics'
                  ? 'bg-[var(--unit-accent)] text-white shadow-unit-sm'
                  : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Retención & Métricas
            </button>
          </div>
        </div>

        {/* Content Section */}
        {activeTab === 'metrics' ? (
          <div className="pt-2">
            <ClientsMetrics clients={rawClients} />
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-200">
            <TableToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por nombre, teléfono, notas o preferencias..."
              chips={[
                { id: 'all', label: 'Todos' },
                { id: 'active', label: 'Solo Activos' },
                { id: 'blocked', label: 'Solo Bloqueados' },
              ]}
              activeChip={statusFilter}
              onChipChange={(id) => setStatusFilter(id as any)}
            />

            <div className="rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] overflow-hidden shadow-unit-sm">
              <DataTable
                data={clients}
                columns={columns}
                actions={actions}
                keyExtractor={(row) => row.id}
                loading={isLoading}
                searchPlaceholder=""
                filters={[]}
                emptyMessage="No se encontraron clientes registrados para esta unidad o búsqueda."
              />
            </div>
          </div>
        )}

        {/* Customer Detail Drawer */}
        <CustomerDetailDrawer
          clientId={selectedClientId}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedClientId(null);
          }}
          onEdit={(c) => {
            setDrawerOpen(false);
            router.push(`/clients/${c.id}/edit`);
          }}
          onAddCredit={isAdmin ? (c) => {
            setSelectedClientForModal(c);
            setCreditModal(true);
          } : undefined}
          onToggleBlock={isAdmin ? (c) => {
            setSelectedClientForModal(c);
            setBlockModal(true);
          } : undefined}
        />

        {/* Credit & Block Modals */}
        <ClientModals
          creditModal={creditModal}
          setCreditModal={setCreditModal}
          blockModal={blockModal}
          setBlockModal={setBlockModal}
          selectedClient={selectedClientForModal}
          setSelectedClient={setSelectedClientForModal}
        />
      </div>
    </div>
  );
}
