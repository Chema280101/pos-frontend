import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * 🌍 Utilidades de Formato de Fecha
 * 
 * IMPORTANTE: La base de datos está en America/Lima
 * No se necesita conversión de zona horaria.
 */

// ✅ TEMPORAL: Compatibilidad mientras se actualiza todo el sistema
export function getPeruTime(date?: Date | string): Date {
  return date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
}

export function toPeruTime(date?: Date | string): Date {
  return date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
}

export function startOfPeruDay(date?: Date | string): Date {
  const inputDate = typeof date === 'string' ? new Date(date) : (date || new Date());
  const result = new Date(inputDate);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfPeruDay(date?: Date | string): Date {
  const inputDate = typeof date === 'string' ? new Date(date) : (date || new Date());
  const result = new Date(inputDate);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function formatPeruDate(date: Date | string): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return format(inputDate, "d 'de' MMMM 'de' yyyy, h:mm a", { locale: es });
}

export function formatPeruDateTime(date: Date | string): string {
  return formatPeruDate(date);
}

export function getStartOfPeruDay(date?: Date | string): Date {
  return startOfPeruDay(date);
}

export function getEndOfPeruDay(date?: Date | string): Date {
  return endOfPeruDay(date);
}

export function isPeruToday(date: Date | string): boolean {
  const target = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return target.toDateString() === today.toDateString();
}

export function getPeruTodayRange(): { start: Date; end: Date } {
  const today = new Date();
  return {
    start: startOfPeruDay(today),
    end: endOfPeruDay(today)
  };
}

/**
 * Obtiene el inicio del día (00:00:00)
 */
export function startOfDay(date?: Date | string): Date {
  const inputDate = typeof date === 'string' ? new Date(date) : (date || new Date());
  const result = new Date(inputDate);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Obtiene el fin del día (23:59:59.999)
 */
export function endOfDay(date?: Date | string): Date {
  const inputDate = typeof date === 'string' ? new Date(date) : (date || new Date());
  const result = new Date(inputDate);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Formatea fecha
 */
export function formatDate(date: Date | string): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return format(inputDate, "d 'de' MMMM 'de' yyyy, h:mm a", { locale: es });
}

/**
 * Formatea fecha y hora
 */
export function formatDateTime(date: Date | string): string {
  return formatDate(date);
}

/**
 * Obtiene el inicio del día
 */
export function getStartOfDay(date?: Date | string): Date {
  return startOfDay(date);
}

/**
 * Obtiene el fin del día
 */
export function getEndOfDay(date?: Date | string): Date {
  return endOfDay(date);
}

/**
 * Verifica si una fecha es hoy
 */
export function isToday(date: Date | string): boolean {
  const target = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return target.toDateString() === today.toDateString();
}

/**
 * Obtiene el rango del día actual
 */
export function getTodayRange(): { start: Date; end: Date } {
  const today = new Date();
  return {
    start: startOfDay(today),
    end: endOfDay(today)
  };
}

/**
 * Convierte timestamp de notificación a formato legible
 */
export function formatNotificationTime(date: Date | string): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - inputDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} d`;
  
  return formatDate(inputDate);
}
