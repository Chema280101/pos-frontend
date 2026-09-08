# 📖 Manual de Usuario Integral - Barbería & Spa POS

Bienvenido al manual técnico y operativo definitivo para **Barbería & Spa POS**. Este documento contiene instrucciones paso a paso, descripción de métricas, gestión de alertas y el comportamiento de la lógica interna del sistema. Diseñado tanto para cajeros, especialistas y administradores.

---

## 🛒 1. Módulo de Punto de Venta (POS) y Ventas

El Punto de Venta (POS) centraliza la facturación y la experiencia de cobro.

### 1.1 Estructura de la Interfaz
- **Catálogo Central**: Muestra pestañas de **Servicios**, **Paquetes** y **Productos**. Cada ítem incluye su nombre y precio.
- **Carrito de Compras (Panel Derecho)**: Lista los ítems seleccionados, permite ajustar cantidades, calcular subtotales, aplicar descuentos e impuestos, e indica el Gran Total.

### 1.2 Flujo: Realizar una Venta Completa
1. **Selección del Cliente (Opcional pero Recomendado)**: En la parte superior del carrito, utilice la barra de búsqueda para seleccionar al cliente. Esto guarda el historial de compras y citas. Si es nuevo, haga clic en "Nuevo Cliente" para registrarlo sin salir del POS.
2. **Selección de Ítems**: Haga clic en los servicios o productos deseados.
3. **Manejo de Precios Variables**: 
   - Si el servicio requiere evaluación (ej. Tinte según largo de cabello), el sistema mostrará inmediatamente un **Modal de Precio Variable**.
   - El cajero debe ingresar el precio exacto acordado. El ítem no se agregará al carrito hasta que se confirme este valor.
4. **Cobrar**: Presione el botón verde "Cobrar".
5. **Modal de Pago (Payment Modal)**:
   - Seleccione el **Método de Pago** (Efectivo, Tarjeta Visa/Mastercard, Yape, Plin, Transferencia BCP/BBVA).
   - Si es **Efectivo**, ingrese con cuánto billete le están pagando (ej. Monto a pagar S/ 45, paga con S/ 100). El sistema calculará la línea de **Vuelto a entregar (S/ 55)**.
   - **Pagos Mixtos**: Si el cliente quiere pagar S/ 20 en efectivo y S/ 25 con Tarjeta, presione "Añadir otro método de pago" y distribuya los montos hasta que el saldo restante sea S/ 0.00.
6. **Confirmar**: Haga clic en "Confirmar Pago". Se generará el recibo y se actualizarán el inventario, caja y comisiones en tiempo real.

### 1.3 Ventas en Espera (Pending Sales)
¿El cliente fue a buscar su billetera al auto o quiere seguir mirando productos?
- Presione **"Ventas en Espera"** en la parte inferior del carrito.
- El carrito actual se guardará temporalmente, limpiando la pantalla para atender al siguiente cliente en la fila.
- Para recuperarlo, haga clic en el botón de "Ventas Pendientes" (ícono de reloj), identifique el carrito por la hora o cliente, y pulse **Restaurar**.

---

## 💰 2. Módulo de Caja (Cash Register) y Arqueo

Control estricto del flujo de efectivo para evitar pérdidas y descuidos.

### 2.1 Apertura de Caja Diaria
El sistema no permite vender en efectivo si la caja está cerrada.
1. Al iniciar la jornada, vaya a **Caja**.
2. Aparecerá el formulario de **Apertura de Caja**.
3. Ingrese el **Monto Base** (el "sencillo" físico con el que inicia).
4. El estado de la caja pasará a **Abierta**, registrando la fecha, hora y el usuario responsable.

### 2.2 Registro de Ingresos y Retiros Manuales
No todo es venta de mostrador. Debe registrar cualquier movimiento de la gaveta:
- **Retiro**: Sacar dinero para comprar papel higiénico (S/ 15). Se registra el monto, la categoría (Gastos Operativos) y una observación.
- **Ingreso**: El dueño inyecta S/ 100 en monedas para dar vueltos.

### 2.3 Cierre de Caja y Arqueo (Reconciliación)
1. Al final del turno, el cajero debe hacer clic en **Cierre de Caja**.
2. El sistema ocultará el monto teórico esperado (para obligar al conteo real).
3. El cajero debe contar todo el dinero en su gaveta e ingresarlo en **Efectivo Real**.
4. El sistema compara: `(Monto Base + Ventas Efectivo + Ingresos Manuales - Retiros Manuales) vs Efectivo Real`.
5. Si cuadra a cero, el cierre es Perfecto. Si hay diferencia, arrojará **Faltante (rojo)** o **Sobrante (amarillo)**. Esto queda inmutable en el historial.

---

## 📅 3. Calendario y Citas (Appointments)

Gestión de la agenda, optimización del tiempo de los especialistas y recordatorios.

### 3.1 Vistas del Calendario
El sistema cuenta con vistas de **Mes, Semana y Día**. La vista "Día" muestra columnas por cada especialista disponible, facilitando ubicar huecos libres.

### 3.2 Flujo de la Cita
1. **Creación**: Presione un bloque de horario vacío. Rellene el formulario asignando Cliente, Servicio(s) y Especialista.
2. **Estados de Vida**:
   - **Pendiente**: Agendada pero falta confirmación.
   - **Confirmada**: El cliente avisó que sí asistirá.
   - **En Progreso**: El cliente ya está sentado en el sillón de barbería o camilla de SPA.
   - **Completada**: El trabajo terminó.
   - **Cancelada / No Show**: El cliente no llegó.
3. **Vinculación a Caja**: Al marcar una cita como "Completada", aparecerá un botón directo para **"Cobrar en POS"**. Al pulsarlo, el sistema lleva todos los datos de la cita (cliente, servicio, especialista asociado) directamente al carrito de compras para cobrar sin reescribir nada.

---

## 📦 4. Inventario, Proveedores y Alertas

Mantenga sus insumos bajo control absoluto.

### 4.1 Productos y Alertas Automáticas
- Cada producto tiene definido un **Stock Mínimo**.
- El **Dashboard** y la pestaña de Inventario mostrarán insignias rojas de alerta si el stock cae por debajo de este número.
- Si el producto tiene fecha de vencimiento (ej. cremas de tratamiento), el sistema alertará 30, 60 y 90 días antes, en la sección **Alertas de Caducidad (Expiry Alerts)**.

### 4.2 Entradas y Movimientos de Stock
Para ingresar nueva mercadería:
1. Vaya a **Movimientos de Stock**.
2. Registre una nueva "Entrada".
3. Seleccione el **Proveedor**, los ítems comprados, las cantidades y el Costo de Adquisición Unitario.
4. El sistema actualizará el stock e ingresará los nuevos costos para el cálculo futuro de márgenes de ganancia.

---

## 💵 5. Finanzas, Comisiones y Gastos

El núcleo de la rentabilidad del salón.

### 5.1 Cálculo de Comisiones (Lógica del Sistema)
- El sistema procesa comisiones de manera invisible. Cuando se cobra un ticket en el POS, lee qué especialista hizo el trabajo.
- Lee el porcentaje de comisión configurado en el perfil de dicho especialista (ej. Barbero Senior = 50%, Barbero Junior = 40%).
- Multiplica el precio final cobrado (descontando impuestos si aplica) por el porcentaje, y lo añade al "Saldo Acumulado" del empleado.

### 5.2 Liquidación (Pago a Especialistas)
1. El Administrador ingresa a la pestaña **Comisiones -> Liquidación**.
2. Selecciona al empleado. El sistema muestra todas las citas realizadas pendientes de pago.
3. El administrador aprueba el monto y pulsa **Liquidar**.
4. Este dinero pasa a estado "Pagado" en el historial del empleado y genera un movimiento de Gasto automático en la contabilidad del negocio.

### 5.3 Panel del Empleado ("Mis Comisiones")
Si el barbero o especialista inicia sesión, su vista principal no es la contabilidad global, sino "Mis Comisiones", donde ve su rendimiento diario, cuánto ha generado hoy y cuánto le toca cobrar a fin de semana.

---

## 📊 6. Dashboards y Reportes Contables

Tome decisiones basadas en datos reales.

### 6.1 Reportes Exportables
En la sección **Reportes**, podrá generar vistas detalladas de:
- **Ventas**: Por día, mes, método de pago (cuánto entró por Yape vs Tarjeta).
- **Rendimiento**: Quién vendió más, qué servicio es el más solicitado.
- **Inventario**: Valoración total del stock almacenado.
- *Todos los reportes cuentan con un botón de exportación para descargar en Excel (.xlsx) o PDF para su envío directo a su área contable.*

### 6.2 Auditoría y Trazabilidad (Audit Log)
El administrador cuenta con una pestaña de **Auditoría (Audit Log)**. Aquí el sistema guarda en piedra cada acción crítica:
- ¿Quién borró un producto?
- ¿Quién modificó el stock manualmente?
- ¿A qué hora exacta se canceló una venta?
- Esto previene el fraude interno y mantiene la transparencia total del negocio.

---
*© Barbería & Spa POS - Desarrollado bajo estándares Premium UI/UX para potenciar el flujo operativo de su negocio.*
