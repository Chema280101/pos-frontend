# 🎨 Guía de Consistencia de Colores para Tablas

## 🎯 **Objetivo Principal**

**Garantizar que el mismo TIPO DE DATO tenga el mismo color en TODAS las tablas del sistema.**

## 📋 **Regla Fundamental**

**No aplicar colores por nombre de columna, sino por TIPO DE DATO que contiene.**

## 🎨 **Sistema de Colores por Tipo de Dato**

### 📋 **IDENTIFICADORES Y REFERENCIAS - ÍNDIGO**
- **ID de venta:** `bg-indigo-100 text-indigo-800`
- **Referencias:** `bg-indigo-100 text-indigo-800`
- **Números de venta:** `bg-indigo-100 text-indigo-800`

### 👤 **PERSONAS Y CONTACTOS**
- **Nombres de personas:** `bg-pink-100 text-pink-800`
- **Nombres de clientes:** `bg-pink-100 text-pink-800`
- **Nombres de usuarios:** `bg-pink-100 text-pink-800`
- **Nombres de empleados:** `bg-emerald-100 text-emerald-800`
- **Teléfonos:** `bg-sky-100 text-sky-800`
- **Emails:** `bg-purple-100 text-purple-800`

### 💰 **DATOS MONETARIOS**
- **Montos/Totales:** `bg-emerald-100 text-emerald-800`
- **Precios:** `bg-emerald-100 text-emerald-800`
- **Comisiones:** `bg-orange-100 text-orange-800`
- **Porcentajes:** `bg-orange-100 text-orange-800`

### 📅 **TIEMPO Y FECHAS**
- **Fechas:** `bg-indigo-100 text-indigo-800`
- **Horas:** `bg-slate-100 text-slate-800`
- **Duraciones:** `bg-blue-100 text-blue-800`

### 🏢 **UNIDADES Y UBICACIONES**
- **SPA:** `bg-teal-100 text-teal-800`
- **Barbería:** `bg-orange-100 text-orange-800`

### 🎨 **SERVICIOS Y PRODUCTOS**
- **Nombres de servicios:** `bg-purple-100 text-purple-800`
- **Nombres de productos:** `bg-blue-100 text-blue-800`
- **Categorías:** `bg-gray-100 text-gray-800`

### 📊 **ESTADOS Y ACCIONES**
- **Estados activos/completados:** `bg-green-100 text-green-800`
- **Estados inactivos/cancelados:** `bg-red-100 text-red-800`
- **Estados pendientes:** `bg-amber-100 text-amber-800`
- **Estados neutrales:** `bg-gray-100 text-gray-800`

### 💳 **MÉTODOS DE PAGO**
- **Efectivo:** `bg-green-100 text-green-800`
- **Tarjeta:** `bg-blue-100 text-blue-800`
- **Yape/Digital:** `bg-purple-100 text-purple-800`
- **Transferencia:** `bg-orange-100 text-orange-800`

### 🔢 **DATOS TÉCNICOS**
- **IDs técnicos:** `bg-gray-100 text-gray-800 font-mono`
- **Códigos:** `bg-gray-100 text-gray-800 font-mono`
- **Direcciones IP:** `bg-cyan-100 text-cyan-800`

## 📊 **Tabla de Consistencia Actual**

| Tipo de Dato | Color Esperado | Tablas Donde Debe Aplicar |
|--------------|---------------|-------------------------|
| **Producto** | Azul (`bg-blue-100 text-blue-800`) | InventoryPage ✅, StockMovementsPage ✅ |
| **Cliente** | Rosa (`bg-pink-100 text-pink-800`) | IncomePage ✅, AppointmentsPage ✅ |
| **Empleado** | Verde Esmeralda (`bg-emerald-100 text-emerald-800`) | UsersPage ✅, AppointmentsPage ✅ |
| **Fecha** | Índigo (`bg-indigo-100 text-indigo-800`) | Todas las tablas ✅ |
| **Hora** | Slate (`bg-slate-100 text-slate-800`) | Todas las tablas ✅ |
| **Monto** | Verde Esmeralda (`bg-emerald-100 text-emerald-800`) | IncomePage ✅, MyCommissions ✅ |
| **Unidad SPA** | Teal (`bg-teal-100 text-teal-800`) | Todas las tablas ✅ |
| **Unidad Barbería** | Naranja (`bg-orange-100 text-orange-800`) | Todas las tablas ✅ |
| **Servicio** | Púrpura (`bg-purple-100 text-purple-800`) | AppointmentsPage ✅ |
| **Stock Actual** | Verde/Ámbar/Rojo | InventoryPage ✅ |
| **Stock Antes** | Slate (`bg-slate-100 text-slate-800`) | StockMovementsPage ✅ |
| **Stock Después** | Verde Esmeralda (`bg-emerald-100 text-emerald-800`) | StockMovementsPage ✅ |

## 🎯 **Ejemplos de Aplicación Correcta**

### ✅ **CASO CORRECTO - Producto**
```tsx
// InventoryPage
<span className="bg-blue-100 text-blue-800">Shampoo</span>

// StockMovementsPage  
<span className="bg-blue-100 text-blue-800">Shampoo</span>
```
**✅ AMBOS usan azul porque son NOMBRES DE PRODUCTOS**

### ❌ **CASO INCORRECTO - Producto**
```tsx
// InventoryPage
<span className="text-gray-500">Shampoo</span>  // ❌ Sin color

// StockMovementsPage
<span className="bg-purple-100 text-purple-800">Shampoo</span>  // ❌ Color de servicio
```

### ✅ **CASO CORRECTO - Cliente**
```tsx
// IncomePage
<span className="bg-pink-100 text-pink-800">Juan Pérez</span>

// AppointmentsPage
<span className="bg-pink-100 text-pink-800">Juan Pérez</span>
```
**✅ AMBOS usan rosa porque son NOMBRES DE PERSONAS**

## 🔄 **Correcciones Realizadas**

### 📦 **InventoryPage**
- ✅ **Producto:** Texto gris → Azul (`bg-blue-100 text-blue-800`)
- ✅ **Mínimo:** Azul → Ámbar (`bg-amber-100 text-amber-800`)
- ✅ **Unidad:** Púrpura/Stone → Teal/Naranja

### 📦 **StockMovementsPage**
- ✅ **Producto:** Púrpura → Azul (`bg-blue-100 text-blue-800`)
- ✅ **ID técnico:** Gris → Gris + `font-mono`
- ✅ **Stock Antes:** Naranja → Slate (`bg-slate-100 text-slate-800`)
- ✅ **Stock Después:** Teal → Verde Esmeralda (`bg-emerald-100 text-emerald-800`)

## 🎯 **Reglas de Decisión de Color**

### 📋 **Preguntas Clave al Asignar Color**

1. **¿Qué tipo de dato es esta columna?**
   - ¿Es un nombre de persona? → Rosa
   - ¿Es un nombre de producto? → Azul
   - ¿Es un nombre de servicio? → Púrpura
   - ¿Es un monto/precio? → Verde Esmeralda

2. **¿Es un identificador técnico?**
   - ¿Es un ID/código? → Gris + `font-mono`

3. **¿Es información de tiempo?**
   - ¿Es una fecha? → Índigo
   - ¿Es una hora? → Slate
   - ¿Es una duración? → Azul

4. **¿Es un estado?**
   - ¿Es positivo/activo? → Verde
   - ¿Es negativo/inactivo? → Rojo
   - ¿Es pendiente? → Ámbar

5. **¿Es una ubicación/unidad?**
   - ¿Es SPA? → Teal
   - ¿Es Barbería? → Naranja

## 🚀 **Implementación con Componente TableBadge**

```tsx
import { TableBadge, TableBadgeStack } from '@/components/ui/TableBadge';

// Uso consistente en todas las tablas
<TableBadge type="product-name">{product.name}</TableBadge>
<TableBadge type="customer-name">{customer.name}</TableBadge>
<TableBadge type="amount" bold>S/ {amount.toFixed(2)}</TableBadge>

// Datos compuestos
<TableBadgeStack>
  <TableBadge type="date">{date}</TableBadge>
  <TableBadge type="time">{time}</TableBadge>
</TableBadgeStack>
```

## ✅ **Verificación de Consistencia**

### 📋 **Checklist para Nueva Tabla**

- [ ] **¿Los productos usan azul?**
- [ ] **¿Los clientes usan rosa?**
- [ ] **¿Los empleados usan verde esmeralda?**
- [ ] **¿Las fechas usan índigo?**
- [ ] **¿Las horas usan slate?**
- [ ] **¿Los montos usan verde esmeralda?**
- [ ] **¿Las unidades SPA usan teal?**
- [ ] **¿Las unidades Barbería usan naranja?**
- [ ] **¿Los servicios usan púrpura?**
- [ ] **¿Los IDs técnicos usan gris + font-mono?**

## 🎯 **Resultado Final**

**Con este sistema garantizamos:**
- ✅ **Consistencia visual** perfecta
- ✅ **Identificación rápida** por tipo de dato
- ✅ **Mantenimiento centralizado**
- ✅ **Escalabilidad** para futuras tablas
- ✅ **Experiencia unificada** para usuarios
