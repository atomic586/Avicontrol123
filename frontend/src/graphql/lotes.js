import { gql } from "@apollo/client";

export const LOTES_QUERY = gql`
  query Lotes {
    lotes {
      id
      granjaId
      galponId
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
    }
  }
`;

export const LOTE_DETALLE_QUERY = gql`
  query LoteDetalle($id: ID!) {
    lote(id: $id) {
      id
      galponId
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
    }
    movimientosAvesLote(loteId: $id) {
      id
      tipo
      cantidad
      fecha
      motivo
      creadoEn
    }
    producciones(loteId: $id) {
      id
      fecha
      huevosPrimera
      huevosSegunda
      huevosTercera
      huevosDescartados
      total
    }
    consumosLote(loteId: $id) {
      id
      fecha
      cantidad
      observaciones
      insumoId
      creadoEn
    }
  }
`;

export const CREAR_LOTE = gql`
  mutation CrearLote(
    $galponId: ID!
    $codigo: String!
    $raza: String!
    $fechaIngreso: Date!
    $cantidadAves: Int!
    $etapa: String!
    $fechaNacimiento: Date
  ) {
    crearLote(
      galponId: $galponId
      codigo: $codigo
      raza: $raza
      fechaIngreso: $fechaIngreso
      cantidadAves: $cantidadAves
      etapa: $etapa
      fechaNacimiento: $fechaNacimiento
    ) {
      id
      codigo
    }
  }
`;

export const REGISTRAR_MOVIMIENTO_AVE = gql`
  mutation RegistrarMovimientoAve(
    $loteId: ID!
    $tipo: String!
    $cantidad: Int!
    $fecha: Date!
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
      motivo
    }
  }
`;

export const REGISTRAR_PRODUCCION = gql`
  mutation RegistrarProduccion(
    $loteId: ID!
    $fecha: Date!
    $huevosPrimera: Int
    $huevosSegunda: Int
    $huevosTercera: Int
    $huevosDescartados: Int
  ) {
    registrarProduccion(
      loteId: $loteId
      fecha: $fecha
      huevosPrimera: $huevosPrimera
      huevosSegunda: $huevosSegunda
      huevosTercera: $huevosTercera
      huevosDescartados: $huevosDescartados
    ) {
      id
      fecha
      total
    }
  }
`;

export const REGISTRAR_CONSUMO = gql`
  mutation RegistrarConsumo(
    $loteId: ID!
    $insumoId: ID!
    $fecha: Date!
    $cantidad: Decimal!
    $observaciones: String
  ) {
    registrarConsumo(
      loteId: $loteId
      insumoId: $insumoId
      fecha: $fecha
      cantidad: $cantidad
      observaciones: $observaciones
    ) {
      id
      fecha
      cantidad
    }
  }
`;

export const INSUMOS_ALIMENTO_QUERY = gql`
  query InsumosAlimento {
    insumos(tipo: "alimento") {
      id
      nombre
      presentacion
      stock
      precioUnitario
    }
  }
`;