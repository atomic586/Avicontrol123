import { gql } from "@apollo/client";

export const TARIFAS_QUERY = gql`
  query TarifasProducto($productoId: ID!) {
    tarifasProducto(productoId: $productoId) {
      id
      tipo
      nombreTemporada
      precio
      fechaInicio
      fechaFin
      activo
    }
  }
`;

export const CREAR_TARIFA = gql`
  mutation CrearTarifaProducto($productoId: ID!, $precio: Float!, $fechaInicio: String!, $fechaFin: String, $tipo: String, $nombreTemporada: String) {
    crearTarifaProducto(
      productoId: $productoId
      precio: $precio
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      tipo: $tipo
      nombreTemporada: $nombreTemporada
    ) {
      id
      precio
    }
  }
`;

export const ELIMINAR_TARIFA = gql`
  mutation EliminarTarifaProducto($id: ID!) {
    eliminarTarifaProducto(id: $id)
  }
`;