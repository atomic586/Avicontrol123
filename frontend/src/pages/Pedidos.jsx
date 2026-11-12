import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { ShoppingCart, Plus, ArrowRight } from "lucide-react";
import {
  PEDIDOS_QUERY,
  CREAR_PEDIDO,
  CAMBIAR_ESTADO_PEDIDO,
} from "../graphql/pedidos";
import Modal from "../components/Modal";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [fechaPedido, setFechaPedido] = useState(new Date().toISOString().split("T")[0]);
  const [detalles, setDetalles] = useState([{ productoId: "", cantidad: 1 }]);
  const [error, setError] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  const { data, loading, error: qError, refetch } = useQuery(PEDIDOS_QUERY, {
    variables: { estado: estadoFiltro || null },
    fetchPolicy: "network-only",
  });
  const { data: dataClientes } = useQuery(CLIENTES_QUERY);
  const { data: dataProductos } = useQuery(PRODUCTOS_QUERY);

  const [crearPedido, { loading: creando }] = useMutation(CREAR_PEDIDO);
  const [cambiarEstado] = useMutation(CAMBIAR_ESTADO_PEDIDO);

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
    try {
      await cambiarEstado({ variables: { id, estado } });
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  const pedidos = data?.pedidos ?? [];
  const agrupados = ESTADOS.reduce((acc, e) => {
    acc[e.value] = pedidos.filter((p) => p.estado === e.value);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-brand-500" /> Pedidos
          </h1>
          <p className="text-gray-500 text-base mt-1 font-medium">
            Organiza cada entrega desde la solicitud hasta el cobro
          </p>
        </div>
        <button onClick={abrirModal} className="btn-primary">
          <Plus className="w-5 h-5" /> Nuevo pedido
        </button>
      </div>

      {qError && (
        <div className="card bg-red-50 border-red-200 text-red-700 p-4">
          <p className="font-bold mb-1">Error al cargar pedidos:</p>
          <p className="text-sm font-mono bg-white p-2 rounded border border-red-200">{qError.message}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setEstadoFiltro("")}
          className={"px-4 py-2 rounded-xl font-bold text-sm " + (estadoFiltro === "" ? "bg-brand-500 text-white" : "bg-white text-gray-600 border border-gray-200")}
        >
          Todos ({pedidos.length})
        </button>
        {ESTADOS.map((e) => (
          <button
            key={e.value}
            onClick={() => setEstadoFiltro(e.value)}
            className={"px-4 py-2 rounded-xl font-bold text-sm " + (estadoFiltro === e.value ? "bg-brand-500 text-white" : "bg-white text-gray-600 border border-gray-200")}
          >
            {e.label} ({agrupados[e.value]?.length || 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card text-center py-12 text-gray-500">Cargando pedidos...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ESTADOS.map((e) => (
            <div key={e.value} className="card p-4 bg-gray-50">
              <div className={"inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 " + e.color}>{e.label}</div>
              <div className="space-y-2">
                {(agrupados[e.value] || []).length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Sin pedidos</p>
                ) : (
                  agrupados[e.value].map((p) => (
                    <div key={p.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-sm text-dark">{p.cliente.nombres} {p.cliente.apellidos}</p>
                          <p className="text-xs text-gray-500">{p.cliente.dni}</p>
                        </div>
                        <span className="text-xs font-black text-brand-700">Bs. {parseFloat(p.total).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{new Date(p.fechaPedido).toLocaleDateString("es-BO")}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {ESTADOS.filter((s) => s.value !== p.estado && s.value !== "anulado").map((s) => (
                          <button
                            key={s.value}
                            onClick={() => onCambiarEstado(p.id, s.value)}
                            className="text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded"
                          >
                            <ArrowRight className="w-3 h-3 inline" /> {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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