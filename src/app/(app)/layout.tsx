'use client';

import { useState, useEffect, useRef } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { SidebarMemo } from '@/components/Layout/Sidebar';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { AppBreadcrumbs } from '@/components/Layout/AppBreadcrumbs';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ToastContainer } from '@/components/ui';
import { useToastStore } from '@/store/toastStore';
import { usePrefetchQueries } from '@/hooks/usePrefetchQueries';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SecurityProvider } from '@/components/security/SecureComponent';

export default function AppLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // ✅ PERFORMANCE: Prefetch queries para optimizar primera carga
  usePrefetchQueries();
  
  // ✅ SEO: Actualizar título dinámicamente
  usePageTitle();

  // ✅ MOBILE: Swipe gesture para sidebar
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX.current = e.changedTouches[0].clientX;
      handleSwipeGesture();
    };

    const handleSwipeGesture = () => {
      const swipeDistance = touchEndX.current - touchStartX.current;
      const minSwipeDistance = 50; // Mínimo 50px para considerar swipe

      // Swipe derecho (izquierda a derecha) - abrir sidebar
      if (swipeDistance > minSwipeDistance && !sidebarOpen) {
        setSidebarOpen(true);
      }
      
      // Swipe izquierdo (derecha a izquierda) - cerrar sidebar
      if (swipeDistance < -minSwipeDistance && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    // Agregar event listeners solo en móviles
    if (window.innerWidth < 768) {
      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [sidebarOpen]);

  return (
    <SecurityProvider>
      <AuthGuard>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="flex min-h-screen flex-col">
          <OfflineBanner />
          <Header onMenuClick={() => setSidebarOpen((o) => !o)} />
          <div className="flex flex-1 relative">
            <SidebarMemo
              mobileOpen={sidebarOpen}
              onMobileClose={() => setSidebarOpen(false)}
            />
            <main className="min-w-0 flex-1 overflow-auto md:ml-56 lg:pt-0 bg-[var(--unit-surface)]">
              {/* Enhanced mobile spacing */}
              <div className="px-3 sm:px-4 md:px-6 py-4 md:py-6">
                <AppBreadcrumbs />
                <div className="mt-4 md:mt-6">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
        <Footer />
      </AuthGuard>
    </SecurityProvider>
  );
}
