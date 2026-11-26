import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { AlertTriangle, ArrowRightLeft, Skull, ShoppingCart, Power, Wrench } from "lucide-react";
import Modal from "./Modal";
import { REGISTRAR_MOVIMIENTO_AVE } from "../graphql/aves";

const TIPOS = [
  { value: "muerte", label: "Muerte", icon: Skull, color: "text-red-600" },
  { value: "venta", label: "Venta", icon: ShoppingCart, color: "text-green-600" },
  { value: "traslado_salida", label: "Traslado (sale)", icon: ArrowRightLeft, color: "text-blue-600" },
  { value: "descarte", label: "Descarte", icon: Power, color: "text-amber-600" },
  { value: "ajuste", label: "Ajuste de inventario", icon: Wrench, color: "text-gray-600" },
];

export default function MovimientoAveModal({ open, onClose, lote, lotesDisponibles = [], onSuccess }) {
  const hoy = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    tipo: "muerte",
    cantidad: 1,
    fecha: hoy,
    motivo: "",
    loteDestinoId: "",
  });
  const [error, setError] = useState("");

  const [registrar, { loading }] = useMutation(REGISTRAR_MOVIMIENTO_AVE);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "cantidad" ? parseInt(value) || 0 : value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!lote) {
      setError("No hay lote seleccionado.");
      return;
    }
    if (form.cantidad <= 0) {
      setError("La cantidad debe ser mayor a 0.");
      return;
    }
    if (form.tipo === "traslado_salida" && !form.loteDestinoId) {
      setError("Debes seleccionar el lote destino para un traslado.");
      return;
    }

    try {
      await registrar({
        variables: {
          loteId: lote.id,
          tipo: form.tipo,
          cantidad: form.cantidad,
          fecha: form.fecha,
          motivo: form.motivo,
          loteDestinoId: form.tipo === "traslado_salida" ? form.loteDestinoId : null,
        },
      });
      onClose();
      setForm({ tipo: "muerte", cantidad: 1, fecha: hoy, motivo: "", loteDestinoId: "" });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  const lotesDestino = lotesDisponibles.filter((l) => l.id !== lote?.id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Registrar movimiento — ${lote?.codigo ?? "Lote"}`}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
          <p className="text-sm text-brand-800 font-bold">
            Aves actuales: <span className="text-2xl text-brand-700">{lote?.avesActuales ?? 0}</span>
          </p>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 mb-2 block">Tipo de movimiento *</label>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS.map((t) => {
              const Icon = t.icon;
              const activo = form.tipo === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, tipo: t.value })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-bold text-sm transition-all ${
                    activo
                      ? "bg-brand-500 text-white border-brand-500"
                      : "bg-white text-gray-700 border-gray-200 hover:border-brand-300"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${activo ? "text-white" : t.color}`} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Cantidad *</label>
            <input
              type="number"
              name="cantidad"
              min="1"
              className="input-field"
              value={form.cantidad}
              onChange={onChange}
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Fecha *</label>
            <input
              type="date"
              name="fecha"
              className="input-field"
              value={form.fecha}
              onChange={onChange}
              required
            />
          </div>
        </div>

        {form.tipo === "traslado_salida" && (
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Lote destino *</label>
            <select
              name="loteDestinoId"
              className="input-field"
              value={form.loteDestinoId}
              onChange={onChange}
              required
            >
              <option value="">Selecciona el lote destino</option>
              {lotesDestino.map((l) => (
                <option key={l.id} value={l.id}>{l.codigo} — {l.raza}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-sm font-bold text-gray-700 mb-1 block">Motivo / observaciones</label>
          <textarea
            name="motivo"
            className="input-field"
            rows={2}
            value={form.motivo}
            onChange={onChange}
            placeholder="Ej: muerte por enfermedad respiratoria, venta a cliente X..."
          />
        </div>

        {form.tipo === "traslado_salida" && (
          <div className="bg-amber-50 text-amber-800 text-sm p-3 rounded-lg border border-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              Al trasladar, se crearán <strong>2 movimientos</strong>: una salida del lote actual
              y una entrada al lote destino. Ambos quedarán en el historial.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Guardando..." : "Guardar movimiento"}
          </button>
        </div>
      </form>
    </Modal>
  );
}