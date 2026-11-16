import { gql } from "@apollo/client";

export const PROVEEDORES_QUERY = gql`
  query Proveedores {
    proveedores {
      id
      nombre
      contacto
      telefono
      email
      direccion
      activo
    }
  }
`;

export const CREAR_PROVEEDOR = gql`
  mutation CrearProveedor($nombre: String!, $telefono: String, $email: String) {
    crearProveedor(nombre: $nombre, telefono: $telefono, email: $email) {
      id
      nombre
    }
  }
`;