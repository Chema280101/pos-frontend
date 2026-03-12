'use client';

import { usePathname } from 'next/navigation';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';
import { Home, Package, Users, Calendar, DollarSign, FileText, Settings, BarChart3, User, Shield, Database, ChevronRight, Building2, Scissors, Sparkles, Activity, AlertTriangle } from 'lucide-react';

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  clients: 'Clientes',
  new: 'Nuevo',
  appointments: 'Agenda',
  pos: 'POS',
  'cash-register': 'Caja',
  inventory: 'Inventario',
  products: 'Productos',
  suppliers: 'Proveedores',
  movements: 'Historial de Movimientos',
  use: 'Uso interno',
  entry: 'Entrada',
  services: 'Servicios',
  packages: 'Paquetes',
  commissions: 'Comisiones',
  admin: 'Administración',
  reports: 'Reportes',
  alerts: 'Alertas de Vencimiento',
  appointments_report: 'Citas',
  cash: 'Caja',
  scheduled: 'Programados',
  users: 'Usuarios',
  audit: 'Auditoría',
  backups: 'Backups',
  expenses: 'Gastos',
  income: 'Ingresos',
  detailed: 'Particulares',
};

const SEGMENT_ICONS: Record<string, any> = {
  dashboard: BarChart3,
  clients: Users,
  new: Sparkles,
  appointments: Calendar,
  pos: DollarSign,
  'cash-register': DollarSign,
  inventory: Package,
  products: Package,
  suppliers: Building2,
  movements: Activity,
  alerts: AlertTriangle,
  use: Package,
  entry: Package,
  services: Scissors,
  packages: Package,
  commissions: DollarSign,
  admin: Settings,
  reports: FileText,
  sales: DollarSign,
  appointments_report: Calendar,
  cash: DollarSign,
  scheduled: Calendar,
  users: User,
  audit: Shield,
  backups: Database,
};

function getLabel(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment;
}

/**
 * Genera items de breadcrumb desde el pathname actual.
 * Rutas dinámicas [id] se muestran como "Detalle" o "Editar" según el segmento siguiente.
 */
export function AppBreadcrumbs(): JSX.Element {
  const pathname = usePathname();
  if (!pathname || pathname === '/') return <></>;

  const segments = pathname.split('/').filter(Boolean);
  
  // Agregar "Home" como primer elemento
  const items: BreadcrumbItem[] = [
    { label: 'Inicio', href: '/', icon: Home }
  ];
  
  // Agregar los segmentos de la ruta
  segments.forEach((segment, i) => {
    const isLast = i === segments.length - 1;
    const href = isLast ? undefined : `/${segments.slice(0, i + 1).join('/')}`;
    let label = getLabel(segment);
    let icon = SEGMENT_ICONS[segment] || FileText;
    
    // Special case for inventory page
    if (segment === 'products' && segments[i - 1] === 'inventory') {
      label = 'Productos';
      icon = Package;
    } else if (segment === 'suppliers' && segments[i - 1] === 'inventory') {
      label = 'Proveedores';
      icon = Building2;
    } else if (segment === 'edit' && segments[i - 1]) {
      label = 'Editar';
      icon = Settings;
    } else if (/^[0-9a-f-]{36}$/i.test(segment) || (segment.length > 20 && !SEGMENT_LABELS[segment])) {
      label = isLast && segments[i - 1] === 'clients' ? 'Detalle' : 'Detalle';
      icon = FileText;
    }
    
    items.push({ label, href: href as string | undefined, icon: icon! });
  });

  if (items.length === 1) return <></>;

  return (
    <div className="relative overflow-hidden border-2 border-[var(--unit-border)]/30 bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-sm shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-50"></div>
      <div className="relative px-6 py-4">
        <Breadcrumbs items={items} />
      </div>
    </div>
  );
}
