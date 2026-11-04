import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { DollarSign, Plus } from "lucide-react";
import { VENTAS_QUERY, REGISTRAR_VENTA } from "../graphql/ventas";
import Modal from "../components/Modal";

const PEDIDOS_PENDIENTES_QUERY = gql`
  query PedidosPendientes {
    pedidos {
      id
      estado
      total
      fechaPedido
      cliente { nombres apellidos dni }
    }
  }
`;

const FORMAS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "qr", label: "QR" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "credito", label: "Crédito" },
];

export default function Ventas() {
  const [modalOpen, setModalOpen] = useState(false);
  const [pedidoId, setPedidoId] = useState("");
  const [formaPago, setFormaPago] = useState("efectivo");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");

  const { data, loading, refetch } = useQuery(VENTAS_QUERY, { fetchPolicy: "network-only" });
  const { data: dataPedidos } = useQuery(PEDIDOS_PENDIENTES_QUERY, { fetchPolicy: "network-only" });
  const [registrarVenta, { loading: guardando }] = useMutation(REGISTRAR_VENTA);

  const pedidosCobrables = (dataPedidos?.pedidos ?? []).filter(p => p.estado !== "entregado" && p.estado !== "anulado");
  const pedidoSeleccionado = pedidosCobrables.find(p => p.id === pedidoId);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!pedidoId) { setError("Selecciona un pedido."); return; }
    try {
      await registrarVenta({ variables: { pedidoId, formaPago, fecha } });
      setModalOpen(false);
      setPedidoId(""); setFormaPago("efectivo"); setFecha(new Date().toISOString().split("T")[0]);
      refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const ventas = data?.ventas ?? [];
  const ingresosTotales = ventas.reduce((a, v) => a + parseFloat(v.montoTotal), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-brand-500" /> Ventas
          </h1>
          <p className="text-gray-500 text-base mt-1 font-medium">Cobra pedidos entregados y consulta el historial</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus className="w-5 h-5" /> Registrar venta
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card bg-brand-50 border-brand-100">
          <p className="text-sm font-bold text-brand-700 uppercase">Ingresos totales</p>
          <p className="text-4xl font-black text-brand-700 mt-2">Bs. {ingresosTotales.toLocaleString("es-BO", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="card">
          <p className="text-sm font-bold text-gray-500 uppercase">Total ventas</p>
          <p className="text-4xl font-black text-dark mt-2">{ventas.length}</p>
        </div>
      </div>

      {loading ? <div className="card text-center py-12 text-gray-500">Cargando ventas...</div> : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-brand-50 text-brand-800 text-sm uppercase tracking-wider">
                <tr>
                  <th className="text-left p-4 font-bold">Pedido</th>
                  <th className="text-left p-4 font-bold">Cliente</th>
                  <th className="text-left p-4 font-bold">Fecha</th>
                  <th className="text-left p-4 font-bold">Forma de pago</th>
                  <th className="text-right p-4 font-bold">Monto</th>
                </tr>
              </thead>
              <tbody>
                {ventas.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay ventas registradas aún.</td></tr>
                ) : (
                  ventas.map(v => (
                    <tr key={v.id} className="border-t border-gray-100 hover:bg-brand-50/30">
                      <td className="p-4 font-bold text-dark">#{v.pedido.id}</td>
                      <td className="p-4 text-gray-700">{v.pedido.cliente.nombres} {v.pedido.cliente.apellidos}</td>
                      <td className="p-4 text-gray-600">{new Date(v.fecha).toLocaleDateString("es-BO")}</td>
                      <td className="p-4"><span className="badge-info">{v.formaPago}</span></td>
                      <td className="p-4 text-right font-black text-brand-700">Bs. {parseFloat(v.montoTotal).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar venta">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Pedido *</label>
            <select className="input-field" value={pedidoId} onChange={(e) => setPedidoId(e.target.value)} required>
              <option value="">Selecciona un pedido</option>
              {pedidosCobrables.map(p => (
                <option key={p.id} value={p.id}>#{p.id} — {p.cliente.nombres} {p.cliente.apellidos} — Bs. {parseFloat(p.total).toFixed(2)}</option>
              ))}
            </select>
          </div>
          {pedidoSeleccionado && (
            <div className="bg-brand-50 p-4 rounded-xl border border-brand-100">
              <p className="text-xs font-bold text-brand-800 uppercase">Monto a cobrar</p>
              <p className="text-3xl font-black text-brand-700">Bs. {parseFloat(pedidoSeleccionado.total).toFixed(2)}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Forma de pago *</label>
            <select className="input-field" value={formaPago} onChange={(e) => setFormaPago(e.target.value)}>
              {FORMAS_PAGO.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Fecha</label>
            <input type="date" className="input-field" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primary">{guardando ? "Cobrando..." : "Registrar venta"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}