const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/graphql\/?$/, "").replace(/\/+$/, "") ||
  "http://localhost:8000";

/**
 * Convierte una ruta relativa (/media/...) en una URL absoluta
 * para que el navegador pueda cargar la imagen.
 */
export function mediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_URL}${url.startsWith("/") ? url : "/" + url}`;
}