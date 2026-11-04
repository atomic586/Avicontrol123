import { gql } from "@apollo/client";

export const CATALOGO_PUBLICO = gql`
  query CatalogoPublico {
    productos(soloActivos: true) {
      id
      nombre
      presentacion
      calidad
      precioUnitario
      stock
    }
  }
`;

export const CREAR_PEDIDO_CLIENTE = gql`
  mutation CrearPedidoCliente(
    $clienteId: ID!
    $fechaPedido: Date!
    $detalles: [DetalleInput!]!
  ) {
    crearPedido(
      clienteId: $clienteId
      fechaPedido: $fechaPedido
      detalles: $detalles
    ) {
      id
      estado
      total
    }
  }
`;