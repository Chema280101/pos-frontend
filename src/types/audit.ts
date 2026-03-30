// Types unificados para el sistema de auditoría

export type AuditAction = 
  | 'LOGIN' | 'LOGOUT'
  | 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER' | 'ACTIVATE_USER'
  | 'UNLOCK_USER' | 'RESET_PASSWORD' | 'CHANGE_ROLE'
  | 'CREATE_SALE' | 'UPDATE_SALE' | 'CANCEL_SALE'
  | 'OPEN_CASH_REGISTER' | 'CLOSE_CASH_REGISTER' | 'REOPEN_CASH_REGISTER'
  | 'CREATE_EXPENSE' | 'UPDATE_EXPENSE' | 'DELETE_EXPENSE'
  | 'CREATE_APPOINTMENT' | 'UPDATE_APPOINTMENT' | 'CANCEL_APPOINTMENT'
  | 'CREATE_SERVICE' | 'UPDATE_SERVICE' | 'DELETE_SERVICE'
  | 'CREATE_PRODUCT' | 'UPDATE_PRODUCT' | 'DELETE_PRODUCT'
  | 'CREATE_CLIENT' | 'UPDATE_CLIENT' | 'DELETE_CLIENT';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  device?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface AuditResponse {
  data: AuditLog[];
  total: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AuditFilters {
  userId?: string;
  action?: AuditAction;
  entity?: string;
  entityId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasIpAddress?: boolean;
  hasDevice?: boolean;
  page?: number;
  limit?: number;
  exportLimit?: number;
}

export interface AuditMetrics {
  totalAudits: number;
  criticalActions: number;
  sessionActivities: number;
  recentAudits: number;
  todayAudits: number;
  weekAudits: number;
  actionBreakdown: Record<string, number>;
  entityBreakdown: Record<string, number>;
  deviceBreakdown: Record<string, number>;
  uniqueIPs: number;
  uniqueUsers: number;
  mostActiveUser: { user: string; count: number };
  mostCommonAction: { action: string; count: number };
  mostAccessedEntity: { entity: string; count: number };
  deletedActions: number;
  activityRate: number;
}

export interface AuditExportData {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  device: string | null;
  ipAddress: string | null;
  createdAt: Date;
}

export interface SecurityAlert {
  type: 'multiple_failed_logins' | 'suspicious_ip' | 'unusual_device' | 'critical_action_after_hours' | 'rapid_successive_actions';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  userId?: string;
  ipAddress?: string;
  device?: string;
  action?: string;
  timestamp: Date;
  details: Record<string, any>;
}

// Helper functions
export function getActionLabel(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    'LOGIN': 'Inicio de sesión',
    'LOGOUT': 'Cierre de sesión',
    'CREATE_USER': 'Crear usuario',
    'UPDATE_USER': 'Actualizar usuario',
    'DELETE_USER': 'Eliminar usuario',
    'ACTIVATE_USER': 'Activar usuario',
    'UNLOCK_USER': 'Desbloquear usuario',
    'RESET_PASSWORD': 'Resetear contraseña',
    'CHANGE_ROLE': 'Cambiar rol',
    'CREATE_SALE': 'Crear venta',
    'UPDATE_SALE': 'Actualizar venta',
    'CANCEL_SALE': 'Cancelar venta',
    'OPEN_CASH_REGISTER': 'Abrir caja',
    'CLOSE_CASH_REGISTER': 'Cerrar caja',
    'REOPEN_CASH_REGISTER': 'Reabrir caja',
    'CREATE_EXPENSE': 'Crear gasto',
    'UPDATE_EXPENSE': 'Actualizar gasto',
    'DELETE_EXPENSE': 'Eliminar gasto',
    'CREATE_APPOINTMENT': 'Crear cita',
    'UPDATE_APPOINTMENT': 'Actualizar cita',
    'CANCEL_APPOINTMENT': 'Cancelar cita',
    'CREATE_SERVICE': 'Crear servicio',
    'UPDATE_SERVICE': 'Actualizar servicio',
    'DELETE_SERVICE': 'Eliminar servicio',
    'CREATE_PRODUCT': 'Crear producto',
    'UPDATE_PRODUCT': 'Actualizar producto',
    'DELETE_PRODUCT': 'Eliminar producto',
    'CREATE_CLIENT': 'Crear cliente',
    'UPDATE_CLIENT': 'Actualizar cliente',
    'DELETE_CLIENT': 'Eliminar cliente',
  };
  return labels[action] || action;
}

export function getActionSeverity(action: AuditAction): 'low' | 'medium' | 'high' | 'critical' {
  const critical: AuditAction[] = ['DELETE_USER', 'CANCEL_SALE', 'DELETE_EXPENSE', 'DELETE_SERVICE', 'DELETE_PRODUCT'];
  const high: AuditAction[] = ['RESET_PASSWORD', 'UNLOCK_USER', 'CHANGE_ROLE', 'REOPEN_CASH_REGISTER'];
  const medium: AuditAction[] = ['CREATE_USER', 'UPDATE_USER', 'CREATE_SALE', 'CLOSE_CASH_REGISTER'];
  
  if (critical.includes(action)) return 'critical';
  if (high.includes(action)) return 'high';
  if (medium.includes(action)) return 'medium';
  return 'low';
}

export function isCriticalAction(action: AuditAction): boolean {
  return getActionSeverity(action) === 'critical' || getActionSeverity(action) === 'high';
}

// Importar traducciones centralizadas
import { getEntityLabel as getEntityLabelCentral } from '@/lib/translations';

// Función para traducir nombres de entidades del sistema (usando sistema centralizado)
export function getEntityLabel(entity: string): string {
  return getEntityLabelCentral(entity);
}

export function formatAuditRow(row: AuditLog | AuditExportData): string[] {
  return [
    new Date(row.createdAt).toLocaleString('es'),
    row.userName,
    getActionLabel(row.action as AuditAction),
    getEntityLabel(row.entity),
    row.entityId,
    `${row.ipAddress || 'N/A'} / ${row.device || 'N/A'}`,
  ];
}

export const VALID_AUDIT_ACTIONS = [
  'LOGIN', 'LOGOUT', 'CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'ACTIVATE_USER',
  'UNLOCK_USER', 'RESET_PASSWORD', 'CHANGE_ROLE', 'CREATE_SALE', 'UPDATE_SALE', 'CANCEL_SALE',
  'OPEN_CASH_REGISTER', 'CLOSE_CASH_REGISTER', 'REOPEN_CASH_REGISTER',
  'CREATE_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE',
  'CREATE_APPOINTMENT', 'UPDATE_APPOINTMENT', 'CANCEL_APPOINTMENT',
  'CREATE_SERVICE', 'UPDATE_SERVICE', 'DELETE_SERVICE',
  'CREATE_PRODUCT', 'UPDATE_PRODUCT', 'DELETE_PRODUCT',
  'CREATE_CLIENT', 'UPDATE_CLIENT', 'DELETE_CLIENT'
] as const;
