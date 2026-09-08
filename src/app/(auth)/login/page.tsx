'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Sparkles,
  Scissors,
  Eye,
  EyeOff,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Layers,
  ArrowRight,
  HelpCircle,
  KeyRound,
  RotateCcw,
  Sparkle
} from 'lucide-react';
import { api, setAccessToken } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { LoginResponse } from '@/types/auth';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';

const REMEMBER_EMAIL_KEY = 'pos_saved_email';

const loginSchema = z.object({
  email: z.string().email({ message: 'Ingresa un correo electrónico válido' }).min(1, { message: 'El correo es requerido' }),
  password: z.string().min(1, { message: 'La contraseña es requerida' }),
});

type LoginForm = z.infer<typeof loginSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [error, setError] = useState<string | null>(null);
  const [attemptsHint, setAttemptsHint] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Cargar email recordado al montar
  useEffect(() => {
    setMounted(true);
    try {
      const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (savedEmail) {
        setValue('email', savedEmail, { shouldValidate: true });
        setRememberMe(true);
      }
    } catch {
      // Ignorar fallo de localStorage
    }
  }, [setValue]);

  // Rotar tabs de características de negocio en panel izquierdo
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeatureTab((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Detector de Bloqueo de Mayúsculas
  const handleKeyModifier = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const isCaps = e.getModifierState('CapsLock');
    setCapsLockActive(isCaps);
  }, []);

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setAttemptsHint(null);
    try {
      const { data: res } = await api.post<LoginResponse>('/api/auth/login', data);
      setAccessToken(res.accessToken);
      setSession(res.user, res.accessToken);
      setFailedAttempts(0);

      // Guardar o limpiar email recordado
      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, data.email);
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        // Ignorar fallo de almacenamiento
      }

      if (res.user.mustChangePassword) {
        router.push('/change-password');
        return;
      }

      // Redirección contextual según el rol de negocio
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

      let msg: string | undefined;
      let remainingAttempts: number | undefined;
      if (responseData && typeof responseData === 'object') {
        const d = responseData as Record<string, unknown>;
        if (typeof d.error === 'string') msg = d.error;
        else if (typeof d.message === 'string') msg = d.message;
        if (typeof d.remainingAttempts === 'number') remainingAttempts = d.remainingAttempts;
      }

      if (isNetworkError) {
        setError('No se pudo establecer conexión con el servidor POS. Verifica que el backend esté en ejecución.');
        setAttemptsHint(null);
        return;
      }

      const formattedError = msg?.trim() || `Error al iniciar sesión${ax.response?.status ? ` (código ${ax.response.status})` : ''}`;
      setError(formattedError);

      if (msg?.toLowerCase().includes('bloqueada')) {
        router.push('/error/locked');
        return;
      }

      const isCredentialError = msg?.toLowerCase().includes('credencial') || ax.response?.status === 401;
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      if (isCredentialError && nextAttempts >= 2) {
        const n = remainingAttempts ?? Math.max(0, 5 - nextAttempts);
        setAttemptsHint(n > 0 ? `Te quedan ${n} intentos antes del bloqueo preventivo.` : 'Pocos intentos restantes antes del bloqueo preventivo.');
      }
    }
  };

  const featureCards = [
    {
      icon: <Calendar className="w-5 h-5 text-fuchsia-300" />,
      title: 'Agenda y Citas en Tiempo Real',
      desc: 'Gestión inteligente de especialistas, cabinas de spa y estaciones de corte.',
    },
    {
      icon: <CreditCard className="w-5 h-5 text-pink-300" />,
      title: 'Punto de Venta Profesional',
      desc: 'Cobros rápidos multidivisa, control de comisiones y cierres de caja ciegos.',
    },
    {
      icon: <Layers className="w-5 h-5 text-violet-300" />,
      title: 'Control de Stock e Inventario',
      desc: 'Descuento por consumo en cabina, alertas de stock mínimo y trazabilidad total.',
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 selection:bg-fuchsia-500 selection:text-white font-sans">
      <ForgotPasswordModal open={forgotModalOpen} onClose={() => setForgotModalOpen(false)} />

      {/* =========================================================================
          PANEL IZQUIERDO: Branding de Lujo, Atmósfera Spa & Showcase
         ========================================================================= */}
      <div className="relative hidden min-h-screen w-[48%] flex-col justify-between overflow-hidden p-12 lg:flex xl:p-16">
        {/* Luces y Gradientes Ambientales */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/80 to-slate-950" />
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-gradient-to-br from-fuchsia-600/25 via-violet-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[560px] h-[560px] bg-gradient-to-tr from-pink-600/20 via-purple-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/10 via-transparent to-transparent pointer-events-none" />

        {/* Micro-textura de puntos sutiles */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Cabecera / Marca */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3.5"
          >
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-fuchsia-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950/40 backdrop-blur-sm">
                <Scissors className="h-6 w-6 text-white transform -rotate-45" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-2xl font-bold tracking-tight text-white">
                  Barbería &amp; Spa
                </h2>
                <span className="rounded-md border border-fuchsia-400/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-fuchsia-300">
                  POS Suite
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Gestión integral de estética y bienestar</p>
            </div>
          </motion.div>
        </div>

        {/* Tarjeta Central Interactiva: Showcase de Módulos */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative z-10 my-auto max-w-lg"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-2xl shadow-2xl">
            {/* Header del Showcase */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 shadow-md">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-fuchsia-300">
                  Ecosistema Operativo
                </span>
              </div>
              <div className="flex gap-1.5">
                {featureCards.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveFeatureTab(i)}
                    aria-label={`Ver característica ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeFeatureTab === i
                        ? 'w-6 bg-gradient-to-r from-fuchsia-400 to-pink-400 shadow-sm'
                        : 'w-2 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Contenido animado del carrusel */}
            <div className="relative min-h-[90px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeatureTab}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2.5">
                    {featureCards[activeFeatureTab].icon}
                    <h3 className="text-lg font-bold text-white">
                      {featureCards[activeFeatureTab].title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-300/80 leading-relaxed">
                    {featureCards[activeFeatureTab].desc}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Highlights en Pills */}
            <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-slate-300 border border-white/5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Control de Comisiones
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-slate-300 border border-white/5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Tickets de Venta
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-slate-300 border border-white/5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Multiusuario Seguro
              </span>
            </div>
          </div>
        </motion.div>

        {/* Footer del panel izquierdo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative z-10 flex items-center justify-between text-xs text-slate-400"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-medium text-slate-300">Terminal POS Conectada</span>
          </div>
          <span>Versión 2.0 • Sistema Seguro</span>
        </motion.div>
      </div>

      {/* =========================================================================
          PANEL DERECHO: Formulario de Autenticación Modernizado
         ========================================================================= */}
      <div className="relative flex w-full flex-col justify-center px-6 py-12 lg:w-[52%] lg:px-16 xl:px-24 bg-slate-900/60 backdrop-blur-md">
        {/* Glows de fondo para móvil y escritorio */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-0 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
        </div>

        {!mounted ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-fuchsia-500 border-t-transparent" />
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="mx-auto w-full max-w-[430px] relative z-10"
          >
            {/* Header del formulario para móviles y escritorio */}
            <motion.div variants={itemVariants} className="text-center mb-8">
              {/* Logo visible en pantallas pequeñas */}
              <div className="inline-flex lg:hidden items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-fuchsia-500/30 mb-4">
                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950/60">
                  <Scissors className="h-7 w-7 text-white transform -rotate-45" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300 text-xs font-semibold mb-3">
                <Sparkle className="h-3.5 w-3.5" />
                Acceso al Sistema
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Bienvenido de vuelta
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-400">
                Ingresa tus credenciales autorizadas para abrir sesión
              </p>
            </motion.div>

            {/* Formulario */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Alerta de Error Accesible */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 backdrop-blur-md"
                    role="alert"
                    aria-live="polite"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
                        {error.toLowerCase().includes('bloque') ? (
                          <ShieldAlert className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="space-y-1 text-xs sm:text-sm">
                        <p className="font-semibold text-red-200">{error}</p>
                        {attemptsHint && (
                          <p className="text-xs font-medium text-amber-300 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                            {attemptsHint}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Campo Email */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold tracking-wide uppercase text-slate-300"
                >
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-fuchsia-400 transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="username email"
                    placeholder="usuario@barberiaspa.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={`block w-full rounded-xl border bg-slate-950/60 pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 transition-all outline-none backdrop-blur-md focus:ring-2 ${
                      errors.email
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-700/80 hover:border-slate-600 focus:border-fuchsia-500 focus:ring-fuchsia-500/25'
                    }`}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="text-xs text-red-400 flex items-center gap-1 mt-1 font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.email.message}
                  </p>
                )}
              </motion.div>

              {/* Campo Contraseña */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold tracking-wide uppercase text-slate-300"
                  >
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(true)}
                    className="text-xs font-medium text-fuchsia-400 hover:text-fuchsia-300 hover:underline transition-colors cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-fuchsia-400 transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    onKeyDown={handleKeyModifier}
                    onKeyUp={handleKeyModifier}
                    className={`block w-full rounded-xl border bg-slate-950/60 pl-10 pr-11 py-3 text-sm text-slate-100 placeholder-slate-500 transition-all outline-none backdrop-blur-md focus:ring-2 ${
                      errors.password
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-700/80 hover:border-slate-600 focus:border-fuchsia-500 focus:ring-fuchsia-500/25'
                    }`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Detector de Bloqueo de Mayúsculas (Caps Lock) */}
                <AnimatePresence>
                  {capsLockActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300 flex items-center gap-1.5 font-medium"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span>Bloqueo de Mayúsculas (Caps Lock) activado</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {errors.password && (
                  <p id="password-error" className="text-xs text-red-400 flex items-center gap-1 mt-1 font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </motion.div>

              {/* Recordarme */}
              <motion.div variants={itemVariants} className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-fuchsia-600 focus:ring-fuchsia-500/30 focus:ring-offset-0 transition-colors cursor-pointer accent-fuchsia-600"
                  />
                  <span className="text-xs sm:text-sm text-slate-300 group-hover:text-white transition-colors">
                    Recordar correo en esta terminal
                  </span>
                </label>
              </motion.div>

              {/* Botón de Submit Principal */}
              <motion.div variants={itemVariants} className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600 shadow-lg shadow-fuchsia-600/25 hover:shadow-fuchsia-600/40 hover:brightness-110 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 group cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>Autenticando credenciales...</span>
                    </>
                  ) : (
                    <>
                      <span>Ingresar al Sistema</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.div>
            </form>

            {/* Ayuda de Soporte */}
            <motion.div variants={itemVariants} className="mt-8 text-center">
              <p className="text-xs text-slate-500">
                ¿Problemas para acceder a tu terminal?{' '}
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="font-medium text-fuchsia-400 hover:text-fuchsia-300 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Contacta a soporte técnico
                </button>
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
