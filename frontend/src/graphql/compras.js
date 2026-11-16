import { gql } from "@apollo/client";

export const COMPRAS_QUERY = gql`
  query Compras {
    compras {
      id
      fecha
      numeroFactura
      estado
      total
      proveedorId
    }
  }
`;

export const INSUMOS_PARA_COMPRA = gql`
  query InsumosParaCompra {
    insumos {
      id
      nombre
      stock
      precioUnitario
    }
  }
`;

export const REGISTRAR_COMPRA = gql`
  mutation RegistrarCompra(
    $proveedorId: ID!
    $fecha: Date!
    $detalles: [DetalleCompraInput!]!
    $numeroFactura: String
  ) {
    registrarCompra(
      proveedorId: $proveedorId
      fecha: $fecha
      detalles: $detalles
      numeroFactura: $numeroFactura
    ) {
      id
      total
      estado
    }
  }
`;