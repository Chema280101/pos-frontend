'use client';

import Link from 'next/link';
import { Phone, CreditCard, ChevronRight, Lock, Unlock, Eye, Calendar } from 'lucide-react';
import { Badge, Skeleton } from '@/components/ui';
import type { Client } from '@/types/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { EmptyStateUsers } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Plus, UserPlus } from 'lucide-react';

interface ClientsTableProps {
  clients: any[];
  onClientSelect?: (client: any) => void;
  onOpenDrawer?: (client: any) => void;
}

export function ClientsTable({ clients, onClientSelect, onOpenDrawer }: ClientsTableProps): JSX.Element {
  if (clients.length === 0) {
    return (
      <EmptyStateUsers
        title="No se encontraron clientes"
        description="No hay clientes registrados en el sistema. Comienza agregando el primer cliente para comenzar a gestionar tu negocio."
        action={
          <div className="flex gap-3 justify-center">
            <Link href="/clients/new">
              <Button variant="primary" className="inline-flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Crear primer cliente
              </Button>
            </Link>
          </div>
        }
      />
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
                      onClick={() => onOpenDrawer?.(client)}
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
