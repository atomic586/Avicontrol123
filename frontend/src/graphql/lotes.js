import { gql } from "@apollo/client";

export const LOTES_QUERY = gql`
  query Lotes {
    lotes {
      id
      granjaId
      galponId
      codigo
      raza
      fechaIngreso
      cantidadAves
      estado
      etapa
      avesActuales
    }
  }
`;

export const CREAR_LOTE = gql`
  mutation CrearLote(
    $galponId: ID!
    $codigo: String!
    $raza: String!
    $fechaIngreso: Date!
    $cantidadAves: Int!
    $etapa: String
  ) {
    crearLote(
      galponId: $galponId
      codigo: $codigo
      raza: $raza
      fechaIngreso: $fechaIngreso
      cantidadAves: $cantidadAves
      etapa: $etapa
    ) {
      id
      codigo
      cantidadAves
    }
  }
`;
