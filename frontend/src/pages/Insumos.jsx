import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Package, Plus, Pencil, Trash2, AlertTriangle, Clock, Filter } from "lucide-react";
import {
  INSUMOS_QUERY,
  CREAR_INSUMO,
  ACTUALIZAR_INSUMO,
  ELIMINAR_INSUMO,
} from "../graphql/insumos";
import Modal from "../components/Modal";

const FORM_VACIO = {
  nombre: "",
  tipo: "alimento",
  presentacion: "",
  stock: "",
  stockMinimo: "",
  precioUnitario: "",
  fechaVencimiento: "",
};

const TIPOS = [
  { value: "alimento", label: "Alimento" },
  { value: "vacuna", label: "Vacuna" },
  { value: "vitamina", label: "Vitamina" },
  { value: "medicamento", label: "Medicamento" },
  { value: "otro", label: "Otro" },
];

const TIPO_COLOR = {
  alimento: "badge-warning",
  vacuna: "badge-info",
  vitamina: "badge-success",
  medicamento: "badge-danger",
  otro: "badge-info",
};

export default function Insumos() {
  const [filtro, setFiltro] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");

  const { data, loading, error: qError, refetch } = useQuery(INSUMOS_QUERY, {
    fetchPolicy: "network-only",
  });

  const [crearInsumo, { loading: creando }] = useMutation(CREAR_INSUMO);
  const [actualizarInsumo, { loading: actualizando }] = useMutation(ACTUALIZAR_INSUMO);
  const [eliminarInsumo] = useMutation(ELIMINAR_INSUMO);

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setError("");
    setModalOpen(true);
  };

  const abrirEditar = (i) => {
    setEditando(i);
    setForm({
      nombre: i.nombre,
      tipo: i.tipo,
      presentacion: i.presentacion,
      stock: i.stock,
      stockMinimo: i.stockMinimo,
      precioUnitario: i.precioUnitario,
      fechaVencimiento: i.fechaVencimiento || "",
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
        await actualizarInsumo({
          variables: {
            id: editando.id,
            nombre: form.nombre,
            tipo: form.tipo,
            presentacion: form.presentacion,
            stock: parseFloat(form.stock),
            stockMinimo: parseFloat(form.stockMinimo),
            precioUnitario: parseFloat(form.precioUnitario),
            fechaVencimiento: form.fechaVencimiento || null,
          },
        });
      } else {
        await crearInsumo({
          variables: {
            nombre: form.nombre,
            tipo: form.tipo,
            presentacion: form.presentacion,
            stock: parseFloat(form.stock),
            stockMinimo: parseFloat(form.stockMinimo),
            precioUnitario: parseFloat(form.precioUnitario),
            fechaVencimiento: form.fechaVencimiento || null,
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
    if (!window.confirm("¿Eliminar este insumo?")) return;
    try {
      await eliminarInsumo({ variables: { id } });
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  const insumos = data?.insumos ?? [];
  const hoy = new Date();
  const proximos30 = insumos.filter((i) => {
    if (!i.fechaVencimiento) return false;
    const diff = (new Date(i.fechaVencimiento) - hoy) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });
  const stockBajo = insumos.filter((i) => parseFloat(i.stock) <= parseFloat(i.stockMinimo));

  const insumosFiltrados =
    filtro === "stock-bajo" ? stockBajo : filtro === "por-vencer" ? proximos30 : insumos;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-brand-500" /> Insumos
          </h1>
          <p className="text-gray-500 text-base mt-1 font-medium">
            Inventario de alimento, vacunas, vitaminas y medicamentos
          </p>
        </div>
        <button onClick={abrirCrear} className="btn-primary">
          <Plus className="w-5 h-5" /> Nuevo insumo
        </button>
      </div>

      {qError && (
        <div className="card bg-red-50 border-red-200 text-red-700 p-4">
          <p className="font-bold mb-1">Error al cargar insumos:</p>
          <p className="text-sm font-mono bg-white p-2 rounded border border-red-200">{qError.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total insumos</p>
          <p className="text-3xl font-black text-dark mt-1">{insumos.length}</p>
        </div>
        <div className="card bg-red-50 border-red-100">
          <p className="text-sm font-bold text-red-700 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Stock bajo
          </p>
          <p className="text-3xl font-black text-red-700 mt-1">{stockBajo.length}</p>
        </div>
        <div className="card bg-brand-50 border-brand-100">
          <p className="text-sm font-bold text-brand-700 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4" /> Por vencer (30 días)
          </p>
          <p className="text-3xl font-black text-brand-700 mt-1">{proximos30.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFiltro("todos")}
          className={"px-4 py-2 rounded-xl font-bold text-sm transition-colors " + (filtro === "todos" ? "bg-brand-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50")}
        >
          <Filter className="w-4 h-4 inline mr-1" /> Todos ({insumos.length})
        </button>
        <button
          onClick={() => setFiltro("stock-bajo")}
          className={"px-4 py-2 rounded-xl font-bold text-sm transition-colors " + (filtro === "stock-bajo" ? "bg-red-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50")}
        >
          <AlertTriangle className="w-4 h-4 inline mr-1" /> Stock bajo ({stockBajo.length})
        </button>
        <button
          onClick={() => setFiltro("por-vencer")}
          className={"px-4 py-2 rounded-xl font-bold text-sm transition-colors " + (filtro === "por-vencer" ? "bg-brand-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50")}
        >
          <Clock className="w-4 h-4 inline mr-1" /> Por vencer ({proximos30.length})
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-gray-500 font-medium">Cargando insumos...</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-brand-50 text-brand-800 text-sm uppercase tracking-wider">
                <tr>
                  <th className="text-left p-4 font-bold">Nombre</th>
                  <th className="text-left p-4 font-bold">Tipo</th>
                  <th className="text-left p-4 font-bold">Presentación</th>
                  <th className="text-right p-4 font-bold">Stock</th>
                  <th className="text-right p-4 font-bold">Mín.</th>
                  <th className="text-left p-4 font-bold">Vencimiento</th>
                  <th className="text-right p-4 font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {insumosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500 font-medium">
                      No hay insumos con este filtro.
                    </td>
                  </tr>
                ) : (
                  insumosFiltrados.map((i) => {
                    const stockNum = parseFloat(i.stock);
                    const minNum = parseFloat(i.stockMinimo);
                    const bajo = stockNum <= minNum;
                    return (
                      <tr key={i.id} className="border-t border-gray-100 hover:bg-brand-50/30 transition-colors">
                        <td className="p-4 font-bold text-dark">{i.nombre}</td>
                        <td className="p-4">
                          <span className={TIPO_COLOR[i.tipo] || "badge-info"}>{i.tipo}</span>
                        </td>
                        <td className="p-4 text-gray-600">{i.presentacion || "—"}</td>
                        <td className={"p-4 text-right font-bold " + (bajo ? "text-red-600" : "text-gray-800")}>
                          {parseFloat(i.stock).toFixed(2)}
                        </td>
                        <td className="p-4 text-right text-gray-500">{parseFloat(i.stockMinimo).toFixed(2)}</td>
                        <td className="p-4 text-gray-600">
                          {i.fechaVencimiento ? new Date(i.fechaVencimiento).toLocaleDateString("es-BO") : "—"}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => abrirEditar(i)}
                            className="text-brand-700 hover:text-brand-900 hover:bg-brand-50 p-2 rounded-lg transition-colors mr-1"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEliminar(i.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={cerrar} title={editando ? "Editar insumo" : "Nuevo insumo"}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-bold text-gray-700 mb-1 block">Nombre *</label>
              <input name="nombre" className="input-field" value={form.nombre} onChange={onChange} required />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Tipo *</label>
              <select name="tipo" className="input-field" value={form.tipo} onChange={onChange}>
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Presentación</label>
              <input name="presentacion" className="input-field" value={form.presentacion} onChange={onChange} placeholder="Ej: Saco 40 kg" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Stock actual *</label>
              <input type="number" step="0.01" name="stock" className="input-field" value={form.stock} onChange={onChange} required />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Stock mínimo *</label>
              <input type="number" step="0.01" name="stockMinimo" className="input-field" value={form.stockMinimo} onChange={onChange} required />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Precio unitario (Bs) *</label>
              <input type="number" step="0.01" name="precioUnitario" className="input-field" value={form.precioUnitario} onChange={onChange} required />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Fecha de vencimiento</label>
              <input type="date" name="fechaVencimiento" className="input-field" value={form.fechaVencimiento} onChange={onChange} />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 font-medium">
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