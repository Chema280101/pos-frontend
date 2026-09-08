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
import { Button, Select, Input } from '@/components/ui';
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
  EyeOff,
  User as UserIcon
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
  const isEdit = Boolean(id && id !== 'new');
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
      // Solo enviar campos que el backend espera
      const backendData = {
        name: createData.name,
        email: createData.email,
        password: createData.password,
        role: createData.role,
        ...(createData.unit && { unit: createData.unit }),
        ...(createData.phone && { phone: createData.phone }),
        ...(createData.commissionPct !== null && { commissionPct: createData.commissionPct }),
      };
      createMutation.mutate(backendData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEdit && !user && !createMutation.isPending) {
    return <p className="p-6 text-[var(--unit-text)]">Cargando...</p>;
  }

  return (
    <div className="min-h-screen bg-[var(--unit-surface)]">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
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
                {isEdit ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[var(--unit-text-muted)] mt-0.5">
                Gestión de Personal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="self-start sm:self-auto px-5 py-2 rounded-full border border-[var(--unit-border)]/60 text-sm font-bold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] shadow-sm transition-all"
          >
            Cancelar
          </button>
        </div>

        {/* Enhanced Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)]/40 backdrop-blur-md p-6 space-y-4">
            {/* Form Header */}
            <div className="flex items-center gap-2 text-[var(--unit-accent)] border-b border-[var(--unit-border)]/30 pb-3">
              <UserIcon className="h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
                Información del usuario
              </h2>
            </div>

            {/* Enhanced Error Alert - Exacto ClientForm */}
            {errors.root && (
              <div className="mx-6 mt-4 rounded-unit border-2 border-red-500/30 bg-gradient-to-br from-red-50 to-red-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-unit bg-red-500 shadow-unit">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="font-medium text-red-800">{errors.root.message}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Nombre Completo"
                  placeholder={getPlaceholder('name')}
                  error={errors.name?.message}
                  required
                  {...register('name')}
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Email"
                  type="email"
                  placeholder={getPlaceholder('email')}
                  error={errors.email?.message}
                  required
                  disabled={isEdit}
                  {...register('email')}
                />
                {isEdit && (
                  <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 bg-amber-500/10 p-2.5 rounded-unit border border-amber-500/30">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>El email no puede ser modificado.</span>
                  </div>
                )}
              </div>

              <div>
                <Select
                  label="Rol *"
                  options={roleOptions}
                  value={watch('role')}
                  onChange={(e: any) => setValue('role', e.target.value)}
                  error={errors.role?.message}
                />
              </div>

              <div>
                <Select
                  label="Unidad de Negocio"
                  options={unitOptions}
                  value={watch('unit') || ''}
                  onChange={(e: any) => setValue('unit', e.target.value === '' ? undefined : e.target.value as BusinessUnit | undefined)}
                />
              </div>

              <div>
                <Input
                  label="Teléfono"
                  type="tel"
                  placeholder={getPlaceholder('phone')}
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </div>

              <div>
                <Input
                  label="% Comisión"
                  type="text"
                  placeholder="Ej: 15.5"
                  error={errors.commissionPct?.message}
                  hint="Porcentaje de comisión para servicios (opcional)"
                  {...register('commissionPct')}
                />
              </div>

              {!isEdit && (
                <div className="sm:col-span-2">
                  <Input
                    label="Contraseña temporal"
                    type="password"
                    placeholder={getPlaceholder('password')}
                    error={errors.password?.message}
                    required
                    showPasswordToggle
                    hint="El usuario deberá cambiarla en su primer inicio de sesión."
                    {...register('password')}
                  />
                </div>
              )}
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
              isLoading={isLoading}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-full font-bold shadow-unit-sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? 'Actualizar Usuario' : 'Guardar Usuario'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}