'use client';

import { Fragment, type ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModalStack } from '@/hooks/useModalStack';

export interface StackedModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCloseButton?: boolean;
  modalId?: string;
  modalName?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  full: 'max-w-[90vw] max-h-[90vh]',
};

export function StackedModal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  modalId,
  modalName = 'Modal',
}: StackedModalProps): JSX.Element {
  const { openModal, closeModal, getZIndex } = useModalStack();

  // Generate unique ID if not provided
  const id = modalId || `modal-${modalName.replace(/\s+/g, '-').toLowerCase()}`;

  // Handle modal open/close with stack management
  const handleOpen = () => {
    if (open) {
      const zIndex = openModal(id, modalName, onClose);
      return zIndex;
    }
  };

  const handleClose = () => {
    closeModal(id);
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={handleClose} className="relative" style={{ zIndex: getZIndex(id) }}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md" aria-hidden="true" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div 
              className={cn(
                'w-full rounded-t-[calc(var(--unit-border-radius)*1.5)] sm:rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto relative overflow-hidden',
                sizeClasses[size]
              )}
            >
              {/* Glassmorphism overlay pattern - Consistente con Modal.tsx */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5"></div>
                <div className="absolute inset-0">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
              </div>

              {/* Modal Header - Estándar consistente */}
              {(title || showCloseButton) && (
                <div className="relative mb-6 flex items-start justify-between gap-4">
                  {/* Background gradient for header - Consistente con Modal.tsx */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--unit-accent)]/20 to-transparent"></div>
                  
                  {title && (
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                        <div className="h-6 w-6 bg-white rounded-sm"></div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[var(--unit-text)]">{title}</h3>
                        {description && (
                          <p className="text-sm text-[var(--unit-text-muted)]">{description}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {showCloseButton && (
                    <button
                      onClick={handleClose}
                      className="relative z-10 shrink-0 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-2 text-[var(--unit-text-muted)] transition-all duration-200 hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50"
                      aria-label="Cerrar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Modal Content */}
              <div className="relative z-10">
                {children}
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
