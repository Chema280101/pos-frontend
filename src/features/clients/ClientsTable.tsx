import { useState } from 'react';
import Link from 'next/link';
import { Phone, CreditCard, ChevronRight, Lock, Unlock, Eye, Calendar } from 'lucide-react';
import { Badge, Skeleton } from '@/components/ui';
import type { Client } from '@/types/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClientsTableProps {
  clients: Client[];
  isLoading: boolean;
  onOpenDrawer: (client: Client) => void;
}

export function ClientsTable({ clients, isLoading, onOpenDrawer }: ClientsTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No se encontraron clientes</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teléfono
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Crédito
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registro
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <div>
                    <div className="font-medium text-gray-900">{client.name}</div>
                    {client.preferredEmployeeId && (
                      <div className="text-sm text-gray-500">Empleado preferido</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{client.phone}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className={`text-sm font-medium ${
                      client.creditBalance > 0 ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      S/{client.creditBalance.toFixed(2)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {client.isBlocked ? (
                    <Badge variant="danger" className="bg-red-100 text-red-800">
                      <Lock className="h-3 w-3 mr-1" />
                      Bloqueado
                    </Badge>
                  ) : (
                    <Badge variant="success" className="bg-green-100 text-green-800">
                      <Unlock className="h-3 w-3 mr-1" />
                      Activo
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(client.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenDrawer(client)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <Link
                      href={`/clients/${client.id}`}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
