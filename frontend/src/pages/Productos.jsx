import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { Package, Search, Edit2, Egg, Bird, Wheat, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import Modal from "../components/Modal";

// 1. QUERY PARA TRAER LOS PRODUCTOS DE LA GRANJA ACTIVA
// Usamos la granja activa del contexto (si no, el backend devuelve todos si es superadmin)
const PRODUCTOS_QUERY = gql`
  query GetProductos {
    productos(soloActivos: false) {
      id
      nombre
      tipo
      presentacion
      calidad
      unidadMedida
      precioUnitario
      stock
      stockMinimo
      activo
    }
  }
`;

// 2. MUTACIÓN PARA ACTUALIZAR (Precio, Stock, Activo)
const ACTUALIZAR_PRODUCTO = gql`
  mutation ActualizarProducto(
    $id: ID!
    $precioUnitario: Decimal
    $stock: Decimal
    $stockMinimo: Decimal
    $activo: Boolean
  ) {
    actualizarProducto(
      id: $id
      precioUnitario: $precioUnitario
      stock: $stock
      stockMinimo: $stockMinimo
      activo: $activo
    ) {
      id
      nombre
      precioUnitario
      stock
      activo
    }
  }
`;

// Mapa de iconos por tipo de producto
const TIPO_ICONO = {
  huevo: Egg,
  abono: Wheat,
  ave: Bird,
};

const TIPO_LABEL = {
  huevo: "Huevos",
  abono: "Abono",
  ave: "Aves",
};

export default function Productos() {
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ precioUnitario: "", stock: "", stockMinimo: "", activo: true });
  const [error, setError] = useState("");

  // Queries y Mutaciones
  const { data, loading, refetch } = useQuery(PRODUCTOS_QUERY, { fetchPolicy: "network-only" });
  const [actualizarProducto, { loading: actualizando }] = useMutation(ACTUALIZAR_PRODUCTO);

  const productos = data?.productos || [];

  // Lógica de Filtrado
  const productosFiltrados = productos.filter((p) => {
    const coincideTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideTipo = filtroTipo ? p.tipo === filtroTipo : true;
    return coincideTexto && coincideTipo;
  });

  // Contadores por tipo (para mostrar en la parte superior)
  const totalHuevos = productos.filter(p => p.tipo === "huevo").length;
  const totalAbono = productos.filter(p => p.tipo === "abono").length;
  const totalAves = productos.filter(p => p.tipo === "ave").length;

  const abrirEditar = (prod) => {
    setEditando(prod);
    setForm({
      precioUnitario: prod.precioUnitario,
      stock: prod.stock,
      stockMinimo: prod.stockMinimo,
      activo: prod.activo,
    });
    setError("");
    setModalOpen(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await actualizarProducto({
        variables: {
          id: editando.id,
          precioUnitario: parseFloat(form.precioUnitario),
          stock: parseFloat(form.stock),
          stockMinimo: parseFloat(form.stockMinimo),
          activo: form.activo,
        },
      });
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-[var(--accent)]" /> Catálogo de Productos
          </h1>
          <p className="text-[var(--text-secondary)] text-base mt-1 font-medium">
            Stock real de tu granja. Lo que actives aquí se verá en la tienda pública.
          </p>
        </div>
      </div>

      {/* TARJETAS DE RESUMEN (Contadores rápidos) */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600"><Egg className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Huevos</p>
            <p className="text-2xl font-black text-[var(--text-primary)]">{totalHuevos}</p>
          </div>
        </div>
        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-xl text-green-600"><Wheat className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Abono</p>
            <p className="text-2xl font-black text-[var(--text-primary)]">{totalAbono}</p>
          </div>
        </div>
        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600"><Bird className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Aves</p>
            <p className="text-2xl font-black text-[var(--text-primary)]">{totalAves}</p>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block uppercase tracking-wider">Buscar Producto</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Nombre del producto..."
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full lg:w-56">
          <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block uppercase tracking-wider">Tipo de Producto</label>
          <select
            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] cursor-pointer"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            <option value="huevo">Huevos</option>
            <option value="abono">Abono</option>
            <option value="ave">Aves</option>
          </select>
        </div>
      </div>

      {/* TABLA DE PRODUCTOS */}
      {loading ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">Cargando catálogo...</div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-[var(--bg-main)] text-[var(--text-secondary)] text-sm uppercase tracking-wider">
                <tr>
                  <th className="text-left p-4 font-bold">Producto</th>
                  <th className="text-left p-4 font-bold">Tipo</th>
                  <th className="text-left p-4 font-bold">Precio</th>
                  <th className="text-left p-4 font-bold">Stock</th>
                  <th className="text-left p-4 font-bold">Estado</th>
                  <th className="text-right p-4 font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[var(--text-secondary)]">
                      No se encontraron productos. Asegúrate de haber registrado producción.
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((p) => {
                    const Icono = TIPO_ICONO[p.tipo] || Package;
                    const tipoLabel = TIPO_LABEL[p.tipo] || p.tipo;
                    const stockBajo = p.stock <= p.stockMinimo;

                    return (
                      <tr key={p.id} className="border-t border-[var(--border-color)] hover:bg-[var(--bg-main)] transition-colors">
                        <td className="p-4 font-bold text-[var(--text-primary)]">
                          {p.nombre}
                          <span className="block text-xs text-[var(--text-secondary)] font-normal">
                            {p.presentacion} — {p.calidad}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider bg-[var(--bg-main)] px-2 py-1 rounded-md w-fit gap-1">
                            <Icono className="w-3.5 h-3.5" />
                            {tipoLabel}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-[var(--text-primary)]">
                          Bs. {Number(p.precioUnitario).toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span className={`font-bold flex items-center gap-1 ${stockBajo ? 'text-red-500' : 'text-green-600'}`}>
                            {p.stock} {p.unidadMedida}
                            {stockBajo && <AlertTriangle className="w-4 h-4" />}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md w-fit ${
                            p.activo 
                              ? "bg-green-500/10 text-green-600" 
                              : "bg-gray-500/10 text-gray-500"
                          }`}>
                            {p.activo ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {p.activo ? "En tienda" : "Oculto"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => abrirEditar(p)}
                            className="text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-main)] p-2 rounded-lg transition-colors"
                            title="Editar Precio/Stock"
                          >
                            <Edit2 className="w-4 h-4" />
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

      {/* MODAL DE EDICIÓN */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Actualizar Producto">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="bg-[var(--bg-main)] p-3 rounded-lg mb-4 border border-[var(--border-color)]">
             <p className="text-sm font-bold text-[var(--text-primary)]">{editando?.nombre}</p>
             <p className="text-xs text-[var(--text-secondary)]">
               Tipo: {TIPO_LABEL[editando?.tipo] || editando?.tipo} | Medida: {editando?.unidadMedida}
             </p>
          </div>
          <div>
            <label className="text-sm font-bold text-[var(--text-secondary)] mb-1 block">Precio Unitario (Bs.)</label>
            <input
              type="number" step="0.01"
              className="input-field"
              value={form.precioUnitario}
              onChange={(e) => setForm({ ...form, precioUnitario: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold text-[var(--text-secondary)] mb-1 block">Stock Actual ({editando?.unidadMedida})</label>
            <input
              type="number" step="0.01"
              className="input-field"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold text-[var(--text-secondary)] mb-1 block">Stock Mínimo (Alerta)</label>
            <input
              type="number" step="0.01"
              className="input-field"
              value={form.stockMinimo}
              onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2 pt-2 bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border-color)]">
            <input
              type="checkbox"
              id="activo"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="w-5 h-5 text-[var(--accent)] rounded focus:ring-[var(--accent)] cursor-pointer"
            />
            <label htmlFor="activo" className="text-sm font-bold text-[var(--text-primary)] cursor-pointer select-none">
              Mostrar en la tienda pública
            </label>
          </div>
          {error && <div className="bg-red-500/10 text-red-500 p-2 rounded text-sm">{error}</div>}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={actualizando} className="btn-primary">
              {actualizando ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}