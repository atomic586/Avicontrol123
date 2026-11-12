import { gql } from "@apollo/client";

export const CLIENTES_QUERY = gql`
  query Clientes($busqueda: String) {
    clientes(busqueda: $busqueda) {
      id
      nombres
      apellidos
      dni
      telefono
      email
      direccion
      puedeLogearse
      creadoEn
    }
  }
`;

export const CREAR_CLIENTE = gql`
  mutation CrearCliente(
    $nombres: String!
    $apellidos: String!
    $dni: String!
    $telefono: String!
    $email: String
    $direccion: String!
  ) {
    crearCliente(
      nombres: $nombres
      apellidos: $apellidos
      dni: $dni
      telefono: $telefono
      email: $email
      direccion: $direccion
    ) {
      id
      nombres
      apellidos
      dni
    }
  }
`;

export const ACTUALIZAR_CLIENTE = gql`
  mutation ActualizarCliente(
    $id: ID!
    $nombres: String
    $apellidos: String
    $telefono: String
    $email: String
    $direccion: String
  ) {
    actualizarCliente(
      id: $id
      nombres: $nombres
      apellidos: $apellidos
      telefono: $telefono
      email: $email
      direccion: $direccion
    ) {
      id
      nombres
      apellidos
    }
  }
`;

export const ELIMINAR_CLIENTE = gql`
  mutation EliminarCliente($id: ID!) {
    eliminarCliente(id: $id)
  }
`;