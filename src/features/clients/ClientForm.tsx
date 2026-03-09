import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Client } from '../../types/client';
import { useUnitStore } from '../../store/unitStore';
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
  Plus
} from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(200),
  phone: z.string().min(1, 'Teléfono requerido').regex(/^[+]?[\d\s-]{9,}$/, 'Teléfono inválido'),
  gender: z.enum(['M', 'F', 'Otro']).optional().nullable(),
  howFoundUs: z.string().max(200).optional().nullable(),
  preferenceNotes: z.string().max(2000).optional().nullable(),
  freeNotes: z.string().max(2000).optional().nullable(),
  usualProducts: z.string().max(500).optional().nullable(),
});

type FormData = z.infer<typeof schema>;

export function ClientForm(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const id = params.id == null ? undefined : Array.isArray(params.id) ? params.id[0] : params.id;
  const isEdit = id && id !== 'new';
  const queryClient = useQueryClient();
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const unit = (activeUnit === 'BARBERIA' ? 'BARBERIA' : 'SPA');

  // Query for services
  const { data: servicesResponse } = useQuery({
    queryKey: ['services', unit],
    queryFn: async () => {
      const { data } = await api.get(`/api/services?unit=${unit}`);
      return data;
    },
  });

  // Extract services array from paginated response
  const services = Array.isArray(servicesResponse?.data) ? servicesResponse.data : Array.isArray(servicesResponse) ? servicesResponse : [];

  // Query for products
  const { data: productsResponse } = useQuery({
    queryKey: ['inventory-products', unit],
    queryFn: async () => {
      const { data } = await api.get(`/api/inventory/products?unit=${unit}`);
      return data;
    },
  });

  // Extract products array from paginated response
  const products = Array.isArray(productsResponse?.data) ? productsResponse.data : Array.isArray(productsResponse) ? productsResponse : [];

  // Query for packages
  const { data: packagesResponse } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const { data } = await api.get('/api/packages');
      return data;
    },
  });

  // Extract packages array from paginated response
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
      const params = new URLSearchParams({ phone: phoneToCheck! });
      if (isEdit && id) params.set('excludeId', id);
      const { data } = await api.get<{ duplicate: boolean }>(`/api/clients/check-phone?${params}`);
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
  });

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  const handleCheckboxChange = (value: string, checked: boolean) => {
    // Extract the name from the value (format: type:id:name)
    const name = value.split(':')[2];
    
    setCheckedState(prev => ({
      ...prev,
      [value]: checked
    }));
    
    if (checked) {
      setSelectedItems(prev => [...prev, name]);
    } else {
      setSelectedItems(prev => prev.filter(item => item !== name));
    }
  };

  useEffect(() => {
    // Reset initialization flag when switching between edit/new
    if (!isEdit) {
      setIsInitialized(false);
    }
  }, [isEdit]);

  useEffect(() => {
    // Update form value when selectedItems changes
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
      
      // Parse existing usualProducts and set checkbox values
      if (client.usualProducts) {
        const rawItems = client.usualProducts.split(',').map(item => item.trim());
        const itemNames: string[] = [];
        
        // Handle both old format (type:id:name) and new format (name)
        rawItems.forEach(item => {
          if (item.includes(':')) {
            // Old format: type:id:name
            const name = item.split(':')[2];
            itemNames.push(name);
          } else {
            // New format: just name
            itemNames.push(item);
          }
        });
        
        setSelectedItems(itemNames);
        
        // Find corresponding full values for checkboxes
        const newCheckedState: Record<string, boolean> = {};
        
        // Check services
        services.forEach((service: any) => {
          if (itemNames.includes(service.name)) {
            newCheckedState[`service:${service.id}:${service.name}`] = true;
          }
        });
        
        // Check products
        products.forEach((product: any) => {
          if (itemNames.includes(product.name)) {
            newCheckedState[`product:${product.id}:${product.name}`] = true;
          }
        });
        
        // Check packages
        packages.forEach((pkg: any) => {
          if (itemNames.includes(pkg.name)) {
            newCheckedState[`package:${pkg.id}:${pkg.name}`] = true;
          }
        });
        
        setCheckedState(newCheckedState);
      }
      
      setIsInitialized(true);
    }
  }, [isEdit, client, reset, services, products, packages, isInitialized]);

  const createMutation = useMutation({
    mutationFn: async (body: FormData) => {
      console.log('createMutation called with:', body);
      const { data } = await api.post<Client>('/api/clients', body);
      console.log('createMutation response:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('createMutation success:', data);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      router.replace(`/clients/${data.id}`);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      console.log('createMutation error:', err);
      setError('root', { message: err.response?.data?.error ?? 'Error al guardar' });
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
      router.replace(`/clients/${id}`);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError('root', { message: err.response?.data?.error ?? 'Error al guardar' });
    },
  });

  const onSubmit = (data: FormData): void => {
    console.log('Form submitted with data:', data);
    console.log('Form errors:', errors);
    console.log('Selected items from state:', selectedItems);
    
    const payload = {
      ...data,
      gender: data.gender || null,
      howFoundUs: data.howFoundUs || null,
      preferenceNotes: data.preferenceNotes || null,
      freeNotes: data.freeNotes || null,
      usualProducts: selectedItems.length > 0 ? selectedItems.join(', ') : null,
    };
    
    console.log('Final payload:', payload);
    console.log('Is edit:', isEdit);
    
    if (isEdit) {
      console.log('Calling updateMutation');
      updateMutation.mutate(payload);
    } else {
      console.log('Calling createMutation');
      createMutation.mutate(payload);
    }
  };

  if (isEdit && !client && !createMutation.isPending) {
    return <p className="p-6 text-[var(--unit-text)]">Cargando...</p>;
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
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
            <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
            <span className="text-sm font-medium text-[var(--unit-text)]">
              {isEdit ? 'Modo edición' : 'Nuevo registro'}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">
            {isEdit ? 'Editar cliente' : 'Nuevo cliente'}
          </h1>
          <p className="text-[var(--unit-text-muted)]">
            {isEdit ? 'Modifica la información del cliente' : 'Registra un nuevo cliente en el sistema'}
          </p>
        </div>

        {/* Enhanced Form Container */}
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
                  <h2 className="text-lg font-bold text-[var(--unit-text)]">Información del cliente</h2>
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
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Nombre *</label>
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

              {/* Enhanced Phone Field */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Teléfono *</label>
                <input
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  placeholder="Ej: +51 987 654 321"
                  {...register('phone', {
                    onBlur: (e) => setPhoneToCheck((e.target.value || '').trim() || null),
                  })}
                />
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.phone.message}
                  </p>
                )}
                {phoneCheck?.duplicate && (
                  <p className="mt-2 text-sm text-amber-600 font-medium flex items-center gap-1 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                    <AlertCircle className="h-4 w-4" />
                    Ya existe un cliente con este teléfono. Puedes continuar pero revisa duplicados.
                  </p>
                )}
              </div>

              {/* Enhanced Gender Field */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Género</label>
                <select className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" {...register('gender')}>
                  <option value="">— Seleccionar —</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Enhanced How Found Us Field */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Cómo nos conoció</label>
                <input 
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" 
                  placeholder="Ej: Recomendación, redes sociales, etc."
                  {...register('howFoundUs')} 
                />
              </div>

              {/* Enhanced Preference Notes */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Notas de preferencias</label>
                <textarea 
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all resize-none" 
                  rows={3} 
                  placeholder="Preferencias específicas del cliente..."
                  {...register('preferenceNotes')} 
                />
              </div>

              {/* Enhanced Free Notes */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Notas libres</label>
                <textarea 
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all resize-none" 
                  rows={3} 
                  placeholder="Información adicional relevante..."
                  {...register('freeNotes')} 
                />
              </div>

              {/* Enhanced Products Section */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Productos y servicios habituales</label>
                <div className="space-y-4 max-h-80 overflow-y-auto border-2 border-[var(--unit-border)]/50 rounded-xl p-4 bg-[var(--unit-surface)]">
                  {/* Services */}
                  {services.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-[var(--unit-text)] mb-3 uppercase tracking-wider flex items-center gap-2">
                        <Scissors className="h-4 w-4" />
                        Servicios
                      </p>
                      <div className="space-y-2">
                        {services.map((service: any) => (
                          <label key={service.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--unit-border)]/30 hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-surface-elevated)] transition-all cursor-pointer group">
                            <input
                              type="checkbox"
                              value={`service:${service.id}:${service.name}`}
                              checked={checkedState[`service:${service.id}:${service.name}`] || false}
                              className="rounded-lg border-2 border-[var(--unit-border)]/50 text-[var(--unit-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 w-5 h-5"
                              style={{
                                accentColor: 'var(--unit-accent)'
                              }}
                              onChange={(e) => handleCheckboxChange(e.target.value, e.target.checked)}
                            />
                            <span className="text-sm text-[var(--unit-text)] group-hover:text-[var(--unit-accent)] font-medium">{service.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Products */}
                  {products.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-[var(--unit-text)] mb-3 uppercase tracking-wider flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        Productos
                      </p>
                      <div className="space-y-2">
                        {products
                          .filter((product: any) => product.type === 'FOR_SALE' || product.type === 'BOTH')
                          .map((product: any) => (
                          <label key={product.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--unit-border)]/30 hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-surface-elevated)] transition-all cursor-pointer group">
                            <input
                              type="checkbox"
                              value={`product:${product.id}:${product.name}`}
                              checked={checkedState[`product:${product.id}:${product.name}`] || false}
                              className="rounded-lg border-2 border-[var(--unit-border)]/50 text-[var(--unit-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 w-5 h-5"
                              style={{
                                accentColor: 'var(--unit-accent)'
                              }}
                              onChange={(e) => handleCheckboxChange(e.target.value, e.target.checked)}
                            />
                            <span className="text-sm text-[var(--unit-text)] group-hover:text-[var(--unit-accent)] font-medium">{product.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Packages */}
                  {packages.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-[var(--unit-text)] mb-3 uppercase tracking-wider flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        Paquetes
                      </p>
                      <div className="space-y-2">
                        {packages.map((pkg: any) => (
                          <label key={pkg.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--unit-border)]/30 hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-surface-elevated)] transition-all cursor-pointer group">
                            <input
                              type="checkbox"
                              value={`package:${pkg.id}:${pkg.name}`}
                              checked={checkedState[`package:${pkg.id}:${pkg.name}`] || false}
                              className="rounded-lg border-2 border-[var(--unit-border)]/50 text-[var(--unit-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 w-5 h-5"
                              style={{
                                accentColor: 'var(--unit-accent)'
                              }}
                              onChange={(e) => handleCheckboxChange(e.target.value, e.target.checked)}
                            />
                            <span className="text-sm text-[var(--unit-text)] group-hover:text-[var(--unit-accent)] font-medium">{pkg.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* If no items available */}
                  {services.length === 0 && products.length === 0 && packages.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-[var(--unit-text-muted)] mx-auto mb-3" />
                      <p className="text-sm text-[var(--unit-text-muted)] font-medium">
                        No hay servicios, productos o paquetes disponibles
                      </p>
                    </div>
                  )}
                </div>
                {errors.usualProducts && (
                  <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.usualProducts.message}
                  </p>
                )}
                <p className="text-xs text-[var(--unit-text-muted)] mt-2 flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  Selecciona los productos y servicios que este cliente suele solicitar
                </p>
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
                      Guardar cliente
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
