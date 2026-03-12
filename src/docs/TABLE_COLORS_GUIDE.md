# 🎨 Guía de Codificación por Colores para Tablas

## 📋 Objetivo

Implementar un sistema de codificación por colores consistente para todas las tablas del sistema, donde cada tipo de dato tenga un color asignado específico para mantener coherencia visual.

## 🎯 Reglas de Colores por Tipo de Dato

### 📋 IDENTIFICADORES Y REFERENCIAS
- **ID/Venta/Referencia:** Índigo (`bg-indigo-100 text-indigo-800`)
- **Números de venta:** Índigo con prefijo `#`

### 👤 PERSONAS Y CONTACTOS
- **Nombres de personas:** Rosa (`bg-pink-100 text-pink-800`)
- **Clientes/Usuarios:** Rosa
- **Empleados:** Verde Esmeralda (`bg-emerald-100 text-emerald-800`)
- **Teléfonos:** Sky Azul (`bg-sky-100 text-sky-800`)
- **Emails:** Púrpura (`bg-purple-100 text-purple-800`)

### 💰 DATOS MONETARIOS
- **Montos/Totales:** Verde Esmeralda (`bg-emerald-100 text-emerald-800`)
- **Precios:** Verde Esmeralda
- **Comisiones:** Naranja (`bg-orange-100 text-orange-800`)

### 📅 TIEMPO Y FECHAS
- **Fechas:** Índigo (`bg-indigo-100 text-indigo-800`)
- **Horas:** Slate (`bg-slate-100 text-slate-800`)
- **Duraciones:** Azul (`bg-blue-100 text-blue-800`)

### 🏢 UNIDADES Y UBICACIONES
- **SPA:** Teal (`bg-teal-100 text-teal-800`)
- **Barbería:** Naranja (`bg-orange-100 text-orange-800`)

### 🎨 SERVICIOS Y PRODUCTOS
- **Nombres de servicios:** Púrpura (`bg-purple-100 text-purple-800`)
- **Nombres de productos:** Azul (`bg-blue-100 text-blue-800`)
- **Categorías:** Gris (`bg-gray-100 text-gray-800`)

### 📊 ESTADOS Y ACCIONES
- **Estados positivos/activos:** Verde (`bg-green-100 text-green-800`)
- **Estados negativos/inactivos:** Rojo (`bg-red-100 text-red-800`)
- **Estados pendientes:** Ámbar (`bg-amber-100 text-amber-800`)
- **Estados neutrales:** Gris (`bg-gray-100 text-gray-800`)

### 💳 MÉTODOS DE PAGO
- **Efectivo:** Verde (`bg-green-100 text-green-800`)
- **Tarjeta:** Azul (`bg-blue-100 text-blue-800`)
- **Yape/Digital:** Púrpura (`bg-purple-100 text-purple-800`)
- **Transferencia:** Naranja (`bg-orange-100 text-orange-800`)

### 🔢 DATOS TÉCNICOS
- **IDs técnicos:** Gris con font-mono (`bg-gray-100 text-gray-800 font-mono`)
- **Códigos:** Gris con font-mono
- **IPs:** Cian (`bg-cyan-100 text-cyan-800`)

### 📋 ACCIONES DE AUDITORÍA
- **Login/Logout:** Azul
- **Create:** Verde
- **Delete/Cancel:** Rojo
- **Update:** Ámbar

## 🛠️ Implementación

### Opción 1: Componente TableBadge (Recomendado)

```tsx
import { TableBadge, TableBadgeStack } from '@/components/ui/TableBadge';

// Uso básico
<TableBadge type="date">Fecha</TableBadge>
<TableBadge type="customer-name">Nombre</TableBadge>
<TableBadge type="amount" bold>S/ 100.00</TableBadge>

// Datos compuestos
<TableBadgeStack>
  <TableBadge type="date">Fecha</TableBadge>
  <TableBadge type="time">Hora</TableBadge>
</TableBadgeStack>

// Colores dinámicos
<TableBadge type={getTableBadgeTypeForStatus(status)}>
  {status}
</TableBadge>
```

### Opción 2: Clases CSS

```tsx
// Importar clases desde lib/table-colors.ts
import { BADGE_DATE, BADGE_PERSON_NAME, BADGE_AMOUNT, BADGE_STACK } from '@/lib/table-colors';

<span className={BADGE_DATE}>Fecha</span>
<span className={BADGE_PERSON_NAME}>Nombre</span>
<span className={BADGE_AMOUNT}>S/ 100.00</span>

// Datos compuestos
<div className={BADGE_STACK}>
  <span className={BADGE_DATE}>Fecha</span>
  <span className={BADGE_TIME}>Hora</span>
</div>
```

### Opción 3: Clases CSS Directas

```tsx
// Usar clases Tailwind directamente
<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800">
  Fecha
</span>
```

## 📚 Tipos de TableBadge Disponibles

### Identificadores
- `id`, `reference`, `sale-number`

### Personas
- `person-name`, `customer-name`, `user-name`, `employee-name`
- `phone`, `contact-phone`, `email`, `contact-email`

### Monetarios
- `amount`, `total`, `price`, `monetary`, `commission`, `percentage`

### Tiempo
- `date`, `fecha`, `time`, `hora`, `duration`, `duracion`

### Unidades
- `unit-spa`, `spa`, `unit-barberia`, `barberia`

### Servicios/Productos
- `service-name`, `servicio`, `product-name`, `producto`
- `category`, `categoria`

### Estados
- `status-active`, `status-completed`, `status-paid`
- `status-inactive`, `status-cancelled`, `status-failed`
- `status-pending`, `status-scheduled`, `status-neutral`, `status-default`

### Métodos de Pago
- `payment-cash`, `payment-efectivo`, `payment-card`, `payment-tarjeta`
- `payment-digital`, `payment-yape`, `payment-transfer`, `payment-transferencia`

### Técnicos
- `technical-id`, `id-code`, `identifier`, `ip-address`, `ip`

### Acciones de Auditoría
- `action-login`, `action-logout`, `action-create`
- `action-delete`, `action-cancel`, `action-update`

### Roles
- `role-admin`, `role-receptionist`, `role-spa-specialist`
- `role-barber`, `role-beautician`, `role-manager`

### Entidades
- `entity-user`, `entity-sale`, `entity-cash-register`
- `entity-product`, `entity-service`, `entity-commission`, `entity-expense`

## 🔄 Funciones Helper para Colores Dinámicos

```tsx
import { 
  getTableBadgeTypeForPaymentMethod,
  getTableBadgeTypeForStatus,
  getTableBadgeTypeForUnit,
  getTableBadgeTypeForRole,
  getTableBadgeTypeForEntity,
  getTableBadgeTypeForAction
} from '@/components/ui/TableBadge';

// Métodos de pago
<TableBadge type={getTableBadgeTypeForPaymentMethod(method)}>
  {method}
</TableBadge>

// Estados
<TableBadge type={getTableBadgeTypeForStatus(status)}>
  {status}
</TableBadge>

// Unidades
<TableBadge type={getTableBadgeTypeForUnit(unit)}>
  {unit === 'SPA' ? 'SPA' : 'Barbería'}
</TableBadge>
```

## 📋 Ejemplos de Uso por Tabla

### Tabla de Ingresos
```tsx
// Cliente
<TableBadge type="customer-name">{customer.name}</TableBadge>

// Total
<TableBadge type="amount" bold>S/ {total.toFixed(2)}</TableBadge>

// Método de pago
<TableBadge type={getTableBadgeTypeForPaymentMethod(method)}>
  {method}
</TableBadge>

// Fecha
<TableBadgeStack>
  <TableBadge type="date">{date}</TableBadge>
  <TableBadge type="time">{time}</TableBadge>
</TableBadgeStack>
```

### Tabla de Citas
```tsx
// Cliente
<TableBadgeStack>
  <TableBadge type="customer-name">{customer.name}</TableBadge>
  <TableBadge type="phone">{customer.phone}</TableBadge>
</TableBadgeStack>

// Servicio
<TableBadgeStack>
  <TableBadge type="service-name">{service.name}</TableBadge>
  <TableBadge type="duration">{service.duration} min</TableBadge>
</TableBadgeStack>

// Empleado
<TableBadgeStack>
  <TableBadge type="employee-name">{employee.name}</TableBadge>
  <TableBadge type={getTableBadgeTypeForUnit(unit)}>
    {unit === 'SPA' ? 'SPA' : 'Barbería'}
  </TableBadge>
</TableBadgeStack>
```

### Tabla de Usuarios
```tsx
// Nombre
<TableBadgeStack>
  <TableBadge type="user-name">{user.name}</TableBadge>
  <TableBadge type="phone">{user.phone}</TableBadge>
</TableBadgeStack>

// Email
<TableBadge type="email">{user.email}</TableBadge>

// Rol
<TableBadge type={getTableBadgeTypeForRole(user.role)}>
  {roleLabels[user.role]}
</TableBadge>

// Unidad
<TableBadge type={getTableBadgeTypeForUnit(user.unit)}>
  {user.unit === 'SPA' ? 'SPA' : 'Barbería'}
</TableBadge>
```

## ✅ Beneficios

1. **Consistencia Visual:** El mismo tipo de dato tiene el mismo color en todas las tablas
2. **Escaneo Rápido:** Los usuarios pueden identificar rápidamente tipos de datos
3. **Mantenimiento:** Centralizado y fácil de actualizar
4. **Accesibilidad:** Colores con buen contraste y significado semántico
5. **Escalabilidad:** Fácil agregar nuevos tipos de datos

## 🎯 Reglas de Aplicación

1. **Usar tipo de dato, no nombre de columna:** Aplicar color según el TIPO de dato
2. **Mantener estructura consistente:** Usar `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium`
3. **Datos compuestos:** Usar `TableBadgeStack` para múltiples datos en una columna
4. **Colores dinámicos:** Usar funciones helper para datos variables
5. **Especialización:** Usar `bold` para montos importantes, `mono` para IDs técnicos

## 🔄 Migración de Tablas Existentes

Las siguientes tablas ya están actualizadas con el sistema de colores:
- ✅ InventoryPage
- ✅ StockMovementsPage  
- ✅ ExpensesPage
- ✅ ServicesPage
- ✅ PackagesPage
- ✅ MyCommissions
- ✅ AdminCommissions
- ✅ UsersPage
- ✅ AuditPage
- ✅ BackupsPage
- ✅ IncomePage
- ✅ AppointmentsPage

Para nuevas tablas, seguir esta guía y usar el componente `TableBadge` para mantener consistencia.
