import { gql } from "@apollo/client";

export const CONFIGURACION_QUERY = gql`
  query ConfiguracionTienda {
    configuracionTienda {
      id
      heroTitulo
      heroSubtitulo
      heroCtaTexto
      heroImagenUrl
      nombreGranja
      telefonoContacto
      actualizadoEn
    }
  }
`;

export const ACTUALIZAR_CONFIGURACION = gql`
  mutation ActualizarConfiguracion(
    $heroTitulo: String
    $heroSubtitulo: String
    $heroCtaTexto: String
    $heroImagenUrl: String
    $nombreGranja: String
    $telefonoContacto: String
  ) {
    actualizarConfiguracionTienda(
      heroTitulo: $heroTitulo
      heroSubtitulo: $heroSubtitulo
      heroCtaTexto: $heroCtaTexto
      heroImagenUrl: $heroImagenUrl
      nombreGranja: $nombreGranja
      telefonoContacto: $telefonoContacto
    ) {
      id
      heroTitulo
      heroSubtitulo
      heroCtaTexto
      heroImagenUrl
      nombreGranja
      telefonoContacto
    }
  }
`;