import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable } from '@/components/ui/DataTable';
import { Edit, Eye, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: { name: string };
  type: string;
  unit: 'SPA' | 'BARBERIA';
  stock: number;
  minStock: number;
  maxStock: number;
  unitPrice: number;
  unitCost: number;
  totalSold: number;
  revenue: number;
  lastSale?: string;
  createdAt: string;
  updatedAt: string;
}

interface InventoryReportProps {
  unit: string;
  dateFrom: Date;
  dateTo: Date;
  compact?: boolean;
}

export function InventoryReport({ unit, dateFrom, dateTo, compact = false }: InventoryReportProps): JSX.Element {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['report-inventory', unit, dateFrom, dateTo],
    queryFn: async (): Promise<Product[]> => {
      const params = new URLSearchParams({
        unit: unit || '',
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
      });
      const { data } = await api.get<Product[]>(`/api/reports/inventory?${params}`);
      return data;
    },
  });

  const columns = [
    {
      key: 'name',
      header: 'Producto',
      sortable: true,
      render: (row: Product) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-[var(--unit-text-muted)]" />
          <div>
            <div className="font-medium">{row.name}</div>
            {row.sku && (
              <div className="text-xs text-[var(--unit-text-muted)]">SKU: {row.sku}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      render: (row: Product) => {
        const categoryName = row.category?.name || 'Sin categoría';
        
        // Assign colors based on category name
        const getCategoryColor = (name: string) => {
          const lowerName = name.toLowerCase();
          
          // SPA Categories
          if (lowerName.includes('facial') || lowerName.includes('cara')) return 'bg-pink-100 text-pink-800';
          if (lowerName.includes('masaje') || lowerName.includes('relaj') || lowerName.includes('corporal')) return 'bg-purple-100 text-purple-800';
          if (lowerName.includes('manicur') || lowerName.includes('uña') || lowerName.includes('mano')) return 'bg-blue-100 text-blue-800';
          if (lowerName.includes('pedicur') || lowerName.includes('pie')) return 'bg-indigo-100 text-indigo-800';
          if (lowerName.includes('depil') || lowerName.includes('cera') || lowerName.includes('laser')) return 'bg-red-100 text-red-800';
          if (lowerName.includes('tratamient') || lowerName.includes('terapia')) return 'bg-green-100 text-green-800';
          
          // Barbería Categories
          if (lowerName.includes('corte') || lowerName.includes('cabello') || lowerName.includes('peinado')) return 'bg-amber-100 text-amber-800';
          if (lowerName.includes('barba') || lowerName.includes('bigote') || lowerName.includes('facial')) return 'bg-orange-100 text-orange-800';
          if (lowerName.includes('tinte') || lowerName.includes('color') || lowerName.includes('decap')) return 'bg-teal-100 text-teal-800';
          
          // Product Categories
          if (lowerName.includes('shampoo') || lowerName.includes('acondicionador')) return 'bg-cyan-100 text-cyan-800';
          if (lowerName.includes('crema') || lowerName.includes('loción')) return 'bg-lime-100 text-lime-800';
          if (lowerName.includes('aceite') || lowerName.includes('serum')) return 'bg-emerald-100 text-emerald-800';
          if (lowerName.includes('máscara') || lowerName.includes('tratamiento')) return 'bg-violet-100 text-violet-800';
          
          // Default colors
          if (lowerName === 'sin categoría') return 'bg-gray-100 text-gray-800';
          return 'bg-sky-100 text-sky-800';
        };
        
        if (categoryName === '—') {
          return <span className="text-[var(--unit-text-muted)]">—</span>;
        }
        
        return (
          <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            getCategoryColor(categoryName)
          )}>
            {categoryName}
          </span>
        );
      },
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (row: Product) => (
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          row.type === 'SERVICE' ? 'bg-blue-100 text-blue-800' :
          row.type === 'PRODUCT' ? 'bg-green-100 text-green-800' :
          'bg-purple-100 text-purple-800'
        )}>
          {row.type === 'SERVICE' ? 'Servicio' : row.type === 'PRODUCT' ? 'Producto' : 'Paquete'}
        </span>
      ),
    },
    {
      key: 'unit',
      header: 'Unidad',
      render: (row: Product) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          row.unit === 'SPA'
            ? 'bg-purple-100 text-purple-800'
            : 'bg-amber-100 text-amber-800'
        )}>
          {row.unit === 'BARBERIA' ? 'Barbería' : 'SPA'}
        </span>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: true,
      render: (row: Product) => (
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-medium',
            row.stock < row.minStock ? 'text-red-600' :
            row.stock > row.maxStock ? 'text-amber-600' :
            'text-green-600'
          )}>
            {row.stock}
          </span>
          {row.stock < row.minStock && (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
        </div>
      ),
    },
    {
      key: 'stockStatus',
      header: 'Estado Stock',
      render: (row: Product) => {
        const status = row.stock < row.minStock ? 'BAJO' : 
                     row.stock > row.maxStock ? 'EXCESO' : 'OK';
        return (
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            status === 'BAJO' ? 'bg-red-100 text-red-800' :
            status === 'EXCESO' ? 'bg-amber-100 text-amber-800' :
            'bg-green-100 text-green-800'
          )}>
            {status}
          </span>
        );
      },
    },
    {
      key: 'unitPrice',
      header: 'Precio Unit.',
      sortable: true,
      render: (row: Product) => (
        <span className="font-medium">S/ {row.unitPrice.toFixed(2)}</span>
      ),
    },
    {
      key: 'totalSold',
      header: 'Vendidos',
      sortable: true,
      render: (row: Product) => (
        <div className="flex items-center gap-1">
          <span className="font-medium">{row.totalSold}</span>
          {row.totalSold > 0 && <TrendingUp className="h-3 w-3 text-green-600" />}
        </div>
      ),
    },
    {
      key: 'revenue',
      header: 'Ingresos',
      sortable: true,
      render: (row: Product) => (
        <span className="font-medium">S/ {row.revenue.toFixed(2)}</span>
      ),
    },
    {
      key: 'lastSale',
      header: 'Última Venta',
      sortable: true,
      render: (row: Product) => (
        <div className="text-sm">
          {row.lastSale ? format(new Date(row.lastSale), 'd MMM yyyy', { locale: es }) : 'Nunca'}
        </div>
      ),
    },
  ];

  const actions = [
    {
      label: 'Ver',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Product) => {
        // TODO: Implement view product functionality
      },
      className: 'text-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/10',
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: Product) => {
        // TODO: Implement edit product functionality
      },
      className: 'text-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/10',
    },
  ];

  const filters = [
    {
      key: 'unit',
      label: 'Unidad',
      type: 'select' as const,
      options: [
        { label: 'Todas', value: '' },
        { label: 'SPA', value: 'SPA' },
        { label: 'Barbería', value: 'BARBERIA' },
      ],
    },
    {
      key: 'type',
      label: 'Tipo',
      type: 'select' as const,
      options: [
        { label: 'Todos', value: '' },
        { label: 'Servicios', value: 'SERVICE' },
        { label: 'Productos', value: 'PRODUCT' },
        { label: 'Paquetes', value: 'PACKAGE' },
      ],
    },
    {
      key: 'stockStatus',
      label: 'Estado Stock',
      type: 'select' as const,
      options: [
        { label: 'Todos', value: '' },
        { label: 'Stock Bajo', value: 'LOW' },
        { label: 'Stock Óptimo', value: 'OK' },
        { label: 'Stock Excesivo', value: 'HIGH' },
        { label: 'Sin Stock', value: 'ZERO' },
      ],
    },
    {
      key: 'priceRange',
      label: 'Rango de Precio',
      type: 'select' as const,
      options: [
        { label: 'Todos', value: '' },
        { label: 'Menos de S/ 10', value: '0-10' },
        { label: 'S/ 10 - S/ 50', value: '10-50' },
        { label: 'S/ 50 - S/ 100', value: '50-100' },
        { label: 'S/ 100 - S/ 500', value: '100-500' },
        { label: 'Más de S/ 500', value: '500+' },
      ],
    },
    {
      key: 'salesPerformance',
      label: 'Rendimiento',
      type: 'select' as const,
      options: [
        { label: 'Todos', value: '' },
        { label: 'Sin Ventas', value: 'NONE' },
        { label: 'Bajas Ventas (0-10)', value: 'LOW' },
        { label: 'Ventas Medias (10-50)', value: 'MEDIUM' },
        { label: 'Altas Ventas (50+)', value: 'HIGH' },
      ],
    },
    {
      key: 'hasSales',
      label: 'Con Ventas',
      type: 'checkbox' as const,
    },
    {
      key: 'lowStock',
      label: 'Stock Crítico',
      type: 'checkbox' as const,
    },
    {
      key: 'recentSales',
      label: 'Ventas Recientes (30 días)',
      type: 'checkbox' as const,
    },
  ];

  const displayData = compact ? products.slice(0, 5) : products;

  return (
    <div>
      <DataTable
        columns={columns}
        data={displayData}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        searchPlaceholder="Buscar por nombre, SKU, categoría..."
        filters={filters}
        actions={!compact ? actions : []}
        emptyMessage="No hay productos en el período seleccionado. Intenta ajustar las fechas o los filtros de categoría."
        pageSize={compact ? 5 : 20}
        maxHeight={compact ? "300px" : "500px"}
        pageSizeOptions={compact ? [5] : [10, 20, 50, 100]}
      />
      {compact && products.length > 5 && (
        <div className="mt-4 text-center">
          <a href="/reports/inventory" className="text-[var(--unit-accent)] hover:underline">
            Ver todos los productos ({products.length} total)
          </a>
        </div>
      )}
    </div>
  );
}
