# Módulo de abono (gallinaza)

Este módulo administra de forma independiente el inventario comercial de gallinaza. Se accede desde **Abono** en AVICONTROL. Conserva la pantalla de recolección por galpón y añade productos, entradas comerciales, punto de venta, cartera y reportes propios. Reutiliza clientes, granjas y usuarios existentes; no modifica el flujo de ventas de huevos ni el dashboard general.

## Flujo

1. Crear un producto y establecer sus precios por bulto, kilogramo y tonelada.
2. Registrar cada recogida como una entrada en kg, indicando fecha, producto y origen (galpón o limpieza). Cada entrada incrementa el stock y genera un movimiento de inventario.
3. En el punto de venta, agregar productos, unidades y cantidades. El servidor calcula importes con el precio de cada unidad y descuenta el equivalente en kg.
4. Las ventas al crédito quedan pendientes. En el historial se registran abonos parciales; el servidor rechaza un abono mayor al saldo y actualiza el estado de la venta.
5. Consultar existencias, alertas por stock mínimo, movimientos, tickets, ventas mensuales y cartera.

## Conversiones de inventario

| Unidad vendida | Equivalente descontado |
| --- | ---: |
| Bulto | 50 kg |
| Kilogramo | 1 kg |
| Tonelada | 1000 kg |

Todos los saldos de inventario se guardan en kg. El frontend muestra la equivalencia y el backend vuelve a calcularla antes de confirmar la venta.

## Modelos y lógica

Los modelos del dominio están en `avicontrol/gallinaza_models.py`; los servicios transaccionales están en `avicontrol/gallinaza_services.py`. Una venta crea cabecera, detalles, pagos iniciales y movimientos, y descuenta stock dentro de una transacción. Las entradas y pagos también se registran de forma atómica. Los tickets tienen numeración propia por granja.

La API GraphQL específica está expuesta con los campos `productosGallinaza`, `entradasGallinaza`, `ventasGallinaza`, `movimientosGallinaza` y las mutaciones `guardarProductoGallinaza`, `registrarEntradaGallinaza`, `registrarVentaGallinaza` y `registrarPagoGallinaza`.

## Migración y comprobaciones

Con las dependencias del backend instaladas:

```powershell
cd backend
python manage.py migrate avicontrol 0005_detalleventagallinaza_entradagallinaza_and_more
python manage.py check
python manage.py test avicontrol.tests.GallinazaRulesTests
```

Las pruebas necesitan que PostgreSQL permita crear la base temporal de Django (`test_avicontrol_db`) o que esta exista y se ejecute el comando con `--keepdb`. El rol de aplicación también necesita permisos para crear/alterar tablas en la base configurada al aplicar la migración.
