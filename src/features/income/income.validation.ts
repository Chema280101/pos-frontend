import { z } from 'zod';

// 🎯 ESQUEMAS DE VALIDACIÓN ZOD PARA INGRESOS

export const paymentMethods = [
  'CASH',
  'CARD',
  'DIGITAL_WALLET',
  'TRANSFER',
  'MIXED'
] as const;

export const incomeStatuses = [
  'PENDING',
  'COMPLETED',
  'CANCELLED'
] as const;

export const incomeTypes = [
  'ALL',
  'SERVICE',
  'PRODUCT',
  'OTHER'
] as const;

// 📋 ESQUEMA PARA EDITAR INGRESO
export const editIncomeSchema = z.object({
  total: z.number()
    .min(0.01, 'El monto debe ser mayor a 0')
    .max(50000, 'El monto no puede exceder S/ 50,000'),
  paymentMethod: z.enum(paymentMethods, {
    errorMap: () => ({ message: 'Método de pago inválido' })
  })
  .optional()
}).refine(
  (data) => data.total !== undefined || data.paymentMethod !== undefined,
  {
    message: 'Al menos un campo debe ser modificado',
    path: ['root']
  }
);

// 📋 ESQUEMA PARA FILTROS DE INGRESOS
export const incomeFiltersSchema = z.object({
  search: z.string()
    .max(100, 'La búsqueda no puede exceder 100 caracteres')
    .optional(),
  unitFilter: z.enum(['SPA', 'BARBERIA'], {
    errorMap: () => ({ message: 'Unidad inválida' })
  })
  .optional(),
  dateFrom: z.date({
    errorMap: () => ({ message: 'Fecha desde inválida' })
  })
  .optional(),
  dateTo: z.date({
    errorMap: () => ({ message: 'Fecha hasta inválida' })
  })
  .optional(),
  paymentMethod: z.enum(paymentMethods, {
    errorMap: () => ({ message: 'Método de pago inválido' })
  })
  .optional(),
  status: z.enum(incomeStatuses, {
    errorMap: () => ({ message: 'Estado inválido' })
  })
  .optional(),
  amountRange: z.string()
    .regex(/^(0|[1-9]\d*)-(0|[1-9]\d*)$/, 'Rango de monto inválido (ej: 100-500)')
    .optional(),
  typeFilter: z.enum(incomeTypes, {
    errorMap: () => ({ message: 'Tipo inválido' })
  })
  .optional(),
  page: z.number()
    .int('La página debe ser un número entero')
    .min(1, 'La página debe ser mayor a 0')
    .optional(),
  limit: z.number()
    .int('El límite debe ser un número entero')
    .min(10, 'El límite mínimo es 10')
    .max(100, 'El límite máximo es 100')
    .optional()
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return data.dateFrom <= data.dateTo;
    }
    return true;
  },
  {
    message: 'La fecha desde debe ser menor o igual a la fecha hasta',
    path: ['dateTo']
  }
);

// 📋 ESQUEMA PARA PARÁMETROS DE RUTA
export const incomeIdSchema = z.string()
  .uuid('ID de ingreso inválido')
  .transform((val) => val.trim());

// 📋 ESQUEMA PARA ELIMINAR INGRESO
export const deleteIncomeSchema = z.object({
  reason: z.string()
    .max(500, 'El motivo no puede exceder 500 caracteres')
    .trim()
    .optional()
});

// 📋 ESQUEMA PARA EXPORTAR INGRESOS
export const exportIncomeSchema = z.object({
  format: z.enum(['excel', 'pdf'], {
    errorMap: () => ({ message: 'Formato inválido' })
  }),
  filters: incomeFiltersSchema.optional()
});

// 🎯 TIPOS EXPORTADOS
export type EditIncomeInput = z.infer<typeof editIncomeSchema>;
export type IncomeFiltersInput = z.infer<typeof incomeFiltersSchema>;
export type DeleteIncomeInput = z.infer<typeof deleteIncomeSchema>;
export type ExportIncomeInput = z.infer<typeof exportIncomeSchema>;

// 🎯 FUNCIONES DE VALIDACIÓN HELPER
export const validateEditIncome = (data: unknown) => {
  return editIncomeSchema.safeParse(data);
};

export const validateIncomeFilters = (data: unknown) => {
  return incomeFiltersSchema.safeParse(data);
};

export const validateIncomeId = (id: unknown) => {
  return incomeIdSchema.safeParse(id);
};

export const validateDeleteIncome = (data: unknown) => {
  return deleteIncomeSchema.safeParse(data);
};

export const validateExportIncome = (data: unknown) => {
  return exportIncomeSchema.safeParse(data);
};

// 🎯 MENSAJES DE ERROR PERSONALIZADOS
export const incomeErrorMessages = {
  total: {
    required: 'El monto es requerido',
    min: 'El monto debe ser mayor a 0',
    max: 'El monto no puede exceder S/ 50,000',
    invalid: 'El monto debe ser un número válido'
  },
  paymentMethod: {
    required: 'El método de pago es requerido',
    invalid: 'Método de pago inválido'
  },
  status: {
    required: 'El estado es requerido',
    invalid: 'Estado inválido'
  },
  dateRange: {
    invalid: 'El rango de fechas es inválido',
    order: 'La fecha desde debe ser menor a la fecha hasta'
  },
  filters: {
    search: 'La búsqueda no puede exceder 100 caracteres',
    page: 'La página debe ser mayor a 0',
    limit: 'El límite debe estar entre 10 y 100'
  }
};

// 🎯 FUNCIONES DE TRANSFORMACIÓN
export const formatPaymentMethod = (method: string): string => {
  switch (method) {
    case 'CASH':
      return 'Efectivo';
    case 'CARD':
      return 'Tarjeta';
    case 'DIGITAL_WALLET':
      return 'Billetera Digital';
    case 'TRANSFER':
      return 'Transferencia';
    case 'MIXED':
      return 'Mixto';
    default:
      return method;
  }
};

export const formatIncomeStatus = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'Pendiente';
    case 'COMPLETED':
      return 'Completado';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status;
  }
};

export const formatIncomeType = (type: string): string => {
  switch (type) {
    case 'SERVICE':
      return 'Servicio';
    case 'PRODUCT':
      return 'Producto';
    case 'OTHER':
      return 'Otro';
    default:
      return type;
  }
};
