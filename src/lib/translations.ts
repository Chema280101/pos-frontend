// Sistema de traducciones centralizadas para datos técnicos del sistema
// Traduce valores del backend que aparecen en la interfaz de usuario

// Traducciones de entidades del sistema
export const ENTITY_LABELS: Record<string, string> = {
  // Usuarios y roles
  'User': 'Usuario',
  'Role': 'Rol',
  'Permission': 'Permiso',
  'Unit': 'Unidad',
  
  // Negocio
  'Sale': 'Venta',
  'Appointment': 'Cita',
  'Client': 'Cliente',
  'Service': 'Servicio',
  'Product': 'Producto',
  'Package': 'Paquete',
  'Category': 'Categoría',
  'Supplier': 'Proveedor',
  
  // Finanzas
  'CashRegister': 'Caja',
  'Commission': 'Comisión',
  'Expense': 'Gasto',
  'Income': 'Ingreso',
  'Payment': 'Pago',
  
  // Inventario
  'Inventory': 'Inventario',
  'Stock': 'Stock',
  'StockMovement': 'Movimiento de Stock',
  
  // Reportes y auditoría
  'Report': 'Reporte',
  'Audit': 'Auditoría',
  'Backup': 'Respaldo',
  'Setting': 'Configuración',
  
  // Seguridad y sistema
  'FAILED_ATTEMPT': 'Intento Fallido',
  'SECURITY_ALERT': 'Alerta de Seguridad',
  'SYSTEM_ERROR': 'Error del Sistema',
  'Session': 'Sesión',
  'Login': 'Inicio de Sesión',
  'Logout': 'Cierre de Sesión',
};

// Traducciones de roles de usuario
export const ROLE_LABELS: Record<string, string> = {
  'ADMIN': 'Administrador',
  'RECEPTIONIST': 'Recepcionista',
  'SPA_SPECIALIST': 'Especialista SPA',
  'BARBER': 'Barbero',
  'BEAUTICIAN': 'Esteticista',
  'MANAGER': 'Gerente',
};

// Traducciones de unidades de negocio
export const UNIT_LABELS: Record<string, string> = {
  'SPA': 'SPA',
  'BARBERIA': 'Barbería',
  'CONSOLIDATED': 'Consolidado',
};

// Traducciones de estados de citas
export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  'SCHEDULED': 'Programada',
  'CONFIRMED': 'Confirmada',
  'IN_PROGRESS': 'En curso',
  'COMPLETED': 'Completada',
  'CANCELLED': 'Cancelada',
  'NO_SHOW': 'No asistió',
  'RESCHEDULED': 'Reprogramada',
};

// Traducciones de estados de ventas
export const SALE_STATUS_LABELS: Record<string, string> = {
  'PENDING': 'Pendiente',
  'PAID': 'Pagada',
  'CANCELLED': 'Cancelada',
  'REFUNDED': 'Reembolsada',
  'COMPLETED': 'Completada',
};

// Traducciones de estados de comisiones
export const COMMISSION_STATUS_LABELS: Record<string, string> = {
  'PENDING': 'Pendiente',
  'APPROVED': 'Aprobada',
  'PAID': 'Pagada',
  'REJECTED': 'Rechazada',
  'CANCELLED': 'Cancelada',
};

// Traducciones de métodos de pago
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  'CASH': 'Efectivo',
  'CARD': 'Tarjeta',
  'TRANSFER': 'Transferencia',
  'DIGITAL_WALLET': 'Billetera Digital',
  'YAPE': 'Yape',
  'PLIN': 'Plin',
  'MIXED': 'Mixto',
  'CREDIT': 'Crédito',
  'DEBIT': 'Débito',
};

// Traducciones de estados de usuario
export const USER_STATUS_LABELS: Record<string, string> = {
  'ACTIVE': 'Activo',
  'INACTIVE': 'Inactivo',
  'LOCKED': 'Bloqueado',
  'SUSPENDED': 'Suspendido',
  'PENDING': 'Pendiente',
  'MUST_CHANGE_PASSWORD': 'Debe cambiar contraseña',
};

// Traducciones de estados de caja
export const CASH_REGISTER_STATUS_LABELS: Record<string, string> = {
  'OPEN': 'Abierta',
  'CLOSED': 'Cerrada',
  'PENDING_CLOSE': 'Pendiente de Cierre',
  'REOPENED': 'Reabierta',
};

// Traducciones de tipos de movimiento de inventario
export const INVENTORY_MOVEMENT_TYPE_LABELS: Record<string, string> = {
  'IN': 'Entrada',
  'OUT': 'Salida',
  'ADJUSTMENT': 'Ajuste',
  'RETURN': 'Devolución',
  'TRANSFER': 'Transferencia',
  'LOSS': 'Pérdida',
  'DAMAGE': 'Daño',
};

// Traducciones de categorías de servicios
export const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  'facial': 'Facial',
  'corporal': 'Corporal',
  'masaje': 'Masaje',
  'manicur': 'Manicura',
  'pedicur': 'Pedicura',
  'depil': 'Depilación',
  'corte': 'Corte',
  'color': 'Color',
  'tratamiento': 'Tratamiento',
  'sin categoría': 'Sin categoría',
};

// Traducciones de acciones de auditoría (complementa a getActionLabel)
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  'LOGIN': 'Inicio de sesión',
  'LOGOUT': 'Cierre de sesión',
  'CREATE': 'Crear',
  'UPDATE': 'Actualizar',
  'DELETE': 'Eliminar',
  'CANCEL': 'Cancelar',
  'OPEN': 'Abrir',
  'CLOSE': 'Cerrar',
  'REOPEN': 'Reabrir',
  'RESET': 'Resetear',
  'UNLOCK': 'Desbloquear',
  'LOCK': 'Bloquear',
  'ACTIVATE': 'Activar',
  'DEACTIVATE': 'Desactivar',
  'EXPORT': 'Exportar',
  'IMPORT': 'Importar',
  'PRINT': 'Imprimir',
  'VIEW': 'Ver',
  'EDIT': 'Editar',
  'SEARCH': 'Buscar',
  'FILTER': 'Filtrar',
};

// Función genérica para traducir cualquier valor
export function translateValue(value: string, type: keyof typeof TRANSLATION_MAPS): string {
  const translationMap = TRANSLATION_MAPS[type];
  return translationMap[value] || value;
}

// Mapa de todos los tipos de traducciones
const TRANSLATION_MAPS = {
  entity: ENTITY_LABELS,
  role: ROLE_LABELS,
  unit: UNIT_LABELS,
  appointmentStatus: APPOINTMENT_STATUS_LABELS,
  saleStatus: SALE_STATUS_LABELS,
  commissionStatus: COMMISSION_STATUS_LABELS,
  paymentMethod: PAYMENT_METHOD_LABELS,
  userStatus: USER_STATUS_LABELS,
  cashRegisterStatus: CASH_REGISTER_STATUS_LABELS,
  inventoryMovementType: INVENTORY_MOVEMENT_TYPE_LABELS,
  serviceCategory: SERVICE_CATEGORY_LABELS,
  auditAction: AUDIT_ACTION_LABELS,
} as const;

// Funciones específicas para cada tipo
export function getEntityLabel(entity: string): string {
  return ENTITY_LABELS[entity] || entity;
}

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] || role;
}

export function getUnitLabel(unit: string): string {
  return UNIT_LABELS[unit] || unit;
}

export function getAppointmentStatusLabel(status: string): string {
  return APPOINTMENT_STATUS_LABELS[status] || status;
}

export function getSaleStatusLabel(status: string): string {
  return SALE_STATUS_LABELS[status] || status;
}

export function getPaymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] || method;
}

export function getUserStatusLabel(status: string): string {
  return USER_STATUS_LABELS[status] || status;
}

export function getCashRegisterStatusLabel(status: string): string {
  return CASH_REGISTER_STATUS_LABELS[status] || status;
}

export function getInventoryMovementTypeLabel(type: string): string {
  return INVENTORY_MOVEMENT_TYPE_LABELS[type] || type;
}

export function getServiceCategoryLabel(category: string): string {
  return SERVICE_CATEGORY_LABELS[category] || category;
}

export function getAuditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] || action;
}

export function getCommissionStatusLabel(status: string): string {
  return COMMISSION_STATUS_LABELS[status] || status;
}
