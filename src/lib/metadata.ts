import type { Metadata } from 'next';

// Títulos de página por ruta
const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/appointments': 'Citas',
  '/clients': 'Clientes',
  '/pos': 'Punto de Venta',
  '/cash-register': 'Caja',
  '/inventory': 'Inventario',
  '/services': 'Servicios',
  '/packages': 'Paquetes',
  '/commissions': 'Comisiones',
  '/reports': 'Reportes',
  '/expenses': 'Gastos',
  '/income': 'Ingresos',
  '/admin': 'Administración',
  '/admin/users': 'Usuarios',
  '/admin/audit': 'Auditoría',
  '/admin/backups': 'Respaldo',
};

// Títulos para subrutas específicas
const SUBPAGE_TITLES: Record<string, string> = {
  // Clientes
  '/clients/new': 'Nuevo Cliente',
  '/products': 'Productos',
  '/products/new': 'Nuevo Producto',
  '/suppliers': 'Proveedores',
  '/suppliers/new': 'Nuevo Proveedor',
  
  // Citas
  '/appointments/new': 'Nueva Cita',
  
  // Servicios
  '/services/new': 'Nuevo Servicio',
  '/packages/new': 'Nuevo Paquete',
  
  // Inventario
  '/inventory/alerts': 'Alertas de Vencimiento',
  '/inventory/entry': 'Entrada de Inventario',
  '/inventory/movements': 'Historial de Movimientos',
  '/inventory/use': 'Uso Interno',
  '/inventory/movements/internal-use': 'Uso Interno',
  
  // Reportes
  '/reports/overview': 'Reporte General',
  '/reports/appointments': 'Reporte de Citas',
  '/reports/cash': 'Reporte de Caja',
  '/reports/clients': 'Reporte de Clientes',
  '/reports/commissions': 'Reporte de Comisiones',
  '/reports/detailed': 'Reportes Particulares',
  '/reports/inventory': 'Reporte de Inventario',
  '/reports/sales': 'Reporte de Ventas',
  '/reports/scheduled': 'Citas Programadas',
  '/reports/services': 'Reporte de Servicios',
};

// Descripciones por ruta
const PAGE_DESCRIPTIONS: Record<string, string> = {
  '/': 'Panel principal de control del sistema',
  '/dashboard': 'Panel principal de control del sistema',
  '/appointments': 'Gestión de citas y agendamiento',
  '/clients': 'Administración de clientes del sistema',
  '/pos': 'Punto de venta para procesar transacciones',
  '/cash-register': 'Gestión de caja y movimientos financieros',
  '/inventory': 'Control de inventario y productos',
  '/services': 'Catálogo de servicios disponibles',
  '/packages': 'Administración de paquetes y promociones',
  '/commissions': 'Gestión de comisiones del personal',
  '/reports': 'Reportes y análisis del negocio',
  '/expenses': 'Control de gastos y egresos',
  '/income': 'Registro de ingresos y ventas',
  '/admin': 'Panel de administración del sistema',
  '/admin/users': 'Gestión de usuarios y permisos',
  '/admin/audit': 'Registro de auditoría del sistema',
  '/admin/backups': 'Gestión de respaldos de datos',
};

/**
 * Genera metadata dinámica para una ruta específica
 */
export function createPageMetadata(pathname: string): Metadata {
  // Buscar título específico primero
  let title = SUBPAGE_TITLES[pathname];
  
  // Si no hay título específico, buscar título de ruta padre
  if (!title) {
    // Para rutas con IDs dinámicos, usar título del padre
    const segments = pathname.split('/').filter(Boolean);
    for (let i = segments.length; i > 0; i--) {
      const parentPath = '/' + segments.slice(0, i).join('/');
      if (PAGE_TITLES[parentPath]) {
        title = PAGE_TITLES[parentPath];
        break;
      }
    }
  }
  
  // Si aún no hay título, usar uno genérico
  if (!title) {
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    
    if (lastSegment === 'edit') {
      const parentPath = '/' + segments.slice(0, -1).join('/');
      const parentTitle = PAGE_TITLES[parentPath];
      title = parentTitle ? `Editar ${parentTitle}` : 'Editar';
    } else if (/^[0-9a-f-]{36}$/i.test(lastSegment) || (lastSegment && lastSegment.length > 20 && !PAGE_TITLES[pathname])) {
      const parentPath = '/' + segments.slice(0, -1).join('/');
      const parentTitle = PAGE_TITLES[parentPath];
      title = parentTitle ? `Detalle de ${parentTitle}` : 'Detalle';
    } else if (lastSegment) {
      title = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
    } else {
      title = 'Página';
    }
  }
  
  // Buscar descripción
  let description = PAGE_DESCRIPTIONS[pathname] || SUBPAGE_TITLES[pathname];
  if (!description) {
    // Buscar descripción de ruta padre
    const segments = pathname.split('/').filter(Boolean);
    for (let i = segments.length; i > 0; i--) {
      const parentPath = '/' + segments.slice(0, i).join('/');
      if (PAGE_DESCRIPTIONS[parentPath]) {
        description = PAGE_DESCRIPTIONS[parentPath];
        break;
      }
    }
  }
  
  // Si no hay descripción, usar una genérica
  if (!description) {
    description = `Gestión de ${title.toLowerCase()} en el sistema Barbería y Spa POS`;
  }
  
  return {
    title: `${title} - VersatPOS` as string,
    description: `${description} - Sistema de gestión para barberías y spas` as string,
    openGraph: {
      title: `${title} - VersatPOS`,
      description: `${description} - Sistema de gestión para barberías y spas`,
      type: 'website',
      siteName: 'VersatPOS',
    },
    twitter: {
      card: 'summary',
      title: `${title} - VersatPOS`,
      description: `${description} - Sistema de gestión para barberías y spas`,
    },
  };
}

/**
 * Genera título simple para uso interno
 */
export function getPageTitle(pathname: string): string {
  const metadata = createPageMetadata(pathname);
  return (metadata.title || 'VersatPOS') as string;
}
