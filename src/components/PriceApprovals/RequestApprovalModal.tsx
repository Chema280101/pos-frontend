'use client';

import { useState } from 'react';
import { ShieldAlert, Send, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';

interface RequestApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  actionType: 'DELETE' | 'UPDATE';
  entityName: string;
  amount?: number;
  onSubmit: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export function RequestApprovalModal({
  isOpen,
  onClose,
  title,
  actionType,
  entityName,
  amount,
  onSubmit,
  isLoading = false,
}: RequestApprovalModalProps) {
  const [reason, setReason] = useState('');
  const [errorText, setErrorText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorText('Debes ingresar un motivo o justificación para enviar al Administrador');
      return;
    }
    setErrorText('');
    await onSubmit(reason.trim());
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    setErrorText('');
    onClose();
  };

  const isDelete = actionType === 'DELETE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-md overflow-hidden transform transition-all">
        {/* Header */}
        <div className={`p-5 flex items-start gap-4 border-b ${
          isDelete 
            ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30' 
            : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
        }`}>
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
            isDelete
              ? 'bg-rose-600 text-white'
              : 'bg-amber-600 text-white'
          }`}>
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Se enviará una solicitud al Administrador para su confirmación
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900/50 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700/60 space-y-1">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
              Registro afectado
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {entityName}
            </div>
            {amount !== undefined && (
              <div className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400">
                Monto: S/ {amount.toFixed(2)}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Motivo o Justificación <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errorText) setErrorText('');
              }}
              rows={3}
              placeholder={
                isDelete
                  ? 'Ej: Error de digitación, se registró dos veces por error...'
                  : 'Ej: Se corrigió el monto según comprobante físico adjunto...'
              }
              className="w-full text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3.5 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
              autoFocus
            />
            {errorText ? (
              <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                {errorText}
              </p>
            ) : (
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                El Administrador verá este motivo en su Centro de Aprobaciones.
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className={isDelete ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Enviar Solicitud
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
