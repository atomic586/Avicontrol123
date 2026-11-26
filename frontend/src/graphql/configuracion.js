import { gql } from "@apollo/client";
import { print } from "graphql";
import { API_URL } from "../apollo";

export const CONFIGURACION_QUERY = gql`
  query ConfiguracionTienda {
    configuracionTienda {
      id
      granjaId
      heroTitulo
      heroSubtitulo
      heroCtaTexto
      heroImagenUrl
      heroImagenUrlEfectiva
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
    $heroImagen: Upload
    $limpiarHeroImagen: Boolean!
    $telefonoContacto: String
  ) {
    actualizarConfiguracionTienda(
      heroTitulo: $heroTitulo
      heroSubtitulo: $heroSubtitulo
      heroCtaTexto: $heroCtaTexto
      heroImagenUrl: $heroImagenUrl
      heroImagen: $heroImagen
      limpiarHeroImagen: $limpiarHeroImagen
      telefonoContacto: $telefonoContacto
    ) {
      id
      heroTitulo
      heroSubtitulo
      heroCtaTexto
      heroImagenUrl
      heroImagenUrlEfectiva
      telefonoContacto
    }
  }
`;

export async function guardarConfiguracionConImagen(variables, archivo) {
  const formulario = new FormData();
  formulario.append(
    "operations",
    JSON.stringify({
      query: print(ACTUALIZAR_CONFIGURACION),
      variables: { ...variables, heroImagen: null },
    })
  );
  formulario.append("map", JSON.stringify({ 0: ["variables.heroImagen"] }));
  formulario.append("0", archivo, archivo.name);

  const headers = {};
  const token = localStorage.getItem("avicontrol_token");
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(API_URL, { method: "POST", body: formulario, headers });
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor. Revisa tu conexión o la URL de la API."
    );
  }

  let resultado;
  try {
    resultado = await respuesta.json();
  } catch {
    throw new Error("El servidor no devolvió una respuesta válida.");
  }

  if (!respuesta.ok || resultado?.errors?.length) {
    throw new Error(
      resultado?.errors?.[0]?.message || `Error del servidor (${respuesta.status}).`
    );
  }
  return resultado.data;
}
