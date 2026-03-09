import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

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

  const createMutation = useMutation({
    mutationFn: async (body: FormData) => {
      if (selectedServices.length === 0) throw new Error('Agrega al menos un servicio');
      const { data } = await api.post('/api/packages', {
        ...body,
        services: selectedServices.map((s) => ({
          serviceId: s.serviceId,
          commissionShare: s.commissionShare ?? undefined,
        })),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      router.replace('/packages');
    },
    onError: (err: { response?: { data?: { error?: string } }; message?: string }) => {
      setError('root', { message: err.response?.data?.error ?? err.message ?? 'Error al guardar' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body: FormData) => {
      if (selectedServices.length === 0) throw new Error('Agrega al menos un servicio');
      const { data } = await api.patch(`/api/packages/${id}`, {
        ...body,
        services: selectedServices.map((s) => ({
          serviceId: s.serviceId,
          commissionShare: s.commissionShare ?? undefined,
        })),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      router.replace('/packages');
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
    <div className="min-h-screen bg-[var(--unit-surface)] p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-[var(--unit-text-muted)] mb-6">
          {isEdit ? 'Editar paquete' : 'Nuevo paquete'}
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-[var(--unit-secondary)] p-6 rounded-xl border-2 border-[var(--unit-primary)]">
          {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
          <div>
            <label className="block text-sm font-medium text-[var(--unit-text-muted)] mb-1">Nombre *</label>
            <input className="w-full rounded-lg border-2 border-[var(--unit-accent)] px-3 py-2 text-[var(--unit-text-muted)] placeholder-[var(--unit-text-muted)]/60" {...register('name')} />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--unit-text-muted)] mb-1">Descripción</label>
            <textarea className="w-full rounded-lg border-2 border-[var(--unit-accent)] px-3 py-2 text-[var(--unit-text-muted)] placeholder-[var(--unit-text-muted)]/60 resize-none" rows={2} {...register('description')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--unit-text-muted)] mb-1">Precio fijo (S/) *</label>
            <input type="number" step="0.10" min="0" className="w-full rounded-lg border-2 border-[var(--unit-accent)] px-3 py-2 text-[var(--unit-text-muted)] placeholder-[var(--unit-text-muted)]/60" {...register('fixedPrice', { valueAsNumber: true })} />
            {errors.fixedPrice && <p className="mt-1 text-sm text-red-600">{errors.fixedPrice.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--unit-text-muted)] mb-1">Estado</label>
            <select className="w-full rounded-lg border-2 border-[var(--unit-accent)] px-3 py-2 text-[var(--unit-text-muted)]" {...register('status')}>
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--unit-text-muted)]">Servicios del paquete *</span>
              <button type="button" onClick={addService} className="text-sm text-[var(--unit-accent)] font-medium hover:underline">
                + Agregar servicio
              </button>
            </div>
            {selectedServices.map((row, index) => (
              <div key={index} className="flex gap-2 items-center mb-2">
                <select
                  value={row.serviceId}
                  onChange={(e) => updateServiceId(index, e.target.value)}
                  className="flex-1 rounded-lg border-2 border-[var(--unit-accent)] px-3 py-2 text-[var(--unit-text-muted)] text-sm"
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
                  className="w-24 rounded-lg border-2 border-[var(--unit-accent)] px-2 py-2 text-sm text-[var(--unit-text-muted)] placeholder-[var(--unit-text-muted)]/60"
                />
                <button type="button" onClick={() => removeService(index)} className="text-red-600 hover:underline text-sm">
                  Quitar
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-[var(--unit-accent)] text-white font-medium disabled:opacity-50">
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={() => router.push('/packages')} className="px-4 py-2 rounded-lg border-2 border-[var(--unit-accent)] text-[var(--unit-accent)] hover:bg-[var(--unit-accent)] hover:text-white transition-colors font-medium">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
