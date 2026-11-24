import { gql } from "@apollo/client";

const PRODUCTO_FIELDS = `
  id nombre unidadBase precioBulto precioKg precioTonelada
  stockActualKg stockMinimoKg activo
`;

export const GALLINAZA_PRODUCTOS = gql`
  query ProductosGallinaza($soloActivos: Boolean!) {
    productosGallinaza(soloActivos: $soloActivos) { ${PRODUCTO_FIELDS} }
  }
`;

export const GALLINAZA_ENTRADAS = gql`
  query EntradasGallinaza($productoId: ID, $fechaDesde: Date, $fechaHasta: Date) {
    entradasGallinaza(productoId: $productoId, fechaDesde: $fechaDesde, fechaHasta: $fechaHasta) {
      id productoId fecha cantidadKg origen observaciones createdAt
    }
  }
`;

export const GALLINAZA_VENTAS = gql`
  query VentasGallinaza($clienteId: ID, $estado: String, $productoId: ID, $fechaDesde: Date, $fechaHasta: Date) {
    ventasGallinaza(clienteId: $clienteId, estado: $estado, productoId: $productoId, fechaDesde: $fechaDesde, fechaHasta: $fechaHasta) {
      id numero fecha clienteId nombreCliente total metodoPago estado montoRecibido cambio totalPagado saldoPendiente
      detalles { id productoId unidadVendida cantidad cantidadKg precioUnitario subtotal producto { id nombre } }
      pagos { id monto fecha metodo }
    }
  }
`;

export const GALLINAZA_MOVIMIENTOS = gql`
  query MovimientosGallinaza($productoId: ID) {
    movimientosGallinaza(productoId: $productoId) {
      id productoId tipo cantidadKg referencia createdAt
    }
  }
`;

export const GUARDAR_PRODUCTO_GALLINAZA = gql`
  mutation GuardarProductoGallinaza($id: ID, $nombre: String!, $precioBulto: Decimal!, $precioKg: Decimal!, $precioTonelada: Decimal!, $stockMinimoKg: Decimal!, $activo: Boolean!) {
    guardarProductoGallinaza(id: $id, nombre: $nombre, precioBulto: $precioBulto, precioKg: $precioKg, precioTonelada: $precioTonelada, stockMinimoKg: $stockMinimoKg, activo: $activo) { ${PRODUCTO_FIELDS} }
  }
`;

export const REGISTRAR_ENTRADA_GALLINAZA = gql`
  mutation RegistrarEntradaGallinaza($productoId: ID!, $fecha: Date!, $cantidadKg: Decimal!, $origen: String!, $observaciones: String!) {
    registrarEntradaGallinaza(productoId: $productoId, fecha: $fecha, cantidadKg: $cantidadKg, origen: $origen, observaciones: $observaciones) { id }
  }
`;

export const REGISTRAR_VENTA_GALLINAZA = gql`
  mutation RegistrarVentaGallinaza($fecha: Date!, $lineas: [LineaGallinazaInput!]!, $metodoPago: String!, $clienteId: ID, $montoRecibido: Decimal!) {
    registrarVentaGallinaza(fecha: $fecha, lineas: $lineas, metodoPago: $metodoPago, clienteId: $clienteId, montoRecibido: $montoRecibido) {
      id numero fecha clienteId nombreCliente total metodoPago estado montoRecibido cambio
      detalles { id productoId unidadVendida cantidad cantidadKg precioUnitario subtotal producto { id nombre } }
      pagos { id monto fecha metodo }
    }
  }
`;

export const REGISTRAR_PAGO_GALLINAZA = gql`
  mutation RegistrarPagoGallinaza($ventaId: ID!, $monto: Decimal!, $metodo: String!) {
    registrarPagoGallinaza(ventaId: $ventaId, monto: $monto, metodo: $metodo) { id monto fecha metodo }
  }
`;

export const CLIENTES_GALLINAZA = gql`
  query ClientesGallinaza { clientes { id nombres apellidos dni activo } }
`;
