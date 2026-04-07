import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Trash2, UserCircle, Search, Printer, X, Package, Scissors, Box, TrendingUp, Clock, Star, Zap, CreditCard, Smartphone, DollarSign, ChevronRight, Plus, Minus, ChevronLeft, AlertCircle, Lock, Palette, Sparkles, Hand, Users, Smile, Wand2, Wind } from 'lucide-react';
import { api } from '@/lib/api';
import { useUnitStore } from '@/store/unitStore';
import { useAuthStore } from '@/store/authStore';
import { printReceipt, type ReceiptSaleData } from '@/lib/receipt';
import { useBusinessConfig } from '@/hooks/useBusinessConfig';
import { useToast } from '@/hooks/useToast';
import { useApprovalNotifications } from '@/hooks/useApprovalNotifications';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui';
import { EmptyStateData } from '@/components/ui/EmptyState';
import { PaymentModal } from './PaymentModal';
import { PendingSales } from './PendingSales';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { VariablePriceModal } from './VariablePriceModal';
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
  const customerIdFromUrl = searchParams?.get('customerId');
  const appointmentIdFromUrl = searchParams?.get('appointmentId');
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const setUnit = useUnitStore((s) => s.setUnit);
  const user = useAuthStore((s) => s.user);
  const { success, error: showError } = useToast();

  // � Activar Socket.io para actualizaciones en tiempo real
  useSocket();

  // � Activar notificaciones de aprobaciones para Admin
  useApprovalNotifications();

  // 🔄 Escuchar actualizaciones de aprobaciones para actualizar el carrito
  useEffect(() => {
    const handleApprovalUpdate = (event: CustomEvent) => {
      const { approval } = event.detail;

      // Actualizar el carrito cuando se aprueba/rechaza
      setCart(prevCart =>
        prevCart.map(item => {
          // Si este item tiene el approvalId que fue actualizado
          if (item.approvalId === approval.id) {
            if (approval.status === 'APPROVED') {
              // Aprobado: eliminar requiresApproval y approvalId, PERO MANTENER employeeId
              return {
                ...item,
                requiresApproval: false,
                approvalId: undefined,
                // ✅ MANTENER el employeeId existente si ya estaba asignado
                // Solo usar employeeId de cita precargada si no hay uno asignado
                employeeId: item.employeeId || (() => {
                  if (appointmentIdFromUrl && appointmentForPreload) {
                    const serviceItem = appointmentForPreload.items?.find((item: any) =>
                      item.serviceId === approval.serviceId
                    );
                    return serviceItem?.employee?.id;
                  }
                  return undefined;
                })()
              };
            } else if (approval.status === 'REJECTED') {
              // Rechazado: eliminar el item del carrito
              return null;
            }
          }
          return item;
        }).filter(Boolean) as CartItem[]
      );
    };

    // Escuchar evento personalizado de aprobación
    window.addEventListener('approval_updated', handleApprovalUpdate as EventListener);

    return () => {
      window.removeEventListener('approval_updated', handleApprovalUpdate as EventListener);
    };
  }, []);

  // For RECEPTIONIST, use their assigned unit instead of the active unit
  const unit = user?.role === 'RECEPTIONIST'
    ? (user.unit === 'BARBERIA' ? 'BARBERIA' : 'SPA') as BusinessUnit
    : (activeUnit === 'BARBERIA' ? 'BARBERIA' : 'SPA') as BusinessUnit;

  const [cart, setCart] = useState<CartItem[]>([]);

  // 🔄 Escuchar actualizaciones de aprobaciones para actualizar el carrito
  useEffect(() => {
    const handleApprovalUpdate = (event: CustomEvent) => {
      const { approval } = event.detail;

      // Actualizar el carrito cuando se aprueba/rechaza
      setCart(prevCart =>
        prevCart.map(item => {
          // Si este item tiene el approvalId que fue actualizado
          if (item.approvalId === approval.id) {
            if (approval.status === 'APPROVED') {
              // Aprobado: eliminar requiresApproval y approvalId
              return {
                ...item,
                requiresApproval: false,
                approvalId: undefined
              };
            } else if (approval.status === 'REJECTED') {
              // Rechazado: eliminar el item del carrito
              return null;
            }
          }
          return item;
        }).filter(Boolean) as CartItem[]
      );
    };

    // Escuchar evento personalizado de aprobación
    window.addEventListener('approval_updated', handleApprovalUpdate as EventListener);

    return () => {
      window.removeEventListener('approval_updated', handleApprovalUpdate as EventListener);
    };
  }, []);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const clientSearchRef = useRef<HTMLDivElement>(null);
  const debouncedClientSearch = useDebouncedValue(clientSearch.trim(), 300);

  // Employee selection state
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedServiceForEmployee, setSelectedServiceForEmployee] = useState<ServiceOption | null>(null);
  const [isPackageSelection, setIsPackageSelection] = useState(false);

  // Variable price modal state
  const [showVariablePriceModal, setShowVariablePriceModal] = useState(false);
  const [selectedServiceForPrice, setSelectedServiceForPrice] = useState<ServiceOption | null>(null);

  // Reset employee modal when closed
  useEffect(() => {
    if (!showEmployeeModal) {
      setSelectedServiceForEmployee(null);
      setIsPackageSelection(false);
    }
  }, [showEmployeeModal]);

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
  const [showSaleConfirmDialog, setShowSaleConfirmDialog] = useState(false);
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
          service: {
            id: string;
            name: string;
            price: number;
            unit?: string;
            priceType?: string;
            minPrice?: number;
            maxPrice?: number;
          };
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

    // ✅ Verificar si los servicios tienen precio variable
    const servicesWithVariablePrice = appointmentForPreload.items.filter(item =>
      item.service.priceType && item.service.priceType !== 'FIXED'
    );

    if (servicesWithVariablePrice.length > 0) {
      // Si hay servicios con precio variable, mostrar modal para cada uno
      // Por ahora, mostramos el primer servicio con precio variable
      const firstVariableService = servicesWithVariablePrice[0].service;
      setSelectedServiceForPrice({
        id: firstVariableService.id,
        name: firstVariableService.name,
        price: firstVariableService.price,
        unit: appointmentForPreload.unit,
        priceType: firstVariableService.priceType as any,
        minPrice: firstVariableService.minPrice,
        maxPrice: firstVariableService.maxPrice,
      });
      setShowVariablePriceModal(true);

      // Agregar los demás servicios (sin precio variable) al carrito
      const fixedPriceItems = appointmentForPreload.items.filter(item =>
        !item.service.priceType || item.service.priceType === 'FIXED'
      );
      const cartItems: CartItem[] = fixedPriceItems.map((item) => ({
        itemType: 'SERVICE',
        referenceId: item.service.id,
        name: item.service.name,
        unitPrice: typeof item.service.price === 'number' ? item.service.price : Number(item.service.price),
        quantity: 1,
        employeeId: item.employee?.id || '', // ✅ Asegurar que siempre tenga un valor
      }));
      setCart(cartItems);
    } else {
      // Si no hay precios variables, agregar todo al carrito como antes
      const cartItems: CartItem[] = appointmentForPreload.items.map((item) => ({
        itemType: 'SERVICE',
        referenceId: item.service.id,
        name: item.service.name,
        unitPrice: typeof item.service.price === 'number' ? item.service.price : Number(item.service.price),
        quantity: 1,
        employeeId: item.employee?.id || '', // ✅ Asegurar que siempre tenga un valor
      }));
      setCart(cartItems);
    }
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
    queryKey: ['packages', unit],
    queryFn: async () => {
      const { data } = await api.get(`/api/packages?unit=${unit}`);
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
    queryKey: ['packages-search', unit, debouncedItemSearch],
    queryFn: async () => {
      const { data } = await api.get(`/api/packages?unit=${unit}&search=${encodeURIComponent(debouncedItemSearch)}`);
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

  // Check if cash register is open
  const { data: openRegister, isLoading: loadingRegister } = useQuery({
    queryKey: ['cash-register-open', unit],
    queryFn: async () => {
      const { data } = await api.get(`/api/cash-register/open?unit=${unit}`);
      return data;
    },
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Polling cada minuto
  });

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

  const addServiceToCart = (service: { id: string; name: string; price?: unknown; unit: string; priceType?: string; minPrice?: number; maxPrice?: number; requiresApproval?: boolean }) => {
    // Check if service has variable pricing
    const serviceOption = service as ServiceOption;
    if (serviceOption.priceType && serviceOption.priceType !== 'FIXED') {
      // Show variable price modal
      setSelectedServiceForPrice(serviceOption);
      setShowVariablePriceModal(true);
      setShowItemSearch(false);
      setItemSearch('');
      return;
    }

    // Show employee selection modal for fixed price services
    setSelectedServiceForEmployee(service as ServiceOption);
    setShowEmployeeModal(true);
    setShowItemSearch(false);
    setItemSearch('');
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

  // ✅ Nueva función para actualizar item existente con employeeId
  const updateCartItemWithEmployee = (serviceId: string, employeeId: string) => {
    console.log('🔍 Update Cart Item Called:', { serviceId, employeeId });
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.referenceId === serviceId && item.requiresApproval) {
          console.log('🔍 Found item to update:', { item, newEmployeeId: employeeId });
          return {
            ...item,
            employeeId
          };
        }
        return item;
      })
    );
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

  const handleVariablePriceConfirm = (price: number) => {
    if (!selectedServiceForPrice) return;

    // ✅ Obtener employeeId de la cita si viene de una cita
    const getEmployeeIdFromAppointment = () => {
      if (appointmentIdFromUrl && appointmentForPreload) {
        // Buscar el employeeId en los items de la cita
        const serviceItem = appointmentForPreload.items?.find((item: any) =>
          item.serviceId === selectedServiceForPrice.id
        );
        return serviceItem?.employee?.id; // ✅ Corregido: employee.id
      }
      return null;
    };

    const employeeId = getEmployeeIdFromAppointment();

    // Add service with custom price to cart
    addToCart({
      itemType: 'SERVICE',
      referenceId: selectedServiceForPrice.id,
      name: selectedServiceForPrice.name,
      unitPrice: price,
      quantity: 1,
      customPrice: price,
      requiresApproval: selectedServiceForPrice.requiresApproval,
      employeeId: employeeId || undefined, // ✅ Convertir null a undefined
    });

    // ✅ Si viene de una cita, no mostrar selección de empleado (ya está asignado)
    if (appointmentIdFromUrl) {
      setShowVariablePriceModal(false);
      setSelectedServiceForPrice(null);
      setShowItemSearch(false);
      setItemSearch('');
    } else {
      // Show employee selection modal para POS normal
      setSelectedServiceForEmployee(selectedServiceForPrice);
      setShowEmployeeModal(true);
      setShowVariablePriceModal(false);
      setSelectedServiceForPrice(null);
      setShowItemSearch(false);
      setItemSearch('');
    }
  };

  const handleApprovalRequest = async (approvalData: { serviceId: string; requestedPrice: number; reason: string }) => {
    try {
      // Generar un ID temporal para el saleItemId
      const tempSaleItemId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const response = await api.post('/api/prices/approvals', {
        ...approvalData,
        saleItemId: tempSaleItemId
      });

      success('Solicitud de aprobación enviada correctamente');
      // Add service with pending approval to cart
      if (selectedServiceForPrice) {
        addToCart({
          itemType: 'SERVICE',
          referenceId: selectedServiceForPrice.id,
          name: selectedServiceForPrice.name,
          unitPrice: approvalData.requestedPrice,
          quantity: 1,
          customPrice: approvalData.requestedPrice,
          requiresApproval: true,
          approvalId: response.data.approvalId, // Guardar el approvalId
          // ✅ EmployeeId se agregará después en el EmployeeModal
        });
        
        // ✅ Abrir modal de empleado para seleccionar el barbero
        setSelectedServiceForEmployee(selectedServiceForPrice);
        setShowEmployeeModal(true);
      }
      setShowVariablePriceModal(false);
      setSelectedServiceForPrice(null);
      setShowItemSearch(false);
      setItemSearch('');
    } catch (error: any) {
      // Error requesting approval

      // Manejo específico de errores
      if (error.response?.status === 401) {
        error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      } else if (error.response?.status === 403) {
        error('No tienes permisos para solicitar aprobaciones.');
      } else if (error.response?.data?.error) {
        error(error.response.data.error);
      } else {
        error('Error al enviar solicitud de aprobación');
      }
    }
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
    // Show employee selection modal for packages
    setSelectedServiceForEmployee({
      id: pkg.id,
      name: pkg.name,
      price: pkg.fixedPrice,
      unit: 'SPA' as BusinessUnit,
    });
    setShowEmployeeModal(true);
    setShowItemSearch(false);
    setItemSearch('');
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
    if (name.includes('corte') || name.includes('cabello')) return <Scissors className="h-4 w-4" />;
    if (name.includes('tinte') || name.includes('color')) return <Palette className="h-4 w-4" />;
    if (name.includes('manicur') || name.includes('uña')) return <Hand className="h-4 w-4" />;
    if (name.includes('pedicur') || name.includes('pie')) return <Hand className="h-4 w-4" />;
    if (name.includes('masaje') || name.includes('relaj')) return <Users className="h-4 w-4" />;
    if (name.includes('facial') || name.includes('cara')) return <Smile className="h-4 w-4" />;
    if (name.includes('depil') || name.includes('cera')) return <Scissors className="h-4 w-4" />;
    if (name.includes('tratamiento') || name.includes('terapia')) return <Sparkles className="h-4 w-4" />;
    if (name.includes('peinado') || name.includes('estilo')) return <Wind className="h-4 w-4" />;
    if (name.includes('barba') || name.includes('bigote')) return <Wand2 className="h-4 w-4" />;
    return <Scissors className="h-4 w-4" />; // Default barber icon
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

  // State for cash register warning modal
  const [showCashRegisterWarning, setShowCashRegisterWarning] = useState(false);

  // Handle create sale error to show cash register warning
  const handleCreateSaleError = (error: any) => {
    if (error.message === 'CAJA_CERRADA') {
      setShowCashRegisterWarning(true);
    } else if (error.message === 'SERVICES_SIN_EMPLEADO') {
      showError('Todos los servicios deben tener un empleado asignado. Por favor, verifica los items en el carrito.');
    }
  };

  // Check if cart has items pending approval
  const hasPendingApprovals = cart.some(item => item.requiresApproval);

  const createSaleMutation = useMutation({
    mutationFn: async () => {
      // Check if cash register is open before creating sale
      if (!openRegister) {
        throw new Error('CAJA_CERRADA');
      }

      // ✅ Validar que todos los servicios tengan empleado asignado
      const servicesWithoutEmployee = cart.filter(item => 
        item.itemType === 'SERVICE' && (!item.employeeId || item.employeeId.trim() === '')
      );

      if (servicesWithoutEmployee.length > 0) {
        throw new Error('SERVICES_SIN_EMPLEADO');
      }

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
      // Mostrar toast de éxito descriptivo
      const total = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
      success(`Venta creada exitosamente: ${itemCount} producto(s) por S/ ${total.toFixed(2)}`);
    },
    onError: handleCreateSaleError,
  });

  const cancelSaleMutation = useMutation({
    mutationFn: async (saleId: string) => {
      const { data } = await api.post(`/api/pos/${saleId}/cancel`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-pending', unit] });
      success('Venta cancelada exitosamente');
    },
    onError: (error: any) => {
      handleCreateSaleError(error);
    },
  });

  const closeSaleMutation = useMutation({
    mutationFn: async ({ saleId, method, amount, detail }: { saleId: string; method: string; amount: number; detail?: Record<string, number> }) => {
      // Convertir claves del frontend al formato del backend, solo incluir métodos con montos > 0
      const paymentDetail = detail ? {
        ...(detail.cash > 0 && { CASH: detail.cash }),
        ...(detail.card > 0 && { CARD: detail.card }),
        ...(detail.transfer > 0 && { TRANSFER: detail.transfer }),
        ...(detail.wallet > 0 && { DIGITAL_WALLET: detail.wallet }),
      } : undefined;

      // Si no hay métodos con monto > 0, enviar undefined
      const finalPaymentDetail = Object.keys(paymentDetail || {}).length > 0 ? paymentDetail : undefined;

      const { data } = await api.post(`/api/pos/${saleId}/close`, {
        paymentMethod: method,
        amountPaid: Number(amount),
        paymentDetail: finalPaymentDetail,
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
      setShowSaleConfirmDialog(true);
      queryClient.invalidateQueries({ queryKey: ['pos-pending', unit] });
      success(`Venta ${data.saleNumber} cerrada exitosamente: ${data.items.length} producto(s) por S/ ${data.total.toFixed(2)}`);
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
          <p className="text-[var(--unit-text-muted)]">Sistema de ventas profesional para {unit === 'SPA' ? 'SPA' : 'Barman Barbería'}</p>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
              <EmptyStateData
                title="No hay servicios populares"
                description="No se encontraron servicios populares para mostrar. Los servicios más vendidos aparecerán aquí."
              />
            )}
          </div>
        </div>

        {/* Customer bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
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
                              const newCustomer = {
                                id: `new-${Date.now()}`,
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

        {/* --- INICIO DEL GRID PRINCIPAL --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* COLUMNA IZQUIERDA: Buscador e Items */}
          <div className="md:col-span-1 lg:col-span-2 space-y-4">

            {/* Item Search */}
            <section className="relative rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-6 z-20">
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

                <div className="relative z-20" ref={itemSearchRef}>
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
                    <div className="absolute z-[9999] mt-2 w-full overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-white shadow-xl" style={{ maxHeight: '400px' }}>
                      <div className="max-h-80 overflow-y-auto">
                        {/* Services */}
                        {searchServices.length > 0 && (
                          <div>
                            <div className="px-4 py-3 text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider border-b border-[var(--unit-border)]/30">Servicios</div>
                            {searchServices.map((s: { id: string; name: string; price?: unknown; unit: string; priceType?: string; minPrice?: number; maxPrice?: number; requiresApproval?: boolean }) => (
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
                            <div className="px-4 py-3 text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider border-b border-[var(--unit-border)]/30">Productos</div>
                            {searchProducts.filter((p: { salePrice: number | null }) => p.salePrice).map((p: { id: string; name: string; salePrice: number }) => (
                              <button
                                key={p.id}
                                type="button"
                                className="group w-full px-4 py-3 text-left text-[var(--unit-text)] transition-colors hover:bg-[var(--unit-accent)]/10"
                                onClick={() => addProductToCart(p)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{p.name}</span>
                                  <span className="text-[var(--unit-accent)] font-bold group-hover:text-[var(--unit-text)]">S/ {p.salePrice}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {/* Packages */}
                        {searchPackages.length > 0 && (
                          <div>
                            <div className="px-4 py-3 text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider border-b border-[var(--unit-border)]/30">Paquetes</div>
                            {searchPackages.map((p: { id: string; name: string; fixedPrice: number }) => (
                              <button
                                key={p.id}
                                type="button"
                                className="group w-full px-4 py-3 text-left text-[var(--unit-text)] transition-colors hover:bg-[var(--unit-accent)]/10"
                                onClick={() => addPackageToCart(p)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{p.name}</span>
                                  <span className="text-[var(--unit-accent)] font-bold group-hover:text-[var(--unit-text)]">S/ {p.fixedPrice}</span>
                                </div>
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
            <section className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-6 z-10">
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
                  {servicesForUnit.map((s: { id: string; name: string; price?: unknown; unit: string; priceType?: string; minPrice?: number; maxPrice?: number; requiresApproval?: boolean }) => (
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
            <section className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-6 z-10">
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
            <section className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-6 z-10">
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

          </div> {/* CIERRE DE COLUMNA IZQUIERDA */}

          {/* COLUMNA DERECHA: Carrito */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
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
                    {user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST' ? (
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
                    ) : null}
                  </>
                )}
              </div>

              {/* Enhanced Ticket footer */}
              <div className="border-t border-dashed border-[var(--unit-border)] bg-[var(--unit-surface)] px-6 py-4 space-y-3">
                <div className="text-center">
                  <span className="text-xs font-bold text-[var(--unit-text-muted)] uppercase tracking-wider">
                    {unit === 'BARBERIA' ? 'Barman Barbería' : 'SPA'}
                  </span>
                </div>

                {selectedCustomer && (
                  <div className="text-center">
                    <span className="text-xs font-medium text-[var(--unit-text)]">
                      Cliente: {selectedCustomer.name}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-xs text-[var(--unit-text-muted)]">
                  <span>Subtotal</span>
                  <span className="tabular-nums">S/ {subtotalCart.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-red-500">
                    <span>Descuentos</span>
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
                  disabled={cart.length === 0 || createSaleMutation.isPending || (discountAmount > 0 && !discountReason.trim()) || hasPendingApprovals}
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
                      {hasPendingApprovals ? 'Esperando aprobación' : 'Crear venta'}
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
          </div> {/* CIERRE DE COLUMNA DERECHA */}
        </div> {/* CIERRE DEL GRID PRINCIPAL */}

        {/* --- INICIO DE MODALES --- */}

        {/* Sale Closed Modal */}
        {lastClosedSale && (
          <div className="fixed inset-0 z-10 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-md p-0 sm:p-4">
            <div className="w-full max-w-sm rounded-t-[calc(var(--unit-border-radius)*1.5)] sm:rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/98 to-white/95 backdrop-blur-sm shadow-xl p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-30">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>

              <div className="relative z-10 mx-auto mb-6 h-1 w-10 rounded-full bg-[var(--unit-text)]/20 sm:hidden" />

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
                  <p className="text-sm font-medium text-[var(--unit-accent)]">{lastClosedSale?.saleNumber || ''}</p>
                  <div className="relative inline-block">
                    <p className="text-3xl font-bold text-emerald-600 tabular-nums">S/ {lastClosedSale?.total?.toFixed(2) || '0.00'}</p>
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const data: ReceiptSaleData = {
                      ...lastClosedSale!,
                      saleNumber: lastClosedSale?.saleNumber || '',
                      unit: lastClosedSale?.unit || '',
                      businessName: businessConfig?.businessName || '',
                      businessAddress: businessConfig?.businessAddress || '',
                      businessPhone: businessConfig?.businessPhone || '',
                      businessLogo: lastClosedSale?.unit === 'BARBERIA'
                        ? (businessConfig?.barberiaLogo || '/logo-barberia.png')
                        : (businessConfig?.spaLogo || '/logo-spa.png'),
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
          <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-md p-0 sm:p-4">
            <div className="w-full max-w-md rounded-t-[calc(var(--unit-border-radius)*1.5)] sm:rounded-[var(--unit-border-radius)] border border-[var(--unit-border)] bg-[var(--unit-surface)] p-5 sm:p-6 shadow-[var(--unit-shadow-lg)]">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--unit-text)]/20 sm:hidden" />
              <p className="mb-3 text-xs text-[var(--unit-text-muted)]">Vista previa del comprobante</p>
              <iframe
                ref={receiptIframeRef}
                srcDoc={receiptHtmlToPrint || ''}
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
              <div className="absolute inset-0 opacity-30">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>

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
                      <p className="text-base font-bold text-[var(--unit-text)]">{selectedServiceForEmployee?.name || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--unit-border)]/30">
                    <span className="text-sm text-[var(--unit-text-muted)]">Precio:</span>
                    <span className="text-lg font-bold text-[var(--unit-accent)]">
                      S/ {(() => {
                        if (!selectedServiceForEmployee) return '0.00';
                        
                        // Si tiene customPrice (aprobación solicitada), mostrar ese precio
                        if (selectedServiceForEmployee.customPrice) {
                          return Number(selectedServiceForEmployee.customPrice).toFixed(2);
                        }
                        
                        // Si no, mostrar el precio base
                        const price = typeof selectedServiceForEmployee.price === 'number' 
                          ? selectedServiceForEmployee.price 
                          : Number(selectedServiceForEmployee.price || 0);
                        return price.toFixed(2);
                      })()}
                    </span>
                  </div>
                </div>

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
                          onClick={() => {
                            if (!selectedServiceForEmployee) return;
                            // ✅ Verificar si ya existe un item pendiente de aprobación para este servicio
                            const existingItem = cart.find(item =>
                              item.referenceId === selectedServiceForEmployee.id &&
                              item.requiresApproval
                            );

                            console.log('🔍 Employee Modal Debug:', {
                              selectedServiceId: selectedServiceForEmployee.id,
                              cartItems: cart,
                              existingItem,
                              requiresApproval: selectedServiceForEmployee.requiresApproval
                            });

                            if (existingItem) {
                              // ✅ Actualizar item existente con employeeId
                              updateCartItemWithEmployee(selectedServiceForEmployee.id, employee.id);
                            } else {
                              // ✅ Agregar nuevo item (flujo normal)
                              isPackageSelection
                                ? addPackageToCartWithEmployee(selectedServiceForEmployee, employee.id)
                                : addServiceToCartWithEmployee(selectedServiceForEmployee, employee.id);
                            }
                          }}
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

        {/* Sale Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showSaleConfirmDialog}
          onClose={() => setShowSaleConfirmDialog(false)}
          onCancel={() => setShowSaleConfirmDialog(false)}
          onConfirm={() => setShowSaleConfirmDialog(false)}
          title="¡Venta Confirmada!"
          message={`Venta ${lastClosedSale?.saleNumber || ''} procesada exitosamente por S/ ${lastClosedSale?.total?.toFixed(2) || '0.00'}. Método de pago: ${lastClosedSale?.paymentMethod || 'Efectivo'}.`}
          type="success"
          confirmText="Aceptar confirmación"
          cancelText=""
          isLoading={false}
        />

        {/* Cash Register Warning Modal */}
        {showCashRegisterWarning && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
                <Lock className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">
                Caja Cerrada
              </h3>
              <p className="text-gray-600 text-center mb-8">
                No hay una caja abierta para {unit === 'SPA' ? 'SPA' : 'Barbería'}.
                Debes abrir la caja antes de poder realizar ventas.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCashRegisterWarning(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Entendido
                </button>
                <Link
                  href="/cash-register"
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors text-center"
                >
                  Abrir Caja
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Variable Price Modal */}
        {showVariablePriceModal && selectedServiceForPrice && (
          <VariablePriceModal
            service={selectedServiceForPrice!}
            isOpen={showVariablePriceModal}
            onClose={() => {
              setShowVariablePriceModal(false);
              setSelectedServiceForPrice(null);
            }}
            onPriceConfirm={handleVariablePriceConfirm}
            onApprovalRequest={handleApprovalRequest}
          />
        )}

      </div>
    </div>
  );
}
