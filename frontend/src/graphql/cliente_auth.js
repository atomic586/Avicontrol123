import { gql } from "@apollo/client";

export const LOGIN_CLIENTE = gql`
  mutation LoginCliente($email: String!, $password: String!) {
    loginCliente(email: $email, password: $password) {
      access
      refresh
      cliente {
        id
        granjaId
        nombres
        apellidos
        dni
        telefono
        email
      }
    }
  }
`;

export const REGISTRO_CLIENTE = gql`
  mutation RegistroCliente(
    $granjaId: ID!
    $nombres: String!
    $apellidos: String!
    $dni: String!
    $telefono: String!
    $email: String!
    $password: String!
  ) {
    registroCliente(
      granjaId: $granjaId
      nombres: $nombres
      apellidos: $apellidos
      dni: $dni
      telefono: $telefono
      email: $email
      password: $password
    ) {
      access
      refresh
      cliente {
        id
        granjaId
        nombres
        apellidos
        dni
        telefono
        email
      }
    }
  }
`;

export const SOLICITAR_ACTIVACION_CLIENTE = gql`
  mutation SolicitarActivacionCliente(
    $granjaId: ID!
    $email: String!
    $dni: String!
    $telefono: String!
  ) {
    solicitarActivacionCliente(
      granjaId: $granjaId
      email: $email
      dni: $dni
      telefono: $telefono
    )
  }
`;

export const CONFIRMAR_ACTIVACION_CLIENTE = gql`
  mutation ConfirmarActivacionCliente(
    $email: String!
    $codigo: String!
    $password: String!
  ) {
    confirmarActivacionCliente(
      email: $email
      codigo: $codigo
      password: $password
    ) {
      access
      refresh
      cliente {
        id
        granjaId
        nombres
        apellidos
        dni
        telefono
        email
      }
    }
  }
`;

export const MIS_PEDIDOS = gql`
  query MisPedidos {
    misPedidos {
      id
      estado
      total
      fechaPedido
      creadoEn
    }
    misVentasAbono {
      id
      numero
      fecha
      total
      estado
      nombreCliente
      detalles {
        id
        cantidad
        unidadVendida
        producto { nombre }
      }
    }
  }
`;
