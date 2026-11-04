import { gql } from "@apollo/client";

export const INSUMOS_QUERY = gql`
  query Insumos($tipo: String) {
    insumos(tipo: $tipo) {
      id
      nombre
      tipo
      presentacion
      stock
      stockMinimo
      precioUnitario
      fechaVencimiento
      creadoEn
    }
  }
`;

export const CREAR_INSUMO = gql`
  mutation CrearInsumo(
    $nombre: String!
    $tipo: String!
    $presentacion: String!
    $stock: Decimal!
    $stockMinimo: Decimal!
    $precioUnitario: Decimal!
    $fechaVencimiento: Date
  ) {
    crearInsumo(
      nombre: $nombre
      tipo: $tipo
      presentacion: $presentacion
      stock: $stock
      stockMinimo: $stockMinimo
      precioUnitario: $precioUnitario
      fechaVencimiento: $fechaVencimiento
    ) {
      id
      nombre
      tipo
    }
  }
`;

export const ACTUALIZAR_INSUMO = gql`
  mutation ActualizarInsumo(
    $id: ID!
    $nombre: String
    $tipo: String
    $presentacion: String
    $stock: Decimal
    $stockMinimo: Decimal
    $precioUnitario: Decimal
    $fechaVencimiento: Date
  ) {
    actualizarInsumo(
      id: $id
      nombre: $nombre
      tipo: $tipo
      presentacion: $presentacion
      stock: $stock
      stockMinimo: $stockMinimo
      precioUnitario: $precioUnitario
      fechaVencimiento: $fechaVencimiento
    ) {
      id
      nombre
      tipo
      presentacion
      stock
      stockMinimo
      precioUnitario
      fechaVencimiento
    }
  }
`;

export const ELIMINAR_INSUMO = gql`
  mutation EliminarInsumo($id: ID!) {
    eliminarInsumo(id: $id)
  }
`;