'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, DollarSign, User, AlertTriangle, Filter } from 'lucide-react';
import { usePriceApprovals, useUpdateApproval } from '@/hooks/usePriceApprovals';
import { Button } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import type { PriceApproval } from '@/types/pos';

interface PriceApprovalsPanelProps {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
  showStatusFilter?: boolean;
}

export function PriceApprovalsPanel({ status = 'PENDING', showStatusFilter = true }: PriceApprovalsPanelProps) {
  const { data: approvals, isLoading, error } = usePriceApprovals(status);
  const updateApproval = useUpdateApproval();
  const { success, error: showError } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (approval: PriceApproval) => {
    setProcessingId(approval.id);
    try {
      await updateApproval(approval.id, 'APPROVED', Number(approval.requestedPrice));
      success('Aprobación aceptada correctamente');
    } catch (err) {
      showError('Error al aprobar la solicitud');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (approval: PriceApproval) => {
    setProcessingId(approval.id);
    try {
      await updateApproval(approval.id, 'REJECTED');
      success('Aprobación rechazada correctamente');
    } catch (err) {
      showError('Error al rechazar la solicitud');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="text-sm text-gray-500">Cargando aprobaciones...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-sm text-red-500">Error al cargar aprobaciones</div>
      </div>
    );
  }

  if (!approvals || approvals.length === 0) {
    const getEmptyMessage = () => {
      switch (status) {
        case 'PENDING':
          return 'No hay aprobaciones pendientes';
        case 'APPROVED':
          return 'No hay aprobaciones aprobadas';
        case 'REJECTED':
          return 'No hay aprobaciones rechazadas';
        case 'ALL':
        default:
          return 'No hay aprobaciones';
      }
    };

    return (
      <div className="p-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <CheckCircle className="h-8 w-8 text-gray-400" />
          <div className="text-sm text-gray-500">{getEmptyMessage()}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {approvals.map((approval: PriceApproval) => (
        <div
          key={approval.id}
          className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-sm">Solicitud de Aprobación</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  approval.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                  approval.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {approval.status === 'PENDING' ? 'Pendiente' :
                   approval.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'}
                </span>
              </div>

              {/* Service Info */}
              <div className="space-y-1">
                <div className="text-sm">
                  <span className="font-medium">Servicio:</span> {approval.service.name}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Precio solicitado:</span> S/ {approval.requestedPrice}
                </div>
                {approval.approvedPrice && (
                  <div className="text-sm">
                    <span className="font-medium">Precio aprobado:</span> S/ {approval.approvedPrice}
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-medium">Solicitado por:</span> {approval.requestedBy.name}
                </div>
                {approval.reason && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Motivo:</span> {approval.reason}
                  </div>
                )}
                {approval.status !== 'PENDING' && approval.approvedBy && (
                  <div className="text-sm">
                    <span className="font-medium">Aprobado por:</span> {approval.approvedBy.name}
                  </div>
                )}
                {approval.status !== 'PENDING' && approval.approvedAt && (
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Fecha de resolución:</span> {new Date(approval.approvedAt).toLocaleString()}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Creado:</span> {new Date(approval.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Actions */}
            {approval.status === 'PENDING' && (
              <div className="flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApprove(approval)}
                  disabled={processingId === approval.id}
                  isLoading={processingId === approval.id}
                  className="min-w-[100px]"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Aprobar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReject(approval)}
                  disabled={processingId === approval.id}
                  isLoading={processingId === approval.id}
                  className="min-w-[100px] text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Rechazar
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
