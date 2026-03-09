'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUnitStore } from '@/store/unitStore';
import { Banknote, Lock, Unlock, TrendingUp, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type CashRegisterOpen, type BusinessUnit } from '@/types/cash';

interface CashRegisterStatusProps {
  unit: BusinessUnit;
  onOpenRegister: () => void;
  onCloseRegister: () => void;
}

export function CashRegisterStatus({ unit, onOpenRegister, onCloseRegister }: CashRegisterStatusProps) {
  const { data: openRegister, isLoading } = useQuery<CashRegisterOpen>({
    queryKey: ['cash-register-open', unit],
    queryFn: async () => {
      const { data } = await api.get<CashRegisterOpen>(`/api/cash-register/open?unit=${unit}`);
      return data;
    },
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Polling cada minuto
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!openRegister) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Caja Cerrada</h3>
              <p className="text-sm text-gray-600">No hay una caja abierta para {unit}</p>
            </div>
          </div>
          <button
            onClick={onOpenRegister}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Banknote className="h-4 w-4" />
            Abrir Caja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Unlock className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Caja Abierta</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(openRegister.openedAt).toLocaleDateString()}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(openRegister.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                ${openRegister.openingAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onCloseRegister}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <Lock className="h-4 w-4" />
          Cerrar Caja
        </button>
      </div>
    </div>
  );
}
