'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button, Modal, Input, Select, Textarea } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { zodResolver } from '@hookform/resolvers/zod';
import { getPlaceholder } from '@/lib/uiTranslations';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useUnitStore } from '../../store/unitStore';
import { useToast } from '@/hooks/useToast';
import { 
  Plus, 
  X, 
  AlertCircle, 
  Save, 
  Info,
  Loader2,
  Edit,
  Tag,
  Clock,
  DollarSign,
  Building2,
  FolderPlus,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(1, { message: "Este campo es requerido" }).max(200),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().positive({ message: "Precio debe ser positivo" }),
  priceType: z.enum(['FIXED', 'VARIABLE', 'RANGE', 'QUOTE']).default('FIXED'),
  minPrice: z.number().positive().optional().nullable(),
  maxPrice: z.number().positive().optional().nullable(),
  durationMin: z.number().int().positive({ message: "Duración en minutos requerida" }),
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
  priceType: string;
  minPrice: number | null;
  maxPrice: number | null;
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
  const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : undefined;
  const isEdit = !!id && id !== 'new';
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const user = useAuthStore((s) => s.user);
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const userUnit = user?.unit || activeUnit || 'SPA';

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
      unit: userUnit as 'SPA' | 'BARBERIA',
      categoryId: null,
      isComboEligible: false,
      isActive: true,
    },
  });

  const unit = watch('unit') ?? userUnit;
  const categoriesForUnit = categories?.filter((c) => c.unit === unit) ?? [];

  useEffect(() => {
    if (!isEdit && userUnit) {
      reset({
        ...watch(),
        unit: userUnit as 'SPA' | 'BARBERIA',
      });
    }
  }, [userUnit, isEdit, reset, watch]);

  useEffect(() => {
    if (isEdit && service) {
      reset({
        name: service.name,
        description: service.description || '',
        price: service.price,
        priceType: (service.priceType as any) || 'FIXED',
        minPrice: service.minPrice || null,
        maxPrice: service.maxPrice || null,
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
      success('Servicio creado exitosamente');
      router.replace('/services');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      const errorMessage = err.response?.data?.error ?? 'Error al guardar servicio';
      setError('root', { message: errorMessage });
      error(errorMessage);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      success('Categoría creada exitosamente');
      setShowCategoryModal(false);
      setNewCategoryName('');
    },
    onError: (err: any) => {
      setError('root', { message: err.response?.data?.error ?? 'Error al crear categoría' });
      error(err.response?.data?.error ?? 'Error al crear categoría');
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
      success('Servicio actualizado exitosamente');
      router.replace('/services');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError('root', { message: err.response?.data?.error ?? 'Error al guardar servicio' });
      error(err.response?.data?.error ?? 'Error al guardar servicio');
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
                {isEdit ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[var(--unit-text-muted)] mt-0.5">
                {userUnit === 'SPA' ? 'Módulo Spa' : 'Módulo Barbería'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2 rounded-full border border-[var(--unit-border)]/60 text-sm font-bold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] shadow-sm transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* Form Root Error */}
        {errors.root && (
          <div className="rounded-unit border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-medium">{errors.root.message}</p>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section: Basic Information */}
          <div className="rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)]/40 backdrop-blur-md p-6 space-y-4">
            <div className="flex items-center gap-2 text-[var(--unit-accent)] border-b border-[var(--unit-border)]/30 pb-3">
              <Tag className="h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
                Información Básica
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Nombre del servicio"
                placeholder={getPlaceholder('name')}
                required
                error={errors.name?.message}
                {...register('name')}
              />

              <Textarea
                label="Descripción"
                rows={3}
                placeholder={getPlaceholder('description')}
                error={errors.description?.message}
                {...register('description')}
              />
            </div>
          </div>

          {/* Section: Price & Duration */}
          <div className="rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)]/40 backdrop-blur-md p-6 space-y-4">
            <div className="flex items-center gap-2 text-[var(--unit-accent)] border-b border-[var(--unit-border)]/30 pb-3">
              <DollarSign className="h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
                Precio y Duración
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Tipo de Precio"
                required
                options={[
                  { value: 'FIXED', label: 'Precio Fijo' },
                  { value: 'VARIABLE', label: 'Precio Variable' },
                  { value: 'RANGE', label: 'Precio con Aprobación' },
                  { value: 'QUOTE', label: 'Precio por Cotización' },
                ]}
                {...register('priceType')}
              />

              <Input
                label="Precio Base (S/)"
                type="number"
                step="0.10"
                min="0"
                placeholder="0.00"
                required
                prefixText="S/"
                error={errors.price?.message}
                {...register('price', { valueAsNumber: true })}
              />

              <Input
                label="Duración (Minutos)"
                type="number"
                min="1"
                placeholder="30"
                required
                leftIcon={<Clock className="h-4 w-4" />}
                error={errors.durationMin?.message}
                {...register('durationMin', { valueAsNumber: true })}
              />
            </div>

            {/* Range conditional inputs */}
            {(watch('priceType') === 'VARIABLE' || watch('priceType') === 'RANGE') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--unit-border)]/20">
                <Input
                  label="Precio Mínimo (S/)"
                  type="number"
                  step="0.10"
                  min="0"
                  placeholder="0.00"
                  prefixText="S/"
                  error={errors.minPrice?.message}
                  {...register('minPrice', { valueAsNumber: true })}
                />
                <Input
                  label="Precio Máximo (S/)"
                  type="number"
                  step="0.10"
                  min="0"
                  placeholder="0.00"
                  prefixText="S/"
                  error={errors.maxPrice?.message}
                  {...register('maxPrice', { valueAsNumber: true })}
                />
              </div>
            )}
          </div>

          {/* Section: Category & Options */}
          <div className="rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)]/40 backdrop-blur-md p-6 space-y-4">
            <div className="flex items-center gap-2 text-[var(--unit-accent)] border-b border-[var(--unit-border)]/30 pb-3">
              <Building2 className="h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
                Categoría y Configuración
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label="Categoría"
                    options={[
                      { value: '', label: 'Sin categoría' },
                      ...categoriesForUnit.map((c) => ({ value: c.id, label: c.name }))
                    ]}
                    {...register('categoryId')}
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

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--unit-text-muted)]">
                  Unidad de Negocio
                </label>
                {!isEdit ? (
                  <div className="w-full rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)]/50 px-4 py-2.5 text-sm font-semibold text-[var(--unit-text)]">
                    {userUnit === 'SPA' ? 'SPA' : 'Barbería'}
                  </div>
                ) : (
                  <Select
                    options={[
                      { value: 'SPA', label: 'SPA' },
                      { value: 'BARBERIA', label: 'Barbería' }
                    ]}
                    {...register('unit')}
                  />
                )}
              </div>
            </div>

            {/* Checkbox triggers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-3 p-3.5 rounded-unit border border-[var(--unit-border)]/40 bg-[var(--unit-surface)]/60 hover:border-[var(--unit-accent)]/40 hover:bg-[var(--unit-surface-elevated)] transition-all cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isComboEligible')}
                  className="w-4 h-4 rounded text-[var(--unit-accent)] focus:ring-[var(--unit-accent)]/40"
                  style={{ accentColor: 'var(--unit-accent)' }}
                />
                <span className="text-sm font-semibold text-[var(--unit-text)]">Elegible para combos y paquetes</span>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-unit border border-[var(--unit-border)]/40 bg-[var(--unit-surface)]/60 hover:border-[var(--unit-accent)]/40 hover:bg-[var(--unit-surface-elevated)] transition-all cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-4 h-4 rounded text-[var(--unit-accent)] focus:ring-[var(--unit-accent)]/40"
                  style={{ accentColor: 'var(--unit-accent)' }}
                />
                <span className="text-sm font-semibold text-[var(--unit-text)]">Servicio activo en catálogo</span>
              </label>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex gap-4 pt-4 mt-6 border-t border-[var(--unit-border)]/40">
            <button
              type="button"
              onClick={() => router.back()}
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
              {isEdit ? 'Actualizar Servicio' : 'Guardar Servicio'}
            </Button>
          </div>
        </form>
      </div>

      {/* Category Creation Modal using standardized Modal primitive */}
      <Modal
        open={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setNewCategoryName('');
        }}
        title="Nueva Categoría"
        description="Organiza tus servicios en categorías personalizadas"
        headerIcon={<FolderPlus className="h-5 w-5" />}
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
              Nombre de la categoría <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ej: Faciales, Cortes Clásicos, etc."
              maxLength={50}
              className="w-full rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] px-4 py-2.5 text-sm text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40 focus:border-[var(--unit-accent)] transition-all placeholder:text-[var(--unit-text-muted)]/50"
            />
          </div>

          <div className="p-3 rounded-unit border border-[var(--unit-border)]/30 bg-[var(--unit-surface-elevated)]/40 text-xs text-[var(--unit-text-muted)] flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-[var(--unit-accent)]" />
            <span>Se registrará para la unidad <strong>{userUnit === 'SPA' ? 'SPA' : 'Barbería'}</strong></span>
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
