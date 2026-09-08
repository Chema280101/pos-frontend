'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, KeyRound, HelpCircle, Check, Copy, Mail } from 'lucide-react';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ open, onClose }: ForgotPasswordModalProps): JSX.Element {
  const [copied, setCopied] = useState(false);
  const supportEmail = 'soporte@barberiayspa.com';

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Recuperación de Contraseña"
      description="Políticas de seguridad corporativa para terminales POS"
      size="md"
      headerIcon={<KeyRound className="h-5 w-5" />}
    >
      <div className="space-y-5">
        <div className="rounded-unit-lg border border-amber-200/70 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20 p-4">
          <div className="flex gap-3 items-start">
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200/90 leading-relaxed">
              <p className="font-semibold mb-1">Acceso Controlado de Punto de Venta</p>
              Por motivos de seguridad financiera y auditoría del POS, el reseteo de claves y desbloqueo de usuarios es gestionado directamente por los <strong>Administradores</strong> del sistema.
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-violet-500" />
            ¿Qué debes hacer?
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-600 dark:text-zinc-400 pl-1">
            <li>
              <span className="font-medium text-slate-700 dark:text-zinc-300">Contacta al Administrador de turno:</span> Solicita que restablezca tu contraseña temporal o desbloquee tu usuario desde el módulo de Usuarios.
            </li>
            <li>
              <span className="font-medium text-slate-700 dark:text-zinc-300">Primer ingreso:</span> Al recibir tu nueva clave temporal, el sistema te solicitará cambiarla inmediatamente por una personalizada.
            </li>
          </ol>
        </div>

        <div className="rounded-unit border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Mail className="h-4 w-4 text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-zinc-400">Canal de Soporte Técnico</p>
              <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-zinc-200 truncate">{supportEmail}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyEmail}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-300 transition-all shadow-sm cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>

        <div className="pt-2 flex justify-end gap-2.5">
          <Button variant="outline" size="sm" onClick={onClose}>
            Entendido, volver
          </Button>
        </div>
      </div>
    </Modal>
  );
}
