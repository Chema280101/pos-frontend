# Rutas de la aplicación (Next.js App Router)

## Públicas (sin sesión)
| Ruta | Descripción |
|------|-------------|
| `/` | Redirige a `/dashboard` si hay sesión, o a `/login` si no |
| `/login` | Formulario de inicio de sesión |
| `/change-password` | Cambio de contraseña obligatorio |
| `/google/callback` | Callback OAuth de Google |
| `/error/403` | Sin permiso |
| `/error/404` | Página no encontrada |
| `/error/locked` | Cuenta bloqueada |

## Protegidas (requieren sesión, layout con Sidebar + Header)
| Ruta | Descripción |
|------|-------------|
| `/dashboard` | Dashboard principal |
| `/clients` | Lista de clientes |
| `/clients/new` | Nuevo cliente |
| `/clients/[id]` | Detalle de cliente |
| `/clients/[id]/edit` | Editar cliente |
| `/appointments` | Agenda |
| `/appointments/new` | Nueva cita |
| `/appointments/[id]` | Detalle de cita |
| `/pos` | Punto de venta |
| `/cash-register` | Caja |
| `/inventory` | Inventario |
| `/inventory/products/new` | Nuevo producto |
| `/inventory/products/[id]/edit` | Editar producto |
| `/inventory/suppliers` | Proveedores |
| `/inventory/use` | Uso interno |
| `/inventory/entry` | Entrada de stock |
| `/services` | Servicios |
| `/services/new` | Nuevo servicio |
| `/services/[id]/edit` | Editar servicio |
| `/packages` | Paquetes |
| `/packages/new` | Nuevo paquete |
| `/packages/[id]/edit` | Editar paquete |
| `/commissions` | Mis comisiones |
| `/commissions/admin` | Todas las comisiones (Admin) |
| `/reports` | Reportes |
| `/reports/sales`, `/reports/appointments`, etc. | Subreportes |
| `/reports/scheduled` | Reportes programados |
| `/admin/users` | Usuarios (Admin) |
| `/admin/audit` | Auditoría (Admin) |
| `/admin/backups` | Backups (Admin) |

## Estructura de carpetas en `src/app`
- `(auth)/` — rutas públicas: login, change-password, google/callback
- `(app)/` — rutas protegidas con Sidebar y Header
- `error/` — 403, 404, locked
