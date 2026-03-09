'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Button, Input } from '@/components/ui';
import { Lock, Key, Shield, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Contraseña actual requerida'),
    newPassword: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Al menos una mayúscula')
      .regex(/[a-z]/, 'Al menos una minúscula')
      .regex(/[0-9]/, 'Al menos un número')
      .regex(/[^A-Za-z0-9]/, 'Al menos un símbolo'),
    confirmPassword: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

function getStrength(value: string): 0 | 1 | 2 | 3 {
  if (!value.length) return 0;
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  if (score <= 1) return 1;
  if (score <= 2) return 2;
  return 3;
}

const strengthLabels = ['', 'Débil', 'Media', 'Fuerte'];
const strengthColors = ['bg-gray-200', 'bg-red-400', 'bg-amber-400', 'bg-green-500'];

export default function ChangePasswordPage(): JSX.Element {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const tryRefresh = useAuthStore((s) => s.tryRefresh);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (user && accessToken) {
      setReady(true);
      return;
    }
    tryRefresh().then((ok) => {
      setReady(true);
      if (!ok) router.replace('/login');
    });
  }, [user, accessToken, tryRefresh, router]);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPassword = watch('newPassword', '');
  const strength = useMemo(() => getStrength(newPassword), [newPassword]);

  const requirements = useMemo(
    () => [
      { label: '8+ caracteres', ok: newPassword.length >= 8 },
      { label: 'Al menos una mayúscula', ok: /[A-Z]/.test(newPassword) },
      { label: 'Al menos una minúscula', ok: /[a-z]/.test(newPassword) },
      { label: 'Al menos un número', ok: /[0-9]/.test(newPassword) },
      { label: 'Al menos un símbolo', ok: /[^A-Za-z0-9]/.test(newPassword) },
    ],
    [newPassword]
  );

  const onSubmit = async (data: ChangePasswordForm) => {
    setError(null);
    try {
      await api.post('/api/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : 'Error al cambiar la contraseña';
      setError(msg ?? 'Error al cambiar la contraseña');
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)] relative flex items-center justify-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--unit-accent)]" />
            <p className="text-[var(--unit-text)]/80">Verificando sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)] relative flex items-center justify-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-green-100 p-8 text-center shadow-2xl max-w-md w-full mx-6"
        >
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="font-heading text-2xl font-bold text-green-800 mb-2">
            ¡Contraseña actualizada!
          </h2>
          <p className="text-sm text-green-700">Redirigiendo al dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)] relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative max-w-2xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
            <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
            <span className="text-sm font-medium text-[var(--unit-text)]">
              Seguridad de cuenta
            </span>
          </div>
          <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">
            Cambiar contraseña
          </h1>
          <p className="text-[var(--unit-text-muted)]">
            Es obligatorio actualizar tu contraseña para continuar.
          </p>
        </div>

        {/* Enhanced Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm shadow-2xl"
        >
          {/* Form Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                <Lock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--unit-text)]">Actualización de seguridad</h2>
                <p className="text-sm text-[var(--unit-text-muted)]">Completa todos los campos requeridos</p>
              </div>
            </div>
          </div>

          {/* Enhanced Error Alert */}
          {error && (
            <div className="mx-6 mt-4 rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-50 to-red-100 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 shadow-lg">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
                <p className="font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Enhanced Form Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Enhanced Current Password Field */}
            <div>
              <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Contraseña actual *</label>
              <div className="relative">
                <input 
                  type={showPasswords.current ? 'text' : 'password'}
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 pr-12 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" 
                  placeholder="Ingresa tu contraseña actual"
                  {...register('currentPassword')} 
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--unit-text-muted)] hover:text-[var(--unit-accent)] transition-colors"
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            {/* Enhanced New Password Field */}
            <div>
              <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Nueva contraseña *</label>
              <div className="relative">
                <input 
                  type={showPasswords.new ? 'text' : 'password'}
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 pr-12 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" 
                  placeholder="Crea una nueva contraseña segura"
                  {...register('newPassword')} 
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--unit-text-muted)] hover:text-[var(--unit-accent)] transition-colors"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.newPassword.message}
                </p>
              )}

              {/* Enhanced Strength Indicator */}
              {newPassword.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-[var(--unit-text)]/70 font-medium">Fortaleza</span>
                    <span className={`font-medium ${strength >= 2 ? 'text-green-600' : 'text-amber-600'}`}>
                      {strengthLabels[strength]}
                    </span>
                  </div>
                  <div className="flex h-2 gap-1 rounded-full overflow-hidden bg-gray-200">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className={`h-full flex-1 ${i <= strength ? strengthColors[strength] : ''}`}
                        initial={{ width: 0 }}
                        animate={{ width: i <= strength ? '100%' : 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Requirements List */}
            <div className="bg-[var(--unit-surface)]/50 rounded-xl p-4 border border-[var(--unit-border)]/30">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-[var(--unit-accent)]" />
                <span className="text-sm font-bold text-[var(--unit-text)]">Requisitos de seguridad</span>
              </div>
              <ul className="space-y-2 text-sm">
                {requirements.map((r) => (
                  <li key={r.label} className="flex items-center gap-2">
                    <span className={r.ok ? 'text-green-600' : 'text-gray-400'}>
                      {r.ok ? '✅' : '○'}
                    </span>
                    <span className={r.ok ? 'text-[var(--unit-text)] font-medium' : 'text-[var(--unit-text-muted)]'}>
                      {r.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Enhanced Confirm Password Field */}
            <div>
              <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Confirmar nueva contraseña *</label>
              <div className="relative">
                <input 
                  type={showPasswords.confirm ? 'text' : 'password'}
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 pr-12 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all" 
                  placeholder="Repite la nueva contraseña"
                  {...register('confirmPassword')} 
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--unit-text-muted)] hover:text-[var(--unit-accent)] transition-colors"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Enhanced Action Button */}
            <div className="pt-4">
              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                className="relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Actualizando contraseña...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4" />
                      Cambiar contraseña
                    </>
                  )}
                </span>
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
