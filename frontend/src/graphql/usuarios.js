import { gql } from "@apollo/client";

export const USUARIOS_QUERY = gql`
  query Usuarios {
    usuarios {
      id
      username
      email
      nombres
      apellidos
      telefono
      activo
      isActive
      granjaId
      roles { codigo nombre }
      creadoEn
    }
  }
`;

export const ROLES_QUERY = gql`
  query Roles {
    roles { id codigo nombre descripcion }
  }
`;

export const CREAR_USUARIO = gql`
  mutation CrearUsuario(
    $username: String!
    $email: String!
    $password: String!
    $rolCodigo: String!
    $granjaId: ID!
    $nombres: String
    $apellidos: String
    $telefono: String
  ) {
    crearUsuario(
      username: $username
      email: $email
      password: $password
      rolCodigo: $rolCodigo
      granjaId: $granjaId
      nombres: $nombres
      apellidos: $apellidos
      telefono: $telefono
    ) { id username email }
  }
`;

export const ACTUALIZAR_USUARIO = gql`
  mutation ActualizarUsuario(
    $id: ID!
    $nombres: String
    $apellidos: String
    $telefono: String
    $email: String
    $activo: Boolean
    $rolCodigo: String
  ) {
    actualizarUsuario(
      id: $id
      nombres: $nombres
      apellidos: $apellidos
      telefono: $telefono
      email: $email
      activo: $activo
      rolCodigo: $rolCodigo
    ) { id username activo }
  }
`;

export const ELIMINAR_USUARIO = gql`
  mutation EliminarUsuario($id: ID!) {
    eliminarUsuario(id: $id)
  }
`;