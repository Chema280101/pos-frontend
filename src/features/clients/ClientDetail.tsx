import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui';
import { ClientModals } from './ClientModals';
import type { Client, ClientHistory } from '@/types/client';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Users, 
  Star, 
  Sparkles, 
  Lock, 
  Unlock, 
  Plus, 
  Edit, 
  AlertCircle, 
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  History
} from 'lucide-react';

export function ClientDetail(): JSX.Element {
  const params = useParams();
  const rawId = params?.id;
  const id = rawId == null ? undefined : Array.isArray(rawId) ? rawId[0] : rawId;
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';
  const canAddCredit = user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<'info' | 'historial' | 'credito' | 'notas'>('info');
  
  // Modal states (passed to ClientModals)
  const [creditModal, setCreditModal] = useState(false);
  const [blockModal, setBlockModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Helper functions
  const isRecentClient = (createdAt?: string) => {
    if (!createdAt) return false;
    const createdDate = new Date(createdAt);
    const daysDiff = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  };

  const isVipClient = (totalVisits?: number) => {
    return (totalVisits ?? 0) > 10;
  };

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: async (): Promise<Client> => {
      const { data } = await api.get<Client>(`/api/clients/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const { data: history } = useQuery({
    queryKey: ['client-history', id],
    queryFn: async (): Promise<ClientHistory> => {
      const { data } = await api.get<ClientHistory>(`/api/clients/${id}/history`);
      return data;
    },
    enabled: !!id,
  });

  // Set selected client when data loads
  if (client && !selectedClient) {
    setSelectedClient(client);
  }

  // Traducciones de estados
  const translateStatus = (status: string) => {
    const statusTranslations: Record<string, string> = {
      'COMPLETED': 'Completada',
      'CANCELLED': 'Cancelada',
      'PENDING': 'Pendiente',
      'RESCHEDULED': 'Reprogramada',
      'SCHEDULED': 'Programada',
      'CONFIRMED': 'Confirmada',
      'NO_SHOW': 'No asistió',
      'CLOSED': 'Cerrada',
      'OPEN': 'Abierta',
      'IN_PROGRESS': 'En progreso',
      'ON_HOLD': 'En espera',
      'REFUNDED': 'Reembolsada',
      'PARTIALLY_PAID': 'Pagado parcialmente',
      'OVERDUE': 'Vencida',
      'ACTIVE': 'Activa',
      'INACTIVE': 'Inactiva'
    };
    return statusTranslations[status] || status;
  };

  // Pagination states for appointments
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const APPOINTMENTS_PER_PAGE = 10;

  // Pagination states for sales
  const [salesPage, setSalesPage] = useState(1);
  const SALES_PER_PAGE = 10;

  // Pagination calculations for appointments
  const appointmentsTotalPages = history?.appointments ? Math.ceil(history.appointments.length / APPOINTMENTS_PER_PAGE) : 0;
  const appointmentsStartIndex = (appointmentsPage - 1) * APPOINTMENTS_PER_PAGE;
  const appointmentsEndIndex = appointmentsStartIndex + APPOINTMENTS_PER_PAGE;
  const paginatedAppointments = history?.appointments?.slice(appointmentsStartIndex, appointmentsEndIndex) || [];

  // Pagination calculations for sales
  const salesTotalPages = history?.sales ? Math.ceil(history.sales.length / SALES_PER_PAGE) : 0;
  const salesStartIndex = (salesPage - 1) * SALES_PER_PAGE;
  const salesEndIndex = salesStartIndex + SALES_PER_PAGE;
  const paginatedSales = history?.sales?.slice(salesStartIndex, salesEndIndex) || [];

  // Pagination functions for appointments
  const getAppointmentsPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (appointmentsTotalPages <= maxVisiblePages) {
      for (let i = 1; i <= appointmentsTotalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const startPage = Math.max(1, appointmentsPage - 2);
      const endPage = Math.min(appointmentsTotalPages, startPage + maxVisiblePages - 1);
      
      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) pageNumbers.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (endPage < appointmentsTotalPages) {
        if (endPage < appointmentsTotalPages - 1) pageNumbers.push('...');
        pageNumbers.push(appointmentsTotalPages);
      }
    }
    
    return pageNumbers;
  };

  // Pagination functions for sales
  const getSalesPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (salesTotalPages <= maxVisiblePages) {
      for (let i = 1; i <= salesTotalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const startPage = Math.max(1, salesPage - 2);
      const endPage = Math.min(salesTotalPages, startPage + maxVisiblePages - 1);
      
      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) pageNumbers.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (endPage < salesTotalPages) {
        if (endPage < salesTotalPages - 1) pageNumbers.push('...');
        pageNumbers.push(salesTotalPages);
      }
    }
    
    return pageNumbers;
  };

  if (isLoading || !client) {
    return (
      <div className="min-h-screen bg-[var(--unit-surface)] p-6">
        <p className="text-[var(--unit-text)]">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--unit-surface)]">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="relative">
          {/* Background Gradient */}
          <div className="absolute inset-0 h-64 bg-gradient-to-br from-[var(--unit-accent)]/10 to-[var(--unit-accent)]/5" />
          
          {/* Navigation */}
          <div className="relative px-6 py-4">
            <Link
              href="/clients"
              className="inline-flex items-center gap-2 rounded-unit bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-[var(--unit-text)] hover:bg-[var(--unit-surface-elevated)] transition-all hover:shadow-unit"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a clientes
            </Link>
          </div>

          {/* Profile Header */}
          <div className="relative px-6 pb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Enhanced Avatar Section */}
              <div className="relative flex-shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--unit-accent)] text-2xl font-bold text-white shadow-unit">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-[var(--unit-surface)] ${
                  client.isBlocked ? 'bg-red-500' : 'bg-emerald-500'
                }`} />
                
                {/* Enhanced VIP/New Badges */}
                <div className="absolute -top-2 -right-2 flex gap-1">
                  {isVipClient(client._count?.appointments) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      <Star className="h-3 w-3" />
                      VIP
                    </span>
                  )}
                  {isRecentClient(client.createdAt) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--unit-accent)] px-2 py-0.5 text-[10px] font-semibold text-white shadow-unit-sm">
                      <Sparkles className="h-3 w-3" />
                      Nuevo
                    </span>
                  )}
                </div>
              </div>

              {/* Enhanced Client Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-[var(--unit-text)] mb-2">{client.name}</h1>
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="inline-flex items-center gap-2 text-sm text-[var(--unit-text-muted)]">
                        <Phone className="h-4 w-4" />
                        {client.phone}
                      </span>
                      {client.gender && (
                        <span className="inline-flex items-center gap-2 text-sm text-[var(--unit-text-muted)]">
                          <Users className="h-4 w-4" />
                          {client.gender}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-2 text-sm text-[var(--unit-text-muted)]">
                        <Calendar className="h-4 w-4" />
                        Cliente desde: {format(new Date(client.createdAt), "d MMM yyyy", { locale: es })}
                      </span>
                    </div>
                  </div>
                  
                  {/* Enhanced Edit Button */}
                  {canEdit && (
                    <Link
                      href={`/clients/${id}/edit`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-unit bg-[var(--unit-accent)] text-white font-semibold shadow-unit border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-unit hover:bg-[var(--unit-accent-hover)] active:scale-[0.98]"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Link>
                  )}
                </div>

                {/* Enhanced Status Alert */}
                {(client.isBlocked || Number(client.creditBalance) < 0) && (
                  <div className="rounded-unit border border-red-200 bg-red-50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-unit bg-red-100">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <p className="text-sm font-semibold text-red-700">
                        {client.isBlocked && <>Cliente bloqueado{client.blockReason ? `: ${client.blockReason}` : ''}</>}
                        {client.isBlocked && Number(client.creditBalance) < 0 && ' · '}
                        {Number(client.creditBalance) < 0 && (
                          <>Deuda pendiente: S/ {Math.abs(Number(client.creditBalance)).toFixed(2)}</>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Dashboard */}
        {client._count != null && (
          <div className="px-6 -mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Interactions - Simplificado */}
              <div className="rounded-[var(--unit-border-radius)] border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)] p-4 hover:shadow-unit transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-unit bg-[var(--unit-primary)]/10">
                    <Users className="h-5 w-5 text-[var(--unit-primary)]" />
                  </div>
                  <span className="text-xs font-semibold text-[var(--unit-text-muted)] uppercase tracking-wide">Total</span>
                </div>
                <p className="text-2xl font-bold text-[var(--unit-text)] tabular-nums mb-1">
                  {client._count.appointments + client._count.sales}
                </p>
                <p className="text-xs text-[var(--unit-text-muted)]">Interacciones totales</p>
              </div>

              {/* Appointments - Simplificado */}
              <div className="rounded-[var(--unit-border-radius)] border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)] p-4 hover:shadow-unit transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-unit bg-[var(--unit-primary)]/10">
                    <Calendar className="h-5 w-5 text-[var(--unit-primary)]" />
                  </div>
                  <span className="text-xs font-semibold text-[var(--unit-text-muted)] uppercase tracking-wide">Citas</span>
                </div>
                <p className="text-2xl font-bold text-[var(--unit-text)] tabular-nums mb-1">{client._count.appointments}</p>
                <p className="text-xs text-[var(--unit-text-muted)]">
                  {client._count.appointments === 1 ? 'Cita total' : 'Citas totales'}
                </p>
              </div>

              {/* Sales - Simplificado */}
              <div className="rounded-[var(--unit-border-radius)] border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)] p-4 hover:shadow-unit transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-unit bg-[var(--unit-accent)]/10">
                    <TrendingUp className="h-5 w-5 text-[var(--unit-accent)]" />
                  </div>
                  <span className="text-xs font-semibold text-[var(--unit-text-muted)] uppercase tracking-wide">Ventas</span>
                </div>
                <p className="text-2xl font-bold text-[var(--unit-text)] tabular-nums mb-1">{client._count.sales}</p>
                <p className="text-xs text-[var(--unit-text-muted)]">
                  {client._count.sales === 1 ? 'Venta total' : 'Ventas totales'}
                </p>
              </div>

              {/* Credit - Simplificado */}
              <div className={`rounded-[var(--unit-border-radius)] border border-[var(--unit-border)]/50 bg-[var(--unit-surface-elevated)] p-4 hover:shadow-unit transition-all ${
                Number(client.creditBalance) < 0 ? 'border-l-4 border-l-red-500' : ''
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-unit ${
                    Number(client.creditBalance) < 0 ? 'bg-red-100' : 'bg-[var(--unit-accent)]/10'
                  }`}>
                    <CreditCard className={`h-5 w-5 ${
                      Number(client.creditBalance) < 0 ? 'text-red-600' : 'text-[var(--unit-primary)]'
                    }`} />
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wide ${
                    Number(client.creditBalance) < 0 ? 'text-red-600' : 'text-[var(--unit-text-muted)]'
                  }`}>
                    {Number(client.creditBalance) < 0 ? 'Deuda' : 'Crédito'}
                  </span>
                </div>
                <p className={`text-2xl font-bold tabular-nums mb-1 ${
                  Number(client.creditBalance) < 0 ? 'text-red-700' : 'text-[var(--unit-text)]'
                }`}>
                  S/ {Number(client.creditBalance).toFixed(2)}
                </p>
                <p className="text-xs text-[var(--unit-text-muted)]">
                  {Number(client.creditBalance) < 0 ? 'Saldo adeudado' : 'Saldo disponible'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="px-6 py-12">
          {/* Enhanced Tabs */}
          <div className="mb-6 border-b border-[var(--unit-border)]/50">
            <div className="flex space-x-1">
              {(['info', 'historial', 'credito', 'notas'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'relative py-3 px-4 text-sm font-bold transition-all duration-300 border-b-3 rounded-t-lg',
                    activeTab === tab
                      ? 'border-[var(--unit-accent)] text-[var(--unit-accent)] bg-[var(--unit-accent)]/5'
                      : 'border-transparent text-[var(--unit-text-muted)] hover:text-[var(--unit-text)] hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface-elevated)]'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {tab === 'info' && <User className="h-4 w-4" />}
                    {tab === 'historial' && <History className="h-4 w-4" />}
                    {tab === 'credito' && <CreditCard className="h-4 w-4" />}
                    {tab === 'notas' && <FileText className="h-4 w-4" />}
                    {tab === 'info' && 'Información'}
                    {tab === 'historial' && 'Historial'}
                    {tab === 'credito' && 'Crédito'}
                    {tab === 'notas' && 'Notas'}
                  </div>
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--unit-accent)] rounded-t-lg"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
        {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="rounded-[var(--unit-border-radius)] border-2 border-[var(--unit-border)] bg-[var(--unit-surface)] p-6">
                <h2 className="text-lg font-semibold text-[var(--unit-text-muted)] mb-4">Información Básica</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[var(--unit-text-muted)]">Nombre completo</p>
                    <p className="font-medium text-[var(--unit-text-muted)]">{client.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--unit-text-muted)]">Teléfono</p>
                    <p className="font-medium text-[var(--unit-text-muted)]">{client.phone}</p>
                  </div>
                  {client.gender && (
                    <div>
                      <p className="text-sm text-[var(--unit-text-muted)]">Género</p>
                      <p className="font-medium text-[var(--unit-text-muted)]">{client.gender}</p>
                    </div>
                  )}
                  {client.howFoundUs && (
                    <div>
                      <p className="text-sm text-[var(--unit-text-muted)]">Cómo nos conoció</p>
                      <p className="font-medium text-[var(--unit-text-muted)]">{client.howFoundUs}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-[var(--unit-text-muted)]">Cliente desde</p>
                    <p className="font-medium text-[var(--unit-text-muted)]">
                      {format(new Date(client.createdAt), "d MMMM yyyy", { locale: es })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--unit-text-muted)]">Estado</p>
                    <div className="mt-1">
              {client.isBlocked ? <Badge variant="danger">Bloqueado</Badge> : <Badge variant="success">Activo</Badge>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              {(client.preferenceNotes || client.freeNotes || client.usualProducts || client.preferredEmployeeId) && (
                <div className="rounded-[var(--unit-border-radius)] border-2 border-[var(--unit-border)] bg-[var(--unit-surface-elevated)] p-6">
                  <h2 className="text-lg font-semibold text-[var(--unit-text)] mb-4">Preferencias y Notas</h2>
                  <div className="space-y-4">
                    {client.preferenceNotes && (
                      <div>
                        <p className="text-sm font-medium text-[var(--unit-text)] mb-2">Preferencias</p>
                        <p className="text-sm text-[var(--unit-text-muted)] bg-[var(--unit-surface)] p-3 rounded-[var(--unit-radius-sm)]">
                          {client.preferenceNotes}
                        </p>
                      </div>
                    )}
                    {client.freeNotes && (
                      <div>
                        <p className="text-sm font-medium text-[var(--unit-text)] mb-2">Notas adicionales</p>
                        <p className="text-sm text-[var(--unit-text-muted)] bg-[var(--unit-surface)] p-3 rounded-[var(--unit-radius-sm)]">
                          {client.freeNotes}
                        </p>
                      </div>
                    )}
                    {client.usualProducts && (
                      <div>
                        <p className="text-sm font-medium text-[var(--unit-text)] mb-2">Productos habituales</p>
                        <p className="text-sm text-[var(--unit-text-muted)] bg-[var(--unit-surface)] p-3 rounded-[var(--unit-radius-sm)]">
                          {client.usualProducts}
                        </p>
                      </div>
                    )}
                    {client.preferredEmployeeId && (
                      <div>
                        <p className="text-sm font-medium text-[var(--unit-text)] mb-2">Empleado preferido</p>
                        <p className="text-sm text-[var(--unit-text-muted)] bg-[var(--unit-surface)] p-3 rounded-[var(--unit-radius-sm)]">
                          ID: {client.preferredEmployeeId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
            )}
          </div>
        )}

        {activeTab === 'historial' && history && (
          <div className="space-y-6">
              {/* Appointments Section */}
              <div>
                <h2 className="text-lg font-semibold text-[var(--unit-text-muted)] mb-4">Historial de Citas</h2>
                <div className="rounded-[var(--unit-border-radius)] border border-[var(--unit-border)] bg-[var(--unit-surface)] overflow-hidden">
                {history.appointments.length === 0 ? (
                    <div className="p-8 text-center">
                      <Calendar className="h-12 w-12 text-[var(--unit-text-muted)] mx-auto mb-3" />
                      <p className="text-[var(--unit-text-muted)]">Sin citas registradas</p>
                    </div>
                ) : (
                    <>
                      <div className="divide-y divide-[var(--unit-border)]">
                        {paginatedAppointments.map((appointment) => (
                          <div key={appointment.id} className="p-4 hover:bg-[var(--unit-accent)] transition-colors group">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Calendar className="h-4 w-4 text-[var(--unit-text-muted)] group-hover:text-white transition-colors" />
                                  <span className="font-medium text-[var(--unit-text-muted)] group-hover:text-white transition-colors">
                                    {format(new Date(appointment.startTime), "d MMMM yyyy, HH:mm", { locale: es })}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <span className={`inline-block h-2 w-2 rounded-full ${
                                      appointment.status === 'COMPLETED' ? 'bg-emerald-500' :
                                      appointment.status === 'CANCELLED' ? 'bg-red-500' :
                                      appointment.status === 'PENDING' ? 'bg-amber-500' :
                                      'bg-gray-500'
                                    }`} />
                                    <span className="text-sm text-[var(--unit-text-muted)] group-hover:text-white transition-colors">{translateStatus(appointment.status)}</span>
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-[var(--unit-text-muted)]">
                                  <span className="inline-flex items-center gap-1 group-hover:text-white transition-colors">
                                    <Users className="h-3 w-3" />
                                    {appointment.unit}
                                  </span>
                                  {appointment.services && (
                                    <span className="group-hover:text-white transition-colors">Servicios: {appointment.services}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Enhanced Pagination */}
                      {appointmentsTotalPages > 1 && (
                        <div className="border-t border-[var(--unit-border)]/50 bg-[var(--unit-surface)] p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-[var(--unit-text-muted)]">
                              Mostrando {appointmentsStartIndex + 1} a {Math.min(appointmentsEndIndex, history.appointments.length)} de {history.appointments.length} citas
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setAppointmentsPage(appointmentsPage - 1)}
                                disabled={appointmentsPage === 1}
                                className="inline-flex items-center gap-2 rounded-unit border-2 border-[var(--unit-border)]/30 bg-[var(--unit-surface)] px-3 py-2 text-sm font-bold text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-surface-elevated)] hover:shadow-unit disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                              >
                                <ChevronLeft className="h-4 w-4" />
                                Anterior
                              </button>
                              
                              <div className="flex items-center gap-1">
                                {getAppointmentsPageNumbers().map((pageNum, index) => (
                                  <span key={index}>
                                    {pageNum === '...' ? (
                                      <span className="px-3 py-1 text-sm text-[var(--unit-text-muted)] font-medium">...</span>
                                    ) : (
                                      <button
                                        onClick={() => setAppointmentsPage(pageNum as number)}
                                        className={`px-3 py-1 text-sm font-bold rounded-unit transition-all ${
                                          pageNum === appointmentsPage
                                            ? 'bg-[var(--unit-accent)] text-white shadow-unit scale-105'
                                            : 'border border-[var(--unit-border)]/50 bg-[var(--unit-surface)] text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-surface-elevated)] hover:shadow-unit-sm'
                                        }`}
                                      >
                                        {pageNum}
                                      </button>
                                    )}
                                  </span>
                                ))}
                              </div>
                              
                              <button
                                onClick={() => setAppointmentsPage(appointmentsPage + 1)}
                                disabled={appointmentsPage === appointmentsTotalPages}
                                className="inline-flex items-center gap-2 rounded-unit border-2 border-[var(--unit-border)]/30 bg-[var(--unit-surface)] px-3 py-2 text-sm font-bold text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-surface-elevated)] hover:shadow-unit disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                              >
                                Siguiente
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Sales Section */}
              <div>
                <h2 className="text-lg font-semibold text-[var(--unit-text-muted)] mb-4">Historial de Ventas</h2>
                <div className="rounded-[var(--unit-border-radius)] border border-[var(--unit-border)] bg-[var(--unit-surface)] overflow-hidden">
                {history.sales.length === 0 ? (
                    <div className="p-8 text-center">
                      <TrendingUp className="h-12 w-12 text-[var(--unit-text-muted)] mx-auto mb-3" />
                      <p className="text-[var(--unit-text-muted)]">Sin ventas registradas</p>
                    </div>
                ) : (
                    <>
                      <div className="divide-y divide-[var(--unit-border)]">
                        {paginatedSales.map((sale) => (
                          <div key={sale.id} className="p-4 hover:bg-[var(--unit-accent)] transition-colors group">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <DollarSign className="h-4 w-4 text-[var(--unit-text-muted)] group-hover:text-white transition-colors" />
                                  <span className="font-medium text-[var(--unit-text-muted)] group-hover:text-white transition-colors">Venta #{sale.saleNumber}</span>
                                  <span className="inline-flex items-center gap-1">
                                    <span className={`inline-block h-2 w-2 rounded-full ${
                                      sale.status === 'COMPLETED' ? 'bg-emerald-500' :
                                      sale.status === 'CANCELLED' ? 'bg-red-500' :
                                      'bg-gray-500'
                                    }`} />
                                    <span className="text-sm text-[var(--unit-text-muted)] group-hover:text-white transition-colors">{translateStatus(sale.status)}</span>
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-[var(--unit-text-muted)]">
                                  <span className="font-semibold text-[var(--unit-text-muted)] group-hover:text-white transition-colors">S/ {sale.total.toFixed(2)}</span>
                                  <span className="group-hover:text-white transition-colors"> {format(new Date(sale.createdAt), "d MMMM yyyy", { locale: es })}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Enhanced Sales Pagination */}
                      {salesTotalPages > 1 && (
                        <div className="border-t border-[var(--unit-border)]/50 bg-[var(--unit-surface)] p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-[var(--unit-text-muted)]">
                              Mostrando {salesStartIndex + 1} a {Math.min(salesEndIndex, history.sales.length)} de {history.sales.length} ventas
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSalesPage(salesPage - 1)}
                                disabled={salesPage === 1}
                                className="inline-flex items-center gap-2 rounded-unit border-2 border-[var(--unit-border)]/30 bg-[var(--unit-surface)] px-3 py-2 text-sm font-bold text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-surface-elevated)] hover:shadow-unit disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                              >
                                <ChevronLeft className="h-4 w-4" />
                                Anterior
                              </button>
                              
                              <div className="flex items-center gap-1">
                                {getSalesPageNumbers().map((pageNum, index) => (
                                  <span key={index}>
                                    {pageNum === '...' ? (
                                      <span className="px-3 py-1 text-sm text-[var(--unit-text-muted)] font-medium">...</span>
                                    ) : (
                                      <button
                                        onClick={() => setSalesPage(pageNum as number)}
                                        className={`px-3 py-1 text-sm font-bold rounded-unit transition-all ${
                                          pageNum === salesPage
                                            ? 'bg-[var(--unit-accent)] text-white shadow-unit scale-105'
                                            : 'border border-[var(--unit-border)]/50 bg-[var(--unit-surface)] text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-surface-elevated)] hover:shadow-unit-sm'
                                        }`}
                                      >
                                        {pageNum}
                                      </button>
                                    )}
                                  </span>
                                ))}
                              </div>
                              
                              <button
                                onClick={() => setSalesPage(salesPage + 1)}
                                disabled={salesPage === salesTotalPages}
                                className="inline-flex items-center gap-2 rounded-unit border-2 border-[var(--unit-border)]/30 bg-[var(--unit-surface)] px-3 py-2 text-sm font-bold text-[var(--unit-text)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-surface-elevated)] hover:shadow-unit disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                              >
                                Siguiente
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
          </div>
        )}

        {activeTab === 'credito' && (
            <div className="space-y-6">
              {/* Credit Summary */}
              <div className="rounded-[var(--unit-border-radius)] border-2 border-[var(--unit-border)] bg-[var(--unit-surface)] p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-[var(--unit-text-muted)]">Resumen de Crédito</h2>
                </div>
                <div className="text-center py-6">
                  <div className={`inline-flex items-center justify-center h-16 w-16 rounded-full mb-4 ${
                    Number(client.creditBalance) < 0 
                      ? 'bg-red-100' 
                      : 'bg-purple-100'
                  }`}>
                    <CreditCard className={`h-8 w-8 ${
                      Number(client.creditBalance) < 0 ? 'text-red-600' : 'text-purple-600'
                    }`} />
                  </div>
                  <p className="text-3xl font-bold tabular-nums mb-2">
                    <span className={Number(client.creditBalance) < 0 ? 'text-red-500' : 'text-purple-600'}>
                      S/ {Number(client.creditBalance).toFixed(2)}
                    </span>
                  </p>
                  <p className="text-sm text-[var(--unit-text-muted)]">
                    {Number(client.creditBalance) < 0 ? 'Saldo adeudado' : 'Saldo disponible'}
            </p>
                </div>
              </div>

              {/* Credit Movements */}
              <div className="rounded-[var(--unit-border-radius)] border border-[var(--unit-border)] bg-[var(--unit-surface)] overflow-hidden">
                <div className="p-4 border-b border-[var(--unit-border)]">
                  <h3 className="font-semibold text-[var(--unit-text-muted)]">Movimientos de Crédito</h3>
                </div>
              {!history?.creditMovements.length ? (
                  <div className="p-8 text-center">
                    <CreditCard className="h-12 w-12 text-[var(--unit-text-muted)] mx-auto mb-3" />
                    <p className="text-[var(--unit-text-muted)]">Sin movimientos de crédito</p>
                  </div>
              ) : (
                  <div className="divide-y divide-[var(--unit-border)]">
                    {history.creditMovements.map((movement) => (
                      <div key={movement.id} className="p-4 hover:bg-[var(--unit-accent)] transition-colors group">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-[var(--unit-text-muted)] group-hover:text-white transition-colors">{movement.reason}</p>
                            <p className="text-sm text-[var(--unit-text-muted)] group-hover:text-white transition-colors">
                              {format(new Date(movement.createdAt), "d MMMM yyyy, HH:mm", { locale: es })}
                            </p>
                          </div>
                          <span className={`font-semibold tabular-nums group-hover:text-white transition-colors ${
                            movement.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {movement.amount >= 0 ? '+' : ''}S/ {movement.amount.toFixed(2)}
                      </span>
                        </div>
                      </div>
                  ))}
                  </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notas' && (
            <div className="space-y-6">
              <div className="rounded-[var(--unit-border-radius)] border-2 border-[var(--unit-border)] bg-[var(--unit-surface-elevated)] p-6">
                <h2 className="text-lg font-semibold text-[var(--unit-text)] mb-4">Notas del Cliente</h2>
                {(!client.preferenceNotes && !client.freeNotes && !client.usualProducts) ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-[var(--unit-text)] mx-auto mb-3" />
                    <p className="text-[var(--unit-text-muted)]">Sin notas registradas</p>
                  </div>
                ) : (
                  <div className="space-y-6">
            {client.preferenceNotes && (
              <div>
                        <h3 className="text-sm font-semibold text-[var(--unit-text)] mb-2 flex items-center gap-2">
                          <Star className="h-4 w-4 text-amber-500" />
                          Preferencias
                        </h3>
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-[var(--unit-radius-sm)]">
                          <p className="text-[var(--unit-text-muted)]">{client.preferenceNotes}</p>
                        </div>
              </div>
            )}
            {client.freeNotes && (
              <div>
                        <h3 className="text-sm font-semibold text-[var(--unit-text)] mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          Notas adicionales
                        </h3>
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-[var(--unit-radius-sm)]">
                          <p className="text-[var(--unit-text-muted)]">{client.freeNotes}</p>
                        </div>
              </div>
            )}
            {client.usualProducts && (
              <div>
                        <h3 className="text-sm font-semibold text-[var(--unit-text)] mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-[var(--unit-text)]" />
                          Productos habituales
                        </h3>
                        <div className="bg-green-50 border border-green-200 p-4 rounded-[var(--unit-radius-sm)]">
                          <p className="text-[var(--unit-text-muted)]">{client.usualProducts}</p>
              </div>
                      </div>
            )}
          </div>
        )}
            </div>
          </div>
        )}
          </div>
      </div>

      {/* Shared Modals */}
      <ClientModals
        creditModal={creditModal}
        setCreditModal={setCreditModal}
        blockModal={blockModal}
        setBlockModal={setBlockModal}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
      />
    </div>
  );
}
