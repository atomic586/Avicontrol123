import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Settings, Save, Store } from "lucide-react";
import {
  CONFIGURACION_QUERY,
  ACTUALIZAR_CONFIGURACION,
} from "../graphql/configuracion";

export default function Configuracion() {
  const { data, loading, refetch } = useQuery(CONFIGURACION_QUERY, {
    fetchPolicy: "network-only",
  });
  const [actualizar, { loading: guardando }] = useMutation(ACTUALIZAR_CONFIGURACION);

  const [form, setForm] = useState({
    heroTitulo: "",
    heroSubtitulo: "",
    heroCtaTexto: "",
    heroImagenUrl: "",
    nombreGranja: "",
    telefonoContacto: "",
  });
  const [exito, setExito] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (data?.configuracionTienda) {
      const c = data.configuracionTienda;
      setForm({
        heroTitulo: c.heroTitulo || "",
        heroSubtitulo: c.heroSubtitulo || "",
        heroCtaTexto: c.heroCtaTexto || "",
        heroImagenUrl: c.heroImagenUrl || "",
        nombreGranja: c.nombreGranja || "",
        telefonoContacto: c.telefonoContacto || "",
      });
    }
  }, [data]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");
    try {
      await actualizar({
        variables: {
          heroTitulo: form.heroTitulo,
          heroSubtitulo: form.heroSubtitulo,
          heroCtaTexto: form.heroCtaTexto,
          heroImagenUrl: form.heroImagenUrl || null,
          nombreGranja: form.nombreGranja,
          telefonoContacto: form.telefonoContacto,
        },
      });
      setExito("Configuración guardada correctamente.");
      refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="card text-center py-12 text-gray-500 font-medium">Cargando configuración...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-brand-500" /> Configuración de la Tienda
        </h1>
        <p className="text-gray-500 text-base mt-1 font-medium">
          Personaliza el hero del portal público para tus clientes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={onSubmit} className="card lg:col-span-2 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-5 h-5 text-brand-600" />
            <h2 className="text-xl font-black text-dark">Datos de la granja</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-bold text-gray-700 mb-1 block">Nombre de la granja</label>
              <input name="nombreGranja" className="input-field" value={form.nombreGranja} onChange={onChange} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-bold text-gray-700 mb-1 block">Teléfono de contacto</label>
              <input name="telefonoContacto" className="input-field" value={form.telefonoContacto} onChange={onChange} placeholder="Ej: +591 712 345 67" />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-brand-600" />
              <h2 className="text-xl font-black text-dark">Hero del portal</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Título principal</label>
                <input name="heroTitulo" className="input-field" value={form.heroTitulo} onChange={onChange} />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Subtítulo</label>
                <textarea name="heroSubtitulo" className="input-field" rows={3} value={form.heroSubtitulo} onChange={onChange} />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Texto del botón (CTA)</label>
                <input name="heroCtaTexto" className="input-field" value={form.heroCtaTexto} onChange={onChange} />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">URL de imagen de fondo (opcional)</label>
                <input name="heroImagenUrl" className="input-field" value={form.heroImagenUrl} onChange={onChange} placeholder="https://..." />
              </div>
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 font-medium">{error}</div>}
          {exito && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg border border-green-200 font-medium">{exito}</div>}

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={guardando} className="btn-primary">
              <Save className="w-5 h-5" /> {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>

        <div className="card">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Vista previa del hero</h3>
          <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl p-6 text-white overflow-hidden">
            {form.heroImagenUrl && (
              <div
                className="h-32 -mx-6 -mt-6 mb-4 bg-cover bg-center"
                style={{ backgroundImage: `url('${form.heroImagenUrl}')` }}
              />
            )}
            <p className="text-xs font-bold uppercase opacity-80 mb-2">{form.nombreGranja}</p>
            <p className="text-2xl font-black leading-tight mb-2">
              {form.heroTitulo || "Título del hero"}
            </p>
            <p className="text-sm opacity-90 mb-4">
              {form.heroSubtitulo || "Subtítulo del hero"}
            </p>
            <button className="bg-white text-brand-700 font-bold py-2 px-4 rounded-lg text-sm">
              {form.heroCtaTexto || "Botón"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}