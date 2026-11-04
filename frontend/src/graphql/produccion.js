import { gql } from "@apollo/client";

export const PRODUCCIONES_QUERY = gql`
  query Producciones($loteId: ID, $fechaDesde: Date, $fechaHasta: Date) {
    producciones(loteId: $loteId, fechaDesde: $fechaDesde, fechaHasta: $fechaHasta) {
      id
      loteId
      fecha
      huevosPrimera
      huevosSegunda
      huevosTercera
      huevosDescartados
      total
    }
  }
`;

export const REGISTRAR_PRODUCCION = gql`
  mutation RegistrarProduccion(
    $loteId: ID!
    $fecha: Date!
    $huevosPrimera: Int!
    $huevosSegunda: Int!
    $huevosTercera: Int!
    $huevosDescartados: Int!
  ) {
    registrarProduccion(
      loteId: $loteId
      fecha: $fecha
      huevosPrimera: $huevosPrimera
      huevosSegunda: $huevosSegunda
      huevosTercera: $huevosTercera
      huevosDescartados: $huevosDescartados
    ) {
      id
      fecha
      total
    }
  }
`;