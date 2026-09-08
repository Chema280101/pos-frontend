'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  Tag, 
  Barcode, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  Edit, 
  Trash2, 
  Plus, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ShoppingBag,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { Drawer } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/product';
import { formatPeruDateTime } from '@/utils/peruTime';

export interface ProductDetailDrawerProps {
  productId: string | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (product: Product) => void;
}

export function ProductDetailDrawer({
  productId,
  open,
  onClose,
  onEdit
}: ProductDetailDrawerProps): JSX.Element {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<'details' | 'movements'>('details');
  const [movementsPage, setMovementsPage] = useState(1);

  // Fetch product detailed data
  const { data: product, isLoading, isError } = useQuery<Product>({
    queryKey: ['product-detail', productId],
    queryFn: async () => {
      if (!productId) throw new Error('No ID');
      const { data } = await api.get(`/api/inventory/products/${productId}`);
      return data?.data || data;
    },
    enabled: !!productId && open,
  });

  // Fetch product movements
  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['product-movements', productId, movementsPage],
    queryFn: async () => {
      if (!productId) return { data: [], pagination: { total: 0, page: 1, totalPages: 1 } };
      const { data } = await api.get(`/api/inventory/movements?productId=${productId}&limit=10&page=${movementsPage}`);
      return data;
    },
    enabled: !!productId && open && activeTab === 'movements',
  });

  const movements = movementsData?.data || [];
  const movementsPagination = movementsData?.pagination || { total: 0, page: 1, totalPages: 1 };

  // Calculate profit margin if cost and sale prices exist
  const profitMargin = product?.costPrice != null && product?.salePrice != null && Number(product.salePrice) > 0
    ? (((Number(product.salePrice) - Number(product.costPrice)) / Number(product.salePrice)) * 100).toFixed(1)
    : null;

  // Stock status styling
  const isZeroStock = product ? product.stock === 0 : false;
  const isLowStock = product ? product.stock < product.minStock && product.stock > 0 : false;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Ficha de Producto"
      width="lg"
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--unit-accent)]" />
          <p className="text-xs text-[var(--unit-text-muted)] font-medium">Cargando información del producto...</p>
        </div>
      ) : isError || !product ? (
        <div className="p-6 text-center text-sm text-[var(--unit-text-muted)]">
          No se pudo cargar la información del producto.
        </div>
      ) : (
        <div className="space-y-6 pb-8">
          {/* Header Card */}
          <div className="p-5 rounded-unit-lg bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/40 relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border',
                    product.unit === 'BARBERIA' 
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' 
                      : 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20'
                  )}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {product.unit === 'BARBERIA' ? 'Barbería' : 'SPA'}
                  </span>

                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                    product.isActive 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                  )}>
                    {product.isActive ? 'Activo' : 'Inactivo'}
                  </span>

                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-[var(--unit-text-muted)] dark:text-slate-400 border border-slate-500/20">
                    {product.type === 'FOR_SALE' ? 'Para Venta' : product.type === 'INTERNAL_USE' ? 'Uso Interno' : 'Venta & Uso'}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-[var(--unit-text)] tracking-tight pt-1">
                  {product.name}
                </h2>

                {product.barcode && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--unit-text-muted)] font-mono">
                    <Barcode className="h-3.5 w-3.5" />
                    <span>{product.barcode}</span>
                  </div>
                )}
              </div>

              <div className="h-12 w-12 rounded-unit-lg bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] flex items-center justify-center shrink-0">
                <Package className="h-6 w-6" />
              </div>
            </div>

            {/* Quick action buttons row */}
            <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-[var(--unit-border)]/30">
              {onEdit && (
                <button
                  onClick={() => onEdit(product)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-unit bg-[var(--unit-accent)] text-white text-xs font-bold hover:bg-[var(--unit-accent)]/90 transition-all shadow-unit-sm"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Editar
                </button>
              )}

              <Link
                href={`/inventory/entry?productId=${encodeURIComponent(product.id)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-unit bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-unit-sm"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Registrar Entrada
              </Link>
            </div>
          </div>

          {/* KPI Micro Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={cn(
              "p-3.5 rounded-unit-lg border bg-[var(--unit-surface-elevated)] space-y-1",
              isZeroStock 
                ? "border-rose-500/30 bg-rose-500/5"
                : isLowStock 
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-[var(--unit-border)]/40"
            )}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Stock Actual</p>
                {isZeroStock ? (
                  <XCircle className="h-4 w-4 text-rose-500" />
                ) : isLowStock ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
              </div>
              <p className={cn(
                "text-lg font-extrabold font-mono",
                isZeroStock ? "text-rose-600" : isLowStock ? "text-amber-600" : "text-[var(--unit-text)]"
              )}>
                {product.stock} <span className="text-xs font-normal text-[var(--unit-text-muted)]">{product.measureUnit}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-1">
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Stock Mínimo</p>
              <p className="text-lg font-bold text-[var(--unit-text)] font-mono">
                {product.minStock} <span className="text-xs font-normal text-[var(--unit-text-muted)]">{product.measureUnit}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-1">
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Precio Venta</p>
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {product.salePrice != null ? `S/ ${Number(product.salePrice).toFixed(2)}` : '—'}
              </p>
            </div>

            <div className="p-3.5 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-1">
              <p className="text-[11px] font-semibold text-[var(--unit-text-muted)] uppercase">Precio Costo</p>
              <p className="text-lg font-bold text-[var(--unit-text)] font-mono">
                {product.costPrice != null ? `S/ ${Number(product.costPrice).toFixed(2)}` : '—'}
              </p>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--unit-surface-elevated)] rounded-unit border border-[var(--unit-border)]/30 w-fit">
            <button
              onClick={() => setActiveTab('details')}
              className={cn(
                'px-4 py-1.5 rounded-unit text-xs font-bold transition-all',
                activeTab === 'details'
                  ? 'bg-[var(--unit-accent)] text-white shadow-unit-sm'
                  : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
              )}
            >
              Detalles & Atributos
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={cn(
                'px-4 py-1.5 rounded-unit text-xs font-bold transition-all',
                activeTab === 'movements'
                  ? 'bg-[var(--unit-accent)] text-white shadow-unit-sm'
                  : 'text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
              )}
            >
              Kardex & Movimientos
            </button>
          </div>

          {activeTab === 'details' ? (
            <div className="space-y-4">
              {/* Characteristics card */}
              <div className="p-4 rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text-muted)] flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-[var(--unit-accent)]" />
                  Información General
                </h3>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[var(--unit-text-muted)] block">Categoría:</span>
                    <span className="font-semibold text-[var(--unit-text)]">{product.category?.name || 'Sin categoría'}</span>
                  </div>
                  <div>
                    <span className="text-[var(--unit-text-muted)] block">Proveedor:</span>
                    <span className="font-semibold text-[var(--unit-text)]">{product.supplier?.name || 'No asignado'}</span>
                  </div>
                  <div>
                    <span className="text-[var(--unit-text-muted)] block">Margen Comercial:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {profitMargin ? `${profitMargin}%` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--unit-text-muted)] block">Total Vendidos:</span>
                    <span className="font-bold text-[var(--unit-text)] font-mono">{product.timesVended || 0} unid.</span>
                  </div>
                </div>

                {product.description && (
                  <div className="pt-2 border-t border-[var(--unit-border)]/20">
                    <span className="text-[var(--unit-text-muted)] block text-xs mb-1">Descripción:</span>
                    <p className="text-xs text-[var(--unit-text)] leading-relaxed">{product.description}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {movementsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--unit-accent)]" />
                </div>
              ) : movements.length === 0 ? (
                <div className="p-8 text-center rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)]">
                  <Activity className="h-8 w-8 text-[var(--unit-text-muted)] mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-[var(--unit-text-muted)]">No hay movimientos registrados para este producto.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {movements.map((mov: any) => (
                    <div
                      key={mov.id}
                      className="p-3 rounded-unit border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] flex items-center justify-between text-xs gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "h-7 w-7 rounded-unit flex items-center justify-center font-bold",
                          mov.type === 'ENTRY' || mov.type === 'INITIAL'
                            ? "bg-emerald-500/10 text-emerald-600"
                            : mov.type === 'SALE'
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-rose-500/10 text-rose-600"
                        )}>
                          {mov.type === 'ENTRY' || mov.type === 'INITIAL' ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : mov.type === 'SALE' ? (
                            <ShoppingBag className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--unit-text)]">
                            {mov.type === 'ENTRY' ? 'Entrada de Stock' :
                             mov.type === 'SALE' ? 'Venta POS' :
                             mov.type === 'INTERNAL_USE' ? 'Uso Interno' :
                             mov.type === 'ADJUSTMENT' ? 'Ajuste de Inventario' : mov.type}
                          </p>
                          <p className="text-[11px] text-[var(--unit-text-muted)]">
                            {mov.createdAt ? formatPeruDateTime(new Date(mov.createdAt)) : '—'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={cn(
                          "font-mono font-bold text-sm",
                          mov.quantity > 0 && (mov.type === 'ENTRY' || mov.type === 'INITIAL')
                            ? "text-emerald-600"
                            : "text-rose-600"
                        )}>
                          {mov.quantity > 0 && (mov.type === 'ENTRY' || mov.type === 'INITIAL') ? `+${mov.quantity}` : `-${Math.abs(mov.quantity)}`}
                        </span>
                        <p className="text-[10px] text-[var(--unit-text-muted)] font-mono">
                          Stock final: {mov.finalStock ?? '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
