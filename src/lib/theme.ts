export type BusinessUnit = 'SPA' | 'BARBERIA';

const UNIT_ATTR = 'data-unit';

/**
 * Aplica el tema visual de la unidad activa en el documento.
 * Transición de 300ms al cambiar.
 */
export function applyUnitTheme(unit: BusinessUnit | null): void {
  const root = document.documentElement;
  if (unit) {
    root.setAttribute(UNIT_ATTR, unit);
  } else {
    root.removeAttribute(UNIT_ATTR);
  }
}

/**
 * Obtiene la unidad actual desde el DOM (para SSR/hidratación).
 */
export function getUnitFromDOM(): BusinessUnit | null {
  if (typeof document === 'undefined') return null;
  const value = document.documentElement.getAttribute(UNIT_ATTR);
  if (value === 'SPA' || value === 'BARBERIA') return value;
  return null;
}
