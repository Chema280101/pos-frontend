'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Phone, 
  CreditCard, 
  Calendar, 
  Star, 
  Sparkles, 
  Clock, 
  History, 
  FileText, 
  Edit, 
  Lock, 
  Unlock, 
  Plus, 
  DollarSign, 
  ShoppingBag, 
  Scissors, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MessageCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { api } from '@/lib/api';
import { Drawer } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import type { Client, ClientHistory } from '@/types/client';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatPeruDateTime } from '@/utils/peruTime';

export interface CustomerDetailDrawerProps {
  clientId: string | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (client: Client) => void;
  onAddCredit?: (client: Client) => void;
  onToggleBlock?: (client: Client) => void;
}

export function CustomerDetailDrawer({
  clientId,
  open,
  onClose,
  onEdit,
  onAddCredit,
  onToggleBlock
}: CustomerDetailDrawerProps): JSX.Element {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<'history' | 'sales' | 'preferences' | 'credit'>('history');

  // Client Details Query
  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: ['client-detail', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('No ID');
      const { data } = await api.get(`/api/clients/${clientId}`);
      return data?.data || data;
    },
    enabled: !!clientId && open,
  });

  // Client History Query (Appointments and Sales)
  const { data: history, isLoading: historyLoading } = useQuery<ClientHistory>({
    queryKey: ['client-history', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('No ID');
      const { data } = await api.get(`/api/clients/${clientId}/history`);
      return data?.data || data;
    },
    enabled: !!clientId && open,
  });

  const appointments = history?.appointments || [];
  const sales = history?.sales || [];

  const isVip = (client?._count?.appointments ?? appointments.length) >= 5;
  const isRecent = client?.createdAt 
    ? (Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 30
    : false;

  // WhatsApp clean link
  const cleanPhone = client?.phone?.replace(/\D/g, '') || '';
  const whatsappUrl = cleanPhone.length >= 9 
    ? `https://wa.me/51${cleanPhone.slice(-9)}?text=${encodeURIComponent(`Hola ${client?.name || ''}, te saludamos de nuestra Barbería y Spa...`)}`
    : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Ficha Integral de Cliente"
      width="lg"
    >
      {clientLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--unit-accent)]" />
          <p className="text-xs text-[var(--unit-text-muted)] font-medium">Cargando expediente del cliente...</p>
        </div>
      ) : !client ? (
        <div className="p-6 text-center text-sm text-[var(--unit-text-muted)]">
          No se encontró información del cliente.
        </div>
      ) : (
        <div className="space-y-6 pb-8">
          {/* Header Card */}
          <div className="p-5 rounded-unit-lg bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/40 relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-14 w-14 rounded-unit-lg bg-[var(--unit-accent)] text-white flex items-center justify-center text-xl font-bold shadow-unit shrink-0">
                  {client.name.charAt(0).toUpperCase()}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                      client.isBlocked
                        ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    )}>
                      {client.isBlocked ? 'Bloqueado' : 'Activo'}
                    </span>

                    {isVip && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        Cliente VIP
                      </span>
                    )}

                    {isRecent && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        <Sparkles className="h-3 w-3" />
                        Nuevo
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-[var(--unit-text)] tracking-tight">
                    {client.name}
                  </h2>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--unit-text-muted)]">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-[var(--unit-accent)]" />
                      {client.phone}
                    </span>
                    {client.email && (
                      <span>• {client.email}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-[var(--unit-border)]/30">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-unit bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-unit-sm"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              )}

              {onEdit && (
                <button
                  onClick={() => onEdit(client)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-unit bg-[var(--unit-surface)] border border-[var(--unit-border)]/60 text-[var(--unit-text)] hover:bg-[var(--unit-surface-elevated)] text-xs font-semibold transition-all shadow-unit-sm"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Editar
                </button>
              )}

              {onAddCredit && (
                <button
                  onClick={() => onAddCredit(client)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-unit bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-unit-sm"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Abonar Saldo
                </button>
              )}

              {onToggleBlock && (
                <button
                  onClick={() => onToggleBlock(client)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-unit text-xs font-semibold transition-all shadow-unit-sm",
                    client.isBlocked
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 border border-rose-500/30 hover:bg-rose-500/20"
                  )}
                >
                  {client.isBlocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  {client.isBlocked ? 'Desbloquear' : 'Bloquear'}
                </button>
              )}
            </div>
          </div>

          {/* Micro Status Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-1">
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Visitas / Citas</p>
              <p className="text-lg font-bold text-[var(--unit-text)] font-mono">
                {appointments.length || client._count?.appointments || 0}
              </p>
            </div>

            <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-1">
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Saldo a Favor</p>
              <p className={cn(
                "text-lg font-extrabold font-mono",
                Number(client.creditBalance) > 0 ? "text-purple-600 dark:text-purple-400" : "text-[var(--unit-text)]"
              )}>
                S/ {Number(client.creditBalance || 0).toFixed(2)}
              </p>
            </div>

            <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-1">
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Total Facturado</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                S/ {sales.reduce((sum, s: any) => sum + Number(s.total || 0), 0).toFixed(2)}
              </p>
            </div>

            <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-1">
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Registrado</p>
              <p className="text-xs font-semibold text-[var(--unit-text)] pt-1">
                {client.createdAt ? format(new Date(client.createdAt), 'dd MMM yyyy', { locale: es }) : '—'}
              </p>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[var(--unit-surface-elevated)] rounded-unit border border-[var(--unit-border)]/30 w-fit">
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                'px-3.5 py-1.5 rounded-unit text-xs font-bold transition-all flex items-center gap-1.5',
                activeTab === 'history'
                  ? 'bg-[var(--unit-accent)] text-white shadow-unit-sm'
                  : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              Citas ({appointments.length})
            </button>

            <button
              onClick={() => setActiveTab('sales')}
              className={cn(
                'px-3.5 py-1.5 rounded-unit text-xs font-bold transition-all flex items-center gap-1.5',
                activeTab === 'sales'
                  ? 'bg-[var(--unit-accent)] text-white shadow-unit-sm'
                  : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
              )}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Compras POS ({sales.length})
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={cn(
                'px-3.5 py-1.5 rounded-unit text-xs font-bold transition-all flex items-center gap-1.5',
                activeTab === 'preferences'
                  ? 'bg-[var(--unit-accent)] text-white shadow-unit-sm'
                  : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              Preferencias & Fórmulas
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'history' && (
            <div className="space-y-2.5">
              {historyLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--unit-accent)]" />
                </div>
              ) : appointments.length === 0 ? (
                <div className="p-8 text-center rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)]">
                  <Calendar className="h-8 w-8 text-[var(--unit-text-muted)] mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-[var(--unit-text-muted)]">No tiene citas registradas en el historial.</p>
                </div>
              ) : (
                appointments.map((apt: any) => (
                  <div
                    key={apt.id}
                    className="p-3.5 rounded-unit border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center justify-between text-xs gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                          apt.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600' :
                          apt.status === 'CONFIRMED' ? 'bg-teal-500/10 text-teal-600' :
                          apt.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                        )}>
                          {apt.status}
                        </span>
                        <span className="font-semibold text-[var(--unit-text)]">
                          {apt.items?.[0]?.service?.name || 'Servicio General'}
                        </span>
                      </div>

                      <p className="text-[11px] text-[var(--unit-text-muted)]">
                        {apt.startTime ? formatPeruDateTime(new Date(apt.startTime)) : '—'} • Especialista: {apt.items?.[0]?.employee?.name || 'No asignado'}
                      </p>
                    </div>

                    <div className="text-right font-mono font-bold text-[var(--unit-text)]">
                      S/ {Number(apt.items?.[0]?.service?.price || 0).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="space-y-2.5">
              {historyLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--unit-accent)]" />
                </div>
              ) : sales.length === 0 ? (
                <div className="p-8 text-center rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)]">
                  <ShoppingBag className="h-8 w-8 text-[var(--unit-text-muted)] mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-[var(--unit-text-muted)]">No tiene compras directas registradas.</p>
                </div>
              ) : (
                sales.map((sale: any) => (
                  <div
                    key={sale.id}
                    className="p-3.5 rounded-unit border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center justify-between text-xs gap-3"
                  >
                    <div>
                      <p className="font-bold text-[var(--unit-text)]">
                        Ticket #{sale.saleNumber || sale.id?.slice(0, 8)}
                      </p>
                      <p className="text-[11px] text-[var(--unit-text-muted)]">
                        {sale.createdAt ? formatPeruDateTime(new Date(sale.createdAt)) : '—'} • {sale.paymentMethod || 'Efectivo'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        S/ {Number(sale.total || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-3">
              <div className="p-4 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-3 text-xs">
                <div>
                  <span className="font-bold text-[var(--unit-text-muted)] block mb-1 uppercase tracking-wider text-[10px]">
                    Productos Habituales / Preferencias:
                  </span>
                  <p className="text-[var(--unit-text)] bg-[var(--unit-surface)] p-2.5 rounded-unit border border-[var(--unit-border)]/30">
                    {client.usualProducts || 'Sin productos habituales registrados.'}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-[var(--unit-text-muted)] block mb-1 uppercase tracking-wider text-[10px]">
                    Notas Clínicas / Fórmulas / Observaciones:
                  </span>
                  <p className="text-[var(--unit-text)] bg-[var(--unit-surface)] p-2.5 rounded-unit border border-[var(--unit-border)]/30">
                    {client.freeNotes || 'Sin notas especiales.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
