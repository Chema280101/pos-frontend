import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Select } from '@/components/ui';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useUnitStore } from '../../store/unitStore';
import { useToast } from '@/hooks/useToast';
import { Plus, X, Package, Save, AlertCircle, Loader2, Edit, Home, ShoppingBag, DollarSign, BarChart3, Info, Scissors } from 'lucide-react';
import type { Product, ProductCategory } from '@/types/product';

const schema = z.object({
  name: z.string().min(1, { message: "Este campo es requerido" }).max(200),
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

  // Get user's business unit from auth store or unit store
  const user = useAuthStore((s) => s.user);
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const userUnit = user?.unit || activeUnit || 'SPA';

  // Category creation state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // ESC key handler for modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showCategoryModal) {
          setShowCategoryModal(false);
          setNewCategoryName('');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCategoryModal, newCategoryName]);
  
  const { success: successToast } = useToast();
  
  // Success confirmation state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
      return data; // Backend returns direct array, not paginated
    },
  });

  const { register, handleSubmit, setError, reset, watch, setValue, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      unit: userUnit, // Use user's business unit automatically
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

  // Reset form with product data when editing
  useEffect(() => {
    if (isEdit && product) {
      reset({
        name: product.name || '',
        description: product.description || '',
        unit: product.unit || userUnit,
        type: product.type || 'BOTH',
        categoryId: product.category?.id || null,
        measureUnit: product.measureUnit || '',
        salePrice: product.salePrice || null,
        costPrice: product.costPrice || null,
        barcode: product.barcode || '',
        minStock: product.minStock || 5,
        maxStock: product.maxStock || null,
        commissionFixed: product.commissionFixed || null,
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
      successToast('Producto creado exitosamente');
      setTimeout(() => {
        router.replace('/inventory');
      }, 2000);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError('root', { message: err.response?.data?.error ?? 'Error al guardar' });
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
    onMutate: async (newCategory) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['inventory-categories'] });
      
      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData<ProductCategory[]>(['inventory-categories']);
      
      // Optimistically update to the new value
      queryClient.setQueryData<ProductCategory[]>(['inventory-categories'], (old = []) => [
        ...old,
        {
          id: 'temp-' + Date.now(),
          name: newCategory,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
      
      return { previousCategories };
    },
    onError: (err: any, newCategory, context) => {
      // Rollback on error
      if (context?.previousCategories) {
        queryClient.setQueryData(['inventory-categories'], context.previousCategories);
      }
      error(err.response?.data?.error ?? 'Error al crear categoría');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
    },
    onSuccess: () => {
      setShowCategoryModal(false);
      setNewCategoryName('');
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
      successToast('Producto actualizado exitosamente');
      setTimeout(() => {
        router.replace('/inventory');
      }, 2000);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError('root', { message: err.response?.data?.error ?? 'Error al guardar' });
    },
  });

  const onSubmit = (data: FormData): void => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  if (isEdit && !product && !createMutation.isPending) {
    return <p className="p-6 text-[var(--unit-text)]">Cargando...</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)] relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative max-w-2xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
            <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
            <span className="text-sm font-medium text-[var(--unit-text)]">
              {isEdit ? 'Modo edición' : 'Nuevo registro'}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">
            {isEdit ? 'Editar producto' : 'Nuevo producto'}
          </h1>
          <p className="text-[var(--unit-text-muted)]">
            {isEdit ? 'Modifica la información del producto' : 'Registra un nuevo producto en el sistema'}
          </p>
        </div>

        {/* Enhanced Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-accent)]/50 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm shadow-2xl">
            {/* Form Header */}
            <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  {isEdit ? (
                    <Edit className="h-5 w-5 text-white" />
                  ) : (
                    <Plus className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--unit-text)]">Información del producto</h2>
                  <p className="text-sm text-[var(--unit-text-muted)]">Completa todos los campos requeridos</p>
                </div>
              </div>
            </div>

            {/* Enhanced Error Alert */}
            {errors.root && (
              <div className="mx-6 mt-4 rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-50 to-red-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 shadow-lg">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="font-medium text-red-800">{errors.root.message}</p>
                </div>
              </div>
            )}

            {/* Enhanced Form Content */}
            <div className="p-6 space-y-6">
              {/* Enhanced Name Field */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Nombre del producto *</label>
                <input 
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" 
                  placeholder="Ej: Champú Keratina 500ml"
                  {...register('name')} 
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Enhanced Description Field */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Descripción</label>
                <textarea 
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all resize-none" 
                  rows={3}
                  placeholder="Describe el producto (opcional)"
                  {...register('description')} 
                />
              </div>

              {/* Enhanced Unit Field */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Unidad de negocio *</label>
                {!isEdit ? (
                  <div className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)]">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-[var(--unit-accent)]" />
                      {userUnit === 'SPA' ? 'SPA' : 'Barbería'}
                    </div>
                  </div>
                ) : (
                  <Select
                label="Unidad *"
                options={[
                  { value: 'SPA', label: 'SPA' },
                  { value: 'BARBERIA', label: 'Barbería' }
                ]}
                value={watch('unit')}
                onChange={(e: any) => setValue('unit', e.target.value)}
              />
                )}
                {!isEdit && (
                  <p className="mt-2 text-xs text-[var(--unit-text-muted)] flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    La unidad se asigna automáticamente según tu unidad de negocio
                  </p>
                )}
              </div>

              {/* Enhanced Type Field */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Tipo de producto *</label>
                <Select
                options={[
                  { value: 'INTERNAL_USE', label: 'Solo uso interno' },
                  { value: 'FOR_SALE', label: 'Solo venta' },
                  { value: 'BOTH', label: 'Uso interno y venta' }
                ]}
                value={watch('type')}
                onChange={(e: any) => setValue('type', e.target.value)}
              />
                {productType && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 font-medium flex items-center gap-2">
                      {productType === 'INTERNAL_USE' && <Home className="h-4 w-4" />}
                      {productType === 'FOR_SALE' && <ShoppingBag className="h-4 w-4" />}
                      {productType === 'BOTH' && <BarChart3 className="h-4 w-4" />}
                      {productType === 'INTERNAL_USE' && 'Producto para consumo interno del negocio'}
                      {productType === 'FOR_SALE' && 'Producto para venta a clientes'}
                      {productType === 'BOTH' && 'Producto para uso interno y venta'}
                    </p>
                  </div>
                )}
              </div>

              {/* Enhanced Category Field */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Categoría</label>
                <div className="flex gap-2">
                  <Select
                  options={[
                    { value: '', label: '— Seleccionar categoría —', disabled: true },
                    ...categoriesForUnit.map((c) => ({
                      value: c.id,
                      label: c.name
                    }))
                  ]}
                  value={watch('categoryId') || ''}
                  onChange={(e: any) => setValue('categoryId', e.target.value === '' ? null : e.target.value)}
                />
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="px-4 py-3 rounded-xl border-2 border-[var(--unit-accent)]/50 text-[var(--unit-accent)] font-bold bg-[var(--unit-surface)] hover:bg-[var(--unit-accent)] hover:text-white transition-all hover:shadow-lg active:scale-[0.98]"
                    title="Crear nueva categoría"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {categoriesForUnit.length === 0 && (
                  <p className="mt-2 text-xs text-[var(--unit-text-muted)] flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    No hay categorías para {unit === 'SPA' ? 'SPA' : 'Barbería'}. Crea una usando el botón +.
                  </p>
                )}
              </div>

              {/* Enhanced Measure Unit Field */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Unidad de medida</label>
                <input 
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" 
                  placeholder="ml, unidad, kg, botella, etc."
                  {...register('measureUnit')} 
                />
              </div>
              
              {/* Enhanced Prices Section */}
              {showPrices && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="h-4 w-4 text-[var(--unit-accent)]" />
                    <h3 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información de precios</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">
                        Precio de venta (S/) {productType === 'BOTH' && '(Opcional)'}
                      </label>
                      <input 
                        type="number" 
                        step="0.10" 
                        min="0" 
                        className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" 
                        placeholder="Ej: 45.00"
                        {...register('salePrice', { valueAsNumber: true })} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">
                        Precio de costo (S/) {productType === 'BOTH' && '(Opcional)'}
                      </label>
                      <input 
                        type="number" 
                        step="0.10" 
                        min="0" 
                        className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" 
                        placeholder="Ej: 25.00"
                        {...register('costPrice', { valueAsNumber: true })} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">
                        Comisión fija (S/) <span className="text-xs text-[var(--unit-text-muted)] font-normal">- Opcional</span>
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          step="0.10" 
                          min="0" 
                          className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" 
                          placeholder="Ej: 5.00"
                          {...register('commissionFixed', { valueAsNumber: true })} 
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <DollarSign className="h-4 w-4 text-[var(--unit-text-muted)]" />
                        </div>
                      </div>
                      {errors.commissionFixed && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.commissionFixed.message}
                        </p>
                      )}
                      <p className="text-xs text-[var(--unit-text-muted)] mt-1">
                        Comisión fija que recibirá el trabajador por vender este producto
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {!showPrices && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                  <p className="text-sm text-gray-700 text-center flex items-center justify-center gap-2">
                    <Home className="h-4 w-4" />
                    <span className="font-medium">Producto de uso interno</span>
                  </p>
                  <p className="text-xs text-gray-600 text-center mt-1">
                    No requiere precios de venta ni costo
                  </p>
                </div>
              )}

              {/* Enhanced Barcode Field */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Código de barras</label>
                <input 
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" 
                  placeholder="Código de barras o SKU (opcional)"
                  {...register('barcode')} 
                />
              </div>

              {/* Enhanced Stock Fields */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-4 w-4 text-[var(--unit-accent)]" />
                  <h3 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Configuración de stock</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Stock mínimo</label>
                    <input 
                      type="number" 
                      min="0" 
                      className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" 
                      placeholder="Ej: 5"
                      {...register('minStock', { valueAsNumber: true })} 
                    />
                    <p className="mt-1 text-xs text-[var(--unit-text-muted)]">Alerta cuando el stock sea inferior</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Stock máximo</label>
                    <input 
                      type="number" 
                      min="0" 
                      className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" 
                      placeholder="Sin límite"
                      {...register('maxStock', { valueAsNumber: true })} 
                    />
                    <p className="mt-1 text-xs text-[var(--unit-text-muted)]">Opcional - límite superior de stock</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="px-6 py-4 bg-gradient-to-r from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] border-t border-[var(--unit-border)]/30">
              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  variant="primary"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  <Save className="h-4 w-4" />
                  {isEdit ? 'Actualizar producto' : 'Crear producto'}
                </Button>
                <button 
                  type="button" 
                  onClick={() => router.push('/inventory/products')} 
                  className="px-6 py-3 rounded-xl border-2 border-[var(--unit-accent)]/50 text-[var(--unit-accent)] font-bold bg-[var(--unit-surface)] hover:bg-[var(--unit-accent)] hover:text-white transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Cancelar
                  </span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Enhanced Category Creation Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCategoryModal(false);
              setNewCategoryName('');
            }
          }}>
            <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-accent)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 max-w-md w-full">
              {/* Modal Header - Estándar consistente */}
              <div className="relative mb-6 flex items-start justify-between gap-4">
                {/* Background gradient for header - Consistente con Modal.tsx */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--unit-accent)]/20 to-transparent"></div>
                
                <div className="relative z-10 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--unit-text)]">Nueva Categoría</h3>
                    <p className="text-sm text-[var(--unit-text-muted)]">Crea una categoría para {userUnit === 'SPA' ? 'SPA' : 'Barbería'}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="relative z-10 shrink-0 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-2 text-[var(--unit-text-muted)] transition-all duration-200 hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Nombre de la categoría *</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ej: Champús, Crema, Productos de cabello, etc."
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    maxLength={50}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Unidad de negocio</label>
                  <div className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)]">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-[var(--unit-accent)]" />
                      {userUnit === 'SPA' ? 'SPA' : 'Barbería'}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-[var(--unit-text-muted)] flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    La categoría se creará para tu unidad de negocio actual
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    if (newCategoryName.trim()) {
                      categoryMutation.mutate(newCategoryName);
                    }
                  }}
                  disabled={!newCategoryName.trim() || categoryMutation.isPending}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {categoryMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Save className="h-4 w-4" />
                      Crear categoría
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-[var(--unit-accent)]/50 text-[var(--unit-accent)] font-bold bg-[var(--unit-surface)] hover:bg-[var(--unit-accent)] hover:text-white transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Cancelar
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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
  );
}
