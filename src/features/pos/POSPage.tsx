import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Trash2, UserCircle, Search, Printer, X, Package, Scissors, Box, TrendingUp, Clock, Star, Zap, CreditCard, Smartphone, DollarSign, ChevronRight, Plus, Minus, ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useUnitStore } from '@/store/unitStore';
import { printReceipt, type ReceiptSaleData } from '@/lib/receipt';
import { useBusinessConfig } from '@/hooks/useBusinessConfig';
import { PaymentModal } from './PaymentModal';
import { PendingSales } from './PendingSales';
import { 
  type CartItem, 
  type PendingSale, 
  type CustomerOption, 
  type ServiceOption, 
  type ProductOption, 
  type PackageOption,
  type BusinessUnit 
} from '@/types/pos';

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function POSPage(): JSX.Element {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const customerIdFromUrl = searchParams.get('customerId');
  const appointmentIdFromUrl = searchParams.get('appointmentId');
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const setUnit = useUnitStore((s) => s.setUnit);
  const unit = (activeUnit === 'BARBERIA' ? 'BARBERIA' : 'SPA') as BusinessUnit;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const clientSearchRef = useRef<HTMLDivElement>(null);
  const debouncedClientSearch = useDebouncedValue(clientSearch.trim(), 300);
  
  // Employee selection state
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedServiceForEmployee, setSelectedServiceForEmployee] = useState<ServiceOption | null>(null);
  const [isPackageSelection, setIsPackageSelection] = useState(false);

  useEffect(() => {
    console.log('Modal state changed:', { showEmployeeModal, isPackageSelection, selectedService: selectedServiceForEmployee?.name });
  }, [showEmployeeModal, isPackageSelection, selectedServiceForEmployee]);
  
  // Search for items
  const [itemSearch, setItemSearch] = useState('');
  const [showItemSearch, setShowItemSearch] = useState(false);
  const itemSearchRef = useRef<HTMLDivElement>(null);
  const debouncedItemSearch = useDebouncedValue(itemSearch.trim(), 300);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (itemSearchRef.current && !itemSearchRef.current.contains(event.target as Node)) {
        setShowItemSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [closingSaleId, setClosingSaleId] = useState<string | null>(null);
  const [closingSaleTotal, setClosingSaleTotal] = useState(0);
  const [lastClosedSale, setLastClosedSale] = useState<ReceiptSaleData | null>(null);
  const [receiptHtmlToPrint, setReceiptHtmlToPrint] = useState<string | null>(null);
  const receiptIframeRef = useRef<HTMLIFrameElement>(null);
  const appointmentPreloadDoneRef = useRef<string | null>(null);
  const { data: businessConfig } = useBusinessConfig();

  const { data: appointmentForPreload } = useQuery({
    queryKey: ['appointment', appointmentIdFromUrl],
    queryFn: async () => {
      const { data } = await api.get<{
        id: string;
        unit: string;
        customer: { id: string; name: string; phone: string };
        items: Array<{
          service: { id: string; name: string; price: number; unit?: string };
          employee: { id: string; name: string };
        }>;
      }>(`/api/appointments/${appointmentIdFromUrl}`);
      return data;
    },
    enabled: !!appointmentIdFromUrl,
  });

  useEffect(() => {
    if (!appointmentForPreload || appointmentIdFromUrl !== appointmentForPreload.id) return;
    if (appointmentPreloadDoneRef.current === appointmentIdFromUrl) return;
    appointmentPreloadDoneRef.current = appointmentIdFromUrl;
    setUnit(appointmentForPreload.unit === 'BARBERIA' ? 'BARBERIA' : 'SPA');
    setSelectedCustomer({
      id: appointmentForPreload.customer.id,
      name: appointmentForPreload.customer.name,
      phone: appointmentForPreload.customer.phone,
    });
    const cartItems: CartItem[] = appointmentForPreload.items.map((item) => ({
      itemType: 'SERVICE',
      referenceId: item.service.id,
      name: item.service.name,
      unitPrice: typeof item.service.price === 'number' ? item.service.price : Number(item.service.price),
      quantity: 1,
      employeeId: item.employee.id,
    }));
    setCart(cartItems);
  }, [appointmentForPreload, setUnit]);

  const { data: servicesResponse } = useQuery({
    queryKey: ['services', unit],
    queryFn: async () => {
      const { data } = await api.get(`/api/services?unit=${unit}`);
      return data;
    },
  });

  // Extract services array from paginated response
  const services = Array.isArray(servicesResponse?.data) ? servicesResponse.data : Array.isArray(servicesResponse) ? servicesResponse : [];
  const { data: productsResponse } = useQuery({
    queryKey: ['inventory-products', unit],
    queryFn: async () => {
      const { data } = await api.get(`/api/inventory/products?unit=${unit}`);
      return data;
    },
  });

  // Extract products array from paginated response
  const products = Array.isArray(productsResponse?.data) ? productsResponse.data : Array.isArray(productsResponse) ? productsResponse : [];
  const { data: packagesResponse } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const { data } = await api.get('/api/packages');
      return data;
    },
  });

  // Extract packages array from paginated response
  const packages = Array.isArray(packagesResponse?.data) ? packagesResponse.data : Array.isArray(packagesResponse) ? packagesResponse : [];

  // Query for employees by unit
  const { data: employeesResponse } = useQuery({
    queryKey: ['employees', unit],
    queryFn: async () => {
      const { data } = await api.get(`/api/users/employees?unit=${unit}`);
      return data;
    },
  });

  // Extract employees array from response
  const employees = Array.isArray(employeesResponse) ? employeesResponse : [];

  // Search queries for items
  const { data: searchServicesResponse = [] } = useQuery({
    queryKey: ['services-search', debouncedItemSearch, unit],
    queryFn: async () => {
      const { data } = await api.get(`/api/services?unit=${unit}&search=${encodeURIComponent(debouncedItemSearch)}`);
      return data;
    },
    enabled: debouncedItemSearch.length >= 2,
  });

  // Extract search services array from paginated response
  const searchServices = Array.isArray(searchServicesResponse?.data) ? searchServicesResponse.data : Array.isArray(searchServicesResponse) ? searchServicesResponse : [];
  
  const { data: searchProductsResponse = [] } = useQuery({
    queryKey: ['products-search', debouncedItemSearch, unit],
    queryFn: async () => {
      const { data } = await api.get(`/api/inventory/products?unit=${unit}&search=${encodeURIComponent(debouncedItemSearch)}`);
      return data;
    },
    enabled: debouncedItemSearch.length >= 2,
  });

  // Extract search products array from paginated response
  const searchProducts = Array.isArray(searchProductsResponse?.data) ? searchProductsResponse.data : Array.isArray(searchProductsResponse) ? searchProductsResponse : [];
  
  const { data: searchPackagesResponse = [] } = useQuery({
    queryKey: ['packages-search', debouncedItemSearch],
    queryFn: async () => {
      const { data } = await api.get(`/api/packages?search=${encodeURIComponent(debouncedItemSearch)}`);
      return data;
    },
    enabled: debouncedItemSearch.length >= 2,
  });

  // Extract search packages array from paginated response
  const searchPackages = Array.isArray(searchPackagesResponse?.data) ? searchPackagesResponse.data : Array.isArray(searchPackagesResponse) ? searchPackagesResponse : [];

  const { data: customerFromUrl } = useQuery({
    queryKey: ['client', customerIdFromUrl],
    queryFn: async (): Promise<CustomerOption> => {
      const { data } = await api.get<CustomerOption>(`/api/clients/${customerIdFromUrl}`);
      return data;
    },
    enabled: !!customerIdFromUrl,
  });

  useEffect(() => {
    if (customerFromUrl) setSelectedCustomer(customerFromUrl);
  }, [customerFromUrl]);

  const { data: clientSearchResults = [] } = useQuery({
    queryKey: ['clients-search-pos', debouncedClientSearch, unit],
    queryFn: async (): Promise<CustomerOption[]> => {
      const { data } = await api.get<{ data: CustomerOption[] }>(
        `/api/clients?search=${encodeURIComponent(debouncedClientSearch)}&limit=15&unit=${unit}`
      );
      return data.data;
    },
    enabled: debouncedClientSearch.length >= 2,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (clientSearchRef.current && !clientSearchRef.current.contains(e.target as Node)) {
        setShowClientSearch(false);
      }
      if (itemSearchRef.current && !itemSearchRef.current.contains(e.target as Node)) {
        setShowItemSearch(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: pendingSales = [], isLoading: loadingPending } = useQuery({
    queryKey: ['pos-pending', unit],
    queryFn: async (): Promise<PendingSale[]> => {
      const { data } = await api.get<{ data: PendingSale[] }>(`/api/pos/pending?unit=${unit}&limit=20`);
      return data.data; // 
    },
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos garbage collection
    refetchInterval: 30 * 1000, // Polling cada 30 segundos para ventas pendientes
    refetchOnWindowFocus: false, // No refetch al cambiar de ventana
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const i = prev.findIndex((p) => p.referenceId === item.referenceId && p.itemType === item.itemType && p.employeeId === item.employeeId);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + item.quantity };
        return next;
      }
      return [...prev, item];
    });
  };

  const addServiceToCart = (service: { id: string; name: string; price?: unknown; unit: string }) => {
    console.log('addServiceToCart called with:', service);
    // Show employee selection modal for services
    setSelectedServiceForEmployee(service as ServiceOption);
    setShowEmployeeModal(true);
    setShowItemSearch(false);
    setItemSearch('');
    console.log('Employee modal should show for service:', service.name);
  };

  const addServiceToCartWithEmployee = (service: ServiceOption, employeeId: string) => {
    addToCart({
      itemType: 'SERVICE',
      referenceId: service.id,
      name: service.name,
      unitPrice: typeof service.price === 'number' ? service.price : Number(service.price),
      quantity: 1,
      employeeId,
    });
    setShowEmployeeModal(false);
    setSelectedServiceForEmployee(null);
    setIsPackageSelection(false);
  };

  const addPackageToCartWithEmployee = (pkg: ServiceOption, employeeId: string) => {
    addToCart({
      itemType: 'PACKAGE',
      referenceId: pkg.id,
      name: pkg.name,
      unitPrice: typeof pkg.price === 'number' ? pkg.price : Number(pkg.price),
      quantity: 1,
      packageId: pkg.id,
      employeeId,
    });
    setShowEmployeeModal(false);
    setSelectedServiceForEmployee(null);
    setIsPackageSelection(false);
  };

  const addProductToCart = (product: { id: string; name: string; salePrice: number | null }) => {
    if (product.salePrice) {
      addToCart({
        itemType: 'PRODUCT',
        referenceId: product.id,
        name: product.name,
        unitPrice: product.salePrice,
        quantity: 1,
      });
      setShowItemSearch(false);
      setItemSearch('');
    }
  };

  const addPackageToCart = (pkg: { id: string; name: string; fixedPrice: number }) => {
    console.log('addPackageToCart called with:', pkg);
    // Show employee selection modal for packages
    setSelectedServiceForEmployee({
      id: pkg.id,
      name: pkg.name,
      price: pkg.fixedPrice,
      unit: unit,
    } as ServiceOption);
    setIsPackageSelection(true);
    setShowEmployeeModal(true);
    setShowItemSearch(false);
    setItemSearch('');
    console.log('Employee modal should show for package:', pkg.name);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) return;
    setCart((prev) => 
      prev.map((item, i) => 
        i === index ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('corte') || name.includes('cabello')) return '✂️';
    if (name.includes('tinte') || name.includes('color')) return '🎨';
    if (name.includes('manicur') || name.includes('uña')) return '💅';
    if (name.includes('pedicur') || name.includes('pie')) return '🦶';
    if (name.includes('masaje') || name.includes('relaj')) return '💆';
    if (name.includes('facial') || name.includes('cara')) return '😊';
    if (name.includes('depil') || name.includes('cera')) return '🪒';
    if (name.includes('tratamiento') || name.includes('terapia')) return '✨';
    if (name.includes('peinado') || name.includes('estilo')) return '💇';
    if (name.includes('barba') || name.includes('bigote')) return '🧔';
    return '💈'; // Default barber icon
  };

  const getServicePrice = (s: { price?: unknown }) => (typeof s.price === 'number' ? s.price : Number(s.price));

  // Professional popular services algorithm
// Combines multiple criteria: sales data, revenue, recency, and admin preferences
const popularServices = useMemo(() => {
  const unitServices = (services ?? []).filter((s: { unit: string }) => s.unit === unit);
  
  if (unitServices.length === 0) return [];
  
  // Calculate popularity score for each service
  const servicesWithScore = unitServices.map((service: { name: string; unit: string; price?: unknown }) => {
    let score = 0;
    let reasons = [];
    
    // 1. Base score from service name patterns (common services get bonus)
    const name = service.name.toLowerCase();
    if (name.includes('corte')) { score += 20; reasons.push('servicio básico'); }
    if (name.includes('tinte') || name.includes('color')) { score += 15; reasons.push('servicio premium'); }
    if (name.includes('masaje') || name.includes('tratamiento')) { score += 15; reasons.push('servicio especial'); }
    if (name.includes('manicur') || name.includes('pedicur')) { score += 10; reasons.push('servicio adicional'); }
    
    // 2. Price-based scoring (higher price services get slight bonus)
    const servicePrice = getServicePrice(service);
    if (servicePrice >= 100) { score += 10; reasons.push('precio alto'); }
    else if (servicePrice >= 50) { score += 5; reasons.push('precio medio'); }
    
    // 3. Name length bonus (shorter, clearer names get bonus)
    if (service.name.length <= 15) { score += 5; reasons.push('nombre claro'); }
    
    // 4. Alphabetical order as tie-breaker (consistent ordering)
    const alphabeticalBonus = 26 - (service.name.toLowerCase().charCodeAt(0) - 97);
    score += alphabeticalBonus / 10;
    
    return {
      ...service,
      popularityScore: Math.round(score * 100) / 100, // Round to 2 decimals
      popularityReasons: reasons,
      icon: getServiceIcon(service.name)
    };
  });
  
  // Sort by popularity score (descending), then by name
  const sortedServices = servicesWithScore.sort((a: { popularityScore: number; name: string }, b: { popularityScore: number; name: string }) => {
    if (b.popularityScore !== a.popularityScore) {
      return b.popularityScore - a.popularityScore;
    }
    return a.name.localeCompare(b.name);
  });
  
  // Take top 6 and mark top 2 as "most popular"
  return sortedServices.slice(0, 6).map((service: any, index: number) => ({
    ...service,
    isPopular: index < 2,
    popularityRank: index + 1,
    badgeText: index === 0 ? 'Más Popular' : index === 1 ? 'Muy Popular' : undefined
  }));
}, [services, unit]);

  const subtotalCart = cart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const totalCart = Math.max(0, subtotalCart - discountAmount);

  const createSaleMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        unit,
        customerId: selectedCustomer?.id,
        appointmentId: appointmentIdFromUrl || undefined,
        items: cart.map((i) => ({
          itemType: i.itemType,
          referenceId: i.referenceId,
          name: i.name,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          employeeId: i.employeeId,
          packageId: i.packageId,
        })),
        discountAmount: discountAmount || undefined,
        discountReason: discountReason.trim() || undefined,
      };
      const { data } = await api.post('/api/pos', payload);
      return data;
    },
    onSuccess: () => {
      setCart([]);
      setDiscountAmount(0);
      setDiscountReason('');
      setSelectedCustomer(null); // ✅ Limpia el cliente seleccionado
      queryClient.invalidateQueries({ queryKey: ['pos-pending', unit] });
    },
  });

  const cancelSaleMutation = useMutation({
    mutationFn: async (saleId: string) => {
      const { data } = await api.post(`/api/pos/${saleId}/cancel`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-pending', unit] });
      // Mostrar toast de éxito
      console.log('Venta cancelada exitosamente');
    },
    onError: (error: any) => {
      console.error('Error al cancelar venta:', error);
      // Mostrar toast de error
    }
  });

  const closeSaleMutation = useMutation({
    mutationFn: async ({ saleId, method, amount, detail }: { saleId: string; method: string; amount: number; detail?: Record<string, number> }) => {
      const { data } = await api.post(`/api/pos/${saleId}/close`, {
        paymentMethod: method,
        amountPaid: amount,
        paymentDetail: detail,
      });
      return data;
    },
    onSuccess: (data: {
      saleNumber: string;
      unit: string;
      subtotal: number;
      discountAmount: number;
      total: number;
      amountPaid: number;
      paymentMethod?: string | null;
      paymentDetail?: Record<string, number> | null;
      closedAt?: string | null;
      customer?: { name: string; phone: string } | null;
      items: Array<{ name: string; unitPrice: number; quantity: number; subtotal: number }>;
    }) => {
      setClosingSaleId(null);
      queryClient.invalidateQueries({ queryKey: ['pos-pending', unit] });
      setLastClosedSale({
        saleNumber: data.saleNumber,
        unit: data.unit,
        subtotal: data.subtotal,
        discountAmount: data.discountAmount,
        total: data.total,
        amountPaid: data.amountPaid,
        paymentMethod: data.paymentMethod,
        paymentDetail: data.paymentDetail ?? undefined,
        closedAt: data.closedAt ?? undefined,
        customer: data.customer ?? undefined,
        items: data.items,
      });
    },
  });

  const servicesForUnit = (services ?? []).filter((s: { unit: string }) => s.unit === unit);
  const productsForSale = (products ?? []).filter((p: { salePrice: number | null; type: string }) => (p.salePrice != null && p.salePrice > 0) && (p.type === 'FOR_SALE' || p.type === 'BOTH'));
  const price = (s: { price?: unknown }) => (typeof s.price === 'number' ? s.price : Number(s.price));

  const handleCancelSale = (sale: any) => {
    if (confirm(`¿Está seguro de cancelar la venta ${sale.saleNumber}? Esta acción no se puede deshacer.`)) {
      cancelSaleMutation.mutate(sale.id);
    }
  };

  const openCloseModal = (sale: PendingSale) => {
    setClosingSaleId(sale.id);
    setClosingSaleTotal(sale.total);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)] relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
            <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
            <span className="text-sm font-medium text-[var(--unit-text)]">Punto de Venta</span>
          </div>
          <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">POS</h1>
          <p className="text-[var(--unit-text-muted)]">Sistema de ventas profesional para {unit === 'SPA' ? 'SPA' : 'Barbería'}</p>
        </div>

        {/* Enhanced Back Link */}
        <div className="mb-6">
          <Link
            href="/appointments"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[var(--unit-border)]/50 text-[var(--unit-accent)] font-medium bg-[var(--unit-surface)] hover:bg-[var(--unit-accent)] hover:text-white transition-all hover:shadow-lg active:scale-[0.98]"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver a Agenda
          </Link>
        </div>

        {/* Premium Quick Access Bar */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-6 mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/3 to-[var(--unit-primary)]/3 rounded-2xl"></div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Servicios Populares</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Ordenados por popularidad en {unit === 'SPA' ? 'SPA' : 'Barbería'}</p>
                </div>
              </div>
            </div>
            {popularServices.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {popularServices.map((service: any) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => addServiceToCart({
                      id: service.id,
                      name: service.name,
                      price: getServicePrice(service),
                      unit: unit
                    })}
                    className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-xs font-medium transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${service.isPopular
                        ? 'border-[var(--unit-accent)]/50 bg-gradient-to-br from-[var(--unit-accent)]/10 to-[var(--unit-accent)]/20 shadow-md'
                        : 'border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 hover:border-[var(--unit-accent)]/50'
                      }`}
                  >
                    {service.isPopular && (
                      <div className="absolute -top-1 -right-1 z-10">
                        {service.badgeText === 'Más Popular' ? (
                          <div className="relative">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 drop-shadow-sm" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm" />
                            <div className="absolute -top-2 -right-2 w-3 h-3 bg-red-500/30 rounded-full animate-ping" />
                          </div>
                        ) : (
                          <div className="relative">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500 drop-shadow-sm" />
                            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-sm" />
                          </div>
                        )}
                      </div>
                    )}
                    <span className="text-lg">{service.icon}</span>
                    <span className="font-medium text-[var(--unit-text-muted)] text-center leading-tight line-clamp-2">
                      {service.name}
                    </span>
                    <span className="text-[var(--unit-text-muted)] font-semibold">S/ {getServicePrice(service)}</span>
                    {service.badgeText && (
                      <span className="absolute top-1 left-1 text-[8px] font-bold text-white bg-gradient-to-r from-red-500 to-orange-500 px-1.5 rounded shadow-md border border-white/20">
                        {service.badgeText}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2"></div>
                <p className="text-sm text-[var(--unit-text-muted)] mb-2">
                  No hay servicios disponibles en {unit === 'SPA' ? 'SPA' : 'Barbería'}
                </p>
                <p className="text-xs text-[var(--unit-text-muted)]">
                  Agrega servicios desde el catálogo para que aparezcan aquí
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Customer bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {selectedCustomer ? (
            <div className="inline-flex items-center gap-2 rounded-[var(--unit-border-radius)] border border-[var(--unit-border)] bg-[var(--unit-surface-elevated)] px-4 py-2.5">
              <UserCircle className="h-4 w-4 text-[var(--unit-accent)]" />
              <span className="text-sm font-medium text-[var(--unit-text)] hover:text-[var(--unit-accent)]">{selectedCustomer.name}</span>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="ml-1 rounded-full p-0.5 bg-[var(--unit-accent)] text-[var(--unit-text)] transition-colors hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative" ref={clientSearchRef}>
              <button
                type="button"
                onClick={() => setShowClientSearch((s) => !s)}
                className="inline-flex items-center gap-2 rounded-[var(--unit-border-radius)] border border-dashed border-[var(--unit-border)] bg-[var(--unit-surface)] px-4 py-2.5 text-sm text-[var(--unit-text-muted)] transition-colors hover:bg-[var(--unit-accent)] hover:text-[var(--unit-text)]"
              >
                <UserCircle className="h-4 w-4" />
                Asignar cliente
              </button>
              {showClientSearch && (
                <div className="absolute left-0 top-full z-20 mt-2 w-80 rounded-[var(--unit-border-radius)] border-2 border-[var(--unit-border)] bg-[var(--unit-surface)] p-3 shadow-[var(--unit-shadow-lg)]">
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--unit-text-muted)]" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Buscar por nombre o teléfono..."
                      className="w-full rounded-[var(--unit-radius-sm)] border border-[var(--unit-border)] bg-[var(--unit-surface)] pl-9 pr-3 py-2 text-sm text-[var(--unit-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]"
                    autoFocus
                  />
                  </div>
                  <ul className="max-h-48 overflow-auto space-y-0.5">
                    {clientSearchResults.length === 0 && debouncedClientSearch.length >= 2 ? (
                      <>
                        <li className="px-3 py-2 text-xs text-[var(--unit-text-muted)]">Sin resultados</li>
                        <li>
                          <button
                            type="button"
                            className="group w-full rounded-[var(--unit-radius-sm)] px-3 py-2 text-left text-sm text-[var(--unit-accent)] transition-colors hover:bg-[var(--unit-accent)] hover:text-white border border-[var(--unit-accent)]/30"
                            onClick={() => {
                              // Crear nuevo cliente con el nombre del buscador
                              const newCustomer = {
                                id: `new-${Date.now()}`, // ID temporal único
                                name: clientSearch.trim(),
                                phone: '',
                                email: '',
                                isNew: true
                              };
                              setSelectedCustomer(newCustomer);
                              setShowClientSearch(false);
                              setClientSearch('');
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Plus className="h-3.5 w-3.5" />
                              <span className="font-medium">Crear nuevo cliente: "{clientSearch.trim()}"</span>
                            </div>
                          </button>
                        </li>
                      </>
                    ) : (
                      clientSearchResults.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            className="group w-full rounded-[var(--unit-radius-sm)] px-3 py-2 text-left text-sm text-[var(--unit-text-muted)] transition-colors hover:bg-[var(--unit-accent)] hover:text-[var(--unit-text)]"
                            onClick={() => { setSelectedCustomer(c); setShowClientSearch(false); setClientSearch(''); }}
                          >
                            <span className="font-medium">{c.name}</span>
                            <span className="ml-2 text-xs text-[var(--unit-text-muted)] group-hover:text-[var(--unit-text)]">{c.phone}</span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
          {appointmentIdFromUrl && cart.length > 0 && (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700">
              Servicios de cita cargados
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Item Selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Item Search */}
            <section className="relative rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/3 to-[var(--unit-primary)]/3 rounded-2xl"></div>
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                    <Search className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--unit-text)]">Buscar Items</h2>
                    <p className="text-sm text-[var(--unit-text-muted)]">Servicios, productos y paquetes</p>
                  </div>
                </div>
              <div className="relative z-50" ref={itemSearchRef}>
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-[var(--unit-text-muted)]" />
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => {
                    setItemSearch(e.target.value);
                    setShowItemSearch(true);
                  }}
                  onFocus={() => setShowItemSearch(true)}
                  placeholder="Buscar servicios, productos o paquetes..."
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)] pl-12 pr-4 py-3 text-[var(--unit-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all placeholder:text-[var(--unit-text-muted)]/50"
                />
                {showItemSearch && debouncedItemSearch.length >= 2 && (
                  <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-white shadow-xl" style={{ maxHeight: '400px' }}>
                    <div className="max-h-80 overflow-y-auto">
                      {/* Services */}
                      {searchServices.length > 0 && (
                        <div>
                          <div className="px-4 py-3 text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider border-b border-[var(--unit-border)]/30">Servicios</div>
                          {searchServices.map((s: { id: string; name: string; price?: unknown; unit: string }) => (
                            <button
                              key={s.id}
                              type="button"
                              className="group w-full px-4 py-3 text-left text-[var(--unit-text)] transition-colors hover:bg-[var(--unit-accent)]/10"
                              onClick={() => addServiceToCart(s)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{s.name}</span>
                                <span className="text-[var(--unit-accent)] font-bold group-hover:text-[var(--unit-text)]">S/ {typeof s.price === 'number' ? s.price : Number(s.price)}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Products */}
                      {searchProducts.length > 0 && (
                        <div>
                          <div className="px-3 py-2 text-xs font-semibold text-[var(--unit-text-muted)] uppercase tracking-wider">Productos</div>
                          {searchProducts.filter((p: { salePrice: number | null }) => p.salePrice).map((p: { id: string; name: string; salePrice: number }) => (
                            <button
                              key={p.id}
                              type="button"
                              className="group w-full px-3 py-2 text-left text-sm text-[var(--unit-text-muted)] transition-colors hover:bg-[var(--unit-accent)] hover:text-[var(--unit-text)]"
                              onClick={() => addProductToCart(p)}
                            >
                              <span className="font-medium">{p.name}</span>
                              <span className="ml-2 text-[var(--unit-accent)] font-semibold group-hover:text-[var(--unit-text)]">S/ {p.salePrice}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Packages */}
                      {searchPackages.length > 0 && (
                        <div>
                          <div className="px-3 py-2 text-xs font-semibold text-[var(--unit-text-muted)] uppercase tracking-wider">Paquetes</div>
                          {searchPackages.map((p: { id: string; name: string; fixedPrice: number }) => (
                            <button
                              key={p.id}
                              type="button"
                              className="group w-full px-3 py-2 text-left text-sm text-[var(--unit-text-muted)] transition-colors hover:bg-[var(--unit-accent)] hover:text-[var(--unit-text)]"
                              onClick={() => addPackageToCart(p)}
                            >
                              <span className="font-medium">{p.name}</span>
                              <span className="ml-2 text-[var(--unit-accent)] font-semibold group-hover:text-[var(--unit-text)]">S/ {p.fixedPrice}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchServices.length === 0 && searchProducts.length === 0 && searchPackages.length === 0 && (
                        <div className="px-3 py-2 text-xs text-[var(--unit-text-muted)]">Sin resultados</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            </section>

            {/* Services */}
            <section className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/3 to-[var(--unit-primary)]/3 rounded-2xl"></div>
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                    <Scissors className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--unit-text)]">Servicios</h2>
                    <p className="text-sm text-[var(--unit-text-muted)]">Todos los servicios disponibles</p>
                  </div>
                </div>
              
              <div className="flex flex-wrap gap-3">
                {servicesForUnit.map((s: { id: string; name: string; price?: unknown; unit: string }) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => addServiceToCart(s)}
                    className="relative flex flex-col items-center gap-2 rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 px-4 py-3 text-sm font-medium transition-all hover:shadow-lg hover:scale-[1.02] hover:border-[var(--unit-accent)]/50 active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-[var(--unit-accent)]" />
                      <span className="font-medium text-[var(--unit-text)]">{s.name}</span>
                    </div>
                    <span className="text-[var(--unit-accent)] font-bold group-hover:text-[var(--unit-primary)]">S/ {price(s)}</span>
                  </button>
                ))}
              </div>
            </div>
            </section>

            {/* Products */}
            <section className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/3 to-[var(--unit-primary)]/3 rounded-2xl"></div>
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                    <Box className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--unit-text)]">Productos</h2>
                    <p className="text-sm text-[var(--unit-text-muted)]">Productos disponibles para venta</p>
                  </div>
                </div>
              
              <div className="flex flex-wrap gap-3">
                {productsForSale.map((p: { id: string; name: string; salePrice: number }) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart({ itemType: 'PRODUCT', referenceId: p.id, name: p.name, unitPrice: p.salePrice ?? 0, quantity: 1 })}
                    className="relative flex flex-col items-center gap-2 rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 px-4 py-3 text-sm font-medium transition-all hover:shadow-lg hover:scale-[1.02] hover:border-[var(--unit-accent)]/50 active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4 text-[var(--unit-accent)]" />
                      <span className="font-medium text-[var(--unit-text)]">{p.name}</span>
                    </div>
                    <span className="text-[var(--unit-accent)] font-bold group-hover:text-[var(--unit-primary)]">S/ {p.salePrice}</span>
                  </button>
                ))}
              </div>
            </div>
            </section>

            {/* Packages */}
            <section className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/3 to-[var(--unit-primary)]/3 rounded-2xl"></div>
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--unit-text)]">Paquetes</h2>
                    <p className="text-sm text-[var(--unit-text-muted)]">Paquetes especiales y promociones</p>
                  </div>
                </div>
              
              <div className="flex flex-wrap gap-3">
                {(packages ?? []).map((p: { id: string; name: string; fixedPrice: number }) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addPackageToCart(p)}
                    className="relative flex flex-col items-center gap-2 rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 px-4 py-3 text-sm font-medium transition-all hover:shadow-lg hover:scale-[1.02] hover:border-[var(--unit-accent)]/50 active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-[var(--unit-accent)]" />
                      <span className="font-medium text-[var(--unit-text)]">{p.name}</span>
                    </div>
                    <span className="text-[var(--unit-accent)] font-bold group-hover:text-[var(--unit-primary)]">S/ {p.fixedPrice}</span>
                  </button>
                ))}
              </div>
            </div>
            </section>
          </div>

          {/* Enhanced Cart Section */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            {/* Cart Header */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl">
              {/* Ticket header */}
              <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                      <ShoppingBag className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[var(--unit-text)]">Carrito</h2>
                      <p className="text-sm text-[var(--unit-text-muted)]">Artículos seleccionados</p>
                    </div>
                  </div>
                  {cart.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[var(--unit-accent)] text-[10px] font-bold text-white">
                        {cart.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCart([])}
                        className="rounded-xl p-2 text-[var(--unit-text)] transition-colors hover:bg-red-500/15 hover:text-red-500"
                        title="Vaciar carrito"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Cart items */}
              <div className="px-5 py-4">
              {cart.length === 0 ? (
                  <div className="py-8 text-center">
                    <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-[var(--unit-text-muted)]/25" />
                    <p className="text-sm text-[var(--unit-text)] mb-4">Carrito vacío</p>
                    <div className="space-y-2 text-xs text-[var(--unit-text)]">
                      <p> Usa los botones de acceso rápido</p>
                      <p> O busca servicios en el catálogo</p>
                    </div>
                  </div>
              ) : (
                  <>
                    <ul className="space-y-3 mb-4">
                  {cart.map((i, idx) => (
                        <li key={idx} className="group rounded-[var(--unit-radius-sm)] border-2 border-[var(--unit-border)] bg-[var(--unit-surface)] p-3 transition-all hover:border-[var(--unit-accent)]">
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-[var(--unit-text-muted)] leading-tight">{i.name}</p>
                                  {(i.itemType === 'SERVICE' || i.itemType === 'PACKAGE') && i.employeeId && (
                                    <p className="text-xs text-[var(--unit-text-muted)] mt-1">
                                      Empleado: {employees.find((emp: any) => emp.id === i.employeeId)?.name || 'No asignado'}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(idx, i.quantity - 1)}
                                      className="rounded-full p-0.5 text-[var(--unit-text-muted)] transition-colors hover:bg-[var(--unit-accent)] hover:text-[var(--unit-text)]"
                                      disabled={i.quantity <= 1}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="text-sm font-medium text-[var(--unit-text-muted)] min-w-[2rem] text-center">
                                      {i.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(idx, i.quantity + 1)}
                                      className="rounded-full p-0.5 text-[var(--unit-text-muted)] transition-colors hover:bg-[var(--unit-accent)] hover:text-[var(--unit-text)]"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <p className="text-xs text-[var(--unit-text-muted)] mt-1">
                                    S/ {i.unitPrice.toFixed(2)} c/u
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="shrink-0 font-semibold tabular-nums text-[var(--unit-text-muted)]">
                                    S/ {(i.unitPrice * i.quantity).toFixed(2)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeFromCart(idx)}
                                    className="opacity-0 group-hover:opacity-100 rounded-full p-1 text-[var(--unit-text-muted)] transition-all hover:bg-red-500/15 hover:text-red-500"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                    </li>
                  ))}
                </ul>

                    {/* Enhanced Discount Section */}
                    <div className="rounded-[var(--unit-radius-sm)] border border-[var(--unit-border)]/50 bg-[var(--unit-surface)] p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-3 w-3 text-[var(--unit-accent)]" />
                        <span className="text-xs font-medium text-[var(--unit-text-muted)]">Descuento</span>
                      </div>
                      <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min={0}
                            step={0.10}
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                            placeholder="Monto"
                            className="w-24 rounded-[var(--unit-radius-sm)] border-2 border-[var(--unit-border)] bg-[var(--unit-surface)] px-2 py-1.5 text-xs text-[var(--unit-text-muted)] text-center focus:outline-none focus:ring-1 focus:ring-[var(--unit-accent)]"
                  />
                  <input
                    type="text"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                            placeholder="Motivo (requerido)"
                            className="min-w-0 flex-1 rounded-[var(--unit-radius-sm)] border-2 border-[var(--unit-border)] bg-[var(--unit-surface)] px-2 py-1.5 text-xs text-[var(--unit-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--unit-accent)]"
                  />
                </div>
                        {discountAmount > 0 && !discountReason.trim() && (
                          <p className="text-xs text-red-500">⚠️ El motivo del descuento es requerido</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Enhanced Ticket footer */}
              <div className="border-t border-dashed border-[var(--unit-border)] bg-[var(--unit-surface)] px-6 py-4 space-y-3">
                <div className="flex justify-between text-xs text-[var(--unit-text-muted)]">
                  <span>Subtotal</span>
                  <span className="tabular-nums">S/ {subtotalCart.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-red-500">
                    <span>Descuento</span>
                    <span className="tabular-nums">-S/ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-[var(--unit-border)]">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--unit-text-muted)]">Total</span>
                  <span className="font-heading text-2xl font-bold tabular-nums text-[var(--unit-accent)]">S/ {totalCart.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => createSaleMutation.mutate()}
                  disabled={cart.length === 0 || createSaleMutation.isPending || (discountAmount > 0 && !discountReason.trim())}
                  className="mt-3 w-full min-h-[48px] touch-manipulation rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white py-3.5 text-sm font-bold uppercase tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {createSaleMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creando venta...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" />
                      Crear venta
                    </>
                  )}
                </button>
              </div>
            </div>

            <PendingSales
              sales={pendingSales ?? []}
              isLoading={loadingPending}
              onCollect={(sale) => openCloseModal(sale as PendingSale)}
              onCancel={handleCancelSale}
              userRole={'ADMIN'} // TODO: Obtener del auth store
            />
          </div>
        </div>
      </div>

      {/* Sale Closed Modal */}
      {lastClosedSale && (
        <div className="fixed inset-0 z-10 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-md p-0 sm:p-4">
          <div className="w-full max-w-sm rounded-t-[calc(var(--unit-border-radius)*1.5)] sm:rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-6 sm:p-8 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-repeat" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>
            
            {/* Drag handle (mobile) */}
            <div className="relative z-10 mx-auto mb-6 h-1 w-10 rounded-full bg-[var(--unit-text)]/20 sm:hidden" />
            
            {/* Success Animation Container */}
            <div className="relative z-10 mb-8 text-center">
              <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/30 shadow-lg">
                <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 animate-pulse"></div>
                <ShoppingBag className="relative h-8 w-8 text-emerald-600" />
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[var(--unit-text)]">¡Venta cerrada!</h3>
                <p className="text-sm font-medium text-[var(--unit-accent)]">{lastClosedSale.saleNumber}</p>
                <div className="relative inline-block">
                  <p className="text-3xl font-bold text-emerald-600 tabular-nums">S/ {lastClosedSale.total.toFixed(2)}</p>
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="relative z-10 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  const data: ReceiptSaleData = {
                    ...lastClosedSale,
                    businessName: businessConfig?.businessName || '',
                    businessAddress: businessConfig?.businessAddress || '',
                    businessPhone: businessConfig?.businessPhone || '',
                  };
                  const html = printReceipt(data);
                  if (html) setReceiptHtmlToPrint(html);
                }}
                className="relative flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] group"
              >
                <Printer className="h-4 w-4" />
                Imprimir comprobante
              </button>
              <button
                type="button"
                onClick={() => setLastClosedSale(null)}
                className="relative w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 py-3.5 text-sm font-semibold text-[var(--unit-text-muted)] transition-all hover:scale-[1.02] hover:border-[var(--unit-accent)]/50 hover:text-[var(--unit-accent)]"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Print Modal */}
      {receiptHtmlToPrint && (
        <div className="fixed inset-0 z-20 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-md p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-[calc(var(--unit-border-radius)*1.5)] sm:rounded-[var(--unit-border-radius)] border border-[var(--unit-border)] bg-[var(--unit-surface)] p-5 sm:p-6 shadow-[var(--unit-shadow-lg)]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--unit-text)]/20 sm:hidden" />
            <p className="mb-3 text-xs text-[var(--unit-text-muted)]">Vista previa del comprobante</p>
            <iframe
              ref={receiptIframeRef}
              srcDoc={receiptHtmlToPrint}
              title="Comprobante"
              className="w-full h-96 rounded-[var(--unit-radius-sm)] border border-[var(--unit-border)] bg-white"
            />
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => receiptIframeRef.current?.contentWindow?.print()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--unit-border-radius)] bg-[var(--unit-accent)] py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </button>
              <button
                type="button"
                onClick={() => setReceiptHtmlToPrint(null)}
                className="flex-1 rounded-[var(--unit-border-radius)] border border-[var(--unit-border)] py-2.5 text-sm font-medium text-[var(--unit-text)] transition-colors hover:bg-[var(--unit-primary)]/10"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Selection Modal */}
      {showEmployeeModal && selectedServiceForEmployee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-6 max-w-md w-full">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-repeat" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>
            
            {/* Header */}
            <div className="relative z-10 flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <UserCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Seleccionar Empleado</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Asignar especialista</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEmployeeModal(false);
                  setSelectedServiceForEmployee(null);
                  setIsPackageSelection(false);
                }}
                className="relative z-20 rounded-xl p-2 text-[var(--unit-text-muted)] transition-all hover:bg-red-500/15 hover:text-red-500 hover:scale-105"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Service Info */}
            <div className="relative z-10 space-y-4">
              <div className="rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10">
                    {isPackageSelection ? (
                      <Package className="h-4 w-4 text-[var(--unit-accent)]" />
                    ) : (
                      <Scissors className="h-4 w-4 text-[var(--unit-accent)]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--unit-text-muted)]">
                      {isPackageSelection ? 'Paquete seleccionado' : 'Servicio seleccionado'}
                    </p>
                    <p className="text-base font-bold text-[var(--unit-text)]">{selectedServiceForEmployee.name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[var(--unit-border)]/30">
                  <span className="text-sm text-[var(--unit-text-muted)]">Precio:</span>
                  <span className="text-lg font-bold text-[var(--unit-accent)]">S/ {typeof selectedServiceForEmployee.price === 'number' ? selectedServiceForEmployee.price : Number(selectedServiceForEmployee.price)}</span>
                </div>
              </div>
              
              {/* Employee Selection */}
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-3">
                  Empleado que realizará {isPackageSelection ? 'el paquete' : 'el servicio'}:
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {employees.length === 0 ? (
                    <div className="text-center py-8 rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90">
                      <UserCircle className="h-12 w-12 text-[var(--unit-text-muted)]/25 mx-auto mb-3" />
                      <p className="text-sm text-[var(--unit-text-muted)]">
                        No hay empleados disponibles para {unit === 'SPA' ? 'SPA' : 'Barbería'}.
                      </p>
                      <p className="text-xs text-[var(--unit-text-muted)] mt-1">
                        {unit === 'SPA' 
                          ? 'Por favor, asegúrate de que haya especialistas SPA activos.' 
                          : 'Por favor, asegúrate de que haya barberos activos.'
                        }
                      </p>
                    </div>
                  ) : (
                    employees.map((employee: any) => (
                      <button
                        key={employee.id}
                        onClick={() => isPackageSelection 
                          ? addPackageToCartWithEmployee(selectedServiceForEmployee, employee.id)
                          : addServiceToCartWithEmployee(selectedServiceForEmployee, employee.id)
                        }
                        className="relative w-full text-left p-4 rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 transition-all hover:shadow-lg hover:scale-[1.02] hover:border-[var(--unit-accent)]/50 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 group-hover:from-[var(--unit-accent)]/20 group-hover:to-[var(--unit-primary)]/20 transition-colors">
                            <UserCircle className="h-5 w-5 text-[var(--unit-accent)]" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-[var(--unit-text)] group-hover:text-[var(--unit-accent)] transition-colors">{employee.name}</div>
                            <div className="text-sm text-[var(--unit-text-muted)]">
                              {employee.role === 'BARBER' ? 'Barbero' : 'Especialista SPA'}
                            </div>
                          </div>
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--unit-accent)]/10 group-hover:bg-white group-hover:shadow-md transition-colors">
                            <ChevronRight className="h-3 w-3 text-[var(--unit-accent)] group-hover:text-[var(--unit-accent)]" />
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            {/* Cancel Button */}
            <div className="relative z-10 mt-6">
              <button
                onClick={() => {
                  setShowEmployeeModal(false);
                  setSelectedServiceForEmployee(null);
                  setIsPackageSelection(false);
                }}
                className="relative w-full rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 px-4 py-3 text-sm font-semibold text-[var(--unit-text-muted)] transition-all hover:scale-[1.02] hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 hover:shadow-lg active:scale-[0.98]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {closingSaleId && (
        <PaymentModal
          saleTotal={closingSaleTotal}
          isProcessing={closeSaleMutation.isPending}
          onClose={() => setClosingSaleId(null)}
          onConfirm={(method, amount, detail) => {
            closeSaleMutation.mutate({ saleId: closingSaleId, method, amount, detail: detail as Record<string, number> | undefined });
          }}
        />
      )}
      </div>
  );
}
