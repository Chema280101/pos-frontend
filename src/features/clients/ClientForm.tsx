'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Input, Select, Textarea, UnsavedChangesModal, Button } from '@/components/ui';
import type { Client } from '../../types/client';
import { useUnitStore } from '../../store/unitStore';
import { useToast } from '@/hooks/useToast';
import { 
  AlertCircle, 
  Scissors, 
  ShoppingBag, 
  Gift, 
  Package, 
  Save, 
  X, 
  Info,
  Edit,
  Plus,
  User,
  Phone,
  Compass,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(1, { message: "El nombre es requerido" }).max(200),
  phone: z.string().min(1, { message: "El teléfono es requerido" }).regex(/^[+]?[\d\s-]{9,}$/, { message: "Teléfono inválido (mínimo 9 dígitos)" }),
  gender: z.enum(['M', 'F', 'Otro']).optional().nullable(),
  howFoundUs: z.string().max(200).optional().nullable(),
  preferenceNotes: z.string().max(2000).optional().nullable(),
  freeNotes: z.string().max(2000).optional().nullable(),
  usualProducts: z.string().max(500).optional().nullable(),
});

type FormData = z.infer<typeof schema>;

export interface ClientFormProps {
  onClose?: () => void;
}

export function ClientForm({ onClose }: ClientFormProps): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const id = params?.id == null ? undefined : Array.isArray(params.id) ? params.id[0] : params.id;
  const isEdit = id && id !== 'new';
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const unit = (activeUnit === 'BARBERIA' ? 'BARBERIA' : 'SPA');

  const { data: servicesResponse } = useQuery({
    queryKey: ['services', unit],
    queryFn: async () => {
      const { data } = await api.get(`/api/services?unit=${unit}`);
      return data;
    },
  });
  const services = Array.isArray(servicesResponse?.data) ? servicesResponse.data : Array.isArray(servicesResponse) ? servicesResponse : [];

  const { data: productsResponse } = useQuery({
    queryKey: ['inventory-products', unit],
    queryFn: async () => {
      const { data } = await api.get(`/api/inventory/products?unit=${unit}`);
      return data;
    },
  });
  const products = Array.isArray(productsResponse?.data) ? productsResponse.data : Array.isArray(productsResponse) ? productsResponse : [];

  const { data: packagesResponse } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const { data } = await api.get('/api/packages');
      return data;
    },
  });
  const packages = Array.isArray(packagesResponse?.data) ? packagesResponse.data : Array.isArray(packagesResponse) ? packagesResponse : [];

  const { data: client } = useQuery({
    queryKey: ['client', id],
    queryFn: async (): Promise<Client> => {
      const { data } = await api.get<Client>(`/api/clients/${id}`);
      return data;
    },
    enabled: Boolean(isEdit),
  });

  const [phoneToCheck, setPhoneToCheck] = useState<string | null>(null);
  const { data: phoneCheck } = useQuery({
    queryKey: ['check-phone', phoneToCheck, id],
    queryFn: async (): Promise<{ duplicate: boolean }> => {
      const p = new URLSearchParams({ phone: phoneToCheck! });
      if (isEdit && id) p.set('excludeId', id);
      const { data } = await api.get<{ duplicate: boolean }>(`/api/clients/check-phone?${p}`);
      return data;
    },
    enabled: !!phoneToCheck && phoneToCheck.trim().length >= 9,
  });

  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', gender: null, howFoundUs: '', preferenceNotes: '', freeNotes: '', usualProducts: '' },
    mode: 'onTouched',
  });

  const watchedValues = watch();
  const defaultValues = { name: '', phone: '', gender: null, howFoundUs: '', preferenceNotes: '', freeNotes: '', usualProducts: '' };

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingClose, setPendingClose] = useState<(() => void) | null>(null);

  const hasChanges = 
    JSON.stringify(watchedValues) !== JSON.stringify(defaultValues) ||
    selectedItems.length > 0 ||
    Object.keys(checkedState).length > 0 ||
    (watchedValues.name && watchedValues.name.trim() !== '') ||
    (watchedValues.phone && watchedValues.phone.trim() !== '');

  const handleCheckboxChange = (value: string, checked: boolean) => {
    const name = value.split(':')[2];
    setCheckedState(prev => ({ ...prev, [value]: checked }));
    if (checked) {
      setSelectedItems(prev => [...prev, name]);
    } else {
      setSelectedItems(prev => prev.filter(item => item !== name));
    }
  };

  const handleDrawerClose = () => {
    if (hasChanges) {
      setPendingClose(() => {
        reset();
        if (onClose) onClose();
        else router.back();
      });
      setShowUnsavedModal(true);
    } else {
      reset();
      if (onClose) onClose();
      else router.back();
    }
  };

  const handleConfirmDiscard = () => {
    setShowUnsavedModal(false);
    if (pendingClose) {
      pendingClose();
      setPendingClose(null);
    }
  };

  const handleCancelDiscard = () => {
    setShowUnsavedModal(false);
    setPendingClose(null);
  };

  useEffect(() => {
    if (!isEdit) setIsInitialized(false);
  }, [isEdit]);

  useEffect(() => {
    setValue('usualProducts', selectedItems.join(', '));
  }, [selectedItems, setValue]);

  useEffect(() => {
    if (isEdit && client && !isInitialized) {
      reset({
        name: client.name,
        phone: client.phone,
        gender: (client.gender as 'M' | 'F' | 'Otro') || null,
        howFoundUs: client.howFoundUs ?? '',
        preferenceNotes: client.preferenceNotes ?? '',
        freeNotes: client.freeNotes ?? '',
        usualProducts: client.usualProducts ?? '',
      });
      
      if (client.usualProducts) {
        const rawItems = client.usualProducts.split(',').map(item => item.trim());
        const itemNames: string[] = [];
        rawItems.forEach(item => {
          if (item.includes(':')) {
            itemNames.push(item.split(':')[2]);
          } else {
            itemNames.push(item);
          }
        });
        setSelectedItems(itemNames);
        
        const newCheckedState: Record<string, boolean> = {};
        services.forEach((service: any) => {
          if (itemNames.includes(service.name)) newCheckedState[`service:${service.id}:${service.name}`] = true;
        });
        products.forEach((product: any) => {
          if (itemNames.includes(product.name)) newCheckedState[`product:${product.id}:${product.name}`] = true;
        });
        packages.forEach((pkg: any) => {
          if (itemNames.includes(pkg.name)) newCheckedState[`package:${pkg.id}:${pkg.name}`] = true;
        });
        setCheckedState(newCheckedState);
      }
      setIsInitialized(true);
    }
  }, [isEdit, client, reset, services, products, packages, isInitialized]);

  const createMutation = useMutation({
    mutationFn: async (body: FormData) => {
      const { data } = await api.post<Client>('/api/clients', body);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      success('Cliente registrado exitosamente');
      reset();
      router.replace(`/clients/${data.id}`);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      const errorMessage = err.response?.data?.error ?? 'Error al guardar cliente';
      setError('root', { message: errorMessage });
      error(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body: FormData) => {
      const { data } = await api.patch<Client>(`/api/clients/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      success('Cliente actualizado exitosamente');
      reset();
      router.replace(`/clients/${id}`);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      const errorMessage = err.response?.data?.error ?? 'Error al guardar cliente';
      setError('root', { message: errorMessage });
      error(errorMessage);
    },
  });

  const onSubmit = (data: FormData): void => {
    const payload = {
      ...data,
      gender: data.gender || null,
      howFoundUs: data.howFoundUs || null,
      preferenceNotes: data.preferenceNotes || null,
      freeNotes: data.freeNotes || null,
      usualProducts: selectedItems.length > 0 ? selectedItems.join(', ') : null,
    };
    
    if (isEdit) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

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
                {isEdit ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[var(--unit-text-muted)] mt-0.5">
                Directorio de Clientes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDrawerClose}
            className="self-start sm:self-auto px-5 py-2 rounded-full border border-[var(--unit-border)]/60 text-sm font-bold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] shadow-sm transition-all"
          >
            Cancelar
          </button>
        </div>

        {/* Error Alert */}
        {errors.root && (
          <div className="rounded-unit border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-medium">{errors.root.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section: Contact Details */}
          <div className="rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)]/40 backdrop-blur-md p-6 space-y-4">
            <div className="flex items-center gap-2 text-[var(--unit-accent)] border-b border-[var(--unit-border)]/30 pb-3">
              <User className="h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
                Datos de Contacto
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Nombre Completo"
                  placeholder="Ej: María González Rodríguez"
                  error={errors.name?.message}
                  required
                  {...register('name')}
                />
              </div>

              <div>
                <Input
                  label="Teléfono / WhatsApp"
                  placeholder="Ej: +58 412 123 4567"
                  error={errors.phone?.message}
                  required
                  leftIcon={<Phone className="h-4 w-4" />}
                  {...register('phone', {
                    onBlur: (e) => setPhoneToCheck((e.target.value || '').trim() || null),
                  })}
                />
                {phoneCheck?.duplicate && (
                  <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 bg-amber-500/10 p-2.5 rounded-unit border border-amber-500/30">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Ya existe un cliente con este teléfono registrado.</span>
                  </div>
                )}
              </div>

              <div>
                <Select
                  label="Género"
                  options={[
                    { value: '', label: '— Seleccionar género —' },
                    { value: 'F', label: 'Femenino' },
                    { value: 'M', label: 'Masculino' },
                    { value: 'Otro', label: 'Otro / Prefiero no decir' }
                  ]}
                  value={watch('gender') || ''}
                  onChange={(e: any) => setValue('gender', e.target.value === '' ? null : e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="¿Cómo nos conoció?"
                  placeholder="Ej: Instagram, recomendación, Google Maps, volante, etc."
                  leftIcon={<Compass className="h-4 w-4" />}
                  {...register('howFoundUs')}
                />
              </div>
            </div>
          </div>

          {/* Section: Notes & Preferences */}
          <div className="rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)]/40 backdrop-blur-md p-6 space-y-4">
            <div className="flex items-center gap-2 text-[var(--unit-accent)] border-b border-[var(--unit-border)]/30 pb-3">
              <FileText className="h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
                Preferencias y Notas del Cliente
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Textarea
                label="Notas de Preferencia"
                placeholder="Ej: Prefiere corte degrafilado, sensible a tintes, prefiere té, etc."
                rows={3}
                {...register('preferenceNotes')}
              />

              <Textarea
                label="Notas Libres / Observaciones"
                placeholder="Ej: Frecuente los viernes por la tarde, cumpleañero en marzo, etc."
                rows={3}
                {...register('freeNotes')}
              />
            </div>
          </div>

          {/* Section: Habitual Items */}
          <div className="rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)]/40 backdrop-blur-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--unit-border)]/30 pb-3">
              <div className="flex items-center gap-2 text-[var(--unit-accent)]">
                <Scissors className="h-4 w-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
                  Servicios y Productos Habituales
                </h2>
              </div>
              <span className="text-xs text-[var(--unit-text-muted)]">
                {selectedItems.length} seleccionados
              </span>
            </div>

            <div className="space-y-4 max-h-72 overflow-y-auto custom-scrollbar p-1">
              {services.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[var(--unit-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <Scissors className="h-3.5 w-3.5" />
                    Servicios frecuentes
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {services.map((service: any) => (
                      <label 
                        key={service.id} 
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-unit border transition-all cursor-pointer text-sm font-medium',
                          checkedState[`service:${service.id}:${service.name}`]
                            ? 'border-[var(--unit-accent)] bg-[var(--unit-accent)]/10 text-[var(--unit-text)] shadow-unit-sm'
                            : 'border-[var(--unit-border)]/40 bg-[var(--unit-surface)] hover:border-[var(--unit-accent)]/40 text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
                        )}
                      >
                        <input
                          type="checkbox"
                          value={`service:${service.id}:${service.name}`}
                          checked={checkedState[`service:${service.id}:${service.name}`] || false}
                          className="w-4 h-4 rounded text-[var(--unit-accent)]"
                          style={{ accentColor: 'var(--unit-accent)' }}
                          onChange={(e) => handleCheckboxChange(e.target.value, e.target.checked)}
                        />
                        <span className="truncate">{service.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {products.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold text-[var(--unit-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Productos de compra habitual
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {products
                      .filter((product: any) => product.type === 'FOR_SALE' || product.type === 'BOTH')
                      .map((product: any) => (
                        <label 
                          key={product.id} 
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-unit border transition-all cursor-pointer text-sm font-medium',
                            checkedState[`product:${product.id}:${product.name}`]
                              ? 'border-[var(--unit-accent)] bg-[var(--unit-accent)]/10 text-[var(--unit-text)] shadow-unit-sm'
                              : 'border-[var(--unit-border)]/40 bg-[var(--unit-surface)] hover:border-[var(--unit-accent)]/40 text-[var(--unit-text-muted)] hover:text-[var(--unit-text)]'
                          )}
                        >
                          <input
                            type="checkbox"
                            value={`product:${product.id}:${product.name}`}
                            checked={checkedState[`product:${product.id}:${product.name}`] || false}
                            className="w-4 h-4 rounded text-[var(--unit-accent)]"
                            style={{ accentColor: 'var(--unit-accent)' }}
                            onChange={(e) => handleCheckboxChange(e.target.value, e.target.checked)}
                          />
                          <span className="truncate">{product.name}</span>
                        </label>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex gap-4 pt-4 mt-6 border-t border-[var(--unit-border)]/40">
            <button 
              type="button" 
              onClick={handleDrawerClose} 
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
              {isEdit ? 'Actualizar Cliente' : 'Guardar Cliente'}
            </Button>
          </div>
        </form>

        <UnsavedChangesModal
          open={showUnsavedModal}
          onClose={handleCancelDiscard}
          onConfirm={handleConfirmDiscard}
          onCancel={handleCancelDiscard}
        />
      </div>
    </div>
  );
}
