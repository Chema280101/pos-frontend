// 🎯 EXPORTACIÓN CENTRALIZADA DE HOOKS DE GASTOS

// Hooks principales
export { useExpenses, useExpensesSummary, useCreateExpenseMutation, useEditExpenseMutation, useDeleteExpenseMutation, useExpenseDetails, useExportExpensesMutation } from './useExpensesQueries';

// Hooks optimizados con cache
export { 
  useOptimizedExpenses, 
  useOptimizedExpensesSummary, 
  useOptimizedCreateExpense, 
  useOptimizedEditExpense, 
  useOptimizedDeleteExpense, 
  useOptimizedExpenseDetails, 
  useOptimizedExportExpenses 
} from './useOptimizedExpenses';

// Hooks de cache
export { useExpensesCache, expensesCache, expensesCacheKeys } from './useExpensesCache';

// Hooks de logging
export { expensesLogger } from './useExpensesLogger';

// Validaciones
export * from '../expenses.validation';
