import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Truck, Plus, Mail, Phone } from "lucide-react";
import { PROVEEDORES_QUERY, CREAR_PROVEEDOR } from "../graphql/proveedores";
import Modal from "../components/Modal";

const FORM_VACIO = { nombre: "", telefono: "", email: "", contacto: "" };

export default function Proveedores() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");

  const { data, loading, error: qError, refetch } = useQuery(PROVEEDORES_QUERY, { fetchPolicy: "network-only" });
  const [crearProveedor, { loading: creando }] = useMutation(CREAR_PROVEEDOR);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await crearProveedor({
        variables: {
          nombre: form.nombre,
          telefono: form.telefono || null,
          email: form.email || null,
        },
      });
      setModalOpen(false);
      setForm(FORM_VACIO);
      refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const proveedores = data?.proveedores ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
            <Truck className="w-8 h-8 text-brand-500" /> Proveedores
          </h1>
          <p className="text-gray-500 text-base mt-1 font-medium">Gestión de proveedores de insumos</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus className="w-5 h-5" /> Nuevo proveedor
        </button>
      </div>

      {qError && <div className="card bg-red-50 text-red-700 p-4">{qError.message}</div>}

      {loading ? (
        <div className="card text-center py-12 text-gray-500">Cargando proveedores...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proveedores.map((p) => (
            <div key={p.id} className="card relative">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-black text-lg">
                  {p.nombre.charAt(0)}
                </div>
                <span className={p.activo ? "badge-success" : "badge-danger"}>{p.activo ? "Activo" : "Inactivo"}</span>
              </div>
              <h3 className="text-xl font-black text-dark">{p.nombre}</h3>
              <div className="space-y-1 text-sm text-gray-600 mt-3">
                {p.telefono && <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> {p.telefono}</p>}
                {p.email && <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> {p.email}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo proveedor">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Nombre *</label>
            <input name="nombre" className="input-field" value={form.nombre} onChange={onChange} required />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Teléfono</label>
            <input name="telefono" className="input-field" value={form.telefono} onChange={onChange} />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Email</label>
            <input name="email" type="email" className="input-field" value={form.email} onChange={onChange} />
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={creando} className="btn-primary">{creando ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}