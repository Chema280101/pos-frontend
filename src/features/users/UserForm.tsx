'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
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
  name: z.string().min(1, 'Nombre requerido').max(200),
  email: z.string().email('Email inválido'),
  role: z.enum(['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER', 'BEAUTICIAN', 'MANAGER']),
  unit: z.enum(['SPA', 'BARBERIA']).nullable(),
  phone: z.string().optional(),
  commissionPct: z.string().optional(),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
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

const unitOptions: { value: BusinessUnit | ''; label: string }[] = [
  { value: '', label: 'Todas las unidades' },
  { value: 'SPA', label: 'SPA' },
  { value: 'BARBERIA', label: 'Barbería' },
];

export function UserForm(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const id = params.id == null ? undefined : Array.isArray(params.id) ? params.id[0] : params.id;
  const isEdit = id && id !== 'new';
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
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      role: 'RECEPTIONIST',
      unit: null,
      phone: '',
      commissionPct: '',
      password: '',
    },
  });

  // Reset form when mode changes or data loads
  useEffect(() => {
    console.log('🔍 UserForm useEffect:', { isEdit, user });
    
    if (isEdit && user) {
      // Set values for edit mode
      console.log('📝 Modo edición - seteando valores:', user);
      setValue('name', user.name || '');
      setValue('email', user.email || '');
      setValue('role', user.role || 'RECEPTIONIST');
      setValue('unit', user.unit || null);
      setValue('phone', user.phone || '');
      setValue('commissionPct', user.commissionPct?.toString() || '');
      setValue('password', '');
      setShowPassword(false);
    } else if (!isEdit) {
      // Reset for new user
      console.log('🆕 Modo creación - reseteando a valores vacíos');
      reset({
        name: '',
        email: '',
        role: 'RECEPTIONIST',
        unit: null,
        phone: '',
        commissionPct: '',
        password: '',
      });
      setShowPassword(false);
    }
  }, [isEdit, user, reset, setValue]);

  const createMutation = useMutation({
    mutationFn: async (body: FormData) => {
      console.log('createMutation called with:', body);
      const { data } = await api.post<User>('/api/users', body);
      console.log('createMutation response:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('createMutation success:', data);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      router.replace(`/admin/users`);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      console.log('createMutation error:', err);
      setError('root', { message: err.response?.data?.error ?? 'Error al guardar' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body: FormData) => {
      const { data } = await api.patch<User>(`/api/users/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      router.replace(`/admin/users`);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError('root', { message: err.response?.data?.error ?? 'Error al guardar' });
    },
  });

  const onSubmit = (data: FormData): void => {
    console.log('Form submitted with data:', data);
    console.log('Form errors:', errors);
    
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
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
      
      <div className="relative max-w-2xl mx-auto p-6">
        {/* Enhanced Header - Exacto ClientForm */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
            <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
            <span className="text-sm font-medium text-[var(--unit-text)]">
              {isEdit ? 'Modo edición' : 'Nuevo registro'}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">
            {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
          </h1>
          <p className="text-[var(--unit-text-muted)]">
            {isEdit ? 'Modifica la información del usuario' : 'Registra un nuevo usuario en el sistema'}
          </p>
        </div>

        {/* Enhanced Form Container - Exacto ClientForm */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  placeholder="Ingresa el nombre completo"
                  {...register('name')} 
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
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
                  placeholder="juan@ejemplo.com"
                  {...register('email')}
                  disabled={isEdit ? true : undefined}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
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
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Rol *</label>
                <select className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" {...register('role')}>
                  {roleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.role.message}
                  </p>
                )}
              </div>

              {/* Enhanced Unit Field */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Unidad de negocio</label>
                <select
                  {...register('unit', {
                    setValueAs: (v: string) => (v === '' ? null : v),
                  })}
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                >
                  {unitOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Enhanced Phone Field */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Teléfono</label>
                <input
                  type="tel"
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  placeholder="+51 987 654 321"
                  {...register('phone')}
                />
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
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
                  placeholder="10.5"
                  {...register('commissionPct')}
                />
                {errors.commissionPct && (
                  <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
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
                      placeholder="Mínimo 6 caracteres"
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
                    <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.password.message}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-[var(--unit-text-muted)]">
                    El usuario deberá cambiarla en su primer inicio de sesión.
                  </p>
                </div>
              )}
            </div>

            {/* Enhanced Action Buttons - Exacto ClientForm */}
            <div className="px-6 py-4 bg-gradient-to-r from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] border-t border-[var(--unit-border)]/30">
              <div className="flex gap-4">
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Save className="h-4 w-4" />
                      Guardar usuario
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
    </div>
  );
}