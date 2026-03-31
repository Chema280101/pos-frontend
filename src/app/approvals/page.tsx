'use client';

import { useState } from 'react';
import { ArrowLeft, Bell, Settings } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { PriceApprovalsPanel } from '@/components/PriceApprovals/PriceApprovalsPanel';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui';

export default function PriceApprovalsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  // 🔌 Activar Socket.io para actualizaciones en tiempo real
  useSocket();

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
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
                <h1 className="text-xl font-bold text-gray-900">Aprobaciones de Precios</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'pending'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'approved'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Aprobadas
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'rejected'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Rechazadas
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Todas
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <PriceApprovalsPanel status={getStatusFromTab(activeTab)} />
          </div>
        </div>
      </div>
    </div>
  );
}
