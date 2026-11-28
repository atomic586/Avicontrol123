import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import {
  Package, Search, Plus, Edit2, Trash2, Eye, EyeOff,
  Egg, Bird, Wheat, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight
} from "lucide-react";
import Modal from "../components/Modal";

// --- QUERIES Y MUTACIONES ---
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
      imagenUrl
    }
  }
`;

const CREAR_PRODUCTO = gql`
  mutation CrearProducto(
    $nombre: String!
    $tipo: String!
    $presentacion: String!
    $calidad: String!
    $precioUnitario: Decimal!
    $stock: Decimal!
    $stockMinimo: Decimal!
    $unidadMedida: String!
    $imagen: Upload
  ) {
    crearProducto(
      nombre: $nombre
      tipo: $tipo
      presentacion: $presentacion
      calidad: $calidad
      precioUnitario: $precioUnitario
      stock: $stock
      stockMinimo: $stockMinimo
      unidadMedida: $unidadMedida
      imagen: $imagen
    ) {
      id
      nombre
    }
  }
`;

const ACTUALIZAR_PRODUCTO = gql`
  mutation ActualizarProducto(
    $id: ID!
    $precioUnitario: Decimal
    $stock: Decimal
    $stockMinimo: Decimal
    $activo: Boolean
    $imagen: Upload
  ) {
    actualizarProducto(
      id: $id
      precioUnitario: $precioUnitario
      stock: $stock
      stockMinimo: $stockMinimo
      activo: $activo
      imagen: $imagen
    ) {
      id
      nombre
    }
  }
`;

const ELIMINAR_PRODUCTO = gql`
  mutation EliminarProducto($id: ID!) {
    eliminarProducto(id: $id)
  }
`;

// --- CONFIGURACIÓN VISUAL POR TIPO ---
const TIPO_CONFIG = {
  huevo: { icon: Egg, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Huevos" },
  abono: { icon: Wheat, color: "text-green-500", bg: "bg-green-500/10", label: "Abono" },
  ave: { icon: Bird, color: "text-blue-500", bg: "bg-blue-500/10", label: "Aves" },
};

export default function Productos() {
  // --- ESTADOS ---
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState("");

  // Estado del formulario
  const [form, setForm] = useState({
    nombre: "",
    tipo: "huevo",
    presentacion: "",
    calidad: "primera",
    precioUnitario: "",
    stock: "",
    stockMinimo: "",
    unidadMedida: "unidad",
    activo: true,
    imagen: null,
    imagenPreview: null,
  });

  // --- QUERIES Y MUTACIONES ---
  const { data, loading, refetch } = useQuery(PRODUCTOS_QUERY, { fetchPolicy: "network-only" });
  const [crearProducto, { loading: creando }] = useMutation(CREAR_PRODUCTO);
  const [actualizarProducto, { loading: actualizando }] = useMutation(ACTUALIZAR_PRODUCTO);
  const [eliminarProducto] = useMutation(ELIMINAR_PRODUCTO);

  const productos = data?.productos || [];

  // --- LÓGICA DE FILTRADO ---
  const productosFiltrados = productos.filter((p) => {
    const coincideTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideTipo = filtroTipo ? p.tipo === filtroTipo : true;
    const coincideEstado = filtroEstado === "activo" ? p.activo : filtroEstado === "inactivo" ? !p.activo : true;
    return coincideTexto && coincideTipo && coincideEstado;
  });

  // --- CONTADORES ---
  const totalHuevos = productos.filter(p => p.tipo === "huevo").length;
  const totalAbono = productos.filter(p => p.tipo === "abono").length;
  const totalAves = productos.filter(p => p.tipo === "ave").length;

  // --- MANEJO DEL FORMULARIO ---
  const abrirCrear = () => {
    setEditando(null);
    setForm({
      nombre: "", tipo: "huevo", presentacion: "", calidad: "primera",
      precioUnitario: "", stock: "", stockMinimo: "", unidadMedida: "unidad",
      activo: true, imagen: null, imagenPreview: null,
    });
    setError("");
    setModalOpen(true);
  };

  const abrirEditar = (prod) => {
    setEditando(prod);
    setForm({
      nombre: prod.nombre,
      tipo: prod.tipo,
      presentacion: prod.presentacion,
      calidad: prod.calidad,
      precioUnitario: prod.precioUnitario,
      stock: prod.stock,
      stockMinimo: prod.stockMinimo,
      unidadMedida: prod.unidadMedida,
      activo: prod.activo,
      imagen: null,
      imagenPreview: prod.imagenUrl,
    });
    setError("");
    setModalOpen(true);
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({
        ...form,
        imagen: file,
        imagenPreview: URL.createObjectURL(file)
      });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await actualizarProducto({
          variables: {
            id: editando.id,
            precioUnitario: parseFloat(form.precioUnitario),
            stock: parseFloat(form.stock),
            stockMinimo: parseFloat(form.stockMinimo),
            activo: form.activo,
            imagen: form.imagen,
          },
        });
      } else {
        await crearProducto({
          variables: {
            nombre: form.nombre,
            tipo: form.tipo,
            presentacion: form.presentacion,
            calidad: form.calidad,
            precioUnitario: parseFloat(form.precioUnitario),
            stock: parseFloat(form.stock),
            stockMinimo: parseFloat(form.stockMinimo),
            unidadMedida: form.unidadMedida,
            imagen: form.imagen,
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
    if (!window.confirm("¿Eliminar este producto permanentemente?")) return;
    try {
      await eliminarProducto({ variables: { id } });
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- RENDERIZADO ---
  return (
    <div className="space-y-6 pb-10">

      {/* HEADER CON IMAGEN */}
      <div className="relative overflow-hidden rounded-3xl bg-[var(--bg-sidebar)] p-8 shadow-lg">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=1000')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-4 bg-[var(--accent)] rounded-2xl shadow-lg">
            <Package className="w-10 h-10 text-black" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Catálogo de Productos</h1>
            <p className="text-white/80 text-lg mt-1">Gestiona y ofrece tus productos avícolas con facilidad</p>
          </div>
        </div>
      </div>

      {/* TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { tipo: "huevo", count: totalHuevos, icon: Egg, color: "text-yellow-500", bg: "bg-yellow-500/10", trend: "+12%" },
          { tipo: "abono", count: totalAbono, icon: Wheat, color: "text-green-500", bg: "bg-green-500/10", trend: "+0%" },
          { tipo: "ave", count: totalAves, icon: Bird, color: "text-blue-500", bg: "bg-blue-500/10", trend: "+0%" },
        ].map((card) => (
          <div key={card.tipo} className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                <card.icon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">{TIPO_CONFIG[card.tipo].label}</p>
                <h3 className="text-3xl font-black text-[var(--text-primary)]">{card.count}</h3>
                <p className="text-xs font-bold text-green-500 mt-1">↑ {card.trend} vs mes anterior</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FILTROS Y BOTÓN NUEVO */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Buscar producto por nombre..."
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <select
            className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] cursor-pointer"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            <option value="huevo">Huevos</option>
            <option value="abono">Abono</option>
            <option value="ave">Aves</option>
          </select>
          <select
            className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] cursor-pointer"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="activo">En tienda</option>
            <option value="inactivo">Oculto</option>
          </select>
        </div>

        <button onClick={abrirCrear} className="w-full lg:w-auto flex items-center justify-center gap-2 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-text)] font-black px-6 py-2.5 rounded-xl transition-all shadow-md">
          <Plus className="w-5 h-5" /> Nuevo Producto
        </button>
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
                      No se encontraron productos. ¡Crea el primero!
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((p) => {
                    const config = TIPO_CONFIG[p.tipo] || TIPO_CONFIG.huevo;
                    const Icono = config.icon;
                    const stockBajo = p.stock <= p.stockMinimo;
                    const porcentajeStock = Math.min(100, (p.stock / (p.stockMinimo * 10)) * 100);

                    return (
                      <tr key={p.id} className="border-t border-[var(--border-color)] hover:bg-[var(--bg-main)] transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] overflow-hidden flex-shrink-0">
                              {p.imagenUrl ? (
                                <img src={p.imagenUrl} alt={p.nombre} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)]">
                                  <Icono className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-[var(--text-primary)]">{p.nombre}</p>
                              <p className="text-xs text-[var(--text-secondary)] font-normal line-clamp-1">{p.presentacion}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color}`}>
                            <Icono className="w-3.5 h-3.5" />
                            {config.label}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-[var(--text-primary)]">Bs. {Number(p.precioUnitario).toFixed(2)}</td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className={`font-bold flex items-center gap-1 ${stockBajo ? 'text-red-500' : 'text-green-600'}`}>
                              {p.stock} {p.unidadMedida}
                              {stockBajo && <AlertTriangle className="w-4 h-4" />}
                            </span>
                            <div className="w-full h-1.5 bg-[var(--bg-main)] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${stockBajo ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${porcentajeStock}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                            p.activo ? "bg-green-500/10 text-green-600" : "bg-gray-500/10 text-gray-500"
                          }`}>
                            {p.activo ? <CheckCircle2 className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            {p.activo ? "En tienda" : "Oculto"}
                          </span>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap opacity-50 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-2 text-[var(--text-secondary)] hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Ver">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => abrirEditar(p)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-colors" title="Editar">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => onEliminar(p.id)} className="p-2 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN */}
          <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between text-sm text-[var(--text-secondary)]">
            <span>Mostrando {productosFiltrados.length} productos</span>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-main)] disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              <button className="w-8 h-8 rounded-lg bg-[var(--accent)] text-[var(--accent-text)] font-bold">1</button>
              <button className="p-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-main)] disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CREAR/EDITAR */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editando ? "Editar Producto" : "Nuevo Producto"}>
        <form onSubmit={onSubmit} className="space-y-4">

          {/* Subida de Imagen */}
          <div className="flex flex-col items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-[var(--border-color)] border-dashed rounded-2xl cursor-pointer bg-[var(--bg-main)] hover:bg-[var(--bg-secondary)] transition-colors relative overflow-hidden">
              {form.imagenPreview ? (
                <img src={form.imagenPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Package className="w-8 h-8 mb-2 text-[var(--text-secondary)]" />
                  <p className="text-sm text-[var(--text-secondary)] font-bold">Subir imagen del producto</p>
                  <p className="text-xs text-[var(--text-secondary)]">PNG, JPG o WEBP</p>
                </div>
              )}
              <input id="dropzone-file" type="file" accept="image/*" className="hidden" onChange={handleImagenChange} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-bold text-[var(--text-secondary)] mb-1 block">Nombre del Producto *</label>
              <input required type="text" className="input-field" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-bold text-[var(--text-secondary)] mb-1 block">Tipo *</label>
              <select className="input-field" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="huevo">Huevo</option>
                <option value="abono">Abono</option>
                <option value="ave">Ave</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-[var(--text-secondary)] mb-1 block">Calidad</label>
              <input type="text" className="input-field" value={form.calidad} onChange={(e) => setForm({ ...form, calidad: e.target.value })} placeholder="Ej: Primera" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-bold text-[var(--text-secondary)] mb-1 block">Descripción / Presentación</label>
              <input type="text" className="input-field" value={form.presentacion} onChange={(e) => setForm({ ...form, presentacion: e.target.value })} placeholder="Ej: Abono orgánico de alta calidad" />
            </div>
            <div>
              <label className="text-sm font-bold text-[var(--text-secondary)] mb-1 block">Precio (Bs.) *</label>
              <input required type="number" step="0.01" className="input-field" value={form.precioUnitario} onChange={(e) => setForm({ ...form, precioUnitario: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-bold text-[var(--text-secondary)] mb-1 block">Unidad de Medida *</label>
              <input required type="text" className="input-field" value={form.unidadMedida} onChange={(e) => setForm({ ...form, unidadMedida: e.target.value })} placeholder="Ej: unidad, kg, caja" />
            </div>
            <div>
              <label className="text-sm font-bold text-[var(--text-secondary)] mb-1 block">Stock Actual *</label>
              <input required type="number" step="0.01" className="input-field" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-bold text-[var(--text-secondary)] mb-1 block">Stock Mínimo</label>
              <input type="number" step="0.01" className="input-field" value={form.stockMinimo} onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })} />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border-color)]">
            <input type="checkbox" id="activo" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} className="w-5 h-5 text-[var(--accent)] rounded focus:ring-[var(--accent)] cursor-pointer" />
            <label htmlFor="activo" className="text-sm font-bold text-[var(--text-primary)] cursor-pointer select-none">Mostrar en la tienda pública</label>
          </div>

          {error && <div className="bg-red-500/10 text-red-500 p-2 rounded text-sm">{error}</div>}

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={creando || actualizando} className="btn-primary">
              {creando || actualizando ? "Guardando..." : (editando ? "Guardar Cambios" : "Crear Producto")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}