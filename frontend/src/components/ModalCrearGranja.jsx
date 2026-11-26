import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client/react";
import { Building2, Image as ImageIcon, Upload, X, Link as LinkIcon } from "lucide-react";
import { CREAR_GRANJA, ACTUALIZAR_GRANJA } from "../graphql/granjas";
import ImageUploader from "./ImageUploader";

const FORM_VACIO = {
  nombre: "",
  codigo: "",
  razonSocial: "",
  nit: "",
  propietario: "",
  ubicacion: "",
  telefono: "",
  email: "",
  logo: null,
  imagenHero: null,
  logoUrl: "",
  imagenHeroUrl: "",
};

export default function ModalCrearGranja({ open, onClose, granjaEditando, onSuccess }) {
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");
  const [subiendo, setSubiendo] = useState(false);

  const [crearGranja] = useMutation(CREAR_GRANJA);
  const [actualizarGranja] = useMutation(ACTUALIZAR_GRANJA);

  useEffect(() => {
    if (granjaEditando) {
      setForm({
        ...FORM_VACIO,
        nombre: granjaEditando.nombre || "",
        codigo: granjaEditando.codigo || "",
        razonSocial: granjaEditando.razonSocial || "",
        nit: granjaEditando.nit || "",
        propietario: granjaEditando.propietario || "",
        ubicacion: granjaEditando.ubicacion || "",
        telefono: granjaEditando.telefono || "",
        email: granjaEditando.email || "",
        logoUrl: granjaEditando.logoFinal || "",
        imagenHeroUrl: granjaEditando.heroFinal || "",
      });
    } else {
      setForm(FORM_VACIO);
    }
    setError("");
  }, [granjaEditando, open]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubiendo(true);

    try {
      if (granjaEditando) {
        await actualizarGranja({
          variables: {
            id: granjaEditando.id,
            nombre: form.nombre,
            ubicacion: form.ubicacion,
            telefono: form.telefono,
            email: form.email,
            razonSocial: form.razonSocial,
            nit: form.nit,
            propietario: form.propietario,
            logoUrl: form.logo ? null : form.logoUrl,
            imagenHeroUrl: form.imagenHero ? null : form.imagenHeroUrl,
          },
        });
        // NOTA: La subida de archivos requiere un endpoint multipart (ver más abajo).
      } else {
        await crearGranja({
          variables: {
            nombre: form.nombre,
            codigo: form.codigo,
            ubicacion: form.ubicacion,
            telefono: form.telefono,
            email: form.email,
            razonSocial: form.razonSocial,
            nit: form.nit,
            propietario: form.propietario,
            logoUrl: form.logo ? null : form.logoUrl,
            imagenHeroUrl: form.imagenHero ? null : form.imagenHeroUrl,
          },
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-dark dark:text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-orange-500" />
              {granjaEditando ? "Editar Granja" : "Nueva Granja"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Completa los datos comerciales y la identidad visual.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* SECCIÓN 1: Datos Básicos */}
          <div>
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 flex items-center justify-center text-xs font-black">1</span>
              Datos Básicos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Nombre Comercial *</label>
                <input name="nombre" className="input-field" value={form.nombre} onChange={onChange} required placeholder="Ej: Granja Los Pinos" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Código Único *</label>
                <input
                  name="codigo"
                  className="input-field disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  value={form.codigo}
                  onChange={onChange}
                  required
                  disabled={!!granjaEditando}
                  placeholder="Ej: GLP-001"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Ubicación *</label>
                <input name="ubicacion" className="input-field" value={form.ubicacion} onChange={onChange} required placeholder="Ej: Carretera a Copacabana Km 15" />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: Datos Comerciales */}
          <div>
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 flex items-center justify-center text-xs font-black">2</span>
              Datos Comerciales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Razón Social</label>
                <input name="razonSocial" className="input-field" value={form.razonSocial} onChange={onChange} placeholder="Ej: Inversiones Avícolas SRL" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">NIT</label>
                <input name="nit" className="input-field" value={form.nit} onChange={onChange} placeholder="Ej: 123456789012" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Propietario</label>
                <input name="propietario" className="input-field" value={form.propietario} onChange={onChange} placeholder="Ej: Juan Pérez" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Teléfono</label>
                <input name="telefono" className="input-field" value={form.telefono} onChange={onChange} placeholder="Ej: +591 70000000" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Email</label>
                <input name="email" type="email" className="input-field" value={form.email} onChange={onChange} placeholder="contacto@granja.com" />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: Identidad Visual */}
          <div>
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 flex items-center justify-center text-xs font-black">3</span>
              Identidad Visual
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ImageUploader
                label="Logo de la Granja"
                type="logo"
                initialPreview={form.logoUrl}
                onChange={({ file, url }) => setForm({ ...form, logo: file, logoUrl: url })}
              />
              <ImageUploader
                label="Imagen Hero (Fondo)"
                type="hero"
                initialPreview={form.imagenHeroUrl}
                onChange={({ file, url }) => setForm({ ...form, imagenHero: file, imagenHeroUrl: url })}
              />
            </div>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-4 rounded-xl border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={subiendo}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={subiendo}>
              {subiendo ? "Guardando..." : granjaEditando ? "Actualizar Granja" : "Crear Granja"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}