import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Activity, X } from "lucide-react";
import { REGISTRAR_MOVIMIENTO_AVE, LOTES_QUERY } from "../graphql/lotes";

const TIPOS = [
  { value: "muerte", label: "Muerte", signo: "−" },
  { value: "venta", label: "Venta", signo: "−" },
  { value: "descarte", label: "Descarte", signo: "−" },
  { value: "traslado_salida", label: "Traslado (sale)", signo: "−" },
  { value: "ajuste_positivo", label: "Ajuste (suma)", signo: "+" },
  { value: "ajuste_negativo", label: "Ajuste (resta)", signo: "−" },
];

export default function ModalMovimientoAve({ open, onClose, lote, onSuccess }) {
  const [tipo, setTipo] = useState("muerte");
  const [cantidad, setCantidad] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [motivo, setMotivo] = useState("");
  const [loteDestinoId, setLoteDestinoId] = useState("");
  const [error, setError] = useState("");

  const { data: lotesData } = useQuery(LOTES_QUERY, { skip: !open });
  const [registrar, { loading }] = useMutation(REGISTRAR_MOVIMIENTO_AVE);

  const lotesDisponibles = (lotesData?.lotes ?? []).filter(
    (l) => l.id !== lote?.id && l.galponId === lote?.galponId
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await registrar({
        variables: {
          loteId: lote.id,
          tipo,
          cantidad: parseInt(cantidad, 10),
          fecha,
          motivo: motivo || null,
          loteDestinoId: tipo === "traslado_salida" ? loteDestinoId : null,
        },
      });
      onSuccess?.();
      onClose();
      setCantidad("");
      setMotivo("");
      setLoteDestinoId("");
    } catch (err) {
      setError(err.message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-black text-dark dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500" /> Registrar Movimiento
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">
              Tipo de movimiento *
            </label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input-field" required>
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">
              Cantidad de aves *
            </label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="input-field"
              required
              min="1"
              max={lote?.avesActuales || undefined}
              placeholder={`Máx. ${lote?.avesActuales || 0}`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Aves actuales en el lote: <strong>{lote?.avesActuales}</strong>
            </p>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Fecha *</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {tipo === "traslado_salida" && (
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                Lote destino *
              </label>
              <select
                value={loteDestinoId}
                onChange={(e) => setLoteDestinoId(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Selecciona un lote</option>
                {lotesDisponibles.map((l) => (
                  <option key={l.id} value={l.id}>Lote {l.codigo}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Motivo</label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="input-field"
              placeholder="Opcional (ej. enfermedad respiratoria)"
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