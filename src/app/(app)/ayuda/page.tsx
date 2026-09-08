'use client';

import React, { useState } from 'react';
import { 
  BookOpen, ShoppingCart, Calendar, Package, Users, 
  DollarSign, BarChart3, Shield, Search, ChevronRight, Calculator, FileText, CheckCircle2, AlertTriangle, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const helpCategories = [
  {
    id: 'pos',
    title: 'Punto de Venta (POS)',
    icon: ShoppingCart,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'Gestión completa de ventas, manejo del carrito, precios variables y métodos de cobro múltiple.',
    articles: [
      { 
        title: 'Realizar una venta paso a paso', 
        content: 'El módulo POS está diseñado para ser rápido e intuitivo.\n\n1. En la pantalla principal, verás tres pestañas: Servicios, Paquetes y Productos.\n2. Haz clic en el ítem que deseas vender; automáticamente aparecerá en el "Carrito de Compras" del panel lateral derecho.\n3. Dentro del carrito, puedes ajustar la cantidad usando los botones + y - o eliminar un ítem presionando el ícono de basura.\n4. Si el cliente está registrado, búscalo en la barra superior del carrito para asociar la venta a su perfil y acumular su historial.\n5. Finalmente, presiona el botón verde "Cobrar". Se abrirá la ventana de pagos.'
      },
      { 
        title: 'Manejo de Precios Variables', 
        content: 'Algunos servicios de la barbería o spa (ej. tintes, decoloraciones o tratamientos según el largo del cabello) no tienen un precio fijo.\n\n- Cuando agregas un servicio con "Precio Variable" activado al carrito, el sistema mostrará inmediatamente un recuadro emergente (Modal).\n- El especialista o cajero debe ingresar el precio final acordado con el cliente.\n- Una vez confirmado, el servicio se añade al carrito con ese monto exacto.'
      },
      { 
        title: 'Confirmación de Pagos y Vuelto', 
        content: 'En la ventana de Cobrar (Payment Modal):\n\n1. Selecciona el método de pago (Efectivo, Tarjeta de Crédito/Débito, Yape, Plin, Transferencia).\n2. El sistema permite "Pagos Mixtos". Si el cliente quiere pagar una parte en efectivo y otra en tarjeta, puedes agregar múltiples métodos hasta cubrir el total.\n3. Si pagan en efectivo, ingresa el monto que te entregan (ej. pagan S/ 100 por una cuenta de S/ 45). El sistema calculará automáticamente que debes entregar S/ 55 de vuelto.\n4. Presiona "Confirmar Venta" para emitir el recibo electrónico.'
      },
      { 
        title: 'Ventas en Espera (Guardar Carrito)', 
        content: 'Esta función es crucial para evitar cuellos de botella en caja.\n\n- Si un cliente está a punto de pagar pero decide regresar a buscar un producto adicional, no es necesario cancelar el carrito.\n- Presiona el botón "Ventas en Espera". Esto limpia tu pantalla para atender al siguiente cliente.\n- Para recuperar el carrito anterior, ve al botón "Ventas Pendientes", búscalo en la lista y presiona "Restaurar". Todo volverá tal cual lo dejaste.'
      }
    ]
  },
  {
    id: 'caja',
    title: 'Control de Caja y Arqueo',
    icon: Calculator,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    description: 'Aperturas, cierres de turno, ingresos adicionales y control de descuadres de efectivo.',
    articles: [
      { 
        title: 'Apertura de Caja Diaria', 
        content: 'Es el primer paso antes de registrar cualquier venta.\n\n1. Ingresa a la sección "Caja". Si el sistema detecta que la caja está cerrada, mostrará el formulario de Apertura.\n2. Ingresa el "Monto Base" o Sencillo. Este es el dinero físico con el que empieza el cajero para poder dar vueltos.\n3. Presiona "Abrir Caja". Desde ahora, cada venta en efectivo se sumará automáticamente a este monto inicial.'
      },
      { 
        title: 'Registro de Ingresos y Retiros', 
        content: 'No todo el movimiento de efectivo proviene de ventas. Usa la sección de "Operaciones":\n\n- Retiro de Efectivo: Selecciona "Retiro", ingresa el monto y el motivo (ej. Pago a proveedor de bebidas, S/ 50). Esto resta del total en caja.\n- Ingreso Adicional: Selecciona "Ingreso", ingresa el monto y el motivo (ej. Reposición de sencillo, S/ 100). Esto suma al total.'
      },
      { 
        title: 'Cierre de Caja y Arqueo', 
        content: 'Proceso obligatorio al finalizar el turno o el día.\n\n1. Ve a "Cierre de Caja".\n2. El sistema no te dirá cuánto debería haber. Primero, debes contar físicamente los billetes y monedas que tienes en la gaveta e ingresar ese monto (Efectivo Real).\n3. Al confirmar, el sistema hará el "Arqueo" comparando el Efectivo Registrado en el sistema vs Efectivo Real ingresado.\n4. El resultado te mostrará si hay un Cuadre Perfecto, un Sobrante (hay más dinero del que debería) o un Faltante (falta dinero).'
      },
      { 
        title: 'Historial de Registros', 
        content: 'El administrador puede revisar cualquier turno pasado en la sección "Historial de Caja". Allí podrá ver a qué hora se abrió, quién fue el cajero, el monto de apertura, el resumen de ventas por método de pago y el resultado del arqueo.'
      }
    ]
  },
  {
    id: 'citas',
    title: 'Calendario y Reservas',
    icon: Calendar,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    description: 'Gestión detallada de la agenda, tiempos de servicio y transiciones al POS.',
    articles: [
      { 
        title: 'Agendar una Cita Nueva', 
        content: '1. Navega a "Citas" para ver el calendario mensual, semanal o diario.\n2. Haz clic en el día y hora deseada.\n3. Se abrirá un formulario. Ingresa o busca el nombre del Cliente (si es nuevo, puedes registrarlo rápidamente allí mismo).\n4. Selecciona el o los Servicios que se realizará.\n5. Asigna al Especialista (Barbero, Manicurista, Masajista, etc.). El sistema bloqueará ese horario para dicho especialista.'
      },
      { 
        title: 'Gestión de Estados de la Cita', 
        content: 'Para mantener el orden en el salón, cada cita tiene un estado visual:\n\n- Pendiente (Gris): La cita está agendada pero el cliente no ha llegado.\n- Confirmada (Azul): El cliente confirmó su asistencia por llamada o WhatsApp.\n- En Progreso (Naranja): El cliente está siendo atendido actualmente en el sillón/cabina.\n- Completada (Verde): El servicio terminó y está listo para cobrarse.\n- Cancelada (Rojo): El cliente no asistió.'
      },
      { 
        title: 'Vinculación Inteligente con POS', 
        content: 'No necesitas volver a teclear los servicios en caja.\n\nCuando marques una cita como "Completada", aparecerá un botón que dice "Ir a Cobrar". Al presionarlo, el sistema te enviará automáticamente a la pantalla de POS, con el cliente seleccionado y los servicios de su cita ya listos en el carrito de compras. Simplemente cobra.'
      }
    ]
  },
  {
    id: 'inventario',
    title: 'Inventario y Proveedores',
    icon: Package,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    description: 'Control de existencias, cálculo de costos, proveedores y fechas de vencimiento.',
    articles: [
      { 
        title: 'Gestión de Productos', 
        content: 'En la tabla principal de inventario verás tu catálogo completo. Cada producto tiene: Nombre, Categoría, Stock Actual, Stock Mínimo (para alertas), Precio de Venta y Costo de Compra. Puedes filtrar rápidamente para ver qué está por agotarse.'
      },
      { 
        title: 'Alertas de Caducidad', 
        content: 'Si vendes productos de cuidado personal (shampoos, cremas, lociones), el sistema rastrea la fecha de vencimiento. En la sección "Alertas de Caducidad" aparecerán los lotes que vencerán en los próximos 30, 60 o 90 días, permitiéndote hacer promociones antes de perder la mercadería.'
      },
      { 
        title: 'Entradas de Stock y Ajustes', 
        content: 'Nunca alteres el stock manualmente a menos que sea una corrección. \n\n- Para abastecer, ve a "Movimientos de Stock" y crea una "Entrada". \n- Selecciona el Proveedor que te entregó la mercadería, los productos, las cantidades y el costo unitario al que los compraste.\n- Esto actualizará el stock y calculará automáticamente el margen de ganancia.'
      }
    ]
  },
  {
    id: 'finanzas',
    title: 'Finanzas y Comisiones',
    icon: DollarSign,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    description: 'Cálculo automatizado de pagos al personal, ingresos externos y gastos operativos.',
    articles: [
      { 
        title: 'Cálculo Automático de Comisiones', 
        content: 'Olvídate de calcular a mano a fin de mes. \n\nCada vez que se cobra un servicio en el POS, el sistema verifica qué especialista lo realizó y aplica el porcentaje de comisión configurado en su perfil (ej. 40% o 50%). El dinero se va acumulando virtualmente en el saldo del barbero.'
      },
      { 
        title: 'Vista del Especialista', 
        content: 'Los empleados (barberos/estilistas) pueden entrar al sistema con su usuario y ver su propia sección "Mis Comisiones". Allí verán exactamente cuántos servicios hicieron hoy, cuánto generaron para el local y cuánto de eso es su comisión.'
      },
      { 
        title: 'Liquidación de Comisiones', 
        content: 'Cuando sea día de pago (semanal o quincenal), el Administrador debe ir a "Comisiones", seleccionar al empleado y hacer clic en "Liquidar". \n- Esto pondrá el saldo de comisiones a cero.\n- Registrará una salida de dinero (Gasto) bajo el concepto de "Pago de planillas/comisiones" para la contabilidad general.'
      },
      { 
        title: 'Gastos Operativos', 
        content: 'Para saber si el negocio es rentable, debes registrar los gastos. En la pestaña "Gastos", registra los recibos de agua, luz, internet, alquiler, artículos de limpieza, etc. Estos montos se restarán de los Ingresos Totales en el Dashboard consolidado.'
      }
    ]
  },
  {
    id: 'reportes',
    title: 'Reportes y Dashboard',
    icon: BarChart3,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    description: 'Análisis de datos, KPIs en tiempo real y exportación contable.',
    articles: [
      { 
        title: 'Dashboards por Rol', 
        content: 'La pantalla de inicio es inteligente:\n- El Administrador ve un Dashboard Consolidado (Ventas del día, Ingresos vs Gastos, Productos top, etc.).\n- El Barbero ve un Dashboard de Especialista (Próximas citas de hoy, comisiones del día, meta personal).'
      },
      { 
        title: 'Reportes Detallados', 
        content: 'En la pestaña "Reportes", tienes acceso a inteligencia de negocios. Puedes generar:\n1. Reporte de Ventas: Por método de pago, por fecha, o por cajero.\n2. Reporte de Rendimiento: Qué barbero produce más dinero.\n3. Reporte de Inventario: Valorización de tu stock actual (cuánto dinero tienes inmovilizado en productos).\n\nTodos los reportes incluyen un botón superior para exportar los datos a PDF o a Excel (.xlsx) para enviarlos al contador.'
      }
    ]
  },
];

export default function AyudaPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = helpCategories.map(cat => ({
    ...cat,
    articles: cat.articles.filter(
      art => 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        art.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.articles.length > 0 || cat.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[var(--unit-surface)] text-[var(--unit-text)] p-4 sm:p-6 lg:p-8 pt-20">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] mb-2">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Centro de Ayuda Avanzado</h1>
          <p className="text-[var(--unit-text-muted)] max-w-2xl mx-auto text-sm sm:text-base">
            Explora guías detalladas, trucos y tutoriales paso a paso para dominar completamente la gestión de tu Barbería y SPA.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative mt-6 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-[var(--unit-text-muted)] group-focus-within:text-[var(--unit-accent)] transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Ej. 'Cómo liquidar comisiones' o 'Ventas en espera'..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)] rounded-full focus:outline-none focus:border-[var(--unit-accent)] focus:ring-4 focus:ring-[var(--unit-accent)]/10 transition-all text-base shadow-sm"
            />
          </div>
        </div>

        {/* Categories Grid */}
        {!selectedCategory && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12"
          >
            {filteredCategories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedCategory(category.id)}
                className="flex flex-col items-start p-6 lg:p-8 rounded-3xl bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)] hover:border-[var(--unit-accent)]/50 hover:shadow-unit-lg transition-all duration-300 text-left group relative overflow-hidden"
              >
                {/* Background Decoration */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--unit-surface)] to-transparent rounded-bl-full opacity-50 transition-transform group-hover:scale-110`} />
                
                <div className={`p-4 rounded-2xl ${category.bgColor} ${category.color} mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm relative z-10`}>
                  <category.icon className="h-8 w-8" />
                </div>
                
                <h3 className="font-bold text-xl mb-2 relative z-10">{category.title}</h3>
                <p className="text-[var(--unit-text-muted)] text-sm mb-6 leading-relaxed relative z-10">
                  {category.description}
                </p>
                
                <div className="mt-auto flex items-center text-sm font-bold text-[var(--unit-accent)] relative z-10 group-hover:translate-x-1 transition-transform">
                  Ver {category.articles.length} artículos detallados <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Detail View */}
        <AnimatePresence mode="wait">
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto mt-8"
            >
              <button 
                onClick={() => setSelectedCategory(null)}
                className="mb-8 text-sm font-bold text-[var(--unit-text-muted)] hover:text-[var(--unit-text)] flex items-center gap-2 transition-colors py-2 px-4 rounded-full hover:bg-[var(--unit-surface-elevated)] border border-transparent hover:border-[var(--unit-border)]"
              >
                <ChevronRight className="h-4 w-4 rotate-180" /> Volver al menú principal
              </button>

              {(() => {
                const category = helpCategories.find(c => c.id === selectedCategory);
                if (!category) return null;
                
                return (
                  <div className="bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)] rounded-3xl overflow-hidden shadow-unit-md">
                    <div className={`p-8 md:p-12 border-b border-[var(--unit-border)]/50 flex flex-col md:flex-row md:items-center gap-6 relative overflow-hidden`}>
                      <div className={`absolute top-0 right-0 w-full h-full opacity-10 bg-gradient-to-r from-transparent to-[var(--unit-text)]`} />
                      
                      <div className={`p-5 rounded-2xl bg-[var(--unit-surface)] ${category.color} shadow-sm shrink-0 relative z-10`}>
                        <category.icon className="h-10 w-10" />
                      </div>
                      <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-2 tracking-tight">{category.title}</h2>
                        <p className="text-[var(--unit-text-muted)] text-lg max-w-2xl">{category.description}</p>
                      </div>
                    </div>
                    
                    <div className="p-8 md:p-12 space-y-10">
                      {category.articles.map((article, i) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          key={i} 
                          className="pb-10 border-b border-[var(--unit-border)]/50 last:border-0 last:pb-0"
                        >
                          <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-[var(--unit-text)]">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[var(--unit-surface)] border border-[var(--unit-border)] text-sm font-bold text-[var(--unit-text-muted)] shrink-0">
                              {i + 1}
                            </div>
                            {article.title}
                          </h3>
                          <div className="text-[var(--unit-text-muted)] leading-relaxed text-base pl-11 space-y-4 whitespace-pre-line">
                            {article.content}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="bg-[var(--unit-surface)] border-t border-[var(--unit-border)]/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-sm font-medium text-[var(--unit-text-muted)] flex items-center gap-2">
                        <Info className="h-4 w-4" /> ¿No encontraste lo que buscabas?
                      </p>
                      <a 
                        href="https://wa.me/51951171534" 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-500/20 transition-colors text-sm flex items-center gap-2"
                      >
                        Contactar Soporte
                      </a>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
