'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { api, setAccessToken } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { LoginResponse } from '@/types/auth';
import { Button, Input } from '@/components/ui';

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }).min(1, { message: "Este campo es requerido" }),
  password: z.string().min(1, { message: "Este campo es requerido" }),
});

type LoginForm = z.infer<typeof loginSchema>;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);
  const [attemptsHint, setAttemptsHint] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [mounted, setMounted] = useState(false);

  const particlePositions = useMemo(() => [
    { top: 25, left: 15 },
    { top: 35, left: 75 },
    { top: 55, left: 25 },
    { top: 65, left: 85 },
    { top: 75, left: 45 },
    { top: 85, left: 65 }
  ], []);

  useEffect(() => setMounted(true), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setAttemptsHint(null);
    try {
      const { data: res } = await api.post<LoginResponse>('/api/auth/login', data);
      setAccessToken(res.accessToken);
      setSession(res.user, res.accessToken);
      setFailedAttempts(0);

      if (res.user.mustChangePassword) {
        router.push('/change-password');
        return;
      }
      
      // Redirigir según el rol del usuario
      switch (res.user.role) {
        case 'ADMIN':
          router.push('/dashboard');
          break;
        case 'RECEPTIONIST':
          router.push('/pos');
          break;
        case 'SPA_SPECIALIST':
        case 'BARBER':
          router.push('/appointments');
          break;
        default:
          router.push('/appointments');
          break;
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown; status?: number }; message?: string; code?: string };
      const responseData = ax.response?.data;
      const isNetworkError = !ax.response && (ax.message === 'Network Error' || ax.code === 'ERR_NETWORK');

      if (process.env.NODE_ENV === 'development' && err) {
        const status = ax.response?.status;
        const summary =
          isNetworkError
            ? 'Sin conexión con el backend. ¿Está corriendo en http://localhost:4000?'
            : status === 401
              ? 'Credenciales incorrectas.'
              : status
                ? `Error del servidor: ${status}.`
                : 'Error de conexión.';
        // Error silencioso para mantener console limpio
      }

      let msg: string | undefined;
      let remainingAttempts: number | undefined;
      if (responseData && typeof responseData === 'object') {
        const d = responseData as Record<string, unknown>;
        if (typeof d.error === 'string') msg = d.error;
        else if (typeof d.message === 'string') msg = d.message;
        if (typeof d.remainingAttempts === 'number') remainingAttempts = d.remainingAttempts;
      }

      if (isNetworkError) {
        setError('No se pudo conectar con el servidor. Comprueba que el backend esté en ejecución (por defecto en http://localhost:4000).');
        setAttemptsHint(null);
        return;
      }
      setError(msg?.trim() || `Error al iniciar sesión${ax.response?.status ? ` (código ${ax.response.status})` : ''}`);
      if (msg?.toLowerCase().includes('bloqueada')) {
        router.push('/error/locked');
        return;
      }
      const isCredentialError = msg?.toLowerCase().includes('credencial') || ax.response?.status === 401;
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (isCredentialError && nextAttempts >= 2) {
        const n = remainingAttempts ?? Math.max(0, 5 - nextAttempts);
        setAttemptsHint(n > 0 ? `Te quedan ${n} intentos antes del bloqueo.` : 'Te quedan pocos intentos antes del bloqueo.');
      }
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Panel izquierdo: marca y atmósfera */}
      <div
        className="relative hidden min-h-screen w-[48%] flex-col justify-between overflow-hidden p-12 lg:flex dark-panel"
        style={{
          background: 'var(--unit-gradient-hero)',
          borderRight: '1px solid var(--unit-border)',
        }}
      >
        <div className="absolute inset-0 bg-pattern-dots opacity-[0.04]" style={{ color: 'var(--unit-text)' }} aria-hidden />
        
        {/* Imagen de fondo para todo el panel izquierdo */}
        <div className="absolute inset-0">
          <img
            src="/login-bg.jpg" // Cambia esto por el nombre de tu imagen
            alt="Barbería y Spa"
            className="w-full h-full object-cover opacity-40"
          />
          {/* Overlay más oscuro para mayor opacidad */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
        </div>
        
        {/* Partículas flotantes sobre la imagen */}
        {mounted && (
          <div className="absolute inset-0">
            {particlePositions.map((position, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-white/30 to-white/20 rounded-full blur-sm"
                style={{
                  top: `${position.top}%`,
                  left: `${position.left}%`
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, 10 - i * 3, 0],
                  opacity: [0, 0.6, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        )}
        
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-heading text-2xl font-semibold tracking-tight text-[var(--unit-text)]"
          >
            Barbería y Spa
          </motion.div>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-1 block text-sm font-medium uppercase tracking-[0.2em] text-[var(--unit-text)]"
            style={{ fontFamily: 'var(--unit-font-body)' }}
          >
            Punto de venta
          </motion.span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative rounded-[var(--unit-border-radius)] border border-[var(--unit-border)] bg-[var(--unit-surface-elevated)]/80 p-8 shadow-[var(--unit-shadow-lg)] backdrop-blur-sm"
        >
          <p className="font-heading text-xl leading-snug text-[var(--unit-text)]">
            Gestión interna para tu negocio.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--unit-text)]" style={{ fontFamily: 'var(--unit-font-body)' }}>
            SPA y Barbería en una sola plataforma: agenda, ventas, inventario y reportes.
          </p>
          <div className="mt-6 h-px w-12 rounded-full bg-[var(--unit-accent)]" aria-hidden />
        </motion.div>

        <p className="relative text-xs text-[var(--unit-text)]" style={{ fontFamily: 'var(--unit-font-body)' }}>
          &copy; Barbería y Spa
        </p>
      </div>

      {/* Panel derecho: formulario */}
      <div className="flex w-full flex-col justify-center px-6 py-14 lg:w-[52%] lg:px-20">
        {/* Loading state */}
        {!mounted ? (
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--unit-accent)] border-t-transparent mx-auto"></div>
              <p className="mt-4 text-[var(--unit-text-muted)]">Cargando...</p>
            </div>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="mx-auto w-full max-w-[400px]"
          >
            <motion.p
              variants={item}
              className="font-heading text-2xl font-bold text-[var(--unit-text)]"
            >
              Barbería y Spa POS
            </motion.p>
            <motion.h1 variants={item} className="mt-8 font-heading text-4xl font-bold text-[var(--unit-text)]">
              Iniciar sesión
            </motion.h1>
            <motion.p variants={item} className="mt-3 text-base text-[var(--unit-text-muted)]">
              Ingresa tus credenciales para acceder al sistema
            </motion.p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-12 space-y-6">
              {error && (
                <motion.div
                  variants={item}
                  layout
                  className="rounded-[var(--unit-radius-sm)] border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800"
                  role="alert"
                >
                  {error}
                  {attemptsHint && (
                    <p className="mt-1 font-medium text-red-700">{attemptsHint}</p>
                  )}
                </motion.div>
              )}

              <motion.div variants={item}>
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </motion.div>
              <motion.div variants={item}>
                <Input
                  label="Contraseña"
                  type="password"
                  autoComplete="current-password"
                  showPasswordToggle
                  error={errors.password?.message}
                  {...register('password')}
                />
              </motion.div>

              <motion.div variants={item} className="mt-8">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="h-12 w-full text-base font-semibold shadow-lg shadow-[var(--unit-accent)]/25 transition-all hover:shadow-xl hover:shadow-[var(--unit-accent)]/35"
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                >
                  {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </Button>
              </motion.div>
            </form>

            <motion.div variants={item} className="mt-8 text-center">
              <p className="text-sm text-[var(--unit-text-muted)]">
                Contacta al administrador para crear tu cuenta
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
