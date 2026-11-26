import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import {
  Settings,
  Save,
  Store,
  Building2,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  CONFIGURACION_QUERY,
  ACTUALIZAR_CONFIGURACION,
  guardarConfiguracionConImagen,
} from "../graphql/configuracion";

const GRANJA_ACTUAL_QUERY = gql`
  query GranjaActual {
    granjaActual {
      id
      nombre
      codigo
      ubicacion
      telefono
    }
  }
`;

const MAX_ARCHIVO_IMAGEN = 5 * 1024 * 1024;
const TIPOS_IMAGEN = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const EXTENSION_IMAGEN = /\.(jpe?g|png|webp)$/i;

function validarArchivo(archivo) {
  if (archivo.type && !TIPOS_IMAGEN[archivo.type]) {
    return "Formato no admitido. Usa una imagen JPG, PNG o WebP.";
  }
  if (!archivo.type && !EXTENSION_IMAGEN.test(archivo.name)) {
    return "Formato no admitido. Usa una imagen JPG, PNG o WebP.";
  }
  if (archivo.size === 0) return "El archivo de imagen está vacío.";
  if (archivo.size > MAX_ARCHIVO_IMAGEN) {
    return "La imagen no debe superar los 5 MB.";
  }
  return "";
}

export default function Configuracion() {
  const { data, loading, error: qError, refetch } = useQuery(CONFIGURACION_QUERY, {
    fetchPolicy: "network-only",
  });
  const { data: dataGranja } = useQuery(GRANJA_ACTUAL_QUERY, { fetchPolicy: "cache-first" });
  const [actualizar, { loading: guardando }] = useMutation(ACTUALIZAR_CONFIGURACION);

  const [form, setForm] = useState({
    heroTitulo: "",
    heroSubtitulo: "",
    heroCtaTexto: "",
    heroImagenUrl: "",
    telefonoContacto: "",
  });
  const [fuenteImagen, setFuenteImagen] = useState("actual");
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [vistaPreviaArchivo, setVistaPreviaArchivo] = useState("");
  const [errorArchivo, setErrorArchivo] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const granja = dataGranja?.granjaActual;
  const imagenGuardada = data?.configuracionTienda?.heroImagenUrlEfectiva || "";
  const imagenVistaPrevia =
    fuenteImagen === "archivo"
      ? vistaPreviaArchivo
      : fuenteImagen === "url"
        ? form.heroImagenUrl.trim()
        : fuenteImagen === "ninguna"
          ? ""
          : imagenGuardada;

  useEffect(() => {
    if (!data?.configuracionTienda) return;
    const c = data.configuracionTienda;
    setForm({
      heroTitulo: c.heroTitulo || "",
      heroSubtitulo: c.heroSubtitulo || "",
      heroCtaTexto: c.heroCtaTexto || "",
      heroImagenUrl: c.heroImagenUrl || "",
      telefonoContacto: c.telefonoContacto || "",
    });
    setFuenteImagen("actual");
    setArchivoImagen(null);
    setErrorArchivo("");
  }, [data]);

  useEffect(() => {
    if (!archivoImagen) {
      setVistaPreviaArchivo("");
      return undefined;
    }
    const url = URL.createObjectURL(archivoImagen);
    setVistaPreviaArchivo(url);
    return () => URL.revokeObjectURL(url);
  }, [archivoImagen]);

  const onChange = (e) =>
    setForm((actual) => ({ ...actual, [e.target.name]: e.target.value }));

  const onChangeUrl = (e) => {
    onChange(e);
    setArchivoImagen(null);
    setFuenteImagen("url");
    setErrorArchivo("");
  };

  const onSeleccionarArchivo = (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    const problema = validarArchivo(archivo);
    if (problema) {
      setErrorArchivo(problema);
      setArchivoImagen(null);
      return;
    }
    setErrorArchivo("");
    setArchivoImagen(archivo);
    setFuenteImagen("archivo");
    setError("");
    setExito("");
  };

  const quitarImagen = () => {
    setArchivoImagen(null);
    setFuenteImagen("ninguna");
    setErrorArchivo("");
    setForm((actual) => ({ ...actual, heroImagenUrl: "" }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");
    if (qError) return;

    const titulo = form.heroTitulo.trim();
    if (!titulo) {
      setError("El título del hero es obligatorio.");
      return;
    }
    if (titulo.length > 200) {
      setError("El título del hero no puede superar los 200 caracteres.");
      return;
    }
    if (form.heroCtaTexto.length > 80) {
      setError("El texto del botón no puede superar los 80 caracteres.");
      return;
    }
    if (form.telefonoContacto.length > 30) {
      setError("El teléfono no puede superar los 30 caracteres.");
      return;
    }
    if (fuenteImagen === "url" && form.heroImagenUrl.trim()) {
      try {
        const url = new URL(form.heroImagenUrl.trim());
        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      } catch {
        setError("La URL de la imagen debe comenzar con http:// o https://.");
        return;
      }
    }
    if (errorArchivo) {
      setError(errorArchivo);
      return;
    }

    const variables = {
      heroTitulo: titulo,
      heroSubtitulo: form.heroSubtitulo,
      heroCtaTexto: form.heroCtaTexto,
      heroImagenUrl:
        fuenteImagen === "archivo"
          ? form.heroImagenUrl
          : form.heroImagenUrl.trim(),
      limpiarHeroImagen: fuenteImagen === "url" || fuenteImagen === "ninguna",
      telefonoContacto: form.telefonoContacto,
    };

    try {
      if (fuenteImagen === "archivo" && archivoImagen) {
        setSubiendo(true);
        await guardarConfiguracionConImagen(variables, archivoImagen);
      } else {
        await actualizar({ variables });
      }
      setExito("Configuración guardada correctamente.");
      await refetch();
    } catch (err) {
      setError(err.message || "No se pudo guardar la configuración.");
    } finally {
      setSubiendo(false);
    }
  };

  if (loading) {
    return <div className="card text-center py-12 text-gray-500 font-medium">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-brand-500" /> Configuración
        </h1>
        <p className="text-gray-500 text-base mt-1 font-medium">
          Personaliza el portal público y los datos de tu granja
        </p>
      </div>

      {qError && (
        <div className="card bg-red-50 border-red-200 text-red-700 p-4" role="alert">
          <p className="font-bold mb-1">No se pudo cargar la configuración.</p>
          <p className="text-sm mt-1">
            Revisa la conexión con el servidor e inténtalo de nuevo.
          </p>
          <p className="text-xs font-mono bg-white p-2 rounded border border-red-200 mt-2 break-words">
            {qError.message}
          </p>
        </div>
      )}

      {granja && (
        <div className="card bg-brand-50 border-brand-100">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-brand-700" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-brand-700 uppercase tracking-wider">Granja activa</p>
              <p className="text-lg font-black text-brand-900 break-words">
                {granja.nombre} <span className="text-sm text-brand-700">({granja.codigo})</span>
              </p>
              <p className="text-xs text-brand-700/80 break-words">
                {granja.ubicacion} · {granja.telefono || "Sin teléfono"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form onSubmit={onSubmit} noValidate className="card xl:col-span-2 space-y-5 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-5 h-5 text-brand-600" />
            <h2 className="text-xl font-black text-dark">Datos del portal</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="heroTitulo" className="text-sm font-bold text-gray-700 mb-1 block">
                Título del hero *
              </label>
              <input
                id="heroTitulo"
                name="heroTitulo"
                className="input-field"
                value={form.heroTitulo}
                onChange={onChange}
                placeholder="Huevos frescos para tu hogar"
                maxLength={200}
                required
              />
            </div>
            <div>
              <label htmlFor="heroSubtitulo" className="text-sm font-bold text-gray-700 mb-1 block">
                Subtítulo
              </label>
              <textarea
                id="heroSubtitulo"
                name="heroSubtitulo"
                className="input-field resize-y"
                rows={3}
                value={form.heroSubtitulo}
                onChange={onChange}
                placeholder="Elige la calidad y la cantidad que necesitas"
              />
            </div>
            <div>
              <label htmlFor="heroCtaTexto" className="text-sm font-bold text-gray-700 mb-1 block">
                Texto del botón (CTA)
              </label>
              <input
                id="heroCtaTexto"
                name="heroCtaTexto"
                className="input-field"
                value={form.heroCtaTexto}
                onChange={onChange}
                placeholder="Hacer un pedido"
                maxLength={80}
              />
            </div>

            <fieldset className="space-y-3 rounded-xl border border-gray-200 p-4">
              <legend className="text-sm font-bold text-gray-700 px-1">
                Imagen de fondo
              </legend>
              <div>
                <label htmlFor="heroImagenUrl" className="text-sm font-bold text-gray-700 mb-1 block">
                  Pegar URL de imagen (opcional)
                </label>
                <input
                  id="heroImagenUrl"
                  name="heroImagenUrl"
                  type="url"
                  inputMode="url"
                  className="input-field break-all"
                  value={form.heroImagenUrl}
                  onChange={onChangeUrl}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  maxLength={200}
                />
              </div>
              <div>
                <label htmlFor="archivoImagen" className="text-sm font-bold text-gray-700 mb-1 block">
                  Subir imagen desde tu dispositivo
                </label>
                <input
                  id="archivoImagen"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  onChange={onSeleccionarArchivo}
                  className="input-field file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-bold file:text-brand-800"
                  aria-describedby="ayuda-imagen"
                />
                <p id="ayuda-imagen" className="text-xs text-gray-500 mt-2">
                  JPG, PNG o WebP · máximo 5 MB. La imagen se guarda en el servidor
                  y se muestra en el portal público.
                </p>
              </div>
              {errorArchivo && (
                <p className="text-sm font-medium text-red-700 break-words" role="alert">
                  {errorArchivo}
                </p>
              )}
              {archivoImagen && (
                <div className="flex items-center gap-3">
                  <img
                    src={vistaPreviaArchivo}
                    alt="Vista previa de la imagen seleccionada"
                    className="h-14 w-20 rounded-lg object-cover border border-gray-200"
                  />
                  <p className="text-sm text-gray-600 min-w-0 break-all">
                    {archivoImagen.name}
                  </p>
                </div>
              )}
              {imagenVistaPrevia && (
                <button
                  type="button"
                  onClick={quitarImagen}
                  className="btn-secondary text-sm"
                >
                  <Trash2 className="w-4 h-4" /> Quitar imagen
                </button>
              )}
            </fieldset>

            <div>
              <label htmlFor="telefonoContacto" className="text-sm font-bold text-gray-700 mb-1 block">
                Teléfono de contacto
              </label>
              <input
                id="telefonoContacto"
                name="telefonoContacto"
                type="tel"
                className="input-field"
                value={form.telefonoContacto}
                onChange={onChange}
                placeholder="Ej: +591 712 345 67"
                maxLength={30}
              />
              <p className="text-xs text-gray-500 mt-2">
                Este número aparece en la sección de atención del portal público.
              </p>
            </div>
          </div>

          {error && (
            <div className="mensaje-error rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 flex items-start gap-2" role="alert">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}
          {exito && (
            <div className="mensaje-exito rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700 flex items-start gap-2" role="status">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{exito}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={guardando || subiendo || !!qError}
              className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {guardando || subiendo ? (
                <Upload className="w-5 h-5 animate-pulse" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {subiendo ? "Subiendo imagen..." : guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>

        <div className="card min-w-0">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Vista previa del hero</h3>
          <div
            className={`relative rounded-2xl overflow-hidden p-5 text-white sm:p-6 min-h-64 ${
              imagenVistaPrevia ? "" : "bg-gradient-to-br from-brand-500 to-brand-600"
            }`}
            style={
              imagenVistaPrevia
                ? {
                    backgroundImage: `linear-gradient(90deg, rgba(15,23,42,0.8), rgba(15,23,42,0.4)), url(${JSON.stringify(imagenVistaPrevia)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            <div className="flex min-h-52 flex-col justify-center gap-3">
              <p className="text-xs font-bold uppercase tracking-widest text-white/85 break-words">
                {granja?.nombre || "Granja"}
              </p>
              <p className="text-xl sm:text-2xl font-black leading-snug break-words whitespace-pre-wrap">
                {form.heroTitulo || "Título del hero"}
              </p>
              <p className="text-sm text-white/90 break-words whitespace-pre-wrap">
                {form.heroSubtitulo || "Subtítulo del hero"}
              </p>
              <span className="mt-1 inline-flex max-w-full items-center rounded-lg bg-white px-4 py-2 text-sm font-bold text-brand-800 break-words">
                {form.heroCtaTexto || "Botón"}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 break-words">
            Teléfono: {form.telefonoContacto || "No configurado"}
          </p>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Así verán tus clientes el portal público
          </p>
        </div>
      </div>
    </div>
  );
}
