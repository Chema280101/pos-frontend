'use client';

import { useState, useMemo } from 'react';
import { Search, Package, Scissors, Box } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { ServiceOption, ProductOption, PackageOption, CartItem, BusinessUnit } from '@/types/pos';

interface ItemSelectorProps {
  unit: BusinessUnit;
  search: string;
  onSearchChange: (value: string) => void;
  onAddToCart: (item: ServiceOption | ProductOption | PackageOption) => void;
  onAddServiceWithEmployee: (service: ServiceOption, employeeId: string) => void;
  selectedServiceForEmployee: ServiceOption | null;
  onSelectServiceForEmployee: (service: ServiceOption | null) => void;
  isPackageSelection: boolean;
  setIsPackageSelection: (value: boolean) => void;
  employees: Array<{ id: string; name: string }>;
}

export function ItemSelector({
  unit,
  search,
  onSearchChange,
  onAddToCart,
  onAddServiceWithEmployee,
  selectedServiceForEmployee,
  onSelectServiceForEmployee,
  isPackageSelection,
  setIsPackageSelection,
  employees
}: ItemSelectorProps) {
  const debouncedSearch = search.trim();

  // Queries para items
  const { data: servicesResponse } = useQuery({
    queryKey: ['services', unit, debouncedSearch],
    queryFn: async () => {
      const { data } = await api.get(`/api/services?unit=${unit}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''}`);
      return data;
    },
    enabled: debouncedSearch.length >= 2 || debouncedSearch.length === 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const { data: productsResponse } = useQuery({
    queryKey: ['inventory-products', unit, debouncedSearch],
    queryFn: async () => {
      const { data } = await api.get(`/api/inventory/products?unit=${unit}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''}`);
      return data;
    },
    enabled: debouncedSearch.length >= 2 || debouncedSearch.length === 0,
    staleTime: 5 * 60 * 1000,
  });

  const { data: packagesResponse } = useQuery({
    queryKey: ['packages', debouncedSearch],
    queryFn: async () => {
      const { data } = await api.get(`/api/packages${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ''}`);
      return data;
    },
    enabled: debouncedSearch.length >= 2 || debouncedSearch.length === 0,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Extraer arrays de respuesta
  const services = Array.isArray(servicesResponse?.data) ? servicesResponse.data : Array.isArray(servicesResponse) ? servicesResponse : [];
  const products = Array.isArray(productsResponse?.data) ? productsResponse.data : Array.isArray(productsResponse) ? productsResponse : [];
  const packages = Array.isArray(packagesResponse?.data) ? packagesResponse.data : Array.isArray(packagesResponse) ? packagesResponse : [];

  // Filtrar por unidad
  const servicesForUnit = services.filter((s: { unit: string }) => s.unit === unit);
  const productsForSale = products.filter((p: { salePrice: number | null; type: string }) => 
    (p.salePrice != null && p.salePrice > 0) && (p.type === 'FOR_SALE' || p.type === 'BOTH')
  );

  const hasResults = servicesForUnit.length > 0 || productsForSale.length > 0 || packages.length > 0;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--unit-text-muted)]" />
        <input
          type="text"
          placeholder="Buscar servicios, productos o paquetes..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 text-[var(--unit-text)] placeholder-[var(--unit-text-muted)] focus:outline-none focus:border-[var(--unit-accent)]/50 focus:ring-2 focus:ring-[var(--unit-accent)]/20 transition-all"
        />
      </div>

      {/* Results */}
      {hasResults ? (
        <div className="max-h-96 overflow-y-auto space-y-4">
          {/* Services */}
          {servicesForUnit.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-[var(--unit-text-muted)] uppercase tracking-wider">
                Servicios
              </div>
              <div className="space-y-2">
                {servicesForUnit.map((service: ServiceOption) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      if (service.durationMin) {
                        onSelectServiceForEmployee(service);
                        setIsPackageSelection(false);
                      } else {
                        onAddToCart(service);
                      }
                    }}
                    className="w-full flex items-center gap-3 rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 p-3 transition-all hover:scale-[1.02] hover:border-[var(--unit-accent)]/50 hover:shadow-md"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--unit-accent)]/10">
                      <Scissors className="h-4 w-4 text-[var(--unit-accent)]" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-[var(--unit-text)]">{service.name}</p>
                      {service.durationMin && (
                        <p className="text-xs text-[var(--unit-text-muted)]">{service.durationMin} min</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--unit-accent)]">
                        S/ {typeof service.price === 'number' ? service.price.toFixed(2) : Number(service.price).toFixed(2)}
                      </p>
                      {service.durationMin && (
                        <p className="text-xs text-[var(--unit-text-muted)]">Seleccionar empleado</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {productsForSale.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-[var(--unit-text-muted)] uppercase tracking-wider">
                Productos
              </div>
              <div className="space-y-2">
                {productsForSale.map((product: ProductOption) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => onAddToCart(product)}
                    className="w-full flex items-center gap-3 rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 p-3 transition-all hover:scale-[1.02] hover:border-[var(--unit-accent)]/50 hover:shadow-md"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--unit-accent)]/10">
                      <Box className="h-4 w-4 text-[var(--unit-accent)]" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-[var(--unit-text)]">{product.name}</p>
                      {product.stock !== undefined && (
                        <p className="text-xs text-[var(--unit-text-muted)]">Stock: {product.stock}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--unit-accent)]">
                        S/ {product.salePrice?.toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Packages */}
          {packages.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-[var(--unit-text-muted)] uppercase tracking-wider">
                Paquetes
              </div>
              <div className="space-y-2">
                {packages.map((pkg: PackageOption) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => {
                      onSelectServiceForEmployee(null);
                      setIsPackageSelection(true);
                    }}
                    className="w-full flex items-center gap-3 rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/90 p-3 transition-all hover:scale-[1.02] hover:border-[var(--unit-accent)]/50 hover:shadow-md"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--unit-accent)]/10">
                      <Package className="h-4 w-4 text-[var(--unit-accent)]" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-[var(--unit-text)]">{pkg.name}</p>
                      {pkg.services && pkg.services.length > 0 && (
                        <p className="text-xs text-[var(--unit-text-muted)]">
                          {pkg.services.length} servicios incluidos
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--unit-accent)]">
                        S/ {typeof pkg.fixedPrice === 'number' ? pkg.fixedPrice.toFixed(2) : Number(pkg.fixedPrice).toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-sm text-[var(--unit-text-muted)]">Sin resultados</p>
          <p className="text-xs text-[var(--unit-text-muted)] mt-1">
            {debouncedSearch.length >= 2 
              ? 'No se encontraron items con esa búsqueda' 
              : 'Escribe al menos 2 caracteres para buscar'}
          </p>
        </div>
      )}
    </div>
  );
}
