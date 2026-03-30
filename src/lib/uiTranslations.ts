// Sistema de traducciones para elementos de UI (frontend)
// Traduce textos estáticos y mensajes del sistema

// Traducciones de textos comunes de UI
export const UI_TEXTS = {
  // Botones y acciones
  save: 'Guardar',
  cancel: 'Cancelar',
  delete: 'Eliminar',
  edit: 'Editar',
  view: 'Ver',
  search: 'Buscar',
  filter: 'Filtrar',
  add: 'Agregar',
  create: 'Crear',
  update: 'Actualizar',
  remove: 'Quitar',
  submit: 'Enviar',
  back: 'Atrás',
  next: 'Siguiente',
  previous: 'Anterior',
  close: 'Cerrar',
  open: 'Abrir',
  yes: 'Sí',
  no: 'No',
  ok: 'Aceptar',
  reset: 'Resetear',
  unlock: 'Desbloquear',
  
  // Estados y mensajes
  loading: 'Cargando',
  error: 'Error',
  success: 'Éxito',
  warning: 'Advertencia',
  info: 'Información',
  please: 'Por favor',
  enterText: 'Ingresar',
  
  // Formularios
  email: 'Correo electrónico',
  password: 'Contraseña',
  username: 'Nombre de usuario',
  name: 'Nombre',
  phone: 'Teléfono',
  address: 'Dirección',
  city: 'Ciudad',
  country: 'País',
  dateField: 'Fecha',
  timeField: 'Hora',
  price: 'Precio',
  cost: 'Costo',
  total: 'Total',
  amount: 'Monto',
  quantity: 'Cantidad',
  status: 'Estado',
  active: 'Activo',
  inactive: 'Inactivo',
  enabled: 'Habilitado',
  disabled: 'Deshabilitado',
  
  // Placeholders
  enterName: 'Ingresar nombre',
  enterEmail: 'Ingresar correo electrónico',
  enterPassword: 'Ingresar contraseña',
  enterPhone: 'Ingresar teléfono',
  enterAddress: 'Ingresar dirección',
  enterCity: 'Ingresar ciudad',
  enterCountry: 'Ingresar país',
  enterPrice: 'Ingresar precio',
  enterQuantity: 'Ingresar cantidad',
  enterDescription: 'Ingresar descripción',
  
  // Mensajes de validación
  required: 'Este campo es requerido',
  invalidEmail: 'Email inválido',
  invalidPhone: 'El número de teléfono no es válido',
  passwordTooShort: 'Mínimo 6 caracteres',
  passwordMismatch: 'Las contraseñas no coinciden',
  invalidNumber: 'Debe ingresar un número válido',
  numberTooSmall: 'El valor es demasiado pequeño',
  numberTooLarge: 'El valor es demasiado grande',
  
  // Mensajes de éxito
  savedSuccessfully: 'Guardado exitosamente',
  createdSuccessfully: 'Creado exitosamente',
  updatedSuccessfully: 'Actualizado exitosamente',
  deletedSuccessfully: 'Eliminado exitosamente',
  operationCompleted: 'Operación completada exitosamente',
  
  // Mensajes de error
  errorOccurred: 'Ocurrió un error',
  tryAgain: 'Inténtalo de nuevo',
  connectionError: 'Error de conexión',
  serverError: 'Error del servidor',
  notFound: 'No encontrado',
  unauthorized: 'No autorizado',
  forbidden: 'Acceso denegado',
  
  // Mensajes informativos
  noData: 'No hay datos disponibles',
  noResults: 'No se encontraron resultados',
  adjustFilters: 'Intenta ajustar los filtros o términos de búsqueda',
  selectOption: 'Selecciona una opción',
  confirmAction: '¿Estás seguro de realizar esta acción?',
  
  // Navegación y layout
  dashboard: 'Panel',
  users: 'Usuarios',
  clients: 'Clientes',
  services: 'Servicios',
  products: 'Productos',
  appointments: 'Citas',
  inventory: 'Inventario',
  reports: 'Reportes',
  settings: 'Configuración',
  logout: 'Cerrar sesión',
  profile: 'Perfil',
  
  // Tablas y listas
  all: 'Todos',
  none: 'Ninguno',
  selectAll: 'Seleccionar todo',
  clearSelection: 'Limpiar selección',
  sortBy: 'Ordenar por',
  orderBy: 'Orden',
  ascending: 'Ascendente',
  descending: 'Descendente',
  
  // Paginación
  page: 'Página',
  of: 'de',
  itemsPerPage: 'Elementos por página',
  showing: 'Mostrando',
  to: 'a',
  ofResults: 'de',
  results: 'resultados',
  
  // Modales y diálogos
  areYouSure: '¿Estás seguro?',
  thisActionCannotBeUndone: 'Esta acción no se puede deshacer',
  confirm: 'Confirmar',
  dismiss: 'Descartar',
  
  // Estados de carga
  loadingData: 'Cargando datos...',
  processing: 'Procesando...',
  saving: 'Guardando...',
  deleting: 'Eliminando...',
  updating: 'Actualizando...',
  
  // Vacío y estados sin datos
  emptyState: 'No hay datos para mostrar',
  noItemsFound: 'No se encontraron elementos',
  startByAdding: 'Comienza agregando un nuevo elemento',
  createFirst: 'Crear el primero',
  
  // Búsqueda y filtros
  searchPlaceholder: 'Buscar por nombre, email, teléfono...',
  filterBy: 'Filtrar por',
  clearFilters: 'Limpiar filtros',
  advancedSearch: 'Búsqueda avanzada',
  
  // Fechas y tiempo
  today: 'Hoy',
  yesterday: 'Ayer',
  thisWeek: 'Esta semana',
  thisMonth: 'Este mes',
  thisYear: 'Este año',
  lastWeek: 'Semana pasada',
  lastMonth: 'Mes pasado',
  lastYear: 'Año pasado',
  customRange: 'Rango personalizado',
  fromDate: 'Desde',
  toDate: 'Hasta',
  
  // Estados financieros
  paid: 'Pagado',
  pending: 'Pendiente',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  
  // Estados de usuarios
  online: 'En línea',
  offline: 'Desconectado',
  busy: 'Ocupado',
  available: 'Disponible',
  away: 'Ausente',
  
  // Unidades de negocio
  spa: 'SPA',
  barberia: 'Barbería',
  consolidated: 'Consolidado',
  
  // Roles de usuario
  administrator: 'Administrador',
  receptionist: 'Recepcionista',
  spaSpecialist: 'Especialista SPA',
  barber: 'Barbero',
  beautician: 'Esteticista',
  manager: 'Gerente',
  
  // Categorías de servicios
  facial: 'Facial',
  corporal: 'Corporal',
  massage: 'Masaje',
  manicure: 'Manicura',
  pedicure: 'Pedicura',
  waxing: 'Depilación',
  haircut: 'Corte de cabello',
  hairColor: 'Color de cabello',
  treatment: 'Tratamiento',
  
  // Métodos de pago
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  digitalWallet: 'Billetera digital',
  yape: 'Yape',
  plin: 'Plin',
  mixed: 'Mixto',
  credit: 'Crédito',
  debit: 'Débito',
  
  allRoles: 'Todos los roles',
  allStatuses: 'Todos los estados',
  allUnits: 'Todas las unidades',
  
  // Tipos de reporte
  sales: 'Ventas',
  commissions: 'Comisiones',
  inventoryReport: 'Inventario',
  clientsReport: 'Clientes',
  cashRegister: 'Caja',
  appointmentsReport: 'Citas',
  detailed: 'Detallado',
  overview: 'Resumen',
  scheduled: 'Programado',
  
  // Acciones de auditoría
  loginAction: 'Inicio de sesión',
  logoutAction: 'Cierre de sesión',
  createAction: 'Crear',
  updateAction: 'Actualizar',
  deleteAction: 'Eliminar',
  cancelAction: 'Cancelar',
  openAction: 'Abrir',
  closeAction: 'Cerrar',
  reopenAction: 'Reabrir',
  resetAction: 'Resetear',
  unlockAction: 'Desbloquear',
  lockAction: 'Bloquear',
  activateAction: 'Activar',
  deactivateAction: 'Desactivar',
  exportAction: 'Exportar',
  importAction: 'Importar',
  printAction: 'Imprimir',
  viewAction: 'Ver',
  editAction: 'Editar',
  searchAction: 'Buscar',
  filterAction: 'Filtrar',
} as const;

// Función para obtener texto traducido
export function t(key: keyof typeof UI_TEXTS): string {
  return UI_TEXTS[key] || key;
}

// Función para traducir placeholders
export function getPlaceholder(field: string): string {
  const placeholders: Record<string, string> = {
    name: UI_TEXTS.enterName,
    email: UI_TEXTS.enterEmail,
    phone: UI_TEXTS.enterPhone,
    password: UI_TEXTS.enterPassword,
    address: UI_TEXTS.enterAddress,
    city: UI_TEXTS.enterCity,
    country: UI_TEXTS.enterCountry,
    price: UI_TEXTS.enterPrice,
    quantity: UI_TEXTS.enterQuantity,
    description: UI_TEXTS.enterDescription,
    search: UI_TEXTS.searchPlaceholder,
  };
  
  return placeholders[field] || UI_TEXTS.enterText;
}

// Función para traducir mensajes de estado
export function getStatusText(status: string, type: 'user' | 'sale' | 'appointment' | 'commission' = 'user'): string {
  const statusMap: Record<string, Record<string, string>> = {
    user: {
      ACTIVE: UI_TEXTS.active,
      INACTIVE: UI_TEXTS.inactive,
      LOCKED: 'Bloqueado',
      SUSPENDED: 'Suspendido',
      PENDING: UI_TEXTS.pending,
      MUST_CHANGE_PASSWORD: 'Debe cambiar contraseña',
    },
    sale: {
      PENDING: UI_TEXTS.pending,
      PAID: UI_TEXTS.paid,
      CANCELLED: UI_TEXTS.cancelled,
      REFUNDED: UI_TEXTS.refunded,
      COMPLETED: UI_TEXTS.operationCompleted,
    },
    appointment: {
      SCHEDULED: 'Programada',
      CONFIRMED: 'Confirmada',
      IN_PROGRESS: 'En curso',
      COMPLETED: 'Completada',
      CANCELLED: UI_TEXTS.cancelled,
      NO_SHOW: 'No asistió',
      RESCHEDULED: 'Reprogramada',
    },
    commission: {
      PENDING: UI_TEXTS.pending,
      APPROVED: 'Aprobada',
      PAID: UI_TEXTS.paid,
      REJECTED: 'Rechazada',
      CANCELLED: UI_TEXTS.cancelled,
    },
  };
  
  return statusMap[type]?.[status] || status;
}

// Función para traducir mensajes de error del backend
export function translateBackendError(error: string): string {
  const errorMap: Record<string, string> = {
    'INVALID_CREDENTIALS': 'Credenciales inválidas',
    'USER_NOT_FOUND': 'Usuario no encontrado',
    'EMAIL_ALREADY_EXISTS': 'El correo electrónico ya está registrado',
    'PHONE_ALREADY_EXISTS': 'El número de teléfono ya está registrado',
    'INVALID_TOKEN': 'Token inválido',
    'TOKEN_EXPIRED': 'Token expirado',
    'ACCESS_DENIED': 'Acceso denegado',
    'INSUFFICIENT_PERMISSIONS': 'Permisos insuficientes',
    'RESOURCE_NOT_FOUND': 'Recurso no encontrado',
    'VALIDATION_ERROR': 'Error de validación',
    'DUPLICATE_ENTRY': 'Entrada duplicada',
    'FOREIGN_KEY_CONSTRAINT': 'No se puede eliminar, está siendo utilizado',
    'DATABASE_ERROR': 'Error en la base de datos',
    'NETWORK_ERROR': 'Error de red',
    'SERVER_ERROR': 'Error del servidor',
    'UNKNOWN_ERROR': 'Error desconocido',
  };
  
  return errorMap[error] || UI_TEXTS.errorOccurred;
}

// Función para traducir mensajes de éxito del backend
export function translateBackendSuccess(message: string): string {
  const successMap: Record<string, string> = {
    'USER_CREATED': 'Usuario creado exitosamente',
    'USER_UPDATED': 'Usuario actualizado exitosamente',
    'USER_DELETED': 'Usuario eliminado exitosamente',
    'CLIENT_CREATED': 'Cliente creado exitosamente',
    'CLIENT_UPDATED': 'Cliente actualizado exitosamente',
    'CLIENT_DELETED': 'Cliente eliminado exitosamente',
    'SERVICE_CREATED': 'Servicio creado exitosamente',
    'SERVICE_UPDATED': 'Servicio actualizado exitosamente',
    'SERVICE_DELETED': 'Servicio eliminado exitosamente',
    'PRODUCT_CREATED': 'Producto creado exitosamente',
    'PRODUCT_UPDATED': 'Producto actualizado exitosamente',
    'PRODUCT_DELETED': 'Producto eliminado exitosamente',
    'APPOINTMENT_CREATED': 'Cita creada exitosamente',
    'APPOINTMENT_UPDATED': 'Cita actualizada exitosamente',
    'APPOINTMENT_CANCELLED': 'Cita cancelada exitosamente',
    'SALE_COMPLETED': 'Venta completada exitosamente',
    'PAYMENT_PROCESSED': 'Pago procesado exitosamente',
    'PASSWORD_CHANGED': 'Contraseña cambiada exitosamente',
    'EMAIL_SENT': 'Correo enviado exitosamente',
    'DATA_EXPORTED': 'Datos exportados exitosamente',
    'DATA_IMPORTED': 'Datos importados exitosamente',
    'BACKUP_CREATED': 'Respaldo creado exitosamente',
    'SETTINGS_UPDATED': 'Configuración actualizada exitosamente',
  };
  
  return successMap[message] || message;
}
