// Exportaciones de hooks personalizados
export { useCrossTabSync } from './useCrossTabSync';
export { useAuth } from './useAuth';
export { useUnit } from './useUnit';
export { useTheme } from './useTheme';
export { useToast } from './useToast';
export { useAlerts } from './useAlerts';
export { useNotifications } from './useNotifications';
export { useOnlineStatus } from './useOnlineStatus';
export { usePageTitle } from './usePageTitle';
export { usePermissions } from './usePermissions';
export { usePrefetchQueries } from './usePrefetchQueries';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useModalStack } from './useModalStack';
export { useAppointmentReminders } from './useAppointmentReminders';
export { useBusinessConfig } from './useBusinessConfig';
export { useUndoRedo } from './useUndoRedo';

// Exportaciones específicas de useSecureApi
export { 
  useSecureQuery, 
  useSecureMutation, 
  useSecureClients, 
  useSecureAppointments, 
  useSecureSales, 
  useSecureCommissions, 
  useSecureInventory, 
  useSecureCreateClient, 
  useSecureUpdateClient, 
  useSecureCreateAppointment, 
  useSecureCreateSale,
  usePermissions as useSecurePermissions,
  useSecureData
} from './useSecureApi';
