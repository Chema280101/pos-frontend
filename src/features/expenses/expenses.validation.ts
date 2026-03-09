import { z } from 'zod';

// 🎯 ESQUEMAS DE VALIDACIÓN ZOD PARA GASTOS

export const expenseCategories = [
  'Servicios',
  'Productos', 
  'Operativos',
  'Administrativos',
  'Otros'
] as const;

// 📋 ESQUEMA PARA CREAR GASTO
export const createExpenseSchema = z.object({
  amount: z.number()
    .min(0.01, 'El monto debe ser mayor a 0')
    .max(10000, 'El monto no puede exceder S/ 10,000'),
  reason: z.string()
    .min(1, 'El concepto es requerido')
    .max(200, 'El concepto no puede exceder 200 caracteres')
    .trim(),
  category: z.enum(expenseCategories, {
    errorMap: () => ({ message: 'Categoría inválida' })
  })
});

// 📋 ESQUEMA PARA EDITAR GASTO
export const editExpenseSchema = z.object({
  amount: z.number()
    .min(0.01, 'El monto debe ser mayor a 0')
    .max(10000, 'El monto no puede exceder S/ 10,000')
    .optional(),
  reason: z.string()
    .min(1, 'El concepto es requerido')
    .max(200, 'El concepto no puede exceder 200 caracteres')
    .trim()
    .optional(),
  category: z.enum(expenseCategories, {
    errorMap: () => ({ message: 'Categoría inválida' })
  })
  .optional()
}).refine(
  (data) => data.amount !== undefined || data.reason !== undefined || data.category !== undefined,
  {
    message: 'Al menos un campo debe ser modificado',
    path: ['root']
  }
);

// 📋 ESQUEMA PARA FILTROS DE GASTOS
export const expenseFiltersSchema = z.object({
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
  category: z.enum(expenseCategories, {
    errorMap: () => ({ message: 'Categoría inválida' })
  })
  .optional(),
  amountRange: z.string()
    .regex(/^(0|[1-9]\d*)-(0|[1-9]\d*)$/, 'Rango de monto inválido (ej: 100-500)')
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
export const expenseIdSchema = z.string()
  .uuid('ID de gasto inválido')
  .transform((val) => val.trim());

// 📋 ESQUEMA PARA ELIMINAR GASTO
export const deleteExpenseSchema = z.object({
  reason: z.string()
    .max(500, 'El motivo no puede exceder 500 caracteres')
    .trim()
    .optional()
});

// 📋 ESQUEMA PARA EXPORTAR GASTOS
export const exportExpensesSchema = z.object({
  format: z.enum(['excel', 'pdf'], {
    errorMap: () => ({ message: 'Formato inválido' })
  }),
  filters: expenseFiltersSchema.optional()
});

// 🎯 TIPOS EXPORTADOS
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type EditExpenseInput = z.infer<typeof editExpenseSchema>;
export type ExpenseFiltersInput = z.infer<typeof expenseFiltersSchema>;
export type DeleteExpenseInput = z.infer<typeof deleteExpenseSchema>;
export type ExportExpensesInput = z.infer<typeof exportExpensesSchema>;

// 🎯 FUNCIONES DE VALIDACIÓN HELPER
export const validateCreateExpense = (data: unknown) => {
  return createExpenseSchema.safeParse(data);
};

export const validateEditExpense = (data: unknown) => {
  return editExpenseSchema.safeParse(data);
};

export const validateExpenseFilters = (data: unknown) => {
  return expenseFiltersSchema.safeParse(data);
};

export const validateExpenseId = (id: unknown) => {
  return expenseIdSchema.safeParse(id);
};

export const validateDeleteExpense = (data: unknown) => {
  return deleteExpenseSchema.safeParse(data);
};

export const validateExportExpenses = (data: unknown) => {
  return exportExpensesSchema.safeParse(data);
};

// 🎯 MENSAJES DE ERROR PERSONALIZADOS
export const expenseErrorMessages = {
  amount: {
    required: 'El monto es requerido',
    min: 'El monto debe ser mayor a 0',
    max: 'El monto no puede exceder S/ 10,000',
    invalid: 'El monto debe ser un número válido'
  },
  reason: {
    required: 'El concepto es requerido',
    min: 'El concepto es muy corto',
    max: 'El concepto no puede exceder 200 caracteres',
    invalid: 'El concepto contiene caracteres inválidos'
  },
  category: {
    required: 'La categoría es requerida',
    invalid: 'Categoría inválida'
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
