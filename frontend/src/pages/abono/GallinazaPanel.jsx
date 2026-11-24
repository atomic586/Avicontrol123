import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { BarChart3, ClipboardList, Package, Plus, Printer, ShoppingCart, Sprout, Warehouse, Wheat } from "lucide-react";
import {
  CLIENTES_GALLINAZA, GALLINAZA_ENTRADAS, GALLINAZA_MOVIMIENTOS,
  GALLINAZA_PRODUCTOS, GALLINAZA_VENTAS, GUARDAR_PRODUCTO_GALLINAZA,
  REGISTRAR_ENTRADA_GALLINAZA, REGISTRAR_PAGO_GALLINAZA,
  REGISTRAR_VENTA_GALLINAZA,
} from "../../graphql/gallinaza";
import RecoleccionGalpon from "./RecoleccionGalpon";

const FECHA_HOY = () => new Date().toISOString().slice(0, 10);
const DINERO = (v) => `Bs. ${Number(v || 0).toFixed(2)}`;
const KILOS_POR_UNIDAD = { bulto: 50, kg: 1, tonelada: 1000 };
const PRECIO_POR_UNIDAD = { bulto: "precioBulto", kg: "precioKg", tonelada: "precioTonelada" };
const TABS = [
  ["venta", "Punto de venta", ShoppingCart], ["entradas", "Entradas", Plus],
  ["productos", "Productos", Package], ["ventas", "Ventas", ClipboardList],
  ["stock", "Stock", Warehouse], ["reportes", "Reportes", BarChart3],
  ["recoleccion", "Recolección", Sprout],
];

function errorText(error) { return error?.message?.replace(/^GraphQL error: /, "") || "Ocurrió un error."; }
function escapar(texto) { return String(texto ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }

export default function GallinazaPanel() {
  const [tab, setTab] = useState("venta");
  const [feedback, setFeedback] = useState("");
  const { data: prodData, refetch: refetchProductos } = useQuery(GALLINAZA_PRODUCTOS, { variables: { soloActivos: false }, fetchPolicy: "network-only" });
  const productos = prodData?.productosGallinaza ?? [];
  const activo = productos.filter(p => p.activo);
  return <div className="space-y-6">
    <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-dark"><Wheat className="h-8 w-8 text-brand-500"/> Abono y gallinaza</h1><p className="mt-1 text-gray-500">Recolección, inventario y ventas del subproducto avícola.</p></div><div className="rounded-xl bg-green-50 px-4 py-2 text-sm font-bold text-green-800">Stock controlado en kilogramos</div></header>
    <nav className="flex gap-2 overflow-x-auto pb-1">{TABS.map(([key, label, Icon]) => <button key={key} onClick={() => { setTab(key); setFeedback(""); }} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${tab === key ? "bg-brand-500 text-white shadow-sm" : "border border-gray-200 bg-white text-gray-600 hover:bg-brand-50"}`}><Icon size={17}/>{label}</button>)}</nav>
    {feedback && <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">{feedback}</div>}
    {tab === "venta" && <PuntoVenta productos={activo} onSaved={v => { setFeedback(`Venta #${v.numero} registrada.`); refetchProductos(); }} />}
    {tab === "entradas" && <Entradas productos={activo} onSaved={() => { setFeedback("Entrada registrada y stock actualizado."); refetchProductos(); }} />}
    {tab === "productos" && <Productos productos={productos} onSaved={() => { setFeedback("Producto guardado."); refetchProductos(); }} />}
    {tab === "ventas" && <Ventas productos={productos} onUpdated={() => { setFeedback("Abono registrado."); refetchProductos(); }} />}
    {tab === "stock" && <Stock productos={productos} />}
    {tab === "reportes" && <Reportes />}
    {tab === "recoleccion" && <RecoleccionGalpon />}
  </div>;
}

function PuntoVenta({ productos, onSaved }) {
  const { data: clientesData } = useQuery(CLIENTES_GALLINAZA, { fetchPolicy: "network-only" });
  const [clienteId, setClienteId] = useState("");
  const [metodo, setMetodo] = useState("efectivo");
  const [recibido, setRecibido] = useState("");
  const [productoId, setProductoId] = useState("");
  const [unidad, setUnidad] = useState("bulto");
  const [cantidad, setCantidad] = useState("1");
  const [carrito, setCarrito] = useState([]);
  const [error, setError] = useState("");
  const [ventaReciente, setVentaReciente] = useState(null);
  const [guardar, { loading }] = useMutation(REGISTRAR_VENTA_GALLINAZA);
  const total = carrito.reduce((s, l) => s + l.subtotal, 0);
  const cambio = metodo === "efectivo" ? Math.max(Number(recibido || 0) - total, 0) : 0;
  function agregar() {
    const p = productos.find(x => x.id === productoId), c = Number(cantidad);
    if (!p || c <= 0) return;
    const precio = Number(p[PRECIO_POR_UNIDAD[unidad]]);
    setCarrito([...carrito, { key: crypto.randomUUID(), producto: p, productoId: p.id, unidad, cantidad: c, kilos: c * KILOS_POR_UNIDAD[unidad], precio, subtotal: c * precio }]);
    setError(""); setCantidad("1");
  }
  async function confirmar() {
    setError("");
    if (!carrito.length) { setError("Agrega al menos un producto."); return; }
    try {
      const result = await guardar({ variables: {
        fecha: FECHA_HOY(), lineas: carrito.map(l => ({ productoId: l.productoId, unidadVendida: l.unidad, cantidad: l.cantidad })),
        metodoPago: metodo, clienteId: clienteId || null, montoRecibido: metodo === "efectivo" ? Number(recibido || 0) : 0,
      } });
      setVentaReciente(result.data.registrarVentaGallinaza); onSaved(result.data.registrarVentaGallinaza); setCarrito([]); setRecibido("");
    } catch (e) { setError(errorText(e)); }
  }
  return <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
    <section className="card space-y-4"><div><h2 className="text-xl font-black">Nueva venta</h2><p className="text-sm text-gray-500">Los precios se toman del producto y el stock se valida en kg.</p></div>
      <label className="block text-sm font-bold text-gray-700">Cliente<select className="input-field mt-1" value={clienteId} onChange={e => setClienteId(e.target.value)}><option value="">Consumidor final</option>{(clientesData?.clientes ?? []).filter(c => c.activo).map(c => <option key={c.id} value={c.id}>{c.nombres} {c.apellidos} · {c.dni}</option>)}</select></label>
      <div className="grid gap-3 sm:grid-cols-[1fr_140px_110px_auto] sm:items-end"><label className="text-sm font-bold text-gray-700">Producto<select className="input-field mt-1" value={productoId} onChange={e => setProductoId(e.target.value)}><option value="">Seleccionar</option>{productos.map(p => <option key={p.id} value={p.id}>{p.nombre} · {Number(p.stockActualKg).toFixed(2)} kg</option>)}</select></label><label className="text-sm font-bold text-gray-700">Unidad<select className="input-field mt-1" value={unidad} onChange={e => setUnidad(e.target.value)}><option value="bulto">Bulto · 50 kg</option><option value="kg">Kilogramo</option><option value="tonelada">Tonelada · 1000 kg</option></select></label><label className="text-sm font-bold text-gray-700">Cantidad<input className="input-field mt-1" type="number" min="0.01" step="0.01" value={cantidad} onChange={e => setCantidad(e.target.value)}/></label><button className="btn-primary" onClick={agregar}><Plus size={18}/> Añadir</button></div>
      <div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm"><thead className="bg-gray-50 text-left"><tr>{["Producto", "Unidad", "Cantidad", "Equiv. kg", "Precio", "Subtotal", ""].map(x => <th key={x} className="p-3">{x}</th>)}</tr></thead><tbody>{carrito.map(l => <tr key={l.key} className="border-t"><td className="p-3 font-semibold">{l.producto.nombre}</td><td className="p-3">{l.unidad}</td><td className="p-3">{l.cantidad}</td><td className="p-3">{l.kilos.toFixed(2)}</td><td className="p-3">{DINERO(l.precio)}</td><td className="p-3 font-bold">{DINERO(l.subtotal)}</td><td className="p-3"><button className="text-red-600" onClick={() => setCarrito(carrito.filter(c => c.key !== l.key))}>Quitar</button></td></tr>)}{!carrito.length && <tr><td colSpan={7} className="p-6 text-center text-gray-400">El carrito está vacío.</td></tr>}</tbody></table></div>
    </section>
    <aside className="card h-fit space-y-4"><h2 className="text-xl font-black">Cobro</h2><div className="flex justify-between border-b pb-3 text-lg font-black"><span>Total</span><span>{DINERO(total)}</span></div><label className="block text-sm font-bold text-gray-700">Forma de pago<select className="input-field mt-1" value={metodo} onChange={e => setMetodo(e.target.value)}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option><option value="credito">Crédito</option></select></label>{metodo === "efectivo" && <><label className="block text-sm font-bold text-gray-700">Monto recibido<input className="input-field mt-1" type="number" step="0.01" min="0" value={recibido} onChange={e => setRecibido(e.target.value)}/></label><div className="rounded-xl bg-green-50 p-3 font-bold text-green-800">Cambio: {DINERO(cambio)}</div></>}{metodo === "credito" && <div className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">La venta quedará pendiente; registra los abonos desde el historial.</div>}{error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}<button className="btn-primary w-full" disabled={loading || !carrito.length} onClick={confirmar}>{loading ? "Procesando…" : "Confirmar venta"}</button>{ventaReciente && <button className="btn-secondary w-full" onClick={() => imprimirTicket(ventaReciente)}><Printer size={17}/> Imprimir último ticket</button>}</aside>
  </div>;
}

function Entradas({ productos, onSaved }) {
  const [form, setForm] = useState({ productoId: "", fecha: FECHA_HOY(), cantidadKg: "", origen: "", observaciones: "" });
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState({ productoId: "", fechaDesde: "", fechaHasta: "" });
  const { data, loading, refetch } = useQuery(GALLINAZA_ENTRADAS, { variables: { productoId: filtro.productoId || null, fechaDesde: filtro.fechaDesde || null, fechaHasta: filtro.fechaHasta || null }, fetchPolicy: "network-only" });
  const [guardar, { loading: guardando }] = useMutation(REGISTRAR_ENTRADA_GALLINAZA);
  async function submit(e) { e.preventDefault(); setError(""); try { await guardar({ variables: { ...form, cantidadKg: Number(form.cantidadKg) } }); setForm({ ...form, cantidadKg: "", origen: "", observaciones: "" }); await refetch(); onSaved(); } catch (err) { setError(errorText(err)); } }
  return <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><form className="card space-y-4" onSubmit={submit}><div><h2 className="text-xl font-black">Registrar entrada</h2><p className="text-sm text-gray-500">La cantidad se agrega al stock en kilogramos.</p></div><label className="block text-sm font-bold">Producto<select className="input-field mt-1" required value={form.productoId} onChange={e => setForm({ ...form, productoId: e.target.value })}><option value="">Seleccionar</option>{productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-bold">Fecha<input className="input-field mt-1" type="date" required value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })}/></label><label className="text-sm font-bold">Cantidad (kg)<input className="input-field mt-1" type="number" min="0.01" step="0.01" required value={form.cantidadKg} onChange={e => setForm({ ...form, cantidadKg: e.target.value })}/></label></div><label className="block text-sm font-bold">Origen<input className="input-field mt-1" required placeholder="Galpón, limpieza…" value={form.origen} onChange={e => setForm({ ...form, origen: e.target.value })}/></label><label className="block text-sm font-bold">Observaciones<textarea className="input-field mt-1" rows={3} value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })}/></label>{error && <p className="text-sm text-red-700">{error}</p>}<button className="btn-primary w-full" disabled={guardando}>{guardando ? "Guardando…" : "Registrar entrada"}</button></form>
    <div className="card space-y-4"><div><h2 className="text-xl font-black">Historial de entradas</h2><div className="mt-3 grid gap-3 sm:grid-cols-3"><select className="input-field" value={filtro.productoId} onChange={e => setFiltro({ ...filtro, productoId: e.target.value })}><option value="">Todos los productos</option>{productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select><input className="input-field" aria-label="Fecha desde" type="date" value={filtro.fechaDesde} onChange={e => setFiltro({ ...filtro, fechaDesde: e.target.value })}/><input className="input-field" aria-label="Fecha hasta" type="date" value={filtro.fechaHasta} onChange={e => setFiltro({ ...filtro, fechaHasta: e.target.value })}/></div></div><Tabla loading={loading} filas={data?.entradasGallinaza ?? []} vacio="No hay entradas registradas." columnas={["Fecha", "Producto", "Cantidad", "Origen", "Observaciones"]} render={e => [e.fecha, productos.find(p => p.id === e.productoId)?.nombre || "—", `${Number(e.cantidadKg).toFixed(2)} kg`, e.origen, e.observaciones || "—"]}/></div></div>;
}

function Productos({ productos, onSaved }) {
  const vacio = { nombre: "", precioBulto: "", precioKg: "", precioTonelada: "", stockMinimoKg: "0", activo: true };
  const [form, setForm] = useState(vacio); const [error, setError] = useState("");
  const [guardar, { loading }] = useMutation(GUARDAR_PRODUCTO_GALLINAZA);
  function editar(p) { setForm({ id: p.id, nombre: p.nombre, precioBulto: p.precioBulto, precioKg: p.precioKg, precioTonelada: p.precioTonelada, stockMinimoKg: p.stockMinimoKg, activo: p.activo }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function submit(e) { e.preventDefault(); setError(""); try { await guardar({ variables: { ...form, precioBulto: Number(form.precioBulto), precioKg: Number(form.precioKg), precioTonelada: Number(form.precioTonelada), stockMinimoKg: Number(form.stockMinimoKg) } }); setForm(vacio); onSaved(); } catch (err) { setError(errorText(err)); } }
  return <div className="space-y-5"><form className="card space-y-4" onSubmit={submit}><div className="flex items-center justify-between"><div><h2 className="text-xl font-black">{form.id ? "Editar producto" : "Nuevo producto"}</h2><p className="text-sm text-gray-500">El stock solo cambia con entradas y ventas.</p></div>{form.id && <button type="button" className="btn-secondary" onClick={() => setForm(vacio)}>Cancelar edición</button>}</div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><label className="text-sm font-bold">Nombre<input className="input-field mt-1" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}/></label><label className="text-sm font-bold">Precio / bulto<input className="input-field mt-1" type="number" min="0" step="0.01" required value={form.precioBulto} onChange={e => setForm({ ...form, precioBulto: e.target.value })}/></label><label className="text-sm font-bold">Precio / kg<input className="input-field mt-1" type="number" min="0" step="0.01" required value={form.precioKg} onChange={e => setForm({ ...form, precioKg: e.target.value })}/></label><label className="text-sm font-bold">Precio / tonelada<input className="input-field mt-1" type="number" min="0" step="0.01" required value={form.precioTonelada} onChange={e => setForm({ ...form, precioTonelada: e.target.value })}/></label><label className="text-sm font-bold">Stock mínimo (kg)<input className="input-field mt-1" type="number" min="0" step="0.01" value={form.stockMinimoKg} onChange={e => setForm({ ...form, stockMinimoKg: e.target.value })}/></label></div><label className="inline-flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })}/> Producto activo</label>{error && <p className="text-sm text-red-700">{error}</p>}<button className="btn-primary" disabled={loading}>{loading ? "Guardando…" : "Guardar producto"}</button></form><div className="card overflow-x-auto p-0"><Tabla loading={false} filas={productos} vacio="Aún no hay productos." columnas={["Producto", "Precio bulto", "Precio kg", "Precio tonelada", "Stock", "Estado", ""]} render={p => [p.nombre, DINERO(p.precioBulto), DINERO(p.precioKg), DINERO(p.precioTonelada), `${Number(p.stockActualKg).toFixed(2)} kg`, p.activo ? "Activo" : "Inactivo", <button className="font-bold text-brand-700" onClick={() => editar(p)}>Editar</button>]}/></div></div>;
}

function Ventas({ productos, onUpdated }) {
  const [filtro, setFiltro] = useState({ estado: "", clienteId: "", productoId: "", fechaDesde: "", fechaHasta: "" });
  const [expandida, setExpandida] = useState("");
  const { data: clientesData } = useQuery(CLIENTES_GALLINAZA, { fetchPolicy: "network-only" });
  const [ventaAbono, setVentaAbono] = useState(null); const [monto, setMonto] = useState(""); const [metodo, setMetodo] = useState("efectivo"); const [error, setError] = useState("");
  const { data, loading, refetch } = useQuery(GALLINAZA_VENTAS, { variables: { clienteId: filtro.clienteId || null, estado: filtro.estado || null, productoId: filtro.productoId || null, fechaDesde: filtro.fechaDesde || null, fechaHasta: filtro.fechaHasta || null }, fetchPolicy: "network-only" });
  const [pagar, { loading: guardando }] = useMutation(REGISTRAR_PAGO_GALLINAZA);
  const ventas = data?.ventasGallinaza ?? [];
  async function guardarAbono(e) { e.preventDefault(); setError(""); try { await pagar({ variables: { ventaId: ventaAbono.id, monto: Number(monto), metodo } }); setVentaAbono(null); setMonto(""); await refetch(); onUpdated(); } catch (err) { setError(errorText(err)); } }
  return <div className="space-y-4"><div className="card grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><label className="text-sm font-bold">Estado<select className="input-field mt-1" value={filtro.estado} onChange={e => setFiltro({ ...filtro, estado: e.target.value })}><option value="">Todos</option><option value="pagada">Pagada</option><option value="parcial">Parcial</option><option value="pendiente">Pendiente</option></select></label><label className="text-sm font-bold">Cliente<select className="input-field mt-1" value={filtro.clienteId} onChange={e => setFiltro({ ...filtro, clienteId: e.target.value })}><option value="">Todos</option>{(clientesData?.clientes ?? []).map(c => <option key={c.id} value={c.id}>{c.nombres} {c.apellidos}</option>)}</select></label><label className="text-sm font-bold">Producto<select className="input-field mt-1" value={filtro.productoId} onChange={e => setFiltro({ ...filtro, productoId: e.target.value })}><option value="">Todos</option>{productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label><label className="text-sm font-bold">Desde<input className="input-field mt-1" type="date" value={filtro.fechaDesde} onChange={e => setFiltro({ ...filtro, fechaDesde: e.target.value })}/></label><label className="text-sm font-bold">Hasta<input className="input-field mt-1" type="date" value={filtro.fechaHasta} onChange={e => setFiltro({ ...filtro, fechaHasta: e.target.value })}/></label></div><div className="card overflow-x-auto p-0"><table className="w-full text-left text-sm"><thead className="bg-brand-50 text-brand-800"><tr>{["Ticket", "Fecha", "Cliente", "Total", "Pagado", "Saldo", "Estado", "Acciones"].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={8} className="p-6">Cargando…</td></tr> : ventas.map(v => <Fragment key={v.id}><tr key={v.id} className="border-t"><td className="p-3 font-bold">#{v.numero}</td><td className="p-3">{v.fecha}</td><td className="p-3">{v.nombreCliente}</td><td className="p-3">{DINERO(v.total)}</td><td className="p-3">{DINERO(v.totalPagado)}</td><td className="p-3">{DINERO(v.saldoPendiente)}</td><td className="p-3"><Estado estado={v.estado}/></td><td className="flex flex-wrap gap-2 p-3"><button className="font-bold text-brand-700" onClick={() => setExpandida(expandida === v.id ? "" : v.id)}>{expandida === v.id ? "Ocultar" : "Detalle"}</button><button className="font-bold text-brand-700" onClick={() => imprimirTicket(v)}>Ticket</button>{Number(v.saldoPendiente) > 0 && <button className="font-bold text-green-700" onClick={() => { setVentaAbono(v); setError(""); }}>Registrar abono</button>}</td></tr>{expandida === v.id && <tr key={`${v.id}-detail`} className="bg-gray-50"><td colSpan={8} className="p-4"><p className="mb-2 font-bold">Detalle del ticket #{v.numero}</p><div className="grid gap-2 md:grid-cols-2">{v.detalles.map(d => <div key={d.id} className="rounded-lg border bg-white p-3">{d.producto?.nombre}: {d.cantidad} {d.unidadVendida} ({Number(d.cantidadKg).toFixed(2)} kg) · {DINERO(d.precioUnitario)} · subtotal {DINERO(d.subtotal)}</div>)}</div><p className="mt-3 text-sm text-gray-600">Pagos: {v.pagos.length ? v.pagos.map(p => `${p.fecha.slice(0, 10)} ${DINERO(p.monto)} (${p.metodo})`).join(" · ") : "Sin pagos registrados"}</p></td></tr>}</Fragment>)}{!loading && !ventas.length && <tr><td colSpan={8} className="p-8 text-center text-gray-500">No hay ventas con estos filtros.</td></tr>}</tbody></table></div>{ventaAbono && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={guardarAbono} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6"><h3 className="text-xl font-black">Abono a ticket #{ventaAbono.numero}</h3><p>Saldo pendiente: <b>{DINERO(ventaAbono.saldoPendiente)}</b></p><label className="block text-sm font-bold">Monto<input className="input-field mt-1" type="number" min="0.01" max={ventaAbono.saldoPendiente} step="0.01" required value={monto} onChange={e => setMonto(e.target.value)}/></label><label className="block text-sm font-bold">Método<select className="input-field mt-1" value={metodo} onChange={e => setMetodo(e.target.value)}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option></select></label>{error && <p className="text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setVentaAbono(null)}>Cancelar</button><button className="btn-primary" disabled={guardando}>{guardando ? "Guardando…" : "Registrar pago"}</button></div></form></div>}</div>;
}

function Stock({ productos }) {
  const [productoId, setProductoId] = useState(""); const { data, loading } = useQuery(GALLINAZA_MOVIMIENTOS, { variables: { productoId: productoId || null }, fetchPolicy: "network-only" });
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{productos.map(p => { const bajo = Number(p.stockActualKg) < Number(p.stockMinimoKg); return <div key={p.id} className={`card border-l-4 ${bajo ? "border-l-red-500" : "border-l-green-500"}`}><div className="flex items-start justify-between"><div><p className="font-black">{p.nombre}</p><p className="mt-2 text-3xl font-black">{Number(p.stockActualKg).toFixed(2)} <span className="text-base">kg</span></p><p className="text-sm text-gray-500">Mínimo: {Number(p.stockMinimoKg).toFixed(2)} kg</p></div><span className={bajo ? "badge-danger" : "badge-success"}>{bajo ? "Stock bajo" : "Disponible"}</span></div></div>; })}</div><div className="card space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-black">Movimientos de stock</h2><select className="input-field max-w-xs" value={productoId} onChange={e => setProductoId(e.target.value)}><option value="">Todos los productos</option>{productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div><Tabla loading={loading} filas={data?.movimientosGallinaza ?? []} vacio="Sin movimientos." columnas={["Fecha", "Producto", "Tipo", "Cantidad", "Referencia"]} render={m => [new Date(m.createdAt).toLocaleString("es-BO"), productos.find(p => p.id === m.productoId)?.nombre || "—", m.tipo === "entrada" ? "Entrada" : "Salida", `${Number(m.cantidadKg).toFixed(2)} kg`, m.referencia]}/></div></div>;
}

function Reportes() {
  const { data, loading } = useQuery(GALLINAZA_VENTAS, { fetchPolicy: "network-only" });
  const ventas = useMemo(() => data?.ventasGallinaza ?? [], [data]);
  const vendidoKg = ventas.reduce((s, v) => s + v.detalles.reduce((x, d) => x + Number(d.cantidadKg), 0), 0);
  const totalVentas = ventas.reduce((s, v) => s + Number(v.total), 0);
  const cartera = ventas.reduce((s, v) => s + Number(v.saldoPendiente), 0);
  const pagado = totalVentas - cartera;
  const meses = useMemo(() => Object.values(ventas.reduce((acc, v) => { const mes = v.fecha.slice(0, 7); acc[mes] ??= { mes, cantidad: 0, total: 0, kg: 0 }; acc[mes].cantidad++; acc[mes].total += Number(v.total); acc[mes].kg += v.detalles.reduce((t, d) => t + Number(d.cantidadKg), 0); return acc; }, {})).sort((a, b) => b.mes.localeCompare(a.mes)), [ventas]);
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi title="Ingresos por gallinaza" value={DINERO(totalVentas)}/><Kpi title="Cobrado" value={DINERO(pagado)}/><Kpi title="Cartera pendiente" value={DINERO(cartera)}/><Kpi title="Cantidad vendida" value={`${vendidoKg.toFixed(2)} kg`}/></div><div className="card"><h2 className="mb-4 text-xl font-black">Ventas mensuales de gallinaza</h2><Tabla loading={loading} filas={meses} vacio="Aún no hay ventas." columnas={["Mes", "Tickets", "Kg vendidos", "Total vendido"]} render={m => [m.mes, m.cantidad, `${m.kg.toFixed(2)} kg`, DINERO(m.total)]}/></div><p className="text-sm text-gray-500">Reporte separado del módulo de huevos. Las entradas de inventario se consultan en la pestaña Entradas.</p></div>;
}

function Tabla({ loading, filas, columnas, render, vacio }) { return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-600"><tr>{columnas.map(c => <th key={c} className="whitespace-nowrap p-3">{c}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={columnas.length} className="p-6 text-gray-500">Cargando…</td></tr> : filas.map((fila, i) => <tr key={fila.id ?? i} className="border-t">{render(fila).map((v, j) => <td key={j} className="whitespace-nowrap p-3">{v}</td>)}</tr>)}{!loading && !filas.length && <tr><td colSpan={columnas.length} className="p-6 text-center text-gray-500">{vacio}</td></tr>}</tbody></table></div>; }
function Kpi({ title, value }) { return <div className="card"><p className="text-xs font-bold uppercase tracking-wide text-gray-500">{title}</p><p className="mt-2 text-2xl font-black text-dark">{value}</p></div>; }
function Estado({ estado }) { const css = estado === "pagada" ? "badge-success" : estado === "parcial" ? "badge-warning" : "badge-danger"; return <span className={css}>{estado}</span>; }

function imprimirTicket(v) {
  const filas = (v.detalles || []).map(d => `<tr><td>${escapar(d.producto?.nombre)}</td><td>${Number(d.cantidad)} ${escapar(d.unidadVendida)}<br><small>${Number(d.cantidadKg).toFixed(2)} kg</small></td><td>${DINERO(d.precioUnitario)}</td><td>${DINERO(d.subtotal)}</td></tr>`).join("");
  const recibido = Number(v.montoRecibido || 0), cambio = Number(v.cambio || 0);
  const w = window.open("", "ticket-gallinaza", "width=720,height=760"); if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Ticket ${v.numero}</title><style>body{font:14px Arial,sans-serif;max-width:680px;margin:30px auto;color:#222}h1{text-align:center}table{width:100%;border-collapse:collapse;margin:22px 0}th,td{padding:9px 5px;border-bottom:1px solid #ddd;text-align:left}tfoot td{font-weight:bold}.total{font-size:20px;text-align:right}.muted{color:#666}@media print{button{display:none}}</style></head><body><h1>AVICONTROL · GALLINAZA</h1><p><b>Ticket:</b> #${escapar(v.numero)}<br><b>Fecha:</b> ${escapar(v.fecha)}<br><b>Cliente:</b> ${escapar(v.nombreCliente || "Consumidor final")}<br><b>Pago:</b> ${escapar(v.metodoPago)}</p><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>${filas}</tbody></table><p class="total">Total: ${DINERO(v.total)}</p><p>Monto recibido: ${DINERO(recibido)}${v.metodoPago === "efectivo" ? `<br>Cambio: ${DINERO(cambio)}` : ""}</p><p>Estado: ${escapar(v.estado)}</p><p class="muted">Gracias por su compra.</p><button onclick="window.print()">Imprimir</button><script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}
