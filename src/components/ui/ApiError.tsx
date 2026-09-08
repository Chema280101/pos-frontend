'use client';

import React from 'react';
import { AlertCircle, RefreshCw, WifiOff, Server, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ApiErrorProps {
  error: Error | null;
  onRetry: () => void;
  message?: string;
  className?: string;
}

function getErrorDetails(error: Error | null): { title: string; description: string; icon: React.ReactNode } {
  if (!error) {
    return {
      title: 'Error desconocido',
      description: 'Ha ocurrido un error inesperado',
      icon: <AlertTriangle className="h-5 w-5" />,
    };
  }

  const errorMessage = error.message.toLowerCase();
  const errorString = error.toString().toLowerCase();

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorString.includes('networkerror')) {
    return {
      title: 'Error de conexión',
      description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente.',
      icon: <WifiOff className="h-5 w-5" />,
    };
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('tiempo')) {
    return {
      title: 'Tiempo de espera agotado',
      description: 'El servidor tardó demasiado en responder. Intenta nuevamente.',
      icon: <AlertTriangle className="h-5 w-5" />,
    };
  }

  // Server errors (5xx)
  if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503') || errorMessage.includes('504')) {
    return {
      title: 'Error del servidor',
      description: 'El servidor está experimentando problemas. Intenta nuevamente en unos minutos.',
      icon: <Server className="h-5 w-5" />,
    };
  }

  // Client errors (4xx)
  if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
    return {
      title: 'No autorizado',
      description: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      icon: <AlertCircle className="h-5 w-5" />,
    };
  }

  if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
    return {
      title: 'Acceso denegado',
      description: 'No tienes permisos para realizar esta acción. Contacta al administrador.',
      icon: <AlertCircle className="h-5 w-5" />,
    };
  }

  if (errorMessage.includes('404') || errorMessage.includes('not found')) {
    return {
      title: 'Recurso no encontrado',
      description: 'El recurso solicitado no existe o ha sido eliminado.',
      icon: <AlertTriangle className="h-5 w-5" />,
    };
  }

  // Validation errors
  if (errorMessage.includes('validación') || errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return {
      title: 'Error de validación',
      description: 'Los datos proporcionados no son válidos. Revisa la información e intenta nuevamente.',
      icon: <AlertTriangle className="h-5 w-5" />,
    };
  }

  // Default error
  return {
    title: 'Error al cargar los datos',
    description: errorMessage || 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.',
    icon: <AlertCircle className="h-5 w-5" />,
  };
}

export function ApiError({ error, onRetry, message, className }: ApiErrorProps): JSX.Element {
  const errorDetails = getErrorDetails(error);
  const displayMessage = message || errorDetails.description;

  return (
    <div className={className}>
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-unit">
        <div className="flex-shrink-0 text-red-600">
          {errorDetails.icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-red-800">{errorDetails.title}</p>
          <p className="text-xs text-red-700 mt-1">{displayMessage}</p>
          {error && process.env.NODE_ENV === 'development' && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                Ver detalles técnicos
              </summary>
              <pre className="mt-1 p-2 bg-red-100 rounded text-xs text-red-900 overflow-auto max-h-20">
                {error.toString()}
              </pre>
            </details>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="flex-shrink-0 border-red-300 text-red-700 hover:bg-red-100"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    </div>
  );
}
