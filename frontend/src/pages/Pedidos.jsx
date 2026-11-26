import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { Link } from "react-router-dom";
import { ShoppingCart, Plus, Search } from "lucide-react";
import {
  PEDIDOS_QUERY,
  CREAR_PEDIDO,
  CAMBIAR_ESTADO_PEDIDO,
} from "../graphql/pedidos";
import { useAuth } from "../auth/AuthContext";
import Modal from "../components/Modal";
import HuevoMascota from "../components/HuevoMascota";
import { VENTAS_GALLINAZA_QUERY } from "../graphql/abono";

const CLIENTES_QUERY = gql`
  query { clientes { id nombres apellidos dni } }
`;

const PRODUCTOS_QUERY = gql`
  query { productos(soloActivos: true) { id nombre tipo presentacion calidad precioUnitario stock } }
`;

const ESTADOS = [
  { value: "pendiente", label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  { value: "confirmado", label: "Confirmado", color: "bg-blue-100 text-blue-800" },
  { value: "entregado", label: "Entregado", color: "bg-green-100 text-green-800" },
  { value: "anulado", label: "Anulado", color: "bg-red-100 text-red-800" },
];

export default function Pedidos() {
  const { tieneRol } = useAuth();
  const puedeEditar = tieneRol(["superadmin", "admin_granja", "encargado_ventas"]);

  const [modalOpen, setModalOpen] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [fechaPedido, setFechaPedido] = useState(new Date().toISOString().split("T")[0]);
  const [detalles, setDetalles] = useState([{ productoId: "", cantidad: 1 }]);
  const [error, setError] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [vistaPedidos, setVistaPedidos] = useState("huevos");
  const [busquedaPedido, setBusquedaPedido] = useState("");
  const [pedidoActualizando, setPedidoActualizando] = useState(null);
  const [errorEstado, setErrorEstado] = useState("");
  const [mensajeEstado, setMensajeEstado] = useState("");

  const { data, loading, error: qError, refetch } = useQuery(PEDIDOS_QUERY, {
    variables: { estado: null },
    fetchPolicy: "network-only",
  });
  const { data: abonoData, loading: cargandoAbono, error: errorAbono } = useQuery(VENTAS_GALLINAZA_QUERY, {
    fetchPolicy: "network-only",
  });
  const { data: dataClientes } = useQuery(CLIENTES_QUERY);
  const { data: dataProductos } = useQuery(PRODUCTOS_QUERY);

  const [crearPedido, { loading: creando }] = useMutation(CREAR_PEDIDO);
  const [cambiarEstado, { loading: cambiandoEstado }] = useMutation(CAMBIAR_ESTADO_PEDIDO);

  const abrirModal = () => {
    setClienteId("");
    setFechaPedido(new Date().toISOString().split("T")[0]);
    setDetalles([{ productoId: "", cantidad: 1 }]);
    setError("");
    setModalOpen(true);
  };

  const agregarLinea = () => setDetalles([...detalles, { productoId: "", cantidad: 1 }]);
  const quitarLinea = (idx) => setDetalles(detalles.filter((_, i) => i !== idx));
  const actualizarLinea = (idx, campo, valor) => {
    const copia = [...detalles];
    copia[idx][campo] = campo === "cantidad" ? parseInt(valor) || 1 : valor;
    setDetalles(copia);
  };

  const calcularTotal = () => {
    return detalles.reduce((acc, d) => {
      const prod = dataProductos?.productos?.find((p) => p.id === d.productoId);
      if (!prod) return acc;
      return acc + parseFloat(prod.precioUnitario) * d.cantidad;
    }, 0);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!clienteId) { setError("Selecciona un cliente"); return; }
    const validos = detalles.filter((d) => d.productoId && d.cantidad > 0);
    if (validos.length === 0) { setError("Agrega al menos un producto"); return; }
    try {
      await crearPedido({
        variables: {
          clienteId,
          fechaPedido,
          detalles: validos.map((d) => ({ productoId: d.productoId, cantidad: d.cantidad })),
        },
      });
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const onCambiarEstado = async (id, estado) => {
    if (estado === "anulado" && !window.confirm(`¿Anular el pedido #${id}?`)) return;
    setPedidoActualizando(id);
    setErrorEstado("");
    setMensajeEstado("");
    try {
      await cambiarEstado({ variables: { id, estado } });
      await refetch();
      setMensajeEstado(`El pedido #${id} ahora está ${ESTADOS.find((item) => item.value === estado)?.label.toLowerCase() || estado}.`);
    } catch (err) {
      setErrorEstado(err.message);
    } finally {
      setPedidoActualizando(null);
    }
  };

  const todosPedidos = data?.pedidos ?? [];
  const pedidos = estadoFiltro ? todosPedidos.filter((pedido) => pedido.estado === estadoFiltro) : todosPedidos;
  const ventasAbono = abonoData?.ventasGallinaza ?? [];
  const agrupados = ESTADOS.reduce((acc, e) => {
    acc[e.value] = todosPedidos.filter((p) => p.estado === e.value);
    return acc;
  }, {});
  const terminoBusqueda = busquedaPedido.trim().toLocaleLowerCase("es");
  const pedidosVisibles = pedidos.filter((pedido) => {
    const nombre = `${pedido.cliente?.nombres ?? ""} ${pedido.cliente?.apellidos ?? ""}`.toLocaleLowerCase("es");
    return !terminoBusqueda || nombre.includes(terminoBusqueda) || String(pedido.id).includes(terminoBusqueda) || (pedido.cliente?.dni ?? "").toLocaleLowerCase("es").includes(terminoBusqueda);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HuevoMascota phase="pedidos" className="huevo-mascota--compacto" />
            <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-brand-500" /> Pedidos
            </h1>
          </div>
          <p className="text-gray-500 text-base mt-1 font-medium">
            Organiza cada entrega desde la solicitud hasta el cobro
          </p>
        </div>
        {puedeEditar && vistaPedidos === "huevos" && (
          <button onClick={abrirModal} className="btn-primary">
            <Plus className="w-5 h-5" /> Nuevo pedido
          </button>
        )}
        {puedeEditar && vistaPedidos === "abono" && (
          <Link to="/abono" className="btn-primary">Gestionar abono</Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3" role="tablist" aria-label="Tipo de pedidos">
        {[
          { key: "huevos", label: `Pedidos de huevos (${todosPedidos.length})` },
          { key: "abono", label: `Pedidos de abono (${ventasAbono.length})` },
        ].map((vista) => (
          <button
            key={vista.key}
            role="tab"
            aria-selected={vistaPedidos === vista.key}
            onClick={() => setVistaPedidos(vista.key)}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${vistaPedidos === vista.key ? "bg-brand-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            {vista.label}
          </button>
        ))}
      </div>

      {qError && (
        <div className="card bg-red-50 border-red-200 text-red-700 p-4">
          <p className="font-bold mb-1">Error al cargar pedidos:</p>
          <p className="text-sm font-mono bg-white p-2 rounded border border-red-200">{qError.message}</p>
        </div>
      )}

      {vistaPedidos === "huevos" ? <>
      <div className="card flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setEstadoFiltro("")}
            className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${estadoFiltro === "" ? "bg-brand-500 text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
          >Todos <span className={estadoFiltro === "" ? "ml-1 opacity-80" : "ml-1 text-gray-400"}>{todosPedidos.length}</span></button>
          {ESTADOS.map((estado) => (
            <button
              key={estado.value}
              onClick={() => setEstadoFiltro(estado.value)}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${estadoFiltro === estado.value ? "bg-brand-500 text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              {estado.label} <span className={estadoFiltro === estado.value ? "ml-1 opacity-80" : "ml-1 text-gray-400"}>{agrupados[estado.value]?.length || 0}</span>
            </button>
          ))}
        </div>
        <label className="relative block w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input-field py-2 pl-9" value={busquedaPedido} onChange={(event) => setBusquedaPedido(event.target.value)} placeholder="Buscar pedido o cliente" aria-label="Buscar pedido o cliente" />
        </label>
      </div>

      {errorEstado && <div role="alert" className="card border border-red-200 bg-red-50 p-3 text-sm text-red-700">No se pudo actualizar el pedido: {errorEstado}</div>}
      {mensajeEstado && <div role="status" className="card border border-green-200 bg-green-50 p-3 text-sm text-green-700">{mensajeEstado}</div>}

      {loading ? (
        <div className="card text-center py-12 text-gray-500">Cargando pedidos...</div>
      ) : (
        <section className="card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <p className="text-sm font-bold text-gray-500">{pedidosVisibles.length} {pedidosVisibles.length === 1 ? "pedido" : "pedidos"}</p>
            <p className="hidden text-xs font-semibold text-gray-400 sm:block">Ordenados del más reciente</p>
          </div>
          {pedidosVisibles.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-gray-500">{terminoBusqueda ? "No se encontraron pedidos con esa búsqueda." : "No hay pedidos en este estado."}</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {pedidosVisibles.map((pedido) => {
                const estado = ESTADOS.find((item) => item.value === pedido.estado);
                return (
                  <article key={pedido.id} className="grid grid-cols-1 gap-3 px-4 py-3 transition-colors hover:bg-gray-50/70 sm:grid-cols-[minmax(180px,1.5fr)_minmax(110px,0.8fr)_minmax(120px,0.8fr)_minmax(110px,0.7fr)_minmax(150px,0.9fr)] sm:items-center sm:gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-dark">{pedido.cliente?.nombres} {pedido.cliente?.apellidos}</p>
                      <p className="mt-0.5 text-xs text-gray-500">Pedido #{pedido.id}{pedido.cliente?.dni ? ` · CI ${pedido.cliente.dni}` : ""}</p>
                    </div>
                    <div><span className="text-[10px] font-bold uppercase text-gray-400 sm:hidden">Fecha · </span><span className="text-sm text-gray-600">{new Date(`${pedido.fechaPedido}T00:00:00`).toLocaleDateString("es-BO")}</span></div>
                    <div><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${estado?.color || "bg-gray-100 text-gray-700"}`}>{estado?.label || pedido.estado}</span></div>
                    <div className="font-black text-brand-700">Bs. {Number(pedido.total).toFixed(2)}</div>
                    {puedeEditar ? (
                      <label className="flex items-center gap-2 sm:justify-end">
                        <span className="text-xs font-semibold text-gray-400 sm:sr-only">Cambiar estado</span>
                        <select
                          className="input-field min-w-0 py-2 text-sm sm:max-w-40"
                          value={pedido.estado}
                          disabled={cambiandoEstado && pedidoActualizando === pedido.id}
                          onChange={(event) => onCambiarEstado(pedido.id, event.target.value)}
                          aria-label={`Cambiar estado del pedido ${pedido.id}`}
                        >
                          {ESTADOS.map((opcion) => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}
                        </select>
                      </label>
                    ) : <span className="text-xs text-gray-400">Solo consulta</span>}
                    {cambiandoEstado && pedidoActualizando === pedido.id && <span className="text-xs text-gray-400 sm:col-span-5">Guardando cambio…</span>}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
      </> :
      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-black text-dark">Pedidos de abono</h2>
          <p className="text-sm text-gray-500">Ventas registradas desde el módulo Abono</p>
        </div>
        {errorAbono ? (
          <div className="card border-red-200 bg-red-50 text-red-700 p-4">No se pudieron cargar los pedidos de abono: {errorAbono.message}</div>
        ) : cargandoAbono ? (
          <div className="card text-center py-6 text-gray-500">Cargando pedidos de abono...</div>
        ) : ventasAbono.length === 0 ? (
          <div className="card text-center py-6 text-gray-500">Aún no hay pedidos de abono registrados.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ventasAbono.map((venta) => (
              <article key={venta.id} className="card p-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-black text-dark">Pedido de abono #{venta.numero}</p>
                    <p className="text-sm text-gray-500">{venta.nombreCliente}</p>
                  </div>
                  <span className="badge-info">{venta.estado}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">{new Date(`${venta.fecha}T12:00:00`).toLocaleDateString("es-BO")}</p>
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  {venta.detalles.map((detalle) => (
                    <p key={detalle.id}>{detalle.producto.nombre}: {Number(detalle.cantidad)} {detalle.unidadVendida}</p>
                  ))}
                </div>
                <p className="text-lg font-black text-brand-700 mt-3">Bs. {Number(venta.total).toFixed(2)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
      }

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo pedido">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Cliente *</label>
            <select className="input-field" value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
              <option value="">Selecciona un cliente</option>
              {dataClientes?.clientes?.map((c) => (
                <option key={c.id} value={c.id}>{c.nombres} {c.apellidos} — {c.dni}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Fecha *</label>
            <input type="date" className="input-field" value={fechaPedido} onChange={(e) => setFechaPedido(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">Productos *</label>
            {detalles.map((d, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-start">
                <select className="input-field flex-1" value={d.productoId} onChange={(e) => actualizarLinea(idx, "productoId", e.target.value)}>
                  <option value="">Producto</option>
                  {dataProductos?.productos?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.tipo === "abono" ? "🌱" : "🥚"} {p.nombre} (stock: {parseFloat(p.stock).toFixed(0)}) — Bs. {parseFloat(p.precioUnitario).toFixed(2)}
                    </option>
                  ))}
                </select>
                <input type="number" className="input-field w-24" value={d.cantidad} onChange={(e) => actualizarLinea(idx, "cantidad", e.target.value)} min="1" />
                {detalles.length > 1 && (
                  <button type="button" onClick={() => quitarLinea(idx)} className="text-red-600 font-bold px-2">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={agregarLinea} className="text-brand-600 font-bold text-sm hover:text-brand-800">+ Agregar producto</button>
          </div>
          <div className="bg-brand-50 p-4 rounded-xl border border-brand-100">
            <p className="text-xs font-bold text-brand-800 uppercase">Total</p>
            <p className="text-3xl font-black text-brand-700">Bs. {calcularTotal().toFixed(2)}</p>
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={creando} className="btn-primary">{creando ? "Guardando..." : "Crear pedido"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
