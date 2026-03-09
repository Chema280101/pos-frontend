'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { SidebarMemo } from '@/components/Layout/Sidebar';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { AppBreadcrumbs } from '@/components/Layout/AppBreadcrumbs';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ToastContainer } from '@/components/ui';
import { useToastStore } from '@/store/toastStore';
import { usePrefetchQueries } from '@/hooks/usePrefetchQueries';

export default function AppLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  // ✅ PERFORMANCE: Prefetch queries para optimizar primera carga
  usePrefetchQueries();

  return (
    <AuthGuard>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="flex min-h-screen flex-col">
        <OfflineBanner />
        <Header onMenuClick={() => setSidebarOpen((o) => !o)} />
        <div className="flex flex-1">
          <SidebarMemo
            mobileOpen={sidebarOpen}
            onMobileClose={() => setSidebarOpen(false)}
          />
          <main className="min-w-0 flex-1 overflow-auto">
            <AppBreadcrumbs />
            {children}
          </main>
        </div>
        <Footer />
      </div>
    </AuthGuard>
  );
}
