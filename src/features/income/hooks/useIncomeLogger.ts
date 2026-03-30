// 🎯 SISTEMA DE LOGGING ESTRUCTURADO PARA INGRESOS

interface LogContext {
  userId?: string;
  unit?: string;
  incomeId?: string;
  action?: string;
  amount?: number;
  paymentMethod?: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
}

interface LogEntry extends LogContext {
  message: string;
  details?: Record<string, any>;
  error?: Error;
  duration?: number;
}

class IncomeLogger {
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
    
    let logMessage = `${icon} [${timestamp}] [INCOME]`;
    
    if (this.context.unit) logMessage += ` [${this.context.unit}]`;
    if (this.context.incomeId) logMessage += ` [${this.context.incomeId.slice(-8)}]`;
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
      case 'INFO': return '💰';
      case 'WARN': return '⚠️';
      case 'ERROR': return '❌';
      case 'DEBUG': return '🔍';
      default: return '📝';
    }
  }

  private getColor(level: LogEntry['level']): string {
    switch (level) {
      case 'INFO': return '#059669'; // emerald-600
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

  // Log de operaciones de ingresos
  logCreateIncome(unit: string, userId: string, amount: number, paymentMethod: string, saleNumber: string) {
    this.setContext({ unit, userId, action: 'CREATE_INCOME' })
      .info('Ingreso creado exitosamente', {
        amount,
        paymentMethod,
        saleNumber,
        timestamp: new Date().toISOString()
      });
  }

  logEditIncome(incomeId: string, userId: string, changes: {
    amount?: number;
    paymentMethod?: string;
  }) {
    this.setContext({ incomeId, userId, action: 'EDIT_INCOME' })
      .info('Ingreso editado exitosamente', {
        changes,
        timestamp: new Date().toISOString()
      });
  }

  logDeleteIncome(incomeId: string, userId: string, reason?: string) {
    this.setContext({ incomeId, userId, action: 'DELETE_INCOME' })
      .warn('Ingreso eliminado', {
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

  logStatusError(operation: string, incomeId: string, currentStatus: string, targetStatus: string) {
    this.setContext({ incomeId, action: 'STATUS_ERROR' })
      .warn('Error de estado', {
        operation,
        currentStatus,
        targetStatus,
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
  logLargeAmountIncome(incomeId: string, amount: number, threshold: number) {
    this.setContext({ incomeId, action: 'LARGE_AMOUNT_INCOME' })
      .warn('Ingreso de monto elevado detectado', {
        amount,
        threshold,
        percentOverThreshold: ((amount - threshold) / threshold * 100).toFixed(2) + '%',
        timestamp: new Date().toISOString()
      });
  }

  logUnusualPaymentMethod(incomeId: string, paymentMethod: string, unit: string) {
    this.setContext({ incomeId, unit, action: 'UNUSUAL_PAYMENT_METHOD' })
      .warn('Método de pago inusual detectado', {
        paymentMethod,
        unit,
        timestamp: new Date().toISOString()
      });
  }

  logMultipleIncomeInShortTime(incomes: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    timestamp: string;
  }>, timeWindow: number) {
    this.setContext({ action: 'MULTIPLE_INCOME_SHORT_TIME' })
      .warn('Múltiples ingresos en corto tiempo', {
        incomeCount: incomes.length,
        totalAmount: incomes.reduce((sum, i) => sum + i.amount, 0),
        timeWindow: `${timeWindow} minutos`,
        incomes: incomes.map(i => ({
          id: i.id.slice(-8),
          amount: i.amount,
          paymentMethod: i.paymentMethod
        })),
        timestamp: new Date().toISOString()
      });
  }

  logPaymentMethodDistribution(distribution: Record<string, { count: number; total: number; percentage: number }>) {
    this.setContext({ action: 'PAYMENT_METHOD_DISTRIBUTION' })
      .info('Distribución de métodos de pago', {
        distribution,
        timestamp: new Date().toISOString()
      });
  }

  logDailySummary(unit: string, summary: {
    totalIncome: number;
    transactionCount: number;
    averageAmount: number;
    paymentMethods: Record<string, number>;
  }) {
    this.setContext({ unit, action: 'DAILY_SUMMARY' })
      .info('Resumen diario de ingresos', {
        ...summary,
        timestamp: new Date().toISOString()
      });
  }

  logExportOperation(format: string, filters: Record<string, any>, userId: string) {
    this.setContext({ userId, action: 'EXPORT_INCOME' })
      .info('Exportación de ingresos iniciada', {
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

  logRefundAttempt(incomeId: string, userId: string, reason: string) {
    this.setContext({ incomeId, userId, action: 'REFUND_ATTEMPT' })
      .warn('Intento de reembolso detectado', {
        reason,
        timestamp: new Date().toISOString()
      });
  }

  logFailedPayment(incomeId: string, paymentMethod: string, error: string) {
    this.setContext({ incomeId, action: 'FAILED_PAYMENT' })
      .error('Pago fallido', new Error(error), {
        paymentMethod,
        timestamp: new Date().toISOString()
      });
  }
}

// Exportar instancia global del logger
export const incomeLogger = new IncomeLogger();

// Exportar tipo para uso en otros archivos
export type { LogContext, LogEntry };
