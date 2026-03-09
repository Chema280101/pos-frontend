// 🎯 EXPORTACIÓN CENTRALIZADA DE HOOKS DE INGRESOS

// Hooks principales
export { useIncome, useIncomeSummary, useEditIncomeMutation, useDeleteIncomeMutation, useIncomeDetails, useExportIncomeMutation } from './useIncomeQueries';

// Hooks optimizados con cache
export { 
  useOptimizedIncome, 
  useOptimizedIncomeSummary, 
  useOptimizedEditIncome, 
  useOptimizedDeleteIncome, 
  useOptimizedIncomeDetails, 
  useOptimizedExportIncome 
} from './useOptimizedIncome';

// Hooks de cache
export { useIncomeCache, incomeCache, incomeCacheKeys } from './useIncomeCache';

// Hooks de logging
export { incomeLogger } from './useIncomeLogger';

// Validaciones
export * from '../income.validation';
