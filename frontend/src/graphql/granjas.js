import { gql } from "@apollo/client";

export const GRANJAS_QUERY = gql`
  query Granjas {
    granjas {
      id
      nombre
      codigo
      ubicacion
      telefono
      email
      activo
      razonSocial
      nit
      propietario
      logoFinal
      heroFinal
    }
  }
`;

export const CREAR_GRANJA = gql`
  mutation CrearGranja(
    $nombre: String! $codigo: String! $ubicacion: String!
    $telefono: String $email: String
    $razonSocial: String $nit: String $propietario: String
    $logoUrl: String $imagenHeroUrl: String
  ) {
    crearGranja(
      nombre: $nombre codigo: $codigo ubicacion: $ubicacion
      telefono: $telefono email: $email
      razonSocial: $razonSocial nit: $nit propietario: $propietario
      logoUrl: $logoUrl imagenHeroUrl: $imagenHeroUrl
    ) { id nombre codigo }
  }
`;

export const ACTUALIZAR_GRANJA = gql`
  mutation ActualizarGranja(
    $id: ID! $nombre: String $ubicacion: String $telefono: String
    $email: String $razonSocial: String $nit: String
    $propietario: String $logoUrl: String $imagenHeroUrl: String
  ) {
    actualizarGranja(
      id: $id nombre: $nombre ubicacion: $ubicacion
      telefono: $telefono email: $email
      razonSocial: $razonSocial nit: $nit propietario: $propietario
      logoUrl: $logoUrl imagenHeroUrl: $imagenHeroUrl
    ) { id }
  }
`;

export const CAMBIAR_ESTADO_GRANJA = gql`
  mutation CambiarEstadoGranja($id: ID!, $activo: Boolean!) {
    cambiarEstadoGranja(id: $id, activo: $activo) { id activo }
  }
`;