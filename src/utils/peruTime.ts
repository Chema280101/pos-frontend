import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PERU_TIMEZONE = 'America/Lima';
const PERU_OFFSET = -5; // UTC-5 para Perú (sin DST)

/**
 * Convierte una fecha a zona horaria de Perú (UTC-5)
 * IMPORTANTE: La BD está en America/Lima, así que usamos directamente la hora de la BD
 */
export function toPeruTime(date?: Date | string): Date {
  if (!date) {
    // Si no hay fecha, usar hora actual del cliente
    const inputDate = new Date();
    const utcTime = inputDate.getTime() + (inputDate.getTimezoneOffset() * 60000);
    return new Date(utcTime + (PERU_OFFSET * 3600000));
  }
  
  // Si ya viene de la BD (ya está en Perú), retornarla directamente
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return inputDate;
}

/**
 * Obtiene la hora actual en zona horaria de Perú
 */
export function getPeruTime(date?: Date | string): Date {
  if (!date) {
    // Hora actual del cliente convertida a Perú
    const inputDate = new Date();
    const utcTime = inputDate.getTime() + (inputDate.getTimezoneOffset() * 60000);
    return new Date(utcTime + (PERU_OFFSET * 3600000));
  }
  
  // Si viene de la BD, retornar directo
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return inputDate;
}

/**
 * Obtiene el inicio del día en zona horaria de Perú
 */
export function startOfPeruDay(date?: Date | string): Date {
  const peruTime = getPeruTime(date);
  peruTime.setHours(0, 0, 0, 0);
  return peruTime;
}

/**
 * Obtiene el fin del día en zona horaria de Perú
 */
export function endOfPeruDay(date?: Date | string): Date {
  const peruTime = getPeruTime(date);
  peruTime.setHours(23, 59, 59, 999);
  return peruTime;
}

/**
 * Formatea fecha en zona horaria de Perú
 */
export function formatPeruDate(date: Date | string): string {
  const peruTime = getPeruTime(date);
  return format(peruTime, "d 'de' MMMM 'de' yyyy, h:mm a", { locale: es });
}


/**
 * Formatea fecha y hora en zona horaria de Perú
 */
export function formatPeruDateTime(date: Date | string): string {
  return formatPeruDate(date);
}

/**
 * Obtiene el inicio del día en zona horaria de Perú
 */
export function getStartOfPeruDay(date?: Date | string): Date {
  return startOfPeruDay(date);
}

/**
 * Obtiene el fin del día en zona horaria de Perú
 */
export function getEndOfPeruDay(date?: Date | string): Date {
  return endOfPeruDay(date);
}

/**
 * Verifica si una fecha es hoy en zona horaria de Perú
 */
export function isPeruToday(date: Date | string): boolean {
  const target = getPeruTime(date);
  const today = getPeruTime();
  return target.toDateString() === today.toDateString();
}

/**
 * Obtiene el rango del día actual en zona horaria de Perú
 */
export function getPeruTodayRange(): { start: Date; end: Date } {
  const today = getPeruTime();
  return {
    start: startOfPeruDay(today),
    end: endOfPeruDay(today)
  };
}

/**
 * Convierte timestamp de notificación a formato legible en Perú
 */
export function formatNotificationTime(date: Date | string): string {
  const peruTime = getPeruTime(date);
  const now = getPeruTime();
  const diffMs = now.getTime() - peruTime.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} d`;
  
  return formatPeruDate(peruTime);
}
