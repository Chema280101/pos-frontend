'use client';

import { useState } from 'react';
import { AlertTriangle, X, Save } from 'lucide-react';

interface UnsavedChangesModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UnsavedChangesModal({ 
  open, 
  onClose, 
  onConfirm, 
  onCancel 
}: UnsavedChangesModalProps): JSX.Element {
  return (
    <>
      {open && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <div 
            className="relative overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-50/95 to-amber-100/85 backdrop-blur-md shadow-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="h-full w-full bg-repeat" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F59E0B' fill-opacity='0.05'%3E%3Ccircle cx='20' cy='20' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>
            
            <div className="relative">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 border-2 border-amber-300">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-amber-900">Cambios no guardados</h3>
                    <p className="text-sm text-amber-700">Tienes cambios que no han sido guardados</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 hover:bg-amber-200 border-2 border-amber-300/50 transition-all hover:scale-105"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4 text-amber-700" />
                </button>
              </div>

              {/* Message */}
              <div className="mb-8 p-4 rounded-xl border-2 border-amber-200 bg-amber-50/50">
                <p className="text-amber-800 text-center">
                  ¿Estás seguro de que deseas cerrar? Todos los cambios realizados se perderán.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-amber-300 text-amber-700 font-bold bg-amber-100 hover:bg-amber-200 transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  <X className="h-4 w-4" />
                  Continuar editando
                </button>
                
                <button
                  onClick={onConfirm}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-amber-500 text-white font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  <Save className="h-4 w-4" />
                  Descartar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
