import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Plus, Trash2, Tag } from "lucide-react";
import { TARIFAS_QUERY, CREAR_TARIFA, ELIMINAR_TARIFA } from "../graphql/tarifas";
import Modal from "./Modal";

export default function TarifasProductoModal({ open, onClose, producto }) {
  const [form, setForm] = useState({
    precio: "",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: "",
    tipo: "temporada",
    nombreTemporada: "",
  });
  const [error, setError] = useState("");

  const { data, loading, refetch } = useQuery(TARIFAS_QUERY, {
    variables: { productoId: producto?.id },
    skip: !open || !producto,
    fetchPolicy: "network-only",
  });

  const [crear, { loading: guardando }] = useMutation(CREAR_TARIFA);
  const [eliminar] = useMutation(ELIMINAR_TARIFA);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.precio || parseFloat(form.precio) <= 0) {
      setError("El precio debe ser mayor a 0.");
      return;
    }
    try {
      await crear({
        variables: {
          productoId: producto.id,
          precio: parseFloat(form.precio),
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin || null,
          tipo: form.tipo,
          nombreTemporada: form.nombreTemporada,
        },
      });
      setForm({
        precio: "",
        fechaInicio: new Date().toISOString().split("T")[0],
        fechaFin: "",
        tipo: "temporada",
        nombreTemporada: "",
      });
      refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const onEliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta tarifa?")) return;
    await eliminar({ variables: { id } });
    refetch();
  };

  const tarifas = data?.tarifasProducto ?? [];

  return (
    <Modal open={open} onClose={onClose} title={`Tarifas — ${producto?.nombre ?? ""}`}>
      <div className="space-y-5">
        <div className="bg-brand-50 p-4 rounded-xl border border-brand-100">
          <p className="text-sm text-brand-800">
            <strong>Precio base actual:</strong> Bs. {producto?.precioUnitario}
          </p>
          <p className="text-xs text-brand-700 mt-1">
            Las tarifas de temporada se aplican automáticamente al crear pedidos según la fecha.
          </p>
        </div>

        {/* Lista de tarifas */}
        <div className="space-y-2">
          <h3 className="font-bold text-dark text-sm uppercase tracking-wider">Tarifas registradas</h3>
          {loading ? (
            <p className="text-sm text-gray-500">Cargando...</p>
          ) : tarifas.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">No hay tarifas especiales para este producto.</p>
          ) : (
            tarifas.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="font-bold text-sm text-dark flex items-center gap-2">
                    <Tag className="w-4 h-4 text-brand-500" />
                    Bs. {t.precio}
                    {t.nombreTemporada && <span className="text-xs font-medium text-gray-500">({t.nombreTemporada})</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(t.fechaInicio).toLocaleDateString()} — {t.fechaFin ? new Date(t.fechaFin).toLocaleDateString() : "Sin fin"}
                  </p>
                </div>
                <button onClick={() => onEliminar(t.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Formulario nueva tarifa */}
        <form onSubmit={onSubmit} className="space-y-3 pt-4 border-t border-gray-100">
          <h3 className="font-bold text-dark text-sm uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nueva tarifa
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Precio (Bs.) *</label>
              <input type="number" step="0.01" name="precio" className="input-field" value={form.precio} onChange={onChange} required />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Tipo</label>
              <select name="tipo" className="input-field" value={form.tipo} onChange={onChange}>
                <option value="temporada">Temporada</option>
                <option value="promocion">Promoción</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Fecha inicio *</label>
              <input type="date" name="fechaInicio" className="input-field" value={form.fechaInicio} onChange={onChange} required />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Fecha fin</label>
              <input type="date" name="fechaFin" className="input-field" value={form.fechaFin} onChange={onChange} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1 block">Nombre temporada</label>
            <input type="text" name="nombreTemporada" className="input-field" placeholder="Ej: Navidad 2026" value={form.nombreTemporada} onChange={onChange} />
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm p-2 rounded">{error}</div>}
          <button type="submit" disabled={guardando} className="btn-primary w-full text-sm">
            {guardando ? "Guardando..." : "Agregar tarifa"}
          </button>
        </form>
      </div>
    </Modal>
  );
}