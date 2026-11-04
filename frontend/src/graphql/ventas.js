import { gql } from "@apollo/client";

export const VENTAS_QUERY = gql`
  query Ventas($clienteId: ID) {
    ventas(clienteId: $clienteId) {
      id
      fecha
      montoTotal
      formaPago
      pedido {
        id
        total
        cliente { id nombres apellidos dni }
      }
    }
  }
`;

export const REGISTRAR_VENTA = gql`
  mutation RegistrarVenta($pedidoId: ID!, $formaPago: String!, $fecha: Date) {
    registrarVenta(pedidoId: $pedidoId, formaPago: $formaPago, fecha: $fecha) {
      id
      fecha
      montoTotal
      formaPago
    }
  }
`;