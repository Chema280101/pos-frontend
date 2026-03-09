import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useUnitStore } from '../../store/unitStore';
import { 
  Plus, 
  X, 
  AlertCircle, 
  Save, 
  Info,
  Loader2,
  CheckCircle,
  Edit,
  Tag,
  Clock,
  DollarSign,
  Building2,
  FolderPlus,
  Sparkles,
  Activity,
  TrendingUp
} from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(200),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().positive('Precio debe ser positivo'),
  durationMin: z.number().int().positive('Duración en minutos requerida'),
  unit: z.enum(['SPA', 'BARBERIA']),
  categoryId: z.string().uuid().optional().nullable(),
  isComboEligible: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface ServiceResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMin: number;
  unit: string;
  categoryId: string | null;
  isComboEligible: boolean;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  unit: string;
}

export function ServiceForm(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const id = params.id == null ? undefined : Array.isArray(params.id) ? params.id[0] : params.id;
  const isEdit = !!id && id !== 'new';
  const queryClient = useQueryClient();

  // Get user's business unit from auth store or unit store
  const user = useAuthStore((s) => s.user);
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const userUnit = user?.unit || activeUnit || 'SPA';

  // Category creation state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { data: service } = useQuery({
    queryKey: ['service', id],
    queryFn: async (): Promise<ServiceResponse> => {
      const { data } = await api.get<ServiceResponse>(`/api/services/${id}`);
      return data;
    },
    enabled: isEdit,
  });

  const { data: categories } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data } = await api.get<Category[]>('/api/services/categories');
      return data;
    },
  });

  const { register, handleSubmit, setError, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      durationMin: 30,
      unit: userUnit, // Use user's business unit automatically
      categoryId: null,
      isComboEligible: false,
      isActive: true,
    },
  });

  const unit = watch('unit') ?? userUnit;
  const categoriesForUnit = categories?.filter((c) => c.unit === unit) ?? [];

  // Update form unit when user unit changes (only for new services)
  useEffect(() => {
    if (!isEdit && userUnit) {
      reset({
        ...watch(),
        unit: userUnit,
      });
    }
  }, [userUnit, isEdit, reset, watch]);

  // Reset form when service data loads (edit mode)
  useEffect(() => {
    if (isEdit && service) {
      reset({
        name: service.name,
        description: service.description || '',
        price: service.price,
        durationMin: service.durationMin,
        unit: service.unit as 'SPA' | 'BARBERIA',
        categoryId: service.categoryId || null,
        isComboEligible: service.isComboEligible,
        isActive: service.isActive,
      });
    }
  }, [isEdit, service, reset]);

  const createMutation = useMutation({
    mutationFn: async (body: FormData) => {
      const { data } = await api.post<ServiceResponse>('/api/services', {
        ...body,
        categoryId: body.categoryId || null,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      router.replace('/services');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError('root', { message: err.response?.data?.error ?? 'Error al guardar' });
    },
  });

  const categoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post<Category>('/api/services/categories', {
        name: name.trim(),
        unit: userUnit,
      });
      return data;
    },
    onMutate: async (newCategory) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['service-categories'] });
      
      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData<Category[]>(['service-categories']);
      
      // Optimistically add the new category
      const optimisticCategory: Category = {
        id: 'temp-' + Date.now(),
        name: newCategory.trim(),
        unit: userUnit,
      };
      
      queryClient.setQueryData(['service-categories'], (old: Category[] | undefined) => 
        old ? [...old, optimisticCategory] : [optimisticCategory]
      );
      
      return { previousCategories };
    },
    onError: (err: any, newCategory, context) => {
      // Rollback on error
      if (context?.previousCategories) {
        queryClient.setQueryData(['service-categories'], context.previousCategories);
      }
      setError('root', { message: err.response?.data?.error ?? 'Error al crear categoría' });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body: FormData) => {
      const { data } = await api.patch<ServiceResponse>(`/api/services/${id}`, {
        ...body,
        categoryId: body.categoryId || null,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service', id] });
      router.replace('/services');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError('root', { message: err.response?.data?.error ?? 'Error al guardar' });
    },
  });

  const onSubmit = (data: FormData): void => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  // Show error state if service not found
  if (isEdit && !service && !createMutation.isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)] relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative flex items-center justify-center min-h-screen p-6">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-500 mb-4">
              <Tag className="h-12 w-12" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--unit-text)] mb-2">Servicio no encontrado</h2>
            <p className="text-[var(--unit-text-muted)] mb-6">El servicio que intentas editar no existe o ha sido eliminado.</p>
            <button
              onClick={() => router.push('/services')}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--unit-accent)] px-4 py-2 text-white font-medium hover:bg-[var(--unit-primary)] transition-colors"
            >
              <X className="h-4 w-4" />
              Volver a servicios
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isEdit && !service && !createMutation.isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)] relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative flex items-center justify-center min-h-screen p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--unit-accent)] mx-auto mb-4"></div>
            <p className="text-[var(--unit-text)]">Cargando servicio...</p>
          </div>
        </div>
      </div>
    );
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
        {/* Enhanced Header - Exacto estilo ClientForm */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
            <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
            <span className="text-sm font-medium text-[var(--unit-text)]">
              {isEdit ? 'Modo edición' : 'Nuevo registro'}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">
            {isEdit ? 'Editar servicio' : 'Nuevo servicio'}
          </h1>
          <p className="text-[var(--unit-text-muted)]">
            {isEdit ? 'Modifica la información del servicio' : 'Registra un nuevo servicio en el sistema'}
          </p>
        </div>

        {/* Enhanced Form Container - Exacto estilo ClientForm */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm shadow-2xl">
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
                  <h2 className="text-lg font-bold text-[var(--unit-text)]">Información del servicio</h2>
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
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="h-4 w-4 text-[var(--unit-accent)]" />
                  <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información básica</h4>
                </div>
                
                {/* Enhanced Name Field */}
                <div>
                  <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Nombre del servicio *</label>
                  <input 
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" 
                    placeholder="Ej: Masaje relajante, Corte de cabello, etc."
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
                    rows={4}
                    placeholder="Describe los detalles del servicio, beneficios, técnicas utilizadas..."
                    {...register('description')} 
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Pricing and Duration Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-4 w-4 text-[var(--unit-accent)]" />
                  <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Precio y duración</h4>
                </div>

                {/* Enhanced Price and Duration Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Enhanced Price Field */}
                  <div>
                    <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Precio (S/) *</label>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                      placeholder="0.00"
                      {...register('price', { valueAsNumber: true })}
                    />
                    {errors.price && (
                      <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.price.message}
                      </p>
                    )}
                  </div>

                  {/* Enhanced Duration Field */}
                  <div>
                    <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Duración (minutos) *</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                      placeholder="30"
                      {...register('durationMin', { valueAsNumber: true })}
                    />
                    {errors.durationMin && (
                      <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.durationMin.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Configuration Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-4 w-4 text-[var(--unit-accent)]" />
                  <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Configuración</h4>
                </div>

                {/* Enhanced Unit Field */}
                <div>
                  <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Unidad de negocio *</label>
                  {!isEdit ? (
                    <div className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)]">
                      {userUnit === 'SPA' ? 'SPA' : 'Barbería'}
                    </div>
                  ) : (
                    <select 
                      className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" 
                      {...register('unit')}
                    >
                      <option value="SPA">SPA</option>
                      <option value="BARBERIA">Barbería</option>
                    </select>
                  )}
                  {!isEdit && (
                    <p className="text-xs text-[var(--unit-text-muted)] mt-2 flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      La unidad se asigna automáticamente según tu unidad de negocio
                    </p>
                  )}
                </div>

                {/* Enhanced Category Field */}
                <div>
                  <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Categoría</label>
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" 
                      {...register('categoryId')}
                    >
                      <option value="">Sin categoría</option>
                      {categoriesForUnit.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
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
                    <p className="text-xs text-[var(--unit-text-muted)] mt-2 flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      No hay categorías para {unit === 'SPA' ? 'SPA' : 'Barbería'}. Crea una usando el botón +.
                    </p>
                  )}
                </div>

                {/* Enhanced Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-[var(--unit-border)]/30 hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-surface-elevated)] transition-all cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="rounded-lg border-2 border-[var(--unit-border)]/50 text-[var(--unit-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 w-5 h-5"
                      style={{
                        accentColor: 'var(--unit-accent)'
                      }}
                      {...register('isComboEligible')} 
                    />
                    <span className="text-sm text-[var(--unit-text)] group-hover:text-[var(--unit-accent)] font-medium">Elegible para combo</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-[var(--unit-border)]/30 hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-surface-elevated)] transition-all cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="rounded-lg border-2 border-[var(--unit-border)]/50 text-[var(--unit-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 w-5 h-5"
                      style={{
                        accentColor: 'var(--unit-accent)'
                      }}
                      {...register('isActive')} 
                    />
                    <span className="text-sm text-[var(--unit-text)] group-hover:text-[var(--unit-accent)] font-medium">Activo</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons - Exacto estilo ClientForm */}
            <div className="px-6 py-4 bg-gradient-to-r from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] border-t border-[var(--unit-border)]/30">
              <div className="flex gap-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isEdit ? 'Actualizando...' : 'Guardando...'}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Save className="h-4 w-4" />
                      {isEdit ? 'Actualizar servicio' : 'Guardar servicio'}
                    </span>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => router.back()} 
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
      </div>

      {/* Enhanced Category Creation Modal - Exacto estilo ClientForm */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 max-w-md w-full">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                    <FolderPlus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--unit-text)]">Nueva Categoría</h3>
                    <p className="text-sm text-[var(--unit-text-muted)]">Crea una categoría para organizar servicios</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="rounded-xl p-2 text-[var(--unit-text)] hover:bg-[var(--unit-surface-elevated)] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Nombre de la categoría *</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ej: Masajes, Faciales, Cortes..."
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  maxLength={50}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Unidad de negocio</label>
                <div className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)]">
                  {userUnit === 'SPA' ? 'SPA' : 'Barbería'}
                </div>
                <p className="text-xs text-[var(--unit-text-muted)] mt-2 flex items-center gap-1">
                  <Info className="h-4 w-4" />
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
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                {categoryMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FolderPlus className="h-4 w-4" />
                    Crear categoría
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName('');
                }}
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
      )}
    </div>
  );
}
