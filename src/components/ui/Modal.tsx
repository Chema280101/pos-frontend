'use client';

import { Fragment, type ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  full: 'max-w-[90vw] sm:max-w-[90vw] md:max-w-[90vw] lg:max-w-[90vw] min-w-[280px] max-h-[90vh]',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps): JSX.Element {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
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
            enterFrom="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel
              className={cn(
                'w-full rounded-t-2xl sm:rounded-2xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 sm:p-8 relative overflow-hidden',
                'max-h-[90vh] overflow-y-auto',
                sizeClasses[size]
              )}
            >
              {/* Glassmorphism overlay pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='20' cy='20' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>
              
              {/* Mobile handle */}
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--unit-text)]/20 sm:hidden" />
              
              {/* Header Section */}
              {(title || showCloseButton) && (
                <div className="relative mb-6 flex items-start justify-between gap-4">
                  {/* Background gradient for header */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--unit-accent)]/20 to-transparent"></div>
                  
                  <div className="relative z-10">
                    {title && (
                      <Dialog.Title className="font-heading text-2xl font-bold tracking-tight text-[var(--unit-text)]">
                        {title}
                      </Dialog.Title>
                    )}
                    {description && (
                      <Dialog.Description className="mt-2 text-sm leading-relaxed text-[var(--unit-text-muted)]">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  
                  {showCloseButton && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="relative z-10 shrink-0 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-2 text-[var(--unit-text-muted)] transition-all duration-200 hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 group"
                      aria-label="Cerrar"
                    >
                      <X className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    </button>
                  )}
                </div>
              )}
              
              {/* Content */}
              <div className="relative z-10">
                {children}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
