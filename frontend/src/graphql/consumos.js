import { gql } from "@apollo/client";

export const CONSUMOS_QUERY = gql`
  query ConsumosGranja($loteId: ID) {
    consumosGranja(loteId: $loteId) {
      id
      loteId
      insumoId
      fecha
      cantidad
      observaciones
    }
  }
`;

export const REGISTRAR_CONSUMO = gql`
  mutation RegistrarConsumo($loteId: ID!, $insumoId: ID!, $fecha: String!, $cantidad: Float!, $observaciones: String) {
    registrarConsumo(
      loteId: $loteId
      insumoId: $insumoId
      fecha: $fecha
      cantidad: $cantidad
      observaciones: $observaciones
    ) { 
      id 
    }
  }
`;

export const ELIMINAR_CONSUMO = gql`
  mutation EliminarConsumo($id: ID!) {
    eliminarConsumo(id: $id)
  }
`;

export const MEDICAMENTOS_ALIMENTO_QUERY = gql`
  query MedicamentosAlimento($alimentoId: ID) {
    medicamentosAlimento(alimentoId: $alimentoId) {
      id
      alimentoId
      medicamentoId
      dosisPorKg
      fechaInicio
      fechaFin
      periodoRetiroDias
    }
  }
`;

export const CREAR_MEDICAMENTO_ALIMENTO = gql`
  mutation CrearMedicamentoAlimento($alimentoId: ID!, $medicamentoId: ID!, $dosisPorKg: Float!, $fechaInicio: String!, $periodoRetiroDias: Int!, $fechaFin: String) {
    crearMedicamentoAlimento(
      alimentoId: $alimentoId
      medicamentoId: $medicamentoId
      dosisPorKg: $dosisPorKg
      fechaInicio: $fechaInicio
      periodoRetiroDias: $periodoRetiroDias
      fechaFin: $fechaFin
    ) { 
      id 
    }
  }
`;