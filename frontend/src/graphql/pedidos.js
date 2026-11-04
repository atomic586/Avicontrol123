import { gql } from "@apollo/client";

export const PEDIDOS_QUERY = gql`
  query Pedidos($estado: String, $fecha: Date, $clienteId: ID) {
    pedidos(estado: $estado, fecha: $fecha, clienteId: $clienteId) {
      id
      estado
      total
      fechaPedido
      creadoEn
      cliente {
        id
        nombres
        apellidos
        dni
        telefono
      }
    }
  }
`;

export const PEDIDO_COMPLETO_QUERY = gql`
  query PedidoCompleto($id: ID!) {
    pedido(id: $id) {
      id
      estado
      total
      fechaPedido
      cliente { id nombres apellidos dni telefono }
      detallesPedido(pedidoId: $id) {
        id
        cantidad
        precioUnitario
        subtotal
        producto { id nombre presentacion calidad }
      }
    }
  }
`;

export const CREAR_PEDIDO = gql`
  mutation CrearPedido($clienteId: ID!, $fechaPedido: Date!, $detalles: [DetalleInput!]!) {
    crearPedido(clienteId: $clienteId, fechaPedido: $fechaPedido, detalles: $detalles) {
      id
      estado
      total
    }
  }
`;

export const CAMBIAR_ESTADO_PEDIDO = gql`
  mutation CambiarEstadoPedido($id: ID!, $estado: String!) {
    cambiarEstadoPedido(id: $id, estado: $estado) {
      id
      estado
    }
  }
`;