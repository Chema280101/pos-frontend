import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Edit, Plus, AlertCircle, X, Package, Save, Loader2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(200),
  description: z.string().max(2000).optional().nullable(),
  fixedPrice: z.number().positive('Precio debe ser positivo'),
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
  const params = useParams();
  const id = params.id == null ? undefined : Array.isArray(params.id) ? params.id[0] : params.id;
  const isEdit = !!id && id !== 'new';
  const queryClient = useQueryClient();
  const [selectedServices, setSelectedServices] = useState<Array<{ serviceId: string; commissionShare: number | null }>>([]);

  // Success confirmation state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { data: pkg } = useQuery({
    queryKey: ['package', id],
    queryFn: async (): Promise<PackageDetail> => {
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

      console.log('🚀 Enviando paquete:', payload);
      const { data } = await api.post('/api/packages', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      setSuccessMessage('¡Paquete creado exitosamente!');
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
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
      setSuccessMessage('¡Paquete actualizado exitosamente!');
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
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
            {isEdit ? 'Editar Paquete' : 'Nuevo Paquete'}
          </h1>
          <p className="text-[var(--unit-text-muted)]">
            {isEdit ? 'Modifica la información del paquete' : 'Crea un nuevo paquete de servicios'}
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
                  <h2 className="text-lg font-bold text-[var(--unit-text)]">Información del paquete</h2>
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
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Nombre del paquete *</label>
                <input
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  placeholder="Ingresa el nombre del paquete"
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
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all resize-none placeholder:[var(--unit-text-muted)]/50"
                  rows={3}
                  placeholder="Describe los servicios incluidos en el paquete"
                  {...register('description')}
                />
              </div>

              {/* Enhanced Price Field */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Precio fijo (S/) *</label>
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all placeholder:[var(--unit-text-muted)]/50"
                  placeholder="0.00"
                  {...register('fixedPrice', { valueAsNumber: true })}
                />
                {errors.fixedPrice && (
                  <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.fixedPrice.message}
                  </p>
                )}
              </div>

              {/* Enhanced Status Field */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Estado</label>
                <select
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  {...register('status')}
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>

              {/* Enhanced Services Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-bold text-[var(--unit-text)]">Servicios del paquete *</label>
                  <button
                    type="button"
                    onClick={addService}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Servicio
                  </button>
                </div>

                {selectedServices.map((row, index) => (
                  <div key={index} className="flex gap-3 items-center mb-3 p-4 rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)]">
                    <select
                      value={row.serviceId}
                      onChange={(e) => updateServiceId(index, e.target.value)}
                      className="flex-1 rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
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
                      className="w-32 rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all placeholder:[var(--unit-text-muted)]/50"
                    />
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-red-100 text-red-700 font-bold border-2 border-red-300/50 transition-all hover:bg-red-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <X className="h-4 w-4" />
                      Quitar
                    </button>
                  </div>
                ))}

                {selectedServices.length === 0 && (
                  <div className="text-center py-8 rounded-xl border-2 border-dashed border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50">
                    <Package className="h-12 w-12 text-[var(--unit-text-muted)]/50 mx-auto mb-3" />
                    <p className="text-[var(--unit-text-muted)] font-medium">No hay servicios agregados</p>
                    <p className="text-sm text-[var(--unit-text-muted)]/70 mt-1">Agrega al menos un servicio para crear el paquete</p>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Action Buttons */}
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
                      Guardando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Save className="h-4 w-4" />
                      {isEdit ? 'Actualizar paquete' : 'Crear paquete'}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/packages')}
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
    </div>
  );
}
