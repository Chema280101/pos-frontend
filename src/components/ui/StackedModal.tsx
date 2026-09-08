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
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  modalId?: string;
  modalName?: string;
  headerIcon?: ReactNode;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[95vw] md:max-w-4xl lg:max-w-5xl min-w-[280px]',
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
  headerIcon,
}: StackedModalProps): JSX.Element {
  const { openModal, closeModal, getZIndex } = useModalStack();

  const id = modalId || `modal-${modalName.replace(/\s+/g, '-').toLowerCase()}`;

  const handleClose = () => {
    closeModal(id);
    onClose();
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-12 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-12 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel
              className={cn(
                'w-full rounded-t-3xl sm:rounded-unit-lg border border-[var(--unit-border)]/60',
                'bg-[var(--unit-surface-elevated)] shadow-unit-lg relative flex flex-col',
                'max-h-[90vh] sm:max-h-[85vh] overflow-hidden',
                'transition-all duration-300',
                sizeClasses[size]
              )}
            >
              {/* Subtle top ambient line */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--unit-accent)]/40 to-transparent pointer-events-none" />

              {/* Mobile handle */}
              <div className="pt-3 pb-1 flex justify-center sm:hidden">
                <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-zinc-700" />
              </div>

              {/* Header Section */}
              {(title || showCloseButton) && (
                <div className="relative px-6 py-4 sm:px-8 sm:py-5 flex items-start justify-between gap-4 border-b border-[var(--unit-border)]/30">
                  <div className="flex items-center gap-3.5 pr-2">
                    {headerIcon && (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-unit bg-[var(--unit-accent)] text-white shadow-md">
                        {headerIcon}
                      </div>
                    )}
                    <div>
                      {title && (
                        <Dialog.Title className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[var(--unit-text)]">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="mt-1 text-xs sm:text-sm text-[var(--unit-text-muted)] line-clamp-2">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                  </div>

                  {showCloseButton && (
                    <button
                      type="button"
                      onClick={handleClose}
                      className="shrink-0 rounded-unit border border-slate-200/80 dark:border-zinc-700/80 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 p-2 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40 active:scale-95"
                      aria-label="Cerrar modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Modal Content */}
              <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
                {children}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
