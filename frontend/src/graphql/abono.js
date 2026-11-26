import { gql } from "@apollo/client";

export const ABONO_QUERY = gql`
  query GeneracionesAbono($estado: String) {
    generacionesAbono(estado: $estado) {
      id
      galponId
      fecha
      cantidadKg
      estado
      responsable
      observaciones
    }
  }
`;

export const REGISTRAR_ABONO = gql`
  mutation RegistrarGeneracionAbono(
    $galponId: ID!
    $fecha: Date!
    $cantidadKg: Decimal!
    $estado: String
    $loteId: ID
    $responsable: String
    $observaciones: String
  ) {
    registrarGeneracionAbono(
      galponId: $galponId
      fecha: $fecha
      cantidadKg: $cantidadKg
      estado: $estado
      loteId: $loteId
      responsable: $responsable
      observaciones: $observaciones
    ) {
      id
      estado
    }
  }
`;

// ============================================================
// PRODUCTOS DE GALLINAZA
// ============================================================
export const PRODUCTOS_GALLINAZA_QUERY = gql`
  query ProductosGallinaza($soloActivos: Boolean, $granjaId: ID) {
    productosGallinaza(soloActivos: $soloActivos, granjaId: $granjaId) {
      id
      granjaId
      nombre
      tipo
      unidadBase
      precioBulto
      precioKg
      precioTonelada
      stockActualKg
      stockMinimoKg
      activo
    }
  }
`;

export const GUARDAR_PRODUCTO_GALLINAZA = gql`
  mutation GuardarProductoGallinaza(
    $id: ID
    $nombre: String
    $unidadBase: String
    $tipo: String
    $precioBulto: Decimal
    $precioKg: Decimal
    $precioTonelada: Decimal
    $stockMinimoKg: Decimal
    $activo: Boolean
  ) {
    guardarProductoGallinaza(
      id: $id
      nombre: $nombre
      unidadBase: $unidadBase
      tipo: $tipo
      precioBulto: $precioBulto
      precioKg: $precioKg
      precioTonelada: $precioTonelada
      stockMinimoKg: $stockMinimoKg
      activo: $activo
    ) {
      id
      nombre
    }
  }
`;

// ============================================================
// ENTRADAS DE GALLINAZA
// ============================================================
export const ENTRADAS_GALLINAZA_QUERY = gql`
  query EntradasGallinaza($productoId: ID, $fechaDesde: Date, $fechaHasta: Date) {
    entradasGallinaza(productoId: $productoId, fechaDesde: $fechaDesde, fechaHasta: $fechaHasta) {
      id
      productoId
      fecha
      cantidadKg
      origen
      observaciones
      usuarioId
      createdAt
    }
  }
`;

export const REGISTRAR_ENTRADA_GALLINAZA = gql`
  mutation RegistrarEntradaGallinaza(
    $productoId: ID!
    $fecha: Date!
    $cantidadKg: Decimal!
    $origen: String
    $observaciones: String
  ) {
    registrarEntradaGallinaza(
      productoId: $productoId
      fecha: $fecha
      cantidadKg: $cantidadKg
      origen: $origen
      observaciones: $observaciones
    ) {
      id
      fecha
      cantidadKg
    }
  }
`;

// ============================================================
// VENTAS DE GALLINAZA
// ============================================================
export const VENTAS_GALLINAZA_QUERY = gql`
  query VentasGallinaza($fechaDesde: Date, $fechaHasta: Date) {
    ventasGallinaza(fechaDesde: $fechaDesde, fechaHasta: $fechaHasta) {
      id
      numero
      granjaId
      fecha
      clienteId
      total
      metodoPago
      estado
      montoRecibido
      cambio
      nombreCliente
      totalPagado
      saldoPendiente
      detalles {
        id
        productoId
        unidadVendida
        cantidad
        cantidadKg
        precioUnitario
        subtotal
        producto {
          id
          nombre
        }
      }
      pagos {
        id
        monto
        fecha
        metodo
      }
    }
  }
`;

export const REGISTRAR_VENTA_GALLINAZA = gql`
  mutation RegistrarVentaGallinaza(
    $fecha: Date!
    $detalles: [LineaAbonoPedidoInput!]!
    $clienteId: ID
    $metodoPago: String
    $montoRecibido: Decimal
  ) {
    registrarVentaGallinaza(
      fecha: $fecha
      detalles: $detalles
      clienteId: $clienteId
      metodoPago: $metodoPago
      montoRecibido: $montoRecibido
    ) {
      id
      numero
      total
      estado
    }
  }
`;

export const REGISTRAR_PAGO_GALLINAZA = gql`
  mutation RegistrarPagoGallinaza($ventaId: ID!, $monto: Decimal!, $metodo: String) {
    registrarPagoGallinaza(ventaId: $ventaId, monto: $monto, metodo: $metodo) {
      id
      monto
      fecha
      metodo
    }
  }
`;

// ============================================================
// MOVIMIENTOS DE GALLINAZA
// ============================================================
export const MOVIMIENTOS_GALLINAZA_QUERY = gql`
  query MovimientosGallinaza($productoId: ID) {
    movimientosGallinaza(productoId: $productoId) {
      id
      productoId
      tipo
      cantidadKg
      referencia
      createdAt
    }
  }
`;

// ============================================================
// GALPONES (para el formulario de entrada)
// ============================================================
export const GALPONES_QUERY = gql`
  query GalponesParaAbono {
    galpones {
      id
      codigo
      granjaId
    }
  }
`;
