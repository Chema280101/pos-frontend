// 🎯 SISTEMA DE LOGGING ESTRUCTURADO PARA GASTOS

interface LogContext {
  userId?: string;
  unit?: string;
  expenseId?: string;
  action?: string;
  amount?: number;
  category?: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
}

interface LogEntry extends LogContext {
  message: string;
  details?: Record<string, any>;
  error?: Error;
  duration?: number;
}

class ExpensesLogger {
  private context: Partial<LogContext> = {};

  // Establecer contexto base para todos los logs
  setContext(context: Partial<LogContext>) {
    this.context = { ...this.context, ...context };
    return this;
  }

  // Limpiar contexto
  clearContext() {
    this.context = {};
    return this;
  }

  // Log genérico
  private log(level: LogEntry['level'], message: string, details?: Record<string, any>, error?: Error, duration?: number) {
    const timestamp = new Date().toISOString();
    const icon = this.getIcon(level);
    const color = this.getColor(level);
    
    let logMessage = `${icon} [${timestamp}] [EXPENSES]`;
    
    if (this.context.unit) logMessage += ` [${this.context.unit}]`;
    if (this.context.expenseId) logMessage += ` [${this.context.expenseId.slice(-8)}]`;
    if (this.context.action) logMessage += ` [${this.context.action}]`;
    if (this.context.userId) logMessage += ` [User:${this.context.userId.slice(-8)}]`;
    
    logMessage += ` ${message}`;

    if (duration) {
      logMessage += ` (${duration}ms)`;
    }

    // Imprimir detalles si existen
    if (details && Object.keys(details).length > 0) {
      // Details logged for debugging (removed console.log)
    }

    // Imprimir error si existe
    if (error) {
      // Error logged for debugging
    }
  }

  private getIcon(level: LogEntry['level']): string {
    switch (level) {
      case 'INFO': return '💸';
      case 'WARN': return '⚠️';
      case 'ERROR': return '❌';
      case 'DEBUG': return '🔍';
      default: return '📝';
    }
  }

  private getColor(level: LogEntry['level']): string {
    switch (level) {
      case 'INFO': return '#DC2626'; // red-600
      case 'WARN': return '#F59E0B'; // amber-500
      case 'ERROR': return '#EF4444'; // red-500
      case 'DEBUG': return '#8B5CF6'; // violet-500
      default: return '#6B7280'; // gray-500
    }
  }

  // Métodos específicos
  info(message: string, details?: Record<string, any>) {
    this.log('INFO', message, details);
  }

  warn(message: string, details?: Record<string, any>) {
    this.log('WARN', message, details);
  }

  error(message: string, error?: Error, details?: Record<string, any>) {
    this.log('ERROR', message, details, error);
  }

  debug(message: string, details?: Record<string, any>) {
    this.log('DEBUG', message, details);
  }

  // Performance logging
  time(action: string): () => void {
    const startTime = Date.now();
    const originalAction = this.context.action;
    this.context.action = action;

    return () => {
      const duration = Date.now() - startTime;
      this.log('DEBUG', `Operation completed`, undefined, undefined, duration);
      this.context.action = originalAction;
    };
  }

  // Log de operaciones de gastos
  logCreateExpense(unit: string, userId: string, amount: number, reason: string, category: string) {
    this.setContext({ unit, userId, action: 'CREATE_EXPENSE' })
      .info('Gasto creado exitosamente', {
        amount,
        reason,
        category,
        timestamp: new Date().toISOString()
      });
  }

  logEditExpense(expenseId: string, userId: string, changes: {
    amount?: number;
    reason?: string;
    category?: string;
  }) {
    this.setContext({ expenseId, userId, action: 'EDIT_EXPENSE' })
      .info('Gasto editado exitosamente', {
        changes,
        timestamp: new Date().toISOString()
      });
  }

  logDeleteExpense(expenseId: string, userId: string, reason?: string) {
    this.setContext({ expenseId, userId, action: 'DELETE_EXPENSE' })
      .warn('Gasto eliminado', {
        reason,
        timestamp: new Date().toISOString()
      });
  }

  logValidationError(validationError: string, context?: Record<string, any>) {
    this.setContext({ action: 'VALIDATION_ERROR' })
      .warn('Error de validación', {
        validationError,
        ...context
      });
  }

  logCashRegisterError(operation: string, unit: string, details: string) {
    this.setContext({ unit, action: 'CASH_REGISTER_ERROR' })
      .warn('Error de caja', {
        operation,
        details,
        timestamp: new Date().toISOString()
      });
  }

  logPermissionError(operation: string, userId: string, details: string) {
    this.setContext({ userId, action: 'PERMISSION_ERROR' })
      .warn('Error de permisos', {
        operation,
        details,
        timestamp: new Date().toISOString()
      });
  }

  logCacheHit(key: string, unit?: string) {
    this.setContext({ unit, action: 'CACHE_HIT' })
      .debug('Cache HIT', { key });
  }

  logCacheMiss(key: string, unit?: string) {
    this.setContext({ unit, action: 'CACHE_MISS' })
      .debug('Cache MISS', { key });
  }

  logCacheInvalidated(keys: string[], unit?: string) {
    this.setContext({ unit, action: 'CACHE_INVALIDATED' })
      .info('Cache invalidado', { keys });
  }

  logApiRequest(method: string, endpoint: string, userId?: string) {
    this.setContext({ userId, action: 'API_REQUEST' })
      .debug(`API ${method} ${endpoint}`, {
        method,
        endpoint,
        timestamp: new Date().toISOString()
      });
  }

  logApiResponse(method: string, endpoint: string, statusCode: number, duration?: number) {
    this.setContext({ action: 'API_RESPONSE' })
      .debug(`API Response ${method} ${endpoint}`, {
        method,
        endpoint,
        statusCode,
        duration,
        timestamp: new Date().toISOString()
      });
  }

  logDatabaseQuery(operation: string, table: string, duration?: number) {
    this.setContext({ action: 'DB_QUERY' })
      .debug(`DB ${operation} on ${table}`, {
        operation,
        table,
        duration,
        timestamp: new Date().toISOString()
      });
  }

  // Log de errores específicos del negocio
  logLargeAmountExpense(expenseId: string, amount: number, threshold: number) {
    this.setContext({ expenseId, action: 'LARGE_AMOUNT_EXPENSE' })
      .warn('Gasto de monto elevado detectado', {
        amount,
        threshold,
        percentOverThreshold: ((amount - threshold) / threshold * 100).toFixed(2) + '%',
        timestamp: new Date().toISOString()
      });
  }

  logUnusualCategory(expenseId: string, category: string, unit: string) {
    this.setContext({ expenseId, unit, action: 'UNUSUAL_CATEGORY' })
      .warn('Categoría inusual detectada', {
        category,
        unit,
        timestamp: new Date().toISOString()
      });
  }

  logMultipleExpensesInShortTime(expenses: Array<{
    id: string;
    amount: number;
    reason: string;
    timestamp: string;
  }>, timeWindow: number) {
    this.setContext({ action: 'MULTIPLE_EXPENSES_SHORT_TIME' })
      .warn('Múltiples gastos en corto tiempo', {
        expenseCount: expenses.length,
        totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
        timeWindow: `${timeWindow} minutos`,
        expenses: expenses.map(e => ({
          id: e.id.slice(-8),
          amount: e.amount,
          reason: e.reason
        })),
        timestamp: new Date().toISOString()
      });
  }

  logExportOperation(format: string, filters: Record<string, any>, userId: string) {
    this.setContext({ userId, action: 'EXPORT_EXPENSES' })
      .info('Exportación de gastos iniciada', {
        format,
        filters,
        timestamp: new Date().toISOString()
      });
  }

  logExportCompleted(format: string, recordCount: number, fileSize?: number) {
    this.setContext({ action: 'EXPORT_COMPLETED' })
      .info('Exportación completada', {
        format,
        recordCount,
        fileSize: fileSize ? `${(fileSize / 1024 / 1024).toFixed(2)}MB` : undefined,
        timestamp: new Date().toISOString()
      });
  }
}

// Exportar instancia global del logger
export const expensesLogger = new ExpensesLogger();

// Exportar tipo para uso en otros archivos
export type { LogContext, LogEntry };
