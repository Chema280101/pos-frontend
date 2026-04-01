import { useState } from 'react';
import { api } from '@/lib/api';
import { X, DollarSign, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui';
import type { ServiceOption, PriceValidation } from '@/types/pos';
import { useAuthStore } from '@/store/authStore';

interface VariablePriceModalProps {
  service: ServiceOption;
  isOpen: boolean;
  onClose: () => void;
  onPriceConfirm: (price: number) => void;
  onApprovalRequest?: (approvalData: { serviceId: string; requestedPrice: number; reason: string }) => void;
}

export function VariablePriceModal({
  service,
  isOpen,
  onClose,
  onPriceConfirm,
  onApprovalRequest
}: VariablePriceModalProps): JSX.Element {
  const [customPrice, setCustomPrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<PriceValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { user } = useAuthStore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(value);
  };

  const handlePriceChange = (value: string) => {
    // Solo permitir números y punto decimal
    const cleanValue = value.replace(/[^0-9.]/g, '');
    setCustomPrice(cleanValue);
    setValidation(null);
  };

  const validatePrice = async () => {
    const price = parseFloat(customPrice);
    if (!price || price <= 0) {
      setValidation({
        valid: false,
        requiresApproval: false,
        canProceed: false,
        message: 'Por favor ingresa un precio válido'
      });
      return;
    }

    // Verificar que el usuario esté autenticado
    if (!user) {
      setValidation({
        valid: false,
        requiresApproval: false,
        canProceed: false,
        message: 'Debes iniciar sesión para validar precios'
      });
      return;
    }

    setIsValidating(true);
    try {
      const response = await api.post('/api/prices/validate', {
        serviceId: service.id,
        requestedPrice: price
      });

      setValidation(response.data.validation);
    } catch (error: any) {
      // Error validando precio
      
      // Manejo específico de errores de autenticación
      if (error.response?.status === 401) {
        setValidation({
          valid: false,
          requiresApproval: false,
          canProceed: false,
          message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
        });
      } else if (error.response?.status === 403) {
        setValidation({
          valid: false,
          requiresApproval: false,
          canProceed: false,
          message: 'No tienes permisos para validar precios.'
        });
      } else if (error.response?.data?.error) {
        setValidation({
          valid: false,
          requiresApproval: false,
          canProceed: false,
          message: error.response.data.error
        });
      } else {
        setValidation({
          valid: false,
          requiresApproval: false,
          canProceed: false,
          message: 'Error al validar el precio. Intenta nuevamente.'
        });
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async () => {
    const price = parseFloat(customPrice);
    if (!price || price <= 0) return;

    setIsLoading(true);
    try {
      if (validation?.requiresApproval && validation.approvalData) {
        // Solicitar aprobación
        await onApprovalRequest?.(validation.approvalData);
        onClose();
        setCustomPrice('');
        setValidation(null);
      } else {
        // Confirmar precio directamente
        onPriceConfirm(price);
        onClose();
        setCustomPrice('');
        setValidation(null);
      }
    } catch (error) {
      // Error al procesar precio
    } finally {
      setIsLoading(false);
    }
  };

  const getPriceTypeColor = () => {
    switch (service.priceType) {
      case 'VARIABLE':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'RANGE':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'QUOTE':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriceTypeLabel = () => {
    switch (service.priceType) {
      case 'VARIABLE':
        return 'Precio Variable';
      case 'RANGE':
        return 'Precio con Aprobación';
      case 'QUOTE':
        return 'Precio por Cotización';
      default:
        return 'Precio Fijo';
    }
  };

  if (!isOpen) return <></>;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Precio Personalizado</h3>
                <p className="text-sm text-gray-500">{service.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-xl border-2 border-gray-200/50 bg-white/50 p-2 text-gray-400 transition-all duration-200 hover:border-gray-300/50 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Price Type Badge */}
          <div className="flex items-center justify-center">
            <span className={`inline-flex items-center px-3 py-1.5 text-sm font-bold rounded-xl border-2 ${getPriceTypeColor()}`}>
              {getPriceTypeLabel()}
            </span>
          </div>

          {/* Price Range Info */}
          {service.minPrice && service.maxPrice && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Rango de precio permitido:</span>
              </div>
              <div className="mt-2 text-lg font-bold text-blue-900">
                {formatCurrency(service.minPrice)} - {formatCurrency(service.maxPrice)}
              </div>
            </div>
          )}

          {/* Price Input */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              Precio a cobrar
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                S/
              </span>
              <input
                type="text"
                value={customPrice}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-3 border-2 border-gray-200 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Validation Result */}
          {validation && (
            <div className={`rounded-xl p-4 border ${
              validation.valid 
                ? 'bg-green-50 border-green-200' 
                : validation.requiresApproval
                ? 'bg-amber-50 border-amber-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {validation.valid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : validation.requiresApproval ? (
                  <Clock className="h-4 w-4 text-amber-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  validation.valid 
                    ? 'text-green-800' 
                    : validation.requiresApproval
                    ? 'text-amber-800'
                    : 'text-red-800'
                }`}>
                  {validation.message}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            
            {!validation ? (
              <Button
                variant="primary"
                onClick={validatePrice}
                disabled={!customPrice || isValidating}
                isLoading={isValidating}
                className="flex-1"
              >
                Validar Precio
              </Button>
            ) : (
              <Button
                variant={validation.requiresApproval ? 'warning' : 'primary'}
                onClick={handleSubmit}
                disabled={!validation.canProceed || isLoading}
                isLoading={isLoading}
                className="flex-1"
              >
                {validation.requiresApproval ? 'Solicitar Aprobación' : 'Confirmar Precio'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
