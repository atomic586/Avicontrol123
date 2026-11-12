import { gql } from "@apollo/client";

export const CATALOGO_PUBLICO = gql`
  query CatalogoPublico {
    productos(soloActivos: true) {
      id
      nombre
      tipo
      presentacion
      calidad
      unidadMedida
      precioUnitario
      stock
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
  }
`;