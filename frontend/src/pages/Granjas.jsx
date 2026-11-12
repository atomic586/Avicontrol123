import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Building2, Plus, Pencil, MapPin, Phone, Mail } from "lucide-react";
import {
  GRANJAS_QUERY,
  CREAR_GRANJA,
  ACTUALIZAR_GRANJA,
} from "../graphql/granjas";
import Modal from "../components/Modal";

const FORM_VACIO = {
  nombre: "",
  codigo: "",
  ubicacion: "",
  telefono: "",
  email: "",
};

export default function Granjas() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");

  const { data, loading, error: qError, refetch } = useQuery(GRANJAS_QUERY, {
    fetchPolicy: "network-only",
  });

  const [crearGranja, { loading: creando }] = useMutation(CREAR_GRANJA);
  const [actualizarGranja, { loading: actualizando }] = useMutation(ACTUALIZAR_GRANJA);

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setError("");
    setModalOpen(true);
  };

  const abrirEditar = (g) => {
    setEditando(g);
    setForm({
      nombre: g.nombre,
      codigo: g.codigo,
      ubicacion: g.ubicacion,
      telefono: g.telefono || "",
      email: g.email || "",
    });
    setError("");
    setModalOpen(true);
  };

  const cerrar = () => setModalOpen(false);
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editando) {
        await actualizarGranja({
          variables: {
            id: editando.id,
            nombre: form.nombre,
            ubicacion: form.ubicacion,
            telefono: form.telefono,
            email: form.email,
          },
        });
      } else {
        await crearGranja({
          variables: {
            nombre: form.nombre,
            codigo: form.codigo,
            ubicacion: form.ubicacion,
            telefono: form.telefono,
            email: form.email,
          },
        });
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const granjas = data?.granjas ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-brand-500" /> Granjas
          </h1>
          <p className="text-gray-500 text-base mt-1 font-medium">
            Administra todas las granjas de la plataforma
          </p>
        </div>
        <button onClick={abrirCrear} className="btn-primary">
          <Plus className="w-5 h-5" /> Nueva granja
        </button>
      </div>

      {qError && (
        <div className="card bg-red-50 border-red-100 text-red-700 font-bold">
          {qError.message}
        </div>
      )}

      {loading ? (
        <div className="card text-center py-12 text-gray-500">Cargando granjas...</div>
      ) : granjas.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          No hay granjas registradas.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {granjas.map((g) => (
            <div key={g.id} className="card relative">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-black text-lg">
                  {g.codigo.slice(0, 3)}
                </div>
                <span className={g.activo ? "badge-success" : "badge-danger"}>
                  {g.activo ? "Activa" : "Suspendida"}
                </span>
              </div>
              <h3 className="text-xl font-black text-dark">{g.nombre}</h3>
              <p className="text-sm text-gray-500 font-bold mb-3">Código: {g.codigo}</p>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" /> {g.ubicacion}
                </p>
                {g.telefono && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" /> {g.telefono}
                  </p>
                )}
                {g.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" /> {g.email}
                  </p>
                )}
              </div>
              <button
                onClick={() => abrirEditar(g)}
                className="mt-4 w-full btn-secondary text-sm"
              >
                <Pencil className="w-4 h-4" /> Editar
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={cerrar} title={editando ? "Editar granja" : "Nueva granja"}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Nombre *</label>
            <input name="nombre" className="input-field" value={form.nombre} onChange={onChange} required />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Código *</label>
            <input
              name="codigo"
              className="input-field disabled:bg-gray-100"
              value={form.codigo}
              onChange={onChange}
              required
              disabled={!!editando}
              placeholder="Ej: GLP-001"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Ubicación *</label>
            <input name="ubicacion" className="input-field" value={form.ubicacion} onChange={onChange} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Teléfono</label>
              <input name="telefono" className="input-field" value={form.telefono} onChange={onChange} />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Email</label>
              <input name="email" type="email" className="input-field" value={form.email} onChange={onChange} />
            </div>
          </div>
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={cerrar} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={creando || actualizando} className="btn-primary">
              {creando || actualizando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}