import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Egg, X } from "lucide-react";
import { REGISTRAR_PRODUCCION } from "../graphql/lotes";

export default function ModalProduccion({ open, onClose, lote, onSuccess }) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    huevosPrimera: "",
    huevosSegunda: "",
    huevosTercera: "",
    huevosDescartados: "",
  });
  const [error, setError] = useState("");
  const [registrar, { loading }] = useMutation(REGISTRAR_PRODUCCION);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const total =
    (parseInt(form.huevosPrimera) || 0) +
    (parseInt(form.huevosSegunda) || 0) +
    (parseInt(form.huevosTercera) || 0) +
    (parseInt(form.huevosDescartados) || 0);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await registrar({
        variables: {
          loteId: lote.id,
          fecha: form.fecha,
          huevosPrimera: parseInt(form.huevosPrimera) || 0,
          huevosSegunda: parseInt(form.huevosSegunda) || 0,
          huevosTercera: parseInt(form.huevosTercera) || 0,
          huevosDescartados: parseInt(form.huevosDescartados) || 0,
        },
      });
      onSuccess?.();
      onClose();
      setForm({
        fecha: new Date().toISOString().split("T")[0],
        huevosPrimera: "",
        huevosSegunda: "",
        huevosTercera: "",
        huevosDescartados: "",
      });
    } catch (err) {
      setError(err.message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-black text-dark dark:text-white flex items-center gap-2">
            <Egg className="w-5 h-5 text-orange-500" /> Registrar Producción
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">1ra calidad</label>
              <input type="number" name="huevosPrimera" value={form.huevosPrimera} onChange={onChange} className="input-field" min="0" placeholder="0" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">2da calidad</label>
              <input type="number" name="huevosSegunda" value={form.huevosSegunda} onChange={onChange} className="input-field" min="0" placeholder="0" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">3ra calidad</label>
              <input type="number" name="huevosTercera" value={form.huevosTercera} onChange={onChange} className="input-field" min="0" placeholder="0" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Descartados</label>
              <input type="number" name="huevosDescartados" value={form.huevosDescartados} onChange={onChange} className="input-field" min="0" placeholder="0" />
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 text-center border border-orange-200 dark:border-orange-800">
            <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Total del día</p>
            <p className="text-3xl font-black text-orange-700 dark:text-orange-300 mt-1">{total.toLocaleString()}</p>
            <p className="text-xs text-orange-500 dark:text-orange-400">huevos</p>
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