import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Utensils, X } from "lucide-react";
import { REGISTRAR_CONSUMO, INSUMOS_ALIMENTO_QUERY } from "../graphql/lotes";

export default function ModalConsumo({ open, onClose, lote, onSuccess }) {
  const [form, setForm] = useState({
    insumoId: "",
    fecha: new Date().toISOString().split("T")[0],
    cantidad: "",
    observaciones: "",
  });
  const [error, setError] = useState("");

  const { data: insumosData } = useQuery(INSUMOS_ALIMENTO_QUERY, { skip: !open });
  const [registrar, { loading }] = useMutation(REGISTRAR_CONSUMO);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await registrar({
        variables: {
          loteId: lote.id,
          insumoId: form.insumoId,
          fecha: form.fecha,
          cantidad: parseFloat(form.cantidad),
          observaciones: form.observaciones || null,
        },
      });
      onSuccess?.();
      onClose();
      setForm({
        insumoId: "",
        fecha: new Date().toISOString().split("T")[0],
        cantidad: "",
        observaciones: "",
      });
    } catch (err) {
      setError(err.message);
    }
  };

  if (!open) return null;

  const insumos = insumosData?.insumos ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-black text-dark dark:text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-orange-500" /> Registrar Consumo
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">
              Insumo (alimento) *
            </label>
            <select
              name="insumoId"
              value={form.insumoId}
              onChange={onChange}
              className="input-field"
              required
            >
              <option value="">Selecciona un alimento</option>
              {insumos.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre} (Stock: {i.stock})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Fecha *</label>
            <input
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={onChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">
              Cantidad consumida (kg) *
            </label>
            <input
              type="number"
              name="cantidad"
              value={form.cantidad}
              onChange={onChange}
              className="input-field"
              required
              min="0.01"
              step="0.01"
              placeholder="Ej: 120.5"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Observaciones</label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={onChange}
              className="input-field"
              rows="2"
              placeholder="Opcional"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-3 rounded-lg border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Registrando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}