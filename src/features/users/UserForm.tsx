'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { t, getPlaceholder } from '@/lib/uiTranslations';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '@/components/ui';
import { Select } from '@/components/ui';
import type { UserRole, BusinessUnit, getRoleLabel } from '@/types/auth';
import type { User, CreateUserRequest, UpdateUserRequest } from '@/types/users';
import { 
  AlertCircle, 
  Scissors, 
  ShoppingBag, 
  Gift, 
  Package, 
  Save, 
  X, 
  Info,
  Loader2,
  CheckCircle,
  Edit,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, { message: t('required') }).max(200),
  email: z.string().email({ message: t('invalidEmail') }).min(1, { message: t('required') }),
  role: z.enum(['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER', 'BEAUTICIAN', 'MANAGER']),
  unit: z.enum(['SPA', 'BARBERIA']).nullable().optional(),
  phone: z.string().optional(),
  commissionPct: z.string().optional(),
  password: z.string().min(6, { message: t('passwordTooShort') }).optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'RECEPTIONIST', label: 'Recepcionista' },
  { value: 'SPA_SPECIALIST', label: 'Especialista SPA' },
  { value: 'BARBER', label: 'Barbero' },
  { value: 'BEAUTICIAN', label: 'Esteticista' },
  { value: 'MANAGER', label: 'Gerente' },
];

const unitOptions: { value: string | number; label: string; disabled?: boolean }[] = [
  { value: '', label: 'Todas las unidades' },
  { value: 'SPA', label: 'SPA' },
  { value: 'BARBERIA', label: 'Barbería' },
];

export function UserForm(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const id = params?.id == null ? undefined : Array.isArray(params.id) ? params.id[0] : params.id;
  const isEdit = id && id !== 'new';
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  // ✅ MEJORADO: Query específica para obtener usuario por ID
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async (): Promise<User> => {
      const { data } = await api.get<User>(`/api/users/${id}`);
      return data;
    },
    enabled: Boolean(id && isEdit && id !== 'new' && id !== ''),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    setError,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      role: 'RECEPTIONIST',
      commissionPct: '',
      unit: undefined,
      phone: '',
      password: '',
    } as Partial<FormData>,
  });

  // Reset form when mode changes or data loads
  useEffect(() => {
        
    if (isEdit && user) {
      // Set values for edit mode
      setValue('name', user.name || '');
      setValue('email', user.email || '');
      setValue('role', (user.role === 'BEAUTICIAN' || user.role === 'MANAGER' ? 'RECEPTIONIST' : user.role));
      setValue('unit', (user.unit === null || user.unit === undefined) ? undefined : user.unit);
      setValue('phone', user.phone || '');
      setValue('commissionPct', user.commissionPct?.toString() || '');
      setValue('password', '');
      setShowPassword(false);
    } else if (!isEdit) {
      // Reset for new user
      reset({
        name: '',
        email: '',
        role: 'RECEPTIONIST',
        unit: undefined,
        phone: '',
        commissionPct: '',
        password: '',
      });
      setShowPassword(false);
    }
  }, [isEdit, user, reset, setValue]);

  const createMutation = useMutation({
    mutationFn: async (body: CreateUserRequest) => {
      const { data } = await api.post<User>('/api/users', body);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      success('Usuario creado exitosamente');
      router.replace(`/admin/users`);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError('root', { message: err.response?.data?.error ?? t('errorOccurred') });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body: UpdateUserRequest) => {
      const { data } = await api.patch<User>(`/api/users/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      success('Usuario actualizado exitosamente');
      router.replace(`/admin/users`);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError('root', { message: err.response?.data?.error ?? t('errorOccurred') });
    },
  });

  const onSubmit = (data: FormData): void => {
    if (isEdit) {
      const updateData: UpdateUserRequest = {
        name: data.name || undefined,
        email: data.email,
        role: data.role as UserRole,
        unit: data.unit,
        phone: data.phone || null,
        commissionPct: data.commissionPct && data.commissionPct !== '' 
          ? parseFloat(data.commissionPct) 
          : null, 
      };
      updateMutation.mutate(updateData);
    } else {
      const createData: CreateUserRequest = {
        name: data.name || '',
        email: data.email,
        role: data.role as UserRole,
        unit: data.unit,
        phone: data.phone || null,
        commissionPct: data.commissionPct && data.commissionPct !== '' 
          ? parseFloat(data.commissionPct) 
          : null, 
        password: data.password || '',
      };
      createMutation.mutate(createData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEdit && !user && !createMutation.isPending) {
    return <p className="p-6 text-[var(--unit-text)]">Cargando...</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)] relative">
      {/* Background Pattern - Exacto ClientForm */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
        {/* Enhanced Header - Mobile Optimized */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-3 px-3 py-2 sm:px-4 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
            <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium text-[var(--unit-text)]">
              {isEdit ? 'Modo edición' : 'Nuevo registro'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">
            {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
          </h1>
          <p className="text-sm sm:text-base text-[var(--unit-text-muted)]">
            {isEdit ? 'Modifica la información del usuario' : 'Registra un nuevo usuario en el sistema'}
          </p>
        </div>

        {/* Enhanced Form Container - Mobile Optimized */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm shadow-2xl">
            {/* Form Header - Exacto ClientForm */}
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
                  <h2 className="text-lg font-bold text-[var(--unit-text)]">Información del usuario</h2>
                  <p className="text-sm text-[var(--unit-text-muted)]">Completa todos los campos requeridos</p>
                </div>
              </div>
            </div>

            {/* Enhanced Error Alert - Exacto ClientForm */}
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

            {/* Enhanced Form Content - Exacto ClientForm */}
            <div className="p-6 space-y-6">
              {/* Enhanced Name Field */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Nombre completo *</label>
                <input 
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" 
                  placeholder={getPlaceholder('name')}
                  {...register('name')} 
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-[var(--unit-error)] font-medium flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Enhanced Email Field */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Email *</label>
                <input
                  type="email"
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder={getPlaceholder('email')}
                  {...register('email')}
                  disabled={isEdit ? true : undefined}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-[var(--unit-error)] font-medium flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email.message}
                  </p>
                )}
                {isEdit && (
                  <p className="mt-2 text-sm text-amber-600 font-medium flex items-center gap-1 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                    <AlertCircle className="h-4 w-4" />
                    El email no puede ser modificado
                  </p>
                )}
              </div>

              {/* Enhanced Role Field */}
              <Select
                label="Rol *"
                options={roleOptions}
                value={watch('role')}
                onChange={(e: any) => setValue('role', e.target.value)}
                error={errors.role?.message}
              />

              {/* Enhanced Unit Field */}
              <Select
                label="Unidad de negocio"
                options={unitOptions}
                value={watch('unit') || ''}
                onChange={(e: any) => setValue('unit', e.target.value === '' ? undefined : e.target.value as BusinessUnit | undefined)}
              />

              {/* Enhanced Phone Field */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Teléfono</label>
                <input
                  type="tel"
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  placeholder={getPlaceholder('phone')}
                  {...register('phone')}
                />
                {errors.phone && (
                  <p className="mt-2 text-sm text-[var(--unit-error)] font-medium flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Enhanced Commission Field */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">% Comisión</label>
                <input
                  type="text"
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  placeholder="Ej: 15.5"
                  {...register('commissionPct')}
                />
                {errors.commissionPct && (
                  <p className="mt-2 text-sm text-[var(--unit-error)] font-medium flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.commissionPct.message}
                  </p>
                )}
                <p className="mt-2 text-xs text-[var(--unit-text-muted)]">
                  Porcentaje de comisión para servicios (opcional)
                </p>
              </div>

              {/* Enhanced Password Field - Solo para nuevos usuarios */}
              {!isEdit && (
                <div>
                  <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Contraseña temporal *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 pr-12 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                      placeholder={getPlaceholder('password')}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--unit-text-muted)] hover:text-[var(--unit-accent)] transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-[var(--unit-error)] font-medium flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.password.message}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-[var(--unit-text-muted)]">
                    El usuario deberá cambiarla en su primer inicio de sesión.
                  </p>
                </div>
              )}

              {/* Enhanced Action Buttons - Exacto ClientForm */}
              <div className="px-6 py-4 bg-gradient-to-r from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] border-t border-[var(--unit-border)]/30">
                <div className="flex gap-4">
                  <Button 
                    type="submit" 
                    variant="primary"
                    isLoading={isLoading}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4" />
                    {isEdit ? 'Actualizar usuario' : 'Guardar usuario'}
                  </Button>
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
          </div>
        </form>
      </div>
    </div>
  );
}