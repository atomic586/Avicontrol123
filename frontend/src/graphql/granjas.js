import { gql } from "@apollo/client";

export const GRANJAS_QUERY = gql`
  query Granjas {
    granjas {
      id
      codigo
      nombre
      ubicacion
      telefono
      email
      activo
      creadoEn
    }
  }
`;

export const CREAR_GRANJA = gql`
  mutation CrearGranja(
    $nombre: String!
    $codigo: String!
    $ubicacion: String!
    $telefono: String
    $email: String
  ) {
    crearGranja(
      nombre: $nombre
      codigo: $codigo
      ubicacion: $ubicacion
      telefono: $telefono
      email: $email
    ) {
      id
      codigo
      nombre
    }
  }
`;

export const ACTUALIZAR_GRANJA = gql`
  mutation ActualizarGranja(
    $id: ID!
    $nombre: String
    $ubicacion: String
    $telefono: String
    $email: String
    $activo: Boolean
  ) {
    actualizarGranja(
      id: $id
      nombre: $nombre
      ubicacion: $ubicacion
      telefono: $telefono
      email: $email
      activo: $activo
    ) {
      id
      nombre
      activo
    }
  }
`;