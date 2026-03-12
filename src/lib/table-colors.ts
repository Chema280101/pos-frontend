// ============================================================================
// SISTEMA DE CODIFICACIÓN POR COLORES PARA TABLAS
// ============================================================================

// Base badge class
export const BADGE_BASE = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

// IDENTIFICADORES Y REFERENCIAS
export const BADGE_ID = `${BADGE_BASE} bg-indigo-100 text-indigo-800`;
export const BADGE_REFERENCE = BADGE_ID;
export const BADGE_SALE_NUMBER = BADGE_ID;

// PERSONAS Y CONTACTOS
export const BADGE_PERSON_NAME = `${BADGE_BASE} bg-pink-100 text-pink-800`;
export const BADGE_CUSTOMER_NAME = BADGE_PERSON_NAME;
export const BADGE_USER_NAME = BADGE_PERSON_NAME;

export const BADGE_EMPLOYEE_NAME = `${BADGE_BASE} bg-emerald-100 text-emerald-800`;

export const BADGE_PHONE = `${BADGE_BASE} bg-sky-100 text-sky-800`;
export const BADGE_CONTACT_PHONE = BADGE_PHONE;

export const BADGE_EMAIL = `${BADGE_BASE} bg-purple-100 text-purple-800`;
export const BADGE_CONTACT_EMAIL = BADGE_EMAIL;

// DATOS MONETARIOS
export const BADGE_AMOUNT = `${BADGE_BASE} bg-emerald-100 text-emerald-800`;
export const BADGE_TOTAL = BADGE_AMOUNT;
export const BADGE_PRICE = BADGE_AMOUNT;
export const BADGE_MONETARY = BADGE_AMOUNT;

export const BADGE_COMMISSION = `${BADGE_BASE} bg-orange-100 text-orange-800`;
export const BADGE_PERCENTAGE = BADGE_COMMISSION;

// TIEMPO Y FECHAS
export const BADGE_DATE = `${BADGE_BASE} bg-indigo-100 text-indigo-800`;
export const BADGE_FECHA = BADGE_DATE;

export const BADGE_TIME = `${BADGE_BASE} bg-slate-100 text-slate-800`;
export const BADGE_HORA = BADGE_TIME;

export const BADGE_DURATION = `${BADGE_BASE} bg-blue-100 text-blue-800`;
export const BADGE_DURACION = BADGE_DURATION;

// UNIDADES Y UBICACIONES
export const BADGE_UNIT_SPA = `${BADGE_BASE} bg-teal-100 text-teal-800`;
export const BADGE_SPA = BADGE_UNIT_SPA;

export const BADGE_UNIT_BARBERIA = `${BADGE_BASE} bg-orange-100 text-orange-800`;
export const BADGE_BARBERIA = BADGE_UNIT_BARBERIA;

// SERVICIOS Y PRODUCTOS
export const BADGE_SERVICE_NAME = `${BADGE_BASE} bg-purple-100 text-purple-800`;
export const BADGE_SERVICIO = BADGE_SERVICE_NAME;

export const BADGE_PRODUCT_NAME = `${BADGE_BASE} bg-blue-100 text-blue-800`;
export const BADGE_PRODUCTO = BADGE_PRODUCT_NAME;

export const BADGE_CATEGORY = `${BADGE_BASE} bg-gray-100 text-gray-800`;
export const BADGE_CATEGORIA = BADGE_CATEGORY;

// ESTADOS Y ACCIONES
export const BADGE_STATUS_ACTIVE = `${BADGE_BASE} bg-green-100 text-green-800`;
export const BADGE_STATUS_COMPLETED = BADGE_STATUS_ACTIVE;
export const BADGE_STATUS_PAID = BADGE_STATUS_ACTIVE;

export const BADGE_STATUS_INACTIVE = `${BADGE_BASE} bg-red-100 text-red-800`;
export const BADGE_STATUS_CANCELLED = BADGE_STATUS_INACTIVE;
export const BADGE_STATUS_FAILED = BADGE_STATUS_INACTIVE;

export const BADGE_STATUS_PENDING = `${BADGE_BASE} bg-amber-100 text-amber-800`;
export const BADGE_STATUS_SCHEDULED = BADGE_STATUS_PENDING;

export const BADGE_STATUS_NEUTRAL = `${BADGE_BASE} bg-gray-100 text-gray-800`;
export const BADGE_STATUS_DEFAULT = BADGE_STATUS_NEUTRAL;

// MÉTODOS DE PAGO
export const BADGE_PAYMENT_CASH = `${BADGE_BASE} bg-green-100 text-green-800`;
export const BADGE_PAYMENT_EFECTIVO = BADGE_PAYMENT_CASH;

export const BADGE_PAYMENT_CARD = `${BADGE_BASE} bg-blue-100 text-blue-800`;
export const BADGE_PAYMENT_TARJETA = BADGE_PAYMENT_CARD;

export const BADGE_PAYMENT_DIGITAL = `${BADGE_BASE} bg-purple-100 text-purple-800`;
export const BADGE_PAYMENT_YAPE = BADGE_PAYMENT_DIGITAL;

export const BADGE_PAYMENT_TRANSFER = `${BADGE_BASE} bg-orange-100 text-orange-800`;
export const BADGE_PAYMENT_TRANSFERENCIA = BADGE_PAYMENT_TRANSFER;

// DATOS TÉCNICOS
export const BADGE_TECHNICAL_ID = `${BADGE_BASE} bg-gray-100 text-gray-800 font-mono`;
export const BADGE_ID_CODE = BADGE_TECHNICAL_ID;
export const BADGE_IDENTIFIER = BADGE_TECHNICAL_ID;

export const BADGE_IP_ADDRESS = `${BADGE_BASE} bg-cyan-100 text-cyan-800`;
export const BADGE_IP = BADGE_IP_ADDRESS;

// ACCIONES DE AUDITORÍA
export const BADGE_ACTION_LOGIN = `${BADGE_BASE} bg-blue-100 text-blue-800`;
export const BADGE_ACTION_LOGOUT = BADGE_ACTION_LOGIN;

export const BADGE_ACTION_CREATE = `${BADGE_BASE} bg-green-100 text-green-800`;

export const BADGE_ACTION_DELETE = `${BADGE_BASE} bg-red-100 text-red-800`;
export const BADGE_ACTION_CANCEL = BADGE_ACTION_DELETE;

export const BADGE_ACTION_UPDATE = `${BADGE_BASE} bg-amber-100 text-amber-800`;

// ROLES DE USUARIO
export const BADGE_ROLE_ADMIN = `${BADGE_BASE} bg-red-100 text-red-800`;
export const BADGE_ROLE_RECEPTIONIST = `${BADGE_BASE} bg-blue-100 text-blue-800`;
export const BADGE_ROLE_SPA_SPECIALIST = `${BADGE_BASE} bg-green-100 text-green-800`;
export const BADGE_ROLE_BARBER = `${BADGE_BASE} bg-amber-100 text-amber-800`;
export const BADGE_ROLE_BEAUTICIAN = `${BADGE_BASE} bg-pink-100 text-pink-800`;
export const BADGE_ROLE_MANAGER = `${BADGE_BASE} bg-indigo-100 text-indigo-800`;

// ENTIDADES DE AUDITORÍA
export const BADGE_ENTITY_USER = `${BADGE_BASE} bg-purple-100 text-purple-800`;
export const BADGE_ENTITY_SALE = `${BADGE_BASE} bg-emerald-100 text-emerald-800`;
export const BADGE_ENTITY_CASH_REGISTER = `${BADGE_BASE} bg-amber-100 text-amber-800`;
export const BADGE_ENTITY_PRODUCT = `${BADGE_BASE} bg-blue-100 text-blue-800`;
export const BADGE_ENTITY_SERVICE = `${BADGE_BASE} bg-green-100 text-green-800`;
export const BADGE_ENTITY_COMMISSION = `${BADGE_BASE} bg-orange-100 text-orange-800`;
export const BADGE_ENTITY_EXPENSE = `${BADGE_BASE} bg-red-100 text-red-800`;

// UTILIDADES PARA DATOS COMPUESTOS
export const BADGE_STACK = 'flex flex-col gap-1';
export const BADGE_GROUP = 'flex items-center gap-2';

// ESPECIALES
export const BADGE_BOLD = 'font-bold';
export const BADGE_MONO = 'font-mono';

// ============================================================================
// FUNCIONES HELPER PARA COLORES DINÁMICOS
// ============================================================================

export function getDateColor(date?: Date): string {
  return BADGE_DATE;
}

export function getTimeColor(time?: string): string {
  return BADGE_TIME;
}

export function getPersonNameColor(type: 'customer' | 'user' | 'employee' = 'customer'): string {
  switch (type) {
    case 'employee': return BADGE_EMPLOYEE_NAME;
    default: return BADGE_PERSON_NAME;
  }
}

export function getAmountColor(type: 'amount' | 'commission' | 'percentage' = 'amount'): string {
  switch (type) {
    case 'commission':
    case 'percentage': return BADGE_COMMISSION;
    default: return BADGE_AMOUNT;
  }
}

export function getUnitColor(unit: 'SPA' | 'BARBERIA'): string {
  return unit === 'SPA' ? BADGE_UNIT_SPA : BADGE_UNIT_BARBERIA;
}

export function getServiceColor(): string {
  return BADGE_SERVICE_NAME;
}

export function getProductColor(): string {
  return BADGE_PRODUCT_NAME;
}

export function getPaymentMethodColor(method: string): string {
  switch (method.toLowerCase()) {
    case 'efectivo': return BADGE_PAYMENT_EFECTIVO;
    case 'tarjeta': return BADGE_PAYMENT_TARJETA;
    case 'yape': return BADGE_PAYMENT_YAPE;
    case 'transferencia': return BADGE_PAYMENT_TRANSFERENCIA;
    default: return BADGE_STATUS_DEFAULT;
  }
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'completed':
    case 'paid': return BADGE_STATUS_ACTIVE;
    case 'inactive':
    case 'cancelled':
    case 'failed': return BADGE_STATUS_INACTIVE;
    case 'pending':
    case 'scheduled': return BADGE_STATUS_PENDING;
    default: return BADGE_STATUS_DEFAULT;
  }
}

export function getRoleColor(role: string): string {
  switch (role.toUpperCase()) {
    case 'ADMIN': return BADGE_ROLE_ADMIN;
    case 'RECEPTIONIST': return BADGE_ROLE_RECEPTIONIST;
    case 'SPA_SPECIALIST': return BADGE_ROLE_SPA_SPECIALIST;
    case 'BARBER': return BADGE_ROLE_BARBER;
    case 'BEAUTICIAN': return BADGE_ROLE_BEAUTICIAN;
    case 'MANAGER': return BADGE_ROLE_MANAGER;
    default: return BADGE_STATUS_DEFAULT;
  }
}

export function getEntityColor(entity: string): string {
  switch (entity) {
    case 'User': return BADGE_ENTITY_USER;
    case 'Sale': return BADGE_ENTITY_SALE;
    case 'CashRegister': return BADGE_ENTITY_CASH_REGISTER;
    case 'Product': return BADGE_ENTITY_PRODUCT;
    case 'Service': return BADGE_ENTITY_SERVICE;
    case 'Commission': return BADGE_ENTITY_COMMISSION;
    case 'Expense': return BADGE_ENTITY_EXPENSE;
    default: return BADGE_STATUS_DEFAULT;
  }
}

export function getActionColor(action: string): string {
  switch (action.toLowerCase()) {
    case 'login':
    case 'logout': return BADGE_ACTION_LOGIN;
    case 'create': return BADGE_ACTION_CREATE;
    case 'delete':
    case 'cancel': return BADGE_ACTION_DELETE;
    case 'update': return BADGE_ACTION_UPDATE;
    default: return BADGE_STATUS_DEFAULT;
  }
}

// ============================================================================
// EJEMPLOS DE USO:
// 
// import { BADGE_DATE, BADGE_PERSON_NAME, BADGE_AMOUNT, BADGE_STACK } from '@/lib/table-colors';
// 
// <span className={BADGE_DATE}>Fecha</span>
// <span className={BADGE_PERSON_NAME}>Nombre</span>
// <span className={BADGE_AMOUNT}>S/ 100.00</span>
// 
// Para datos compuestos:
// <div className={BADGE_STACK}>
//   <span className={BADGE_DATE}>Fecha</span>
//   <span className={BADGE_TIME}>Hora</span>
// </div>
// 
// Para colores dinámicos:
// <span className={getStatusColor(status)}>{status}</span>
// <span className={getPaymentMethodColor(method)}>{method}</span>
// ============================================================================
