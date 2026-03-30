'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface ModalInfo {
  id: string;
  name: string;
  zIndex: number;
  onClose?: () => void;
}

interface ModalStackContextType {
  stack: ModalInfo[];
  openModal: (id: string, name: string, onClose?: () => void) => number;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  isModalOpen: (id: string) => boolean;
  getTopModal: () => ModalInfo | null;
  getZIndex: (id: string) => number;
}

const ModalStackContext = createContext<ModalStackContextType | null>(null);

const BASE_Z_INDEX = 50;
const Z_INDEX_INCREMENT = 10;

export function ModalStackProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<ModalInfo[]>([]);
  const nextZIndexRef = useRef(BASE_Z_INDEX);

  const openModal = useCallback((id: string, name: string, onClose?: () => void) => {
    const zIndex = nextZIndexRef.current;
    nextZIndexRef.current += Z_INDEX_INCREMENT;
    
    const modalInfo: ModalInfo = {
      id,
      name,
      zIndex,
      onClose
    };

    setStack(prev => [...prev, modalInfo]);
    return zIndex;
  }, []);

  const closeModal = useCallback((id: string) => {
    setStack(prev => {
      const modal = prev.find(m => m.id === id);
      if (modal?.onClose) {
        modal.onClose();
      }
      return prev.filter(m => m.id !== id);
    });
    
    // Reset z-index counter if stack is empty
    if (stack.length <= 1) {
      nextZIndexRef.current = BASE_Z_INDEX;
    }
  }, [stack.length]);

  const closeAllModals = useCallback(() => {
    stack.forEach(modal => {
      if (modal.onClose) {
        modal.onClose();
      }
    });
    setStack([]);
    nextZIndexRef.current = BASE_Z_INDEX;
  }, [stack]);

  const isModalOpen = useCallback((id: string) => {
    return stack.some(modal => modal.id === id);
  }, [stack]);

  const getTopModal = useCallback(() => {
    return stack.length > 0 ? stack[stack.length - 1] : null;
  }, [stack]);

  const getZIndex = useCallback((id: string) => {
    const modal = stack.find(m => m.id === id);
    return modal?.zIndex || BASE_Z_INDEX;
  }, [stack]);

  // Close modals on ESC key (only top modal)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const topModal = getTopModal();
        if (topModal) {
          closeModal(topModal.id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeModal, getTopModal]);

  const value: ModalStackContextType = {
    stack,
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    getTopModal,
    getZIndex
  };

  return (
    <ModalStackContext.Provider value={value}>
      {children}
    </ModalStackContext.Provider>
  );
}

export function useModalStack() {
  const context = useContext(ModalStackContext);
  if (!context) {
    throw new Error('useModalStack must be used within a ModalStackProvider');
  }
  return context;
}
