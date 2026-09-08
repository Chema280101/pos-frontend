// 🎯 TIPOS COMPARTIDOS ENTRE FRONTEND Y BACKEND

// Enum de estados - Compartido entre frontend y backend
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
  RESCHEDULED: 'RESCHEDULED'
} as const;

export type AppointmentStatus = typeof APPOINTMENT_STATUS[keyof typeof APPOINTMENT_STATUS];

// Enum de unidades - Compartido entre frontend y backend
export const BUSINESS_UNIT = {
  SPA: 'SPA',
  BARBERIA: 'BARBERIA'
} as const;

export type BusinessUnit = typeof BUSINESS_UNIT[keyof typeof BUSINESS_UNIT];

// Interfaz base de Appointment - Compartida
export interface BaseAppointment {
  id: string;
  unit: BusinessUnit;
  customerId: string;
  employeeId?: string;
  packageId?: string | null;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  durationMin?: number;
  status: AppointmentStatus;
  notes?: string | null;
  saleId?: string | null;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// Interfaz completa con relaciones - Backend
export interface Appointment extends BaseAppointment {
  customer?: {
    id: string;
    name: string;
    phone?: string;
  };
  employee?: {
    id: string;
    name: string;
    unit?: BusinessUnit;
  };
  items?: Array<{
    serviceId: string;
    employeeId: string;
    durationMin?: number;
    service?: {
      id: string;
      name: string;
      durationMin: number;
      price?: number;
      priceType?: string;
      minPrice?: number;
      maxPrice?: number;
    };
    employee?: {
      id: string;
      name: string;
      unit?: BusinessUnit;
    };
  }>;
  sale?: {
    id: string;
    saleNumber: string;
    status: string;
  } | null;
}

// Interfaz para crear cita - Backend
export interface CreateAppointmentInput {
  unit: BusinessUnit;
  customerId: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  durationMin?: number;
  items: Array<{
    serviceId: string;
    employeeId: string;
    durationMin?: number;
  }>;
  notes?: string;
  status?: AppointmentStatus;
}

// Interfaz para actualizar cita - Backend
export interface UpdateAppointmentInput {
  unit?: BusinessUnit;
  customerId?: string;
  startTime?: string; // ISO string
  endTime?: string; // ISO string
  durationMin?: number;
  items?: Array<{
    serviceId: string;
    employeeId: string;
    durationMin?: number;
  }>;
  notes?: string;
  status?: AppointmentStatus;
}

// Interfaz para filtros - Backend
export interface AppointmentFilters {
  unit?: BusinessUnit;
  dateFrom?: string; // ISO string
  dateTo?: string; // ISO string
  status?: AppointmentStatus;
  serviceId?: string;
  employeeId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Configuración de estados para UI - Frontend
export const STATUS_CONFIG = {
  [APPOINTMENT_STATUS.SCHEDULED]: {
    label: 'Programada',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    color: '#3B82F6'
  },
  [APPOINTMENT_STATUS.CONFIRMED]: {
    label: 'Confirmada',
    bg: 'bg-green-100',
    text: 'text-green-800',
    color: '#10B981'
  },
  [APPOINTMENT_STATUS.IN_PROGRESS]: {
    label: 'En curso',
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    color: '#F59E0B'
  },
  [APPOINTMENT_STATUS.COMPLETED]: {
    label: 'Completada',
    bg: 'bg-green-100',
    text: 'text-green-800',
    color: '#10B981'
  },
  [APPOINTMENT_STATUS.CANCELLED]: {
    label: 'Cancelada',
    bg: 'bg-red-100',
    text: 'text-red-800',
    color: '#EF4444'
  },
  [APPOINTMENT_STATUS.NO_SHOW]: {
    label: 'No asistió',
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    color: '#6B7280'
  },
  [APPOINTMENT_STATUS.RESCHEDULED]: {
    label: 'Reprogramada',
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    color: '#8B5CF6'
  }
} as const;

export type StatusConfig = typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG];

// Utilidades para frontend
export const getStatusConfig = (status: string | AppointmentStatus): StatusConfig => {
  return STATUS_CONFIG[status as AppointmentStatus] || STATUS_CONFIG[APPOINTMENT_STATUS.SCHEDULED];
};

export const isValidStatus = (status: string): status is AppointmentStatus => {
  return Object.values(APPOINTMENT_STATUS).includes(status as AppointmentStatus);
};

export const isValidUnit = (unit: string): unit is BusinessUnit => {
  return Object.values(BUSINESS_UNIT).includes(unit as BusinessUnit);
};

// Interfaz para calendario con extendedProps (usada en tabla)
export interface CalendarAppointmentWithProps {
  id: string;
  title: string;
  start: Date;
  end: Date;
  extendedProps: {
    appointmentId: string;
    customer?: {
      id: string;
      name: string;
      phone?: string;
    };
    service?: {
      id: string;
      name: string;
      durationMin?: number;
      priceType?: string;
      minPrice?: number;
      maxPrice?: number;
    };
    employee?: {
      id: string;
      name: string;
      unit?: BusinessUnit;
    };
    unit: BusinessUnit;
    status: AppointmentStatus;
    notes?: string;
    sale?: {
      id: string;
      saleNumber: string;
      status: string;
    } | null;
  };
}

export type AppointmentForReminder = Appointment;
