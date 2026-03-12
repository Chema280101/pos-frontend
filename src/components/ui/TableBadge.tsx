'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type TableBadgeType = 
  // IDENTIFICADORES Y REFERENCIAS
  | 'id' | 'reference' | 'sale-number'
  // PERSONAS Y CONTACTOS
  | 'person-name' | 'customer-name' | 'user-name' | 'employee-name'
  | 'phone' | 'contact-phone' | 'email' | 'contact-email'
  // DATOS MONETARIOS
  | 'amount' | 'total' | 'price' | 'monetary' | 'commission' | 'percentage'
  // TIEMPO Y FECHAS
  | 'date' | 'fecha' | 'time' | 'hora' | 'duration' | 'duracion'
  // UNIDADES Y UBICACIONES
  | 'unit-spa' | 'spa' | 'unit-barberia' | 'barberia'
  // SERVICIOS Y PRODUCTOS
  | 'service-name' | 'servicio' | 'product-name' | 'producto'
  | 'category' | 'categoria'
  // ESTADOS Y ACCIONES
  | 'status-active' | 'status-completed' | 'status-paid'
  | 'status-inactive' | 'status-cancelled' | 'status-failed'
  | 'status-pending' | 'status-scheduled' | 'status-neutral' | 'status-default'
  // MÉTODOS DE PAGO
  | 'payment-cash' | 'payment-efectivo' | 'payment-card' | 'payment-tarjeta'
  | 'payment-digital' | 'payment-yape' | 'payment-transfer' | 'payment-transferencia'
  // DATOS TÉCNICOS
  | 'technical-id' | 'id-code' | 'identifier' | 'ip-address' | 'ip'
  // ACCIONES DE AUDITORÍA
  | 'action-login' | 'action-logout' | 'action-create'
  | 'action-delete' | 'action-cancel' | 'action-update'
  // ROLES DE USUARIO
  | 'role-admin' | 'role-receptionist' | 'role-spa-specialist'
  | 'role-barber' | 'role-beautician' | 'role-manager'
  // ENTIDADES DE AUDITORÍA
  | 'entity-user' | 'entity-sale' | 'entity-cash-register'
  | 'entity-product' | 'entity-service' | 'entity-commission' | 'entity-expense';

export interface TableBadgeProps {
  children: ReactNode;
  type: TableBadgeType;
  className?: string;
  bold?: boolean;
  mono?: boolean;
}

const typeStyles: Record<TableBadgeType, string> = {
  // IDENTIFICADORES Y REFERENCIAS - ÍNDIGO
  'id': 'bg-indigo-100 text-indigo-800',
  'reference': 'bg-indigo-100 text-indigo-800',
  'sale-number': 'bg-indigo-100 text-indigo-800',

  // PERSONAS Y CONTACTOS - ROSA/ESMERALDA/SKY/PÚRPURA
  'person-name': 'bg-pink-100 text-pink-800',
  'customer-name': 'bg-pink-100 text-pink-800',
  'user-name': 'bg-pink-100 text-pink-800',
  'employee-name': 'bg-emerald-100 text-emerald-800',
  'phone': 'bg-sky-100 text-sky-800',
  'contact-phone': 'bg-sky-100 text-sky-800',
  'email': 'bg-purple-100 text-purple-800',
  'contact-email': 'bg-purple-100 text-purple-800',

  // DATOS MONETARIOS - ESMERALDA/NARANJA
  'amount': 'bg-emerald-100 text-emerald-800',
  'total': 'bg-emerald-100 text-emerald-800',
  'price': 'bg-emerald-100 text-emerald-800',
  'monetary': 'bg-emerald-100 text-emerald-800',
  'commission': 'bg-orange-100 text-orange-800',
  'percentage': 'bg-orange-100 text-orange-800',

  // TIEMPO Y FECHAS - ÍNDIGO/SLATE/AZUL
  'date': 'bg-indigo-100 text-indigo-800',
  'fecha': 'bg-indigo-100 text-indigo-800',
  'time': 'bg-slate-100 text-slate-800',
  'hora': 'bg-slate-100 text-slate-800',
  'duration': 'bg-blue-100 text-blue-800',
  'duracion': 'bg-blue-100 text-blue-800',

  // UNIDADES Y UBICACIONES - TEAL/NARANJA
  'unit-spa': 'bg-teal-100 text-teal-800',
  'spa': 'bg-teal-100 text-teal-800',
  'unit-barberia': 'bg-orange-100 text-orange-800',
  'barberia': 'bg-orange-100 text-orange-800',

  // SERVICIOS Y PRODUCTOS - PÚRPURA/AZUL/GRIS
  'service-name': 'bg-purple-100 text-purple-800',
  'servicio': 'bg-purple-100 text-purple-800',
  'product-name': 'bg-blue-100 text-blue-800',
  'producto': 'bg-blue-100 text-blue-800',
  'category': 'bg-gray-100 text-gray-800',
  'categoria': 'bg-gray-100 text-gray-800',

  // ESTADOS Y ACCIONES - VERDE/ROJO/ÁMBAR/GRIS
  'status-active': 'bg-green-100 text-green-800',
  'status-completed': 'bg-green-100 text-green-800',
  'status-paid': 'bg-green-100 text-green-800',
  'status-inactive': 'bg-red-100 text-red-800',
  'status-cancelled': 'bg-red-100 text-red-800',
  'status-failed': 'bg-red-100 text-red-800',
  'status-pending': 'bg-amber-100 text-amber-800',
  'status-scheduled': 'bg-amber-100 text-amber-800',
  'status-neutral': 'bg-gray-100 text-gray-800',
  'status-default': 'bg-gray-100 text-gray-800',

  // MÉTODOS DE PAGO - VERDE/AZUL/PÚRPURA/NARANJA
  'payment-cash': 'bg-green-100 text-green-800',
  'payment-efectivo': 'bg-green-100 text-green-800',
  'payment-card': 'bg-blue-100 text-blue-800',
  'payment-tarjeta': 'bg-blue-100 text-blue-800',
  'payment-digital': 'bg-purple-100 text-purple-800',
  'payment-yape': 'bg-purple-100 text-purple-800',
  'payment-transfer': 'bg-orange-100 text-orange-800',
  'payment-transferencia': 'bg-orange-100 text-orange-800',

  // DATOS TÉCNICOS - GRIS/CYAN
  'technical-id': 'bg-gray-100 text-gray-800',
  'id-code': 'bg-gray-100 text-gray-800',
  'identifier': 'bg-gray-100 text-gray-800',
  'ip-address': 'bg-cyan-100 text-cyan-800',
  'ip': 'bg-cyan-100 text-cyan-800',

  // ACCIONES DE AUDITORÍA - AZUL/VERDE/ROJO/ÁMBAR
  'action-login': 'bg-blue-100 text-blue-800',
  'action-logout': 'bg-blue-100 text-blue-800',
  'action-create': 'bg-green-100 text-green-800',
  'action-delete': 'bg-red-100 text-red-800',
  'action-cancel': 'bg-red-100 text-red-800',
  'action-update': 'bg-amber-100 text-amber-800',

  // ROLES DE USUARIO - ROJO/AZUL/VERDE/ÁMBAR/ROSA/ÍNDIGO
  'role-admin': 'bg-red-100 text-red-800',
  'role-receptionist': 'bg-blue-100 text-blue-800',
  'role-spa-specialist': 'bg-green-100 text-green-800',
  'role-barber': 'bg-amber-100 text-amber-800',
  'role-beautician': 'bg-pink-100 text-pink-800',
  'role-manager': 'bg-indigo-100 text-indigo-800',

  // ENTIDADES DE AUDITORÍA - PÚRPURA/ESMERALDA/ÁMBAR/AZUL/VERDE/NARANJA/ROJO
  'entity-user': 'bg-purple-100 text-purple-800',
  'entity-sale': 'bg-emerald-100 text-emerald-800',
  'entity-cash-register': 'bg-amber-100 text-amber-800',
  'entity-product': 'bg-blue-100 text-blue-800',
  'entity-service': 'bg-green-100 text-green-800',
  'entity-commission': 'bg-orange-100 text-orange-800',
  'entity-expense': 'bg-red-100 text-red-800',
};

export function TableBadge({ children, type, className, bold, mono }: TableBadgeProps): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        typeStyles[type],
        bold && 'font-bold',
        mono && 'font-mono',
        className
      )}
    >
      {children}
    </span>
  );
}

// ============================================================================
// COMPONENTES DE DATOS COMPUESTOS
// ============================================================================

export interface TableBadgeStackProps {
  children: ReactNode;
  className?: string;
}

export function TableBadgeStack({ children, className }: TableBadgeStackProps): JSX.Element {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {children}
    </div>
  );
}

export interface TableBadgeGroupProps {
  children: ReactNode;
  className?: string;
}

export function TableBadgeGroup({ children, className }: TableBadgeGroupProps): JSX.Element {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {children}
    </div>
  );
}

// ============================================================================
// FUNCIONES HELPER PARA COLORES DINÁMICOS
// ============================================================================

export function getTableBadgeTypeForPaymentMethod(method: string): TableBadgeType {
  switch (method.toLowerCase()) {
    case 'efectivo': return 'payment-efectivo';
    case 'tarjeta': return 'payment-tarjeta';
    case 'yape': return 'payment-yape';
    case 'transferencia': return 'payment-transferencia';
    default: return 'status-default';
  }
}

export function getTableBadgeTypeForStatus(status: string): TableBadgeType {
  switch (status.toLowerCase()) {
    case 'active':
    case 'completed':
    case 'paid': return 'status-active';
    case 'inactive':
    case 'cancelled':
    case 'failed': return 'status-inactive';
    case 'pending':
    case 'scheduled': return 'status-pending';
    default: return 'status-default';
  }
}

export function getTableBadgeTypeForUnit(unit: 'SPA' | 'BARBERIA'): TableBadgeType {
  return unit === 'SPA' ? 'unit-spa' : 'unit-barberia';
}

export function getTableBadgeTypeForRole(role: string): TableBadgeType {
  switch (role.toUpperCase()) {
    case 'ADMIN': return 'role-admin';
    case 'RECEPTIONIST': return 'role-receptionist';
    case 'SPA_SPECIALIST': return 'role-spa-specialist';
    case 'BARBER': return 'role-barber';
    case 'BEAUTICIAN': return 'role-beautician';
    case 'MANAGER': return 'role-manager';
    default: return 'status-default';
  }
}

export function getTableBadgeTypeForEntity(entity: string): TableBadgeType {
  switch (entity) {
    case 'User': return 'entity-user';
    case 'Sale': return 'entity-sale';
    case 'CashRegister': return 'entity-cash-register';
    case 'Product': return 'entity-product';
    case 'Service': return 'entity-service';
    case 'Commission': return 'entity-commission';
    case 'Expense': return 'entity-expense';
    default: return 'status-default';
  }
}

export function getTableBadgeTypeForAction(action: string): TableBadgeType {
  switch (action.toLowerCase()) {
    case 'login':
    case 'logout': return 'action-login';
    case 'create': return 'action-create';
    case 'delete':
    case 'cancel': return 'action-delete';
    case 'update': return 'action-update';
    default: return 'status-default';
  }
}

// ============================================================================
// EJEMPLOS DE USO:
// 
// import { TableBadge, TableBadgeStack } from '@/components/ui/TableBadge';
// 
// <TableBadge type="date">Fecha</TableBadge>
// <TableBadge type="customer-name">Nombre</TableBadge>
// <TableBadge type="amount" bold>S/ 100.00</TableBadge>
// 
// Para datos compuestos:
// <TableBadgeStack>
//   <TableBadge type="date">Fecha</TableBadge>
//   <TableBadge type="time">Hora</TableBadge>
// </TableBadgeStack>
// 
// Para colores dinámicos:
// <TableBadge type={getTableBadgeTypeForStatus(status)}>{status}</TableBadge>
// <TableBadge type={getTableBadgeTypeForPaymentMethod(method)}>{method}</TableBadge>
// ============================================================================
