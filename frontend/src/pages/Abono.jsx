import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Wheat, Plus, Package, ArrowDownCircle, ShoppingCart } from "lucide-react";
import {
  PRODUCTOS_GALLINAZA_QUERY,
  ENTRADAS_GALLINAZA_QUERY,
  VENTAS_GALLINAZA_QUERY,
  REGISTRAR_ENTRADA_GALLINAZA,
  GUARDAR_PRODUCTO_GALLINAZA,
} from "../graphql/abono";
import Modal from "../components/Modal";
import RecoleccionGalpon from "./abono/RecoleccionGalpon";

const TABS = [
  { key: "productos", label: "Productos", icon: Package },
  { key: "recoleccion", label: "Recolección", icon: Wheat },
  { key: "entradas", label: "Entradas", icon: ArrowDownCircle },
  { key: "ventas", label: "Ventas", icon: ShoppingCart },
];

export default function Abono() {
  const [tab, setTab] = useState("productos");
  const [productoParaEntrada, setProductoParaEntrada] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
          <Wheat className="w-8 h-8 text-brand-500" /> Abono y Subproductos
        </h1>
        <p className="text-gray-500 text-base mt-1 font-medium">Gestión comercial de abono</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                tab === t.key ? "border-brand-500 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "recoleccion" && <RecoleccionGalpon />}
      {tab === "productos" && <TabProductos onRegistrarStock={(producto) => { setProductoParaEntrada(producto); setTab("entradas"); }} />}
      {tab === "entradas" && <TabEntradas productoSeleccionado={productoParaEntrada} onProductoSeleccionado={() => setProductoParaEntrada(null)} />}
      {tab === "ventas" && <TabVentas />}
    </div>
  );
}

function TabProductos({ onRegistrarStock }) {
  const { data, loading, refetch } = useQuery(PRODUCTOS_GALLINAZA_QUERY, {
    variables: { soloActivos: false },
    fetchPolicy: "network-only",
  });
  const [guardarProducto, { loading: guardando }] = useMutation(GUARDAR_PRODUCTO_GALLINAZA);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", unidadBase: "kg", tipo: "listo", precioBulto: "0", precioKg: "0", precioTonelada: "0", stockMinimoKg: "0", activo: true });
  const [error, setError] = useState("");

  const abrirNuevo = () => {
    setForm({ nombre: "", unidadBase: "kg", tipo: "listo", precioBulto: "0", precioKg: "0", precioTonelada: "0", stockMinimoKg: "0", activo: true });
    setError("");
    setModalOpen(true);
  };

  const editar = (producto) => {
    setForm({
      id: producto.id,
      nombre: producto.nombre,
      unidadBase: "kg",
      tipo: producto.tipo,
      precioBulto: String(producto.precioBulto),
      precioKg: String(producto.precioKg),
      precioTonelada: String(producto.precioTonelada),
      stockMinimoKg: String(producto.stockMinimoKg),
      activo: producto.activo,
    });
    setError("");
    setModalOpen(true);
  };

  const cambiarEstado = async (producto) => {
    setError("");
    try {
      await guardarProducto({ variables: {
        id: producto.id,
        nombre: producto.nombre,
        unidadBase: "kg",
        tipo: producto.tipo,
        precioBulto: producto.precioBulto,
        precioKg: producto.precioKg,
        precioTonelada: producto.precioTonelada,
        stockMinimoKg: producto.stockMinimoKg,
        activo: !producto.activo,
      } });
      await refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await guardarProducto({
        variables: {
          id: form.id,
          nombre: form.nombre,
          unidadBase: "kg",
          tipo: form.tipo,
          precioBulto: parseFloat(form.precioBulto) || 0,
          precioKg: parseFloat(form.precioKg) || 0,
          precioTonelada: parseFloat(form.precioTonelada) || 0,
          stockMinimoKg: parseFloat(form.stockMinimoKg) || 0,
          activo: form.activo,
        },
      });
      setModalOpen(false);
      setForm({ nombre: "", unidadBase: "kg", tipo: "listo", precioBulto: "0", precioKg: "0", precioTonelada: "0", stockMinimoKg: "0", activo: true });
      await refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const productos = data?.productosGallinaza ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={abrirNuevo} className="btn-primary">
          <Plus className="w-5 h-5" /> Nuevo producto
        </button>
      </div>

      {error && !modalOpen && <div className="card border-red-200 bg-red-50 text-red-700">{error}</div>}

      {loading ? (
        <div className="card text-center py-12 text-gray-500">Cargando productos...</div>
      ) : productos.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No hay productos de abono registrados.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productos.map((p) => (
            <div key={p.id} className="card">
              <h3 className="text-xl font-black text-dark mb-2">{p.nombre}</h3>
              <span className="badge-info">{p.tipo === "en_tratamiento" ? "En tratamiento" : p.tipo === "listo" ? "Listo para vender" : p.tipo[0].toUpperCase() + p.tipo.slice(1)}</span>
              <p className="text-sm text-gray-500 mb-3">Unidad base: {p.unidadBase}</p>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Stock actual: <strong>{Number(p.stockActualKg).toFixed(2)} kg</strong></p>
                <p>Stock mínimo: {Number(p.stockMinimoKg).toFixed(2)} kg</p>
                <p>Precio kg: Bs. {Number(p.precioKg).toFixed(2)}</p>
                <p>Precio tonelada: Bs. {Number(p.precioTonelada).toFixed(2)}</p>
              </div>
              <div className="mt-3">
                <span className={p.activo ? "badge-success" : "badge-danger"}>{p.activo ? "Activo" : "Inactivo"}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn-secondary" onClick={() => editar(p)}>Editar</button>
                <button type="button" className="btn-secondary" onClick={() => {
                  if (!p.activo || window.confirm(`¿Desactivar “${p.nombre}”? Se conservarán sus ventas y movimientos.`)) cambiarEstado(p);
                }} disabled={guardando}>
                  {p.activo ? "Desactivar" : "Reactivar"}
                </button>
                {p.activo && <button type="button" className="btn-primary" onClick={() => onRegistrarStock(p)}>Registrar stock</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? "Editar producto de abono" : "Nuevo producto de abono"}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Nombre *</label>
            <input className="input-field" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Unidad base</label>
            <input className="input-field" value="kg" readOnly aria-readonly="true" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Tipo de abono *</label>
            <select className="input-field" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="fresco">Fresco</option>
              <option value="en_tratamiento">En tratamiento</option>
              <option value="seco">Seco</option>
              <option value="listo">Listo para vender</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Precio bulto</label>
              <input type="number" className="input-field" value={form.precioBulto} onChange={(e) => setForm({ ...form, precioBulto: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Precio kg</label>
              <input type="number" className="input-field" value={form.precioKg} onChange={(e) => setForm({ ...form, precioKg: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Precio tonelada</label>
              <input type="number" className="input-field" value={form.precioTonelada} onChange={(e) => setForm({ ...form, precioTonelada: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Stock mínimo (kg)</label>
            <input type="number" className="input-field" value={form.stockMinimoKg} onChange={(e) => setForm({ ...form, stockMinimoKg: e.target.value })} />
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primary">{guardando ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function TabEntradas({ productoSeleccionado, onProductoSeleccionado }) {
  const { data: productosData } = useQuery(PRODUCTOS_GALLINAZA_QUERY, { variables: { soloActivos: true } });
  const { data, loading, refetch } = useQuery(ENTRADAS_GALLINAZA_QUERY, { fetchPolicy: "network-only" });
  const [registrarEntrada, { loading: guardando }] = useMutation(REGISTRAR_ENTRADA_GALLINAZA);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ productoId: "", fecha: new Date().toISOString().split("T")[0], cantidadKg: "", origen: "", observaciones: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productoSeleccionado) return;
    setForm((actual) => ({ ...actual, productoId: productoSeleccionado.id }));
    setError("");
    setModalOpen(true);
    onProductoSeleccionado();
  }, [productoSeleccionado, onProductoSeleccionado]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await registrarEntrada({
        variables: {
          productoId: form.productoId,
          fecha: form.fecha,
          cantidadKg: parseFloat(form.cantidadKg),
          origen: form.origen,
          observaciones: form.observaciones,
        },
      });
      setModalOpen(false);
      setForm({ productoId: "", fecha: new Date().toISOString().split("T")[0], cantidadKg: "", origen: "", observaciones: "" });
      refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const entradas = data?.entradasGallinaza ?? [];
  const productos = productosData?.productosGallinaza ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus className="w-5 h-5" /> Registrar entrada
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-gray-500">Cargando entradas...</div>
      ) : entradas.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No hay entradas registradas. Registra una cantidad en kg para que el abono tenga stock y aparezca en pedidos.</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-base">
            <thead className="bg-brand-50 text-brand-800 text-sm uppercase">
              <tr>
                <th className="text-left p-4 font-bold">Fecha</th>
                <th className="text-left p-4 font-bold">Producto</th>
                <th className="text-right p-4 font-bold">Cantidad (kg)</th>
                <th className="text-left p-4 font-bold">Origen</th>
              </tr>
            </thead>
            <tbody>
              {entradas.map((e) => (
                <tr key={e.id} className="border-t border-gray-100">
                  <td className="p-4 font-bold">{new Date(e.fecha).toLocaleDateString("es-BO")}</td>
                  <td className="p-4">Producto #{e.productoId}</td>
                  <td className="p-4 text-right font-bold">{Number(e.cantidadKg).toFixed(2)} kg</td>
                  <td className="p-4 text-gray-600">{e.origen || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar entrada de abono">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Producto *</label>
            <select className="input-field" value={form.productoId} onChange={(e) => setForm({ ...form, productoId: e.target.value })} required>
              <option value="">Selecciona un producto</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Fecha *</label>
              <input type="date" className="input-field" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Cantidad (kg) *</label>
              <input type="number" step="0.01" className="input-field" value={form.cantidadKg} onChange={(e) => setForm({ ...form, cantidadKg: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Origen</label>
            <input className="input-field" value={form.origen} onChange={(e) => setForm({ ...form, origen: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Observaciones</label>
            <textarea className="input-field" rows={2} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primary">{guardando ? "Guardando..." : "Registrar"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function TabVentas() {
  const { data, loading } = useQuery(VENTAS_GALLINAZA_QUERY, { fetchPolicy: "network-only" });
  const ventas = data?.ventasGallinaza ?? [];

  if (loading) return <div className="card text-center py-12 text-gray-500">Cargando ventas...</div>;
  if (ventas.length === 0) return <div className="card text-center py-12 text-gray-500">No hay ventas registradas.</div>;

  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full text-base">
        <thead className="bg-brand-50 text-brand-800 text-sm uppercase">
          <tr>
            <th className="text-left p-4 font-bold">#</th>
            <th className="text-left p-4 font-bold">Fecha</th>
            <th className="text-left p-4 font-bold">Cliente</th>
            <th className="text-right p-4 font-bold">Total</th>
            <th className="text-left p-4 font-bold">Estado</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((v) => (
            <tr key={v.id} className="border-t border-gray-100">
              <td className="p-4 font-bold">{v.numero}</td>
              <td className="p-4">{new Date(v.fecha).toLocaleDateString("es-BO")}</td>
              <td className="p-4">{v.nombreCliente}</td>
              <td className="p-4 text-right font-bold">Bs. {Number(v.total).toFixed(2)}</td>
              <td className="p-4"><span className="badge-info">{v.estado}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
