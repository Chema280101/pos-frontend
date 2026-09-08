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
    <div className="bg-[var(--unit-surface-elevated)] rounded-unit border border-[var(--unit-border)]/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--unit-surface)] border-b border-[var(--unit-border)]/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--unit-text-muted)] uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--unit-text-muted)] uppercase tracking-wider">
                Teléfono
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--unit-text-muted)] uppercase tracking-wider">
                Crédito
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--unit-text-muted)] uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--unit-text-muted)] uppercase tracking-wider">
                Registro
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--unit-text-muted)] uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-[var(--unit-surface)] transition-colors">
                <td className="px-4 py-4">
                  <div>
                    <div className="font-medium text-[var(--unit-text)]">{client.name}</div>
                    {client.preferredEmployeeId && (
                      <div className="text-sm text-[var(--unit-text-muted)]">Empleado preferido</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-[var(--unit-text)]">{client.phone}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className={`text-sm font-medium ${
                      client.creditBalance > 0 ? 'text-green-600' : 'text-[var(--unit-text-muted)]'
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
                  <div className="flex items-center gap-2 text-sm text-[var(--unit-text-muted)]">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(client.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center whitespace-nowrap">
                  <div className="inline-flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenDrawer?.(client)}
                      className="p-1.5 rounded-unit border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/40 transition-all hover:scale-105 active:scale-95 shadow-xs"
                      title="Ver vista rápida"
                      aria-label={`Ver vista rápida de ${client.name}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <Link
                      href={`/clients/${client.id}`}
                      className="p-1.5 rounded-unit border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all hover:scale-105 active:scale-95 shadow-xs flex items-center justify-center"
                      title="Ver perfil completo"
                      aria-label={`Ver perfil de ${client.name}`}
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
