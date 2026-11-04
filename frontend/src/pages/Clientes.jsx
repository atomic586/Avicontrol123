import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Search, Plus, Pencil, Trash2, Users } from "lucide-react";
import {
  CLIENTES_QUERY,
  CREAR_CLIENTE,
  ACTUALIZAR_CLIENTE,
  ELIMINAR_CLIENTE,
} from "../graphql/clientes";
import Modal from "../components/Modal";

const FORM_VACIO = {
  nombres: "",
  apellidos: "",
  dni: "",
  telefono: "",
  email: "",
  direccion: "",
};

export default function Clientes() {
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");

  const { data, loading, error: qError, refetch } = useQuery(CLIENTES_QUERY, {
    variables: { busqueda: busqueda || null },
    fetchPolicy: "network-only",
  });

  const [crearCliente, { loading: creando }] = useMutation(CREAR_CLIENTE);
  const [actualizarCliente, { loading: actualizando }] = useMutation(ACTUALIZAR_CLIENTE);
  const [eliminarCliente] = useMutation(ELIMINAR_CLIENTE);

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setError("");
    setModalOpen(true);
  };

  const abrirEditar = (c) => {
    setEditando(c);
    setForm({
      nombres: c.nombres,
      apellidos: c.apellidos,
      dni: c.dni,
      telefono: c.telefono,
      email: c.email || "",
      direccion: c.direccion || "",
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
        await actualizarCliente({
          variables: {
            id: editando.id,
            nombres: form.nombres,
            apellidos: form.apellidos,
            telefono: form.telefono,
            email: form.email || null,
            direccion: form.direccion,
          },
        });
      } else {
        await crearCliente({
          variables: {
            nombres: form.nombres,
            apellidos: form.apellidos,
            dni: form.dni,
            telefono: form.telefono,
            email: form.email || null,
            direccion: form.direccion,
          },
        });
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const onEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este cliente?")) return;
    try {
      await eliminarCliente({ variables: { id } });
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-brand-500" /> Clientes
          </h1>
          <p className="text-gray-500 text-base mt-1 font-medium">
            Compradores de huevos registrados en AVICONTROL
          </p>
        </div>
        <button onClick={abrirCrear} className="btn-primary">
          <Plus className="w-5 h-5" /> Nuevo cliente
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="input-field pl-12"
            placeholder="Buscar por nombre, DNI o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {qError && (
        <div className="card bg-red-50 border-red-100 text-red-700 font-bold">
          Error: {qError.message}
        </div>
      )}

      {loading ? (
        <div className="card text-center py-12 text-gray-500 font-medium">
          Cargando clientes...
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-brand-50 text-brand-800 text-sm uppercase tracking-wider">
                <tr>
                  <th className="text-left p-4 font-bold">DNI</th>
                  <th className="text-left p-4 font-bold">Nombres</th>
                  <th className="text-left p-4 font-bold">Apellidos</th>
                  <th className="text-left p-4 font-bold">Teléfono</th>
                  <th className="text-left p-4 font-bold">Email</th>
                  <th className="text-right p-4 font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(data?.clientes ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">
                      No hay clientes registrados.
                    </td>
                  </tr>
                ) : (
                  data.clientes.map((c) => (
                    <tr key={c.id} className="border-t border-gray-100 hover:bg-brand-50/30 transition-colors">
                      <td className="p-4 font-bold text-dark">{c.dni}</td>
                      <td className="p-4 text-gray-700">{c.nombres}</td>
                      <td className="p-4 text-gray-700">{c.apellidos}</td>
                      <td className="p-4 text-gray-700">{c.telefono}</td>
                      <td className="p-4 text-gray-500">{c.email || "—"}</td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => abrirEditar(c)}
                          className="text-brand-700 hover:text-brand-900 hover:bg-brand-50 p-2 rounded-lg transition-colors mr-1"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEliminar(c.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={cerrar}
        title={editando ? "Editar cliente" : "Nuevo cliente"}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Nombres *</label>
              <input name="nombres" className="input-field" value={form.nombres} onChange={onChange} required />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Apellidos *</label>
              <input name="apellidos" className="input-field" value={form.apellidos} onChange={onChange} required />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">DNI *</label>
              <input
                name="dni"
                className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={form.dni}
                onChange={onChange}
                required
                disabled={!!editando}
                placeholder="Solo dígitos (6-15)"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Teléfono *</label>
              <input name="telefono" className="input-field" value={form.telefono} onChange={onChange} required />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-bold text-gray-700 mb-1 block">Email</label>
              <input name="email" type="email" className="input-field" value={form.email} onChange={onChange} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-bold text-gray-700 mb-1 block">Dirección</label>
              <input name="direccion" className="input-field" value={form.direccion} onChange={onChange} />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 font-medium">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={cerrar} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={creando || actualizando} className="btn-primary">
              {creando || actualizando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}