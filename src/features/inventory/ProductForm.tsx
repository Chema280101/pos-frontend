'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Select, Textarea, Modal } from '@/components/ui';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useUnitStore } from '../../store/unitStore';
import { useToast } from '@/hooks/useToast';
import { 
  Plus, 
  Package, 
  Save, 
  AlertCircle, 
  Loader2, 
  Edit, 
  DollarSign, 
  BarChart3, 
  Info, 
  QrCode, 
  FolderPlus,
  Boxes
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product, ProductCategory } from '@/types/product';

const schema = z.object({
  name: z.string().min(1, { message: "El nombre es requerido" }).max(200),
  description: z.string().max(2000).optional().nullable(),
  unit: z.enum(['SPA', 'BARBERIA']),
  type: z.enum(['INTERNAL_USE', 'FOR_SALE', 'BOTH']),
  categoryId: z.string().uuid().optional().nullable(),
  measureUnit: z.string().max(20).optional().nullable(),
  salePrice: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  barcode: z.string().max(50).optional().nullable(),
  minStock: z.number().int().min(0).optional(),
  maxStock: z.number().int().min(0).optional().nullable(),
  commissionFixed: z.number().min(0).optional().nullable(),
});

type FormData = z.infer<typeof schema>;

export function ProductForm(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : undefined;
  const isEdit = !!id && id !== 'new';
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const user = useAuthStore((s) => s.user);
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const userUnit = user?.unit || activeUnit || 'SPA';

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { data: product } = useQuery({
    queryKey: ['inventory-product', id],
    queryFn: async (): Promise<Product> => {
      const { data } = await api.get<Product>(`/api/inventory/products/${id}`);
      return data;
    },
    enabled: isEdit,
  });

  const { data: categories } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: async (): Promise<ProductCategory[]> => {
      const { data } = await api.get<ProductCategory[]>('/api/inventory/products/categories');
      return data;
    },
  });

  const { register, handleSubmit, setError, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      unit: userUnit as 'SPA' | 'BARBERIA',
      type: 'BOTH',
      categoryId: null,
      measureUnit: '',
      salePrice: null,
      costPrice: null,
      barcode: '',
      minStock: 5,
      maxStock: null,
      commissionFixed: null,
    },
  });

  const unit = watch('unit') ?? userUnit;
  const categoriesForUnit = categories?.filter((c) => c.unit === unit) ?? [];
  const productType = watch('type');
  const showPrices = productType === 'FOR_SALE' || productType === 'BOTH';

  useEffect(() => {
    if (isEdit && product) {
      reset({
        name: product.name || '',
        description: product.description || '',
        unit: (product.unit as 'SPA' | 'BARBERIA') || userUnit,
        type: product.type || 'BOTH',
        categoryId: product.category?.id || null,
        measureUnit: product.measureUnit || '',
        salePrice: product.salePrice ?? null,
        costPrice: product.costPrice ?? null,
        barcode: product.barcode || '',
        minStock: product.minStock || 5,
        maxStock: product.maxStock || null,
        commissionFixed: product.commissionFixed ?? null,
      });
    }
  }, [isEdit, product, reset, userUnit]);

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/api/inventory/products', {
        ...formData,
        categoryId: formData.categoryId || null,
        salePrice: formData.salePrice ?? null,
        costPrice: formData.costPrice ?? null,
        commissionFixed: formData.commissionFixed ?? null,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      success('Producto creado exitosamente');
      router.replace('/inventory');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      const msg = err.response?.data?.error ?? 'Error al guardar producto';
      setError('root', { message: msg });
      error(msg);
    },
  });

  const categoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await api.post('/api/inventory/products/categories', {
        name: name.trim(),
        unit: userUnit,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      success('Categoría creada exitosamente');
      setShowCategoryModal(false);
      setNewCategoryName('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error ?? 'Error al crear categoría';
      setError('root', { message: msg });
      error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.patch(`/api/inventory/products/${id}`, {
        ...formData,
        categoryId: formData.categoryId || null,
        salePrice: formData.salePrice ?? null,
        costPrice: formData.costPrice ?? null,
        commissionFixed: formData.commissionFixed ?? null,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-product', id] });
      success('Producto actualizado exitosamente');
      router.replace('/inventory');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      const msg = err.response?.data?.error ?? 'Error al guardar producto';
      setError('root', { message: msg });
      error(msg);
    },
  });

  const onSubmit = (data: FormData): void => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-[var(--unit-surface)]">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--unit-border)]/40 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-unit bg-[var(--unit-accent)] text-white shadow-unit-sm shrink-0">
              {isEdit ? <Edit className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--unit-accent)]/10 text-[var(--unit-accent)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--unit-accent)] animate-pulse" />
                  {isEdit ? 'Edición' : 'Nuevo'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--unit-text)]">
                {isEdit ? 'Editar Producto' : 'Registrar Nuevo Producto'}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[var(--unit-text-muted)] mt-0.5">
                Control de Inventario
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/inventory')}
            className="self-start sm:self-auto px-5 py-2 rounded-full border border-[var(--unit-border)]/60 text-sm font-bold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] shadow-sm transition-all"
          >
            Cancelar
          </button>
        </div>

        {/* Error Alert */}
        {errors.root && (
          <div className="rounded-unit border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-medium">{errors.root.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section: Basic Details */}
          <div className="rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)]/40 backdrop-blur-md p-6 space-y-4">
            <div className="flex items-center gap-2 text-[var(--unit-accent)] border-b border-[var(--unit-border)]/30 pb-3">
              <Package className="h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
                Datos del Producto
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Nombre del Producto"
                  placeholder="Ej: Cera Modeladora Mate 150ml"
                  error={errors.name?.message}
                  required
                  {...register('name')}
                />
              </div>

              <div className="sm:col-span-2">
                <Textarea
                  label="Descripción"
                  placeholder="Detalles sobre el producto, modo de uso o especificaciones..."
                  rows={3}
                  {...register('description')}
                />
              </div>

              <div>
                <Select
                  label="Tipo de Producto"
                  required
                  value={watch('type')}
                  onChange={(e: any) => setValue('type', e.target.value)}
                  options={[
                    { value: 'BOTH', label: 'Uso Interno y Venta' },
                    { value: 'FOR_SALE', label: 'Solo Venta al Público' },
                    { value: 'INTERNAL_USE', label: 'Solo Uso Interno / Cabina' }
                  ]}
                />
              </div>

              <div>
                <Input
                  label="Unidad de Medida"
                  placeholder="ml, gr, frasco, unidad..."
                  {...register('measureUnit')}
                />
              </div>

              <div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Select
                      label="Categoría"
                      options={[
                        { value: '', label: '— Sin categoría —' },
                        ...categoriesForUnit.map((c) => ({ value: c.id, label: c.name }))
                      ]}
                      value={watch('categoryId') || ''}
                      onChange={(e: any) => setValue('categoryId', e.target.value === '' ? null : e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="h-[42px] px-3.5 rounded-unit border border-[var(--unit-accent)]/40 text-[var(--unit-accent)] hover:bg-[var(--unit-accent)] hover:text-white bg-[var(--unit-surface)] font-semibold transition-all shadow-sm flex items-center justify-center mb-[2px]"
                    title="Crear nueva categoría"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <Input
                  label="Código de Barras / SKU"
                  placeholder="Escanea o escribe el código"
                  leftIcon={<QrCode className="h-4 w-4" />}
                  {...register('barcode')}
                />
              </div>
            </div>
          </div>

          {/* Section: Pricing & Commission */}
          {showPrices && (
            <div className="rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)]/40 backdrop-blur-md p-6 space-y-4">
              <div className="flex items-center gap-2 text-[var(--unit-accent)] border-b border-[var(--unit-border)]/30 pb-3">
                <DollarSign className="h-4 w-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
                  Precios y Comisiones
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Precio de Venta (S/)"
                  type="number"
                  step="0.10"
                  min="0"
                  placeholder="0.00"
                  prefixText="S/"
                  {...register('salePrice', { valueAsNumber: true })}
                />

                <Input
                  label="Precio de Costo (S/)"
                  type="number"
                  step="0.10"
                  min="0"
                  placeholder="0.00"
                  prefixText="S/"
                  {...register('costPrice', { valueAsNumber: true })}
                />

                <Input
                  label="Comisión Vendedora (S/)"
                  type="number"
                  step="0.10"
                  min="0"
                  placeholder="0.00"
                  prefixText="S/"
                  hint="Comisión fija por venta"
                  {...register('commissionFixed', { valueAsNumber: true })}
                />
              </div>
            </div>
          )}

          {/* Section: Stock Control */}
          <div className="rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)]/40 backdrop-blur-md p-6 space-y-4">
            <div className="flex items-center gap-2 text-[var(--unit-accent)] border-b border-[var(--unit-border)]/30 pb-3">
              <Boxes className="h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
                Control de Stock y Alertas
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Stock Mínimo (Alerta)"
                type="number"
                min="0"
                placeholder="5"
                hint="Se alertará cuando el inventario sea menor"
                {...register('minStock', { valueAsNumber: true })}
              />

              <Input
                label="Stock Máximo Deseado"
                type="number"
                min="0"
                placeholder="Sin límite"
                hint="Capacidad máxima sugerida"
                {...register('maxStock', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex gap-4 pt-4 mt-6 border-t border-[var(--unit-border)]/40">
            <button
              type="button"
              onClick={() => router.push('/inventory')}
              className="px-6 py-2.5 rounded-full font-bold text-[var(--unit-text-muted)] hover:text-[var(--unit-text)] bg-[var(--unit-surface)] hover:bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/60 transition-all shadow-sm"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-full font-bold shadow-unit-sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? 'Actualizar Producto' : 'Guardar Producto'}
            </Button>
          </div>
        </form>
      </div>

      {/* Category Creation Modal using standardized Modal */}
      <Modal
        open={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setNewCategoryName('');
        }}
        title="Nueva Categoría de Inventario"
        description="Agrupa tus productos de barbería o spa"
        headerIcon={<FolderPlus className="h-5 w-5" />}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nombre de la Categoría"
            placeholder="Ej: Ceras, Champús, Desinfectantes..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            maxLength={50}
            required
          />

          <div className="p-3 rounded-unit border border-[var(--unit-border)]/30 bg-[var(--unit-surface-elevated)]/40 text-xs text-[var(--unit-text-muted)] flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-[var(--unit-accent)]" />
            <span>Se registrará en la unidad <strong>{userUnit === 'SPA' ? 'SPA' : 'Barbería'}</strong></span>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                setShowCategoryModal(false);
                setNewCategoryName('');
              }}
              className="flex-1 px-4 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-sm font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-border)]/20 transition-all active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                if (newCategoryName.trim()) {
                  categoryMutation.mutate(newCategoryName);
                }
              }}
              disabled={!newCategoryName.trim() || categoryMutation.isPending}
              className="flex-1 px-4 py-2.5 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white font-semibold shadow-unit shadow-[var(--unit-accent)]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
            >
              {categoryMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <FolderPlus className="h-4 w-4" />
                  Crear Categoría
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
