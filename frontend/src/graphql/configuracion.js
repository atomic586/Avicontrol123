import { gql } from "@apollo/client";

export const CONFIGURACION_QUERY = gql`
  query ConfiguracionTienda {
    configuracionTienda {
      id
      granjaId
      heroTitulo
      heroSubtitulo
      heroCtaTexto
      heroImagenUrl
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
    $telefonoContacto: String
  ) {
    actualizarConfiguracionTienda(
      heroTitulo: $heroTitulo
      heroSubtitulo: $heroSubtitulo
      heroCtaTexto: $heroCtaTexto
      heroImagenUrl: $heroImagenUrl
      telefonoContacto: $telefonoContacto
    ) {
      id
      heroTitulo
      heroSubtitulo
      heroCtaTexto
      heroImagenUrl
      telefonoContacto
    }
  }
`;