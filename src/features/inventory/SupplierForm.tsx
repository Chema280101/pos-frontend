'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  name: z.string().min(1, 'Nombre requerido').max(200),
  contactName: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email('Email inválido').max(100).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  website: z.string().url('Website inválido').max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface SupplierDetail {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    stockEntries: number;
  };
}

export function SupplierForm() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!params.id && params.id !== 'new';

  // Get supplier from list cache as fallback
  const suppliersCache = queryClient.getQueryData<any[]>(['suppliers', false]);
  const cachedSupplier = suppliersCache?.find(s => s.id === params.id);

  const { data: supplier, error } = useQuery({
    queryKey: ['supplier', params.id],
    queryFn: async (): Promise<SupplierDetail> => {
      const response = await api.get<SupplierDetail>(`/api/inventory/suppliers/${params.id}`);
      return response.data;
    },
    enabled: isEdit,
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
      website: '',
      notes: '',
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
          website: supplierData.website || '',
          notes: supplierData.notes || '',
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
      router.replace('/suppliers');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError('root', { message: err.response?.data?.error ?? 'Error al guardar proveedor' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.patch(`/api/inventory/suppliers/${params.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', params.id] });
      router.replace('/suppliers');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError('root', { message: err.response?.data?.error ?? 'Error al actualizar proveedor' });
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
              onClick={() => router.push('/suppliers')}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--unit-accent)] px-4 py-2 text-white font-medium hover:bg-[var(--unit-primary)] transition-colors"
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
            {isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h1>
          <p className="text-[var(--unit-text-muted)]">
            {isEdit ? 'Modifica la información del proveedor' : 'Registra un nuevo proveedor en el sistema'}
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
                  <h2 className="text-lg font-bold text-[var(--unit-text)]">Información del proveedor</h2>
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
                  <Building2 className="h-4 w-4 text-[var(--unit-accent)]" />
                  <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información básica</h4>
                </div>
                
                {/* Enhanced Name Field */}
                <div>
                  <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Nombre del proveedor *</label>
                  <input 
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" 
                    placeholder="Ej: Distribuidora de Productos S.A."
                    {...register('name')} 
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Enhanced Contact Name Field */}
                <div>
                  <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Nombre de contacto</label>
                  <input 
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" 
                    placeholder="Ej: Juan Pérez"
                    {...register('contactName')} 
                  />
                  {errors.contactName && (
                    <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.contactName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="h-4 w-4 text-[var(--unit-accent)]" />
                  <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información de contacto</h4>
                </div>

                {/* Enhanced Phone Field */}
                <div>
                  <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Teléfono</label>
                  <input
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    placeholder="Ej: +51 987 654 321"
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Enhanced Email Field */}
                <div>
                  <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    placeholder="Ej: contacto@proveedor.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Enhanced Website Field */}
                <div>
                  <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Website</label>
                  <input
                    type="url"
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    placeholder="Ej: https://www.proveedor.com"
                    {...register('website')}
                  />
                  {errors.website && (
                    <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.website.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Location Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-4 w-4 text-[var(--unit-accent)]" />
                  <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Ubicación</h4>
                </div>

                {/* Enhanced Address Field */}
                <div>
                  <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Dirección</label>
                  <textarea 
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all resize-none" 
                    rows={3}
                    placeholder="Ej: Av. Principal 123, Lima, Perú"
                    {...register('address')} 
                  />
                  {errors.address && (
                    <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.address.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="h-4 w-4 text-[var(--unit-accent)]" />
                  <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información adicional</h4>
                </div>

                {/* Enhanced Notes Field */}
                <div>
                  <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Notas</label>
                  <textarea 
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all resize-none" 
                    rows={4}
                    placeholder="Información adicional relevante sobre el proveedor..."
                    {...register('notes')} 
                  />
                  {errors.notes && (
                    <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.notes.message}
                    </p>
                  )}
                  <p className="text-xs text-[var(--unit-text-muted)] mt-2 flex items-center gap-1">
                    <Info className="h-4 w-4" />
                    Agrega cualquier información importante sobre el proveedor
                  </p>
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
                      {isEdit ? 'Actualizar proveedor' : 'Guardar proveedor'}
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
