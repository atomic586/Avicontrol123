import { gql } from "@apollo/client";

export const ABONO_QUERY = gql`
  query GeneracionesAbono($estado: String) {
    generacionesAbono(estado: $estado) {
      id
      granjaId
      galponId
      loteId
      fecha
      cantidadKg
      estado
      responsable
      observaciones
      creadoEn
    }
  }
`;

export const GALPONES_QUERY = gql`
  query GalponesParaAbono {
    galpones {
      id
      codigo
      granjaId
    }
  }
`;

export const REGISTRAR_ABONO = gql`
  mutation RegistrarGeneracionAbono(
    $galponId: ID!
    $fecha: Date!
    $cantidadKg: Decimal!
    $estado: String!
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
      fecha
      cantidadKg
      estado
    }
  }
`;