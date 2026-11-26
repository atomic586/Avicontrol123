import { gql } from "@apollo/client";

export const GALPONES_QUERY = gql`
  query Galpones($granjaId: ID) {
    galpones(granjaId: $granjaId) {
      id
      granjaId
      codigo
      capacidadAves
      activo
      avesActuales
    }
  }
`;

export const CREAR_GALPON = gql`
  mutation CrearGalpon($granjaId: ID!, $codigo: String!, $capacidadAves: Int!) {
    crearGalpon(granjaId: $granjaId, codigo: $codigo, capacidadAves: $capacidadAves) {
      id
      codigo
      capacidadAves
    }
  }
`;