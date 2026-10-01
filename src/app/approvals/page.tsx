'use client';

import { useState } from 'react';
import { ArrowLeft, Bell, Receipt, ShoppingBag, Scissors, DollarSign, Tag, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { PriceApprovalsPanel } from '@/components/PriceApprovals/PriceApprovalsPanel';
import { CashApprovalsPanel } from '@/components/PriceApprovals/CashApprovalsPanel';
import { useSocket } from '@/hooks/useSocket';
import { useApprovalNotifications } from '@/hooks/useApprovalNotifications';
import { Button } from '@/components/ui';

export default function PriceApprovalsPage() {
  const { user } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState<'prices' | 'expenses' | 'sales' | 'inventory' | 'services' | 'income'>('expenses');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  // 🔌 Activar Socket.io para actualizaciones en tiempo real
  useSocket();
  
  // 🔔 Activar notificaciones de aprobaciones para Admin
  useApprovalNotifications();

  // Convertir tab a status para el componente
  const getStatusFromTab = (tab: typeof activeTab): 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL' => {
    switch (tab) {
      case 'pending': return 'PENDING';
      case 'approved': return 'APPROVED';
      case 'rejected': return 'REJECTED';
      case 'all': return 'ALL';
      default: return 'PENDING';
    }
  };

  // Solo Admin puede acceder
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página.</p>
          <Link href="/pos">
            <Button variant="primary">Volver al POS</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/pos">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al POS
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-600" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Centro de Aprobaciones</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Category Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveCategory('expenses')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeCategory === 'expenses'
                ? 'bg-white dark:bg-gray-700 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <TrendingDown className="h-3.5 w-3.5" />
            Gastos
          </button>

          <button
            onClick={() => setActiveCategory('sales')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeCategory === 'sales'
                ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            Ventas
          </button>

          <button
            onClick={() => setActiveCategory('inventory')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeCategory === 'inventory'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Productos
          </button>

          <button
            onClick={() => setActiveCategory('services')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeCategory === 'services'
                ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Scissors className="h-3.5 w-3.5" />
            Servicios
          </button>

          <button
            onClick={() => setActiveCategory('prices')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeCategory === 'prices'
                ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            Precios POS
          </button>

          <button
            onClick={() => setActiveCategory('income')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeCategory === 'income'
                ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            Ingresos
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-4">
            <nav className="flex -mb-px space-x-6">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'pending'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'approved'
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Aprobadas
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                className={`py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'rejected'
                    ? 'border-red-500 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Rechazadas
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Todas
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeCategory === 'prices' && (
              <PriceApprovalsPanel status={getStatusFromTab(activeTab)} />
            )}
            {activeCategory === 'expenses' && (
              <CashApprovalsPanel status={getStatusFromTab(activeTab)} typeFilter="EXPENSE" />
            )}
            {activeCategory === 'sales' && (
              <CashApprovalsPanel status={getStatusFromTab(activeTab)} typeFilter="SALE" />
            )}
            {activeCategory === 'inventory' && (
              <CashApprovalsPanel status={getStatusFromTab(activeTab)} typeFilter="INVENTORY" />
            )}
            {activeCategory === 'services' && (
              <CashApprovalsPanel status={getStatusFromTab(activeTab)} typeFilter="SERVICE" />
            )}
            {activeCategory === 'income' && (
              <CashApprovalsPanel status={getStatusFromTab(activeTab)} typeFilter="INCOME" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
