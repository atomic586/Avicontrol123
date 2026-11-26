import { gql } from "@apollo/client";

export const MOVIMIENTOS_AVES_QUERY = gql`
  query MovimientosAvesLote($loteId: ID!) {
    movimientosAvesLote(loteId: $loteId) {
      id
      tipo
      cantidad
      fecha
      motivo
      creadoEn
    }
  }
`;

export const LOTES_CON_AVES_QUERY = gql`
  query LotesConAves {
    lotesConAves {
      id
      codigo
      raza
      fechaIngreso
      fechaNacimiento
      cantidadAves
      estado
      etapa
      avesActuales
      porcentajeMortalidad
      edadSemanas
      galponId
    }
  }
`;

export const REGISTRAR_MOVIMIENTO_AVE = gql`
  mutation RegistrarMovimientoAve(
    $loteId: ID!
    $tipo: String!
    $cantidad: Int!
    $fecha: String!
    $motivo: String
    $loteDestinoId: ID
  ) {
    registrarMovimientoAve(
      loteId: $loteId
      tipo: $tipo
      cantidad: $cantidad
      fecha: $fecha
      motivo: $motivo
      loteDestinoId: $loteDestinoId
    ) {
      id
      tipo
      cantidad
      fecha
    }
  }
`;

export const AVANZAR_ETAPA_LOTE = gql`
  mutation AvanzarEtapaLote($loteId: ID!) {
    avanzarEtapaLote(loteId: $loteId) {
      id
      codigo
      etapa
      estado
    }
  }
`;