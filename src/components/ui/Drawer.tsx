'use client';

import { Fragment, type ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

const widthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Drawer({ open, onClose, title, children, width = 'md' }: DrawerProps): JSX.Element {
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
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel
                  className={cn(
                    'w-screen rounded-l-2xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl relative overflow-hidden',
                    widthClasses[width]
                  )}
                >
                  {/* Glassmorphism overlay pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="h-full w-full bg-repeat" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='20' cy='20' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}></div>
                  </div>
                  
                  <div className="relative h-full flex flex-col">
                    {title && (
                      <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 border-b border-[var(--unit-border)]/30 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="font-heading text-lg font-bold text-[var(--unit-text)]">
                            {title}
                          </Dialog.Title>
                          <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-2 text-[var(--unit-text-muted)] hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50"
                            aria-label="Cerrar"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
