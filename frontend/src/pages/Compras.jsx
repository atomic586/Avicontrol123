import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { ShoppingBag, Plus } from "lucide-react";
import { COMPRAS_QUERY, INSUMOS_PARA_COMPRA, REGISTRAR_COMPRA } from "../graphql/compras";
import { PROVEEDORES_QUERY } from "../graphql/proveedores";
import Modal from "../components/Modal";

export default function Compras() {
  const [modalOpen, setModalOpen] = useState(false);
  const [proveedorId, setProveedorId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [numeroFactura, setNumeroFactura] = useState("");
  const [detalles, setDetalles] = useState([{ insumoId: "", cantidad: 1, precioUnitario: 0 }]);
  const [error, setError] = useState("");

  const { data, loading, error: qError, refetch } = useQuery(COMPRAS_QUERY, { fetchPolicy: "network-only" });
  const { data: dataProveedores } = useQuery(PROVEEDORES_QUERY);
  const { data: dataInsumos } = useQuery(INSUMOS_PARA_COMPRA);

  const [registrar, { loading: guardando }] = useMutation(REGISTRAR_COMPRA);

  const agregarLinea = () => setDetalles([...detalles, { insumoId: "", cantidad: 1, precioUnitario: 0 }]);
  const quitarLinea = (idx) => setDetalles(detalles.filter((_, i) => i !== idx));
  const actualizarLinea = (idx, campo, valor) => {
    const copia = [...detalles];
    copia[idx][campo] = campo === "cantidad" || campo === "precioUnitario" ? parseFloat(valor) || 0 : valor;
    setDetalles(copia);
  };

  const calcularTotal = () => detalles.reduce((acc, d) => acc + (d.cantidad * d.precioUnitario), 0);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!proveedorId) { setError("Selecciona un proveedor"); return; }
    const validos = detalles.filter(d => d.insumoId && d.cantidad > 0);
    if (validos.length === 0) { setError("Agrega al menos un insumo"); return; }
    try {
      await registrar({
        variables: {
          proveedorId,
          fecha,
          numeroFactura,
          detalles: validos.map(d => ({ insumoId: d.insumoId, cantidad: d.cantidad, precioUnitario: d.precioUnitario })),
        },
      });
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const compras = data?.compras ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-brand-500" /> Compras
          </h1>
          <p className="text-gray-500 text-base mt-1 font-medium">Registro de compras de insumos y actualización de inventario</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus className="w-5 h-5" /> Nueva compra
        </button>
      </div>

      {qError && <div className="card bg-red-50 text-red-700 p-4">{qError.message}</div>}

      {loading ? (
        <div className="card text-center py-12 text-gray-500">Cargando compras...</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-brand-50 text-brand-800 text-sm uppercase tracking-wider">
                <tr>
                  <th className="text-left p-4 font-bold">ID</th>
                  <th className="text-left p-4 font-bold">Fecha</th>
                  <th className="text-left p-4 font-bold">Proveedor ID</th>
                  <th className="text-left p-4 font-bold">Factura</th>
                  <th className="text-left p-4 font-bold">Estado</th>
                  <th className="text-right p-4 font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {compras.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">No hay compras registradas.</td></tr>
                ) : (
                  compras.map((c) => (
                    <tr key={c.id} className="border-t border-gray-100 hover:bg-brand-50/30">
                      <td className="p-4 font-bold text-dark">#{c.id}</td>
                      <td className="p-4 text-gray-600">{new Date(c.fecha).toLocaleDateString("es-BO")}</td>
                      <td className="p-4 text-gray-600">{c.proveedorId}</td>
                      <td className="p-4 text-gray-600">{c.numeroFactura || "—"}</td>
                      <td className="p-4"><span className="badge-success">{c.estado}</span></td>
                      <td className="p-4 text-right font-black text-brand-700">Bs. {parseFloat(c.total).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar nueva compra">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Proveedor *</label>
            <select className="input-field" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} required>
              <option value="">Selecciona un proveedor</option>
              {dataProveedores?.proveedores?.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Fecha *</label>
              <input type="date" className="input-field" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Nº Factura</label>
              <input className="input-field" value={numeroFactura} onChange={(e) => setNumeroFactura(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">Insumos *</label>
            {detalles.map((d, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-start">
                <select className="input-field flex-1" value={d.insumoId} onChange={(e) => actualizarLinea(idx, "insumoId", e.target.value)}>
                  <option value="">Insumo</option>
                  {dataInsumos?.insumos?.map((i) => (
                    <option key={i.id} value={i.id}>{i.nombre}</option>
                  ))}
                </select>
                <input type="number" step="0.01" className="input-field w-20" placeholder="Cant." value={d.cantidad} onChange={(e) => actualizarLinea(idx, "cantidad", e.target.value)} min="0.01" />
                <input type="number" step="0.01" className="input-field w-24" placeholder="Precio" value={d.precioUnitario} onChange={(e) => actualizarLinea(idx, "precioUnitario", e.target.value)} min="0" />
                {detalles.length > 1 && (
                  <button type="button" onClick={() => quitarLinea(idx)} className="text-red-600 font-bold px-2">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={agregarLinea} className="text-brand-600 font-bold text-sm hover:text-brand-800">+ Agregar insumo</button>
          </div>
          <div className="bg-brand-50 p-4 rounded-xl border border-brand-100">
            <p className="text-xs font-bold text-brand-800 uppercase">Total Compra</p>
            <p className="text-3xl font-black text-brand-700">Bs. {calcularTotal().toFixed(2)}</p>
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primary">{guardando ? "Guardando..." : "Registrar compra"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}