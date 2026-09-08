import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { EmptyStateData } from '@/components/ui/EmptyState';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Edit, Plus, AlertCircle, X, Package, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const schema = z.object({
  name: z.string().min(1, { message: "Este campo es requerido" }).max(200),
  description: z.string().max(2000).optional().nullable(),
  fixedPrice: z.number().positive({ message: "Precio debe ser positivo" }),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

type FormData = z.infer<typeof schema>;

interface ServiceOption {
  id: string;
  name: string;
  durationMin: number;
  unit: string;
}

interface PackageServiceRow {
  serviceId: string;
  service?: { name: string };
  commissionShare: number | null;
}

interface PackageDetail {
  id: string;
  name: string;
  description: string | null;
  fixedPrice: number;
  durationMin: number;
  status: string;
  services: PackageServiceRow[];
}

export function PackageForm(): JSX.Element {
  const router = useRouter();
  const params = useParams<{ id?: string | string[] }>();
  const id = params?.id == null ? undefined : Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const isEdit = !!id && id !== 'new';
  const queryClient = useQueryClient();
  const [selectedServices, setSelectedServices] = useState<Array<{ serviceId: string; commissionShare: number | null }>>([]);

  // Success confirmation state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { data: pkg } = useQuery({
    queryKey: ['package', id],
    queryFn: async (): Promise<PackageDetail> => {
      if (!id) throw new Error('ID no proporcionado');
      const { data } = await api.get<PackageDetail>(`/api/packages/${id}`);
      return data;
    },
    enabled: isEdit,
  });

  const { data: services } = useQuery({
    queryKey: ['services-all'],
    queryFn: async (): Promise<ServiceOption[]> => {
      const { data } = await api.get<{ data: ServiceOption[] }>('/api/services?activeOnly=false');
      return data.data; // Acceder al array dentro del objeto paginado
    },
  });

  const { success } = useToast();
  const { register, handleSubmit, setError, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', fixedPrice: 0, status: 'ACTIVE' },
  });

  useEffect(() => {
    if (isEdit && pkg) {
      reset({
        name: pkg.name,
        description: pkg.description ?? '',
        fixedPrice: pkg.fixedPrice,
        status: pkg.status as 'ACTIVE' | 'INACTIVE',
      });
      setSelectedServices(
        pkg.services.map((s) => ({ serviceId: s.serviceId, commissionShare: s.commissionShare ?? null }))
      );
    }
  }, [isEdit, pkg, reset]);

  const addService = (): void => {
    // Asegurar que services sea un array antes de usar find
    const servicesArray = Array.isArray(services) ? services : [];
    const available = servicesArray.find((s) => !selectedServices.some((ss) => ss.serviceId === s.id));
    if (available)
      setSelectedServices((prev) => [...prev, { serviceId: available.id, commissionShare: null }]);
  };

  const removeService = (index: number): void => {
    setSelectedServices((prev) => prev.filter((_, i) => i !== index));
  };

  const updateServiceId = (index: number, serviceId: string): void => {
    setSelectedServices((prev) => prev.map((s, i) => (i === index ? { ...s, serviceId } : s)));
  };

  const updateCommissionShare = (index: number, commissionShare: number | null): void => {
    setSelectedServices((prev) => prev.map((s, i) => (i === index ? { ...s, commissionShare } : s)));
  };

  const calculateTotalDuration = () => {
    return selectedServices.reduce((acc, curr) => {
      const serviceInfo = (services ?? []).find(s => s.id === curr.serviceId);
      return acc + (serviceInfo?.durationMin ?? 0);
    }, 0);
  };

  const createMutation = useMutation({
    mutationFn: async (body: FormData) => {
      if (selectedServices.length === 0) throw new Error('Agrega al menos un servicio');

      // 2. 💡 Preparamos el objeto exacto que espera el backend
      const payload = {
        name: body.name,
        description: body.description || null,
        fixedPrice: Number(body.fixedPrice), // Aseguramos que sea número
        status: body.status,
        durationMin: calculateTotalDuration(), // 👈 Enviamos la duración calculada
        services: selectedServices.map((s) => ({
          serviceId: s.serviceId,
          commissionShare: s.commissionShare !== null ? Number(s.commissionShare) : null,
        })),
      };
      
      const { data } = await api.post('/api/packages', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      success('Paquete creado exitosamente');
      setTimeout(() => {
        router.replace('/packages');
      }, 2000);
    },
    onError: (err: { response?: { data?: { error?: string } }; message?: string }) => {
      setError('root', { message: err.response?.data?.error ?? err.message ?? 'Error al guardar' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body: FormData) => {
      if (selectedServices.length === 0) throw new Error('Agrega al menos un servicio');

      const payload = {
        name: body.name,
        description: body.description || null,
        fixedPrice: Number(body.fixedPrice),
        status: body.status,
        durationMin: calculateTotalDuration(), // 👈 También en la edición
        services: selectedServices.map((s) => ({
          serviceId: s.serviceId,
          commissionShare: s.commissionShare !== null ? Number(s.commissionShare) : null,
        })),
      };

      const { data } = await api.patch(`/api/packages/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      success('Paquete actualizado exitosamente');
      setTimeout(() => {
        router.replace('/packages');
      }, 2000);
    },
    onError: (err: { response?: { data?: { error?: string } }; message?: string }) => {
      setError('root', { message: err.response?.data?.error ?? err.message ?? 'Error al guardar' });
    },
  });

  const onSubmit = (data: FormData): void => {
    if (selectedServices.length === 0) {
      setError('root', { message: 'Agrega al menos un servicio al paquete' });
      return;
    }
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
                {isEdit ? 'Editar Paquete' : 'Nuevo Paquete'}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[var(--unit-text-muted)] mt-0.5">
                Servicios Combinados
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
              <Package className="h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
                Información del paquete
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

            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Nombre del paquete"
                placeholder="Ej: Paquete Premium + Corte + Barba"
                required
                error={errors.name?.message}
                {...register('name')}
              />

              <Textarea
                label="Descripción"
                rows={3}
                placeholder="Describe los servicios incluidos en el paquete"
                error={errors.description?.message}
                {...register('description')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Precio (S/)"
                type="number"
                step="0.10"
                min="0"
                placeholder="0.00"
                required
                prefixText="S/"
                error={errors.fixedPrice?.message}
                {...register('fixedPrice', { valueAsNumber: true })}
              />

              <Select
                label="Estado"
                required
                options={[
                  { value: 'ACTIVE', label: 'Activo' },
                  { value: 'INACTIVE', label: 'Inactivo' },
                ]}
                {...register('status')}
              />
            </div>

              {/* Enhanced Services Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-bold text-[var(--unit-text)]">Servicios del paquete *</label>
                  <button
                    type="button"
                    onClick={addService}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white font-bold shadow-unit transition-all active:scale-[0.98]"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Servicio
                  </button>
                </div>

                {selectedServices.map((row, index) => (
                  <div key={index} className="flex gap-3 items-center mb-3 p-4 rounded-unit border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)]">
                    <select
                      value={row.serviceId}
                      onChange={(e) => updateServiceId(index, e.target.value)}
                      className="flex-1 rounded-unit border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                    >
                      {(services ?? []).map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.durationMin} min)</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="% comisión"
                      value={row.commissionShare ?? ''}
                      onChange={(e) => updateCommissionShare(index, e.target.value ? Number(e.target.value) : null)}
                      className="w-32 rounded-unit border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all placeholder:[var(--unit-text-muted)]/50"
                    />
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-unit bg-red-100 text-red-700 font-bold border-2 border-red-300/50 transition-all hover:bg-red-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <X className="h-4 w-4" />
                      Quitar
                    </button>
                  </div>
                ))}

                {selectedServices.length === 0 && (
                  <EmptyStateData
                    title="No hay servicios agregados"
                    description="Agrega al menos un servicio para crear el paquete. Los paquetes te permiten ofrecer múltiples servicios con un precio especial."
                    action={
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => document.getElementById('service-search')?.focus()}
                      >
                        Buscar servicios
                      </Button>
                    }
                  />
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
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-full font-bold shadow-unit-sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? 'Actualizar Paquete' : 'Crear Paquete'}
            </Button>
          </div>
        </form>

        {/* Success Message Toast */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 z-50 animate-pulse">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-unit shadow-unit border-2 border-green-400/50 backdrop-blur-sm">
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
    </div>
  );
}
