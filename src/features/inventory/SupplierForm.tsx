'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button, Input, Textarea } from '@/components/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from '@/lib/uiTranslations';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  AlertCircle, 
  Save, 
  X, 
  Info,
  Loader2,
  CheckCircle,
  Edit,
  Plus,
  User,
  Globe,
  Briefcase,
  ArrowLeft
} from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, { message: t('required') }).max(200),
  contactName: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email({ message: t('invalidEmail') }).max(100).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface SupplierDetail {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
      isActive: boolean;
  createdAt: string;
  _count: {
    stockEntries: number;
  };
}

export function SupplierForm() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!params?.id && params?.id !== 'new';

  // Get supplier from list cache as fallback
  const suppliersCache = queryClient.getQueryData(['suppliers']) as any;
  const suppliersList = suppliersCache?.data || suppliersCache;
  const cachedSupplier = Array.isArray(suppliersList) ? suppliersList.find((s: any) => s.id === params?.id) : undefined;

  const { data: supplier, error } = useQuery({
    queryKey: ['supplier', params?.id],
    queryFn: async (): Promise<SupplierDetail> => {
      if (!params?.id) throw new Error('ID no proporcionado');
      const response = await api.get<SupplierDetail>(`/api/inventory/suppliers/${params?.id}`);
      return response.data;
    },
    enabled: isEdit && !!params?.id,
    retry: false,
  });

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
    },
  });

  useEffect(() => {
    if (isEdit) {
      // Use API data if available, otherwise use cached data
      const supplierData = supplier || cachedSupplier;
      if (supplierData) {
        reset({
          name: supplierData.name,
          contactName: supplierData.contactName || '',
          phone: supplierData.phone || '',
          email: supplierData.email || '',
          address: supplierData.address || '',
        });
      }
    }
  }, [isEdit, supplier, cachedSupplier, reset]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.post('/api/inventory/suppliers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      router.replace('/inventory/suppliers');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError('root', { message: err.response?.data?.error ?? t('errorOccurred') });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!params?.id) throw new Error('ID no proporcionado');
      const response = await api.patch(`/api/inventory/suppliers/${params?.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', params?.id] });
      router.replace('/inventory/suppliers');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError('root', { message: err.response?.data?.error ?? t('errorOccurred') });
    },
  });

  const onSubmit = (data: FormData): void => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // Show error state if supplier not found and no cached data available
  if (isEdit && error && !cachedSupplier) {
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
              <Building2 className="h-12 w-12" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--unit-text)] mb-2">Proveedor no encontrado</h2>
            <p className="text-[var(--unit-text-muted)] mb-6">El proveedor que intentas editar no existe o ha sido eliminado.</p>
            <button
              onClick={() => router.push('/inventory/suppliers')}
              className="inline-flex items-center gap-2 rounded-unit bg-[var(--unit-accent)] px-4 py-2 text-white font-medium hover:bg-[var(--unit-primary)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a proveedores
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isEdit && !supplier && !error && !cachedSupplier) {
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
            <p className="text-[var(--unit-text)]">Cargando proveedor...</p>
          </div>
        </div>
      </div>
    );
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
                {isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[var(--unit-text-muted)] mt-0.5">
                Gestión de Inventario
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
              <Building2 className="h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
                Información del proveedor
              </h2>
            </div>

            {/* Enhanced Error Alert */}
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
                  label="Nombre del proveedor"
                  placeholder="Ej: Distribuidora de Productos S.A."
                  error={errors.name?.message}
                  required
                  {...register('name')}
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Nombre de contacto"
                  placeholder="Ej: Juan Pérez"
                  error={errors.contactName?.message}
                  {...register('contactName')}
                />
              </div>

              <div>
                <Input
                  label="Teléfono"
                  placeholder="Ej: +51 987 654 321"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </div>

              <div>
                <Input
                  label="Email"
                  type="email"
                  placeholder="Ej: contacto@proveedor.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div className="sm:col-span-2">
                <Textarea
                  label="Dirección"
                  rows={2}
                  placeholder="Ej: Av. Principal 123, Lima, Perú"
                  error={errors.address?.message}
                  {...register('address')}
                />
              </div>
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
              {isEdit ? 'Actualizar Proveedor' : 'Guardar Proveedor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
