import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { Pill, Plus, Trash2, ShieldAlert } from "lucide-react";
import { MEDICAMENTOS_ALIMENTO_QUERY, CREAR_MEDICAMENTO_ALIMENTO } from "../graphql/consumos";
import Modal from "../components/Modal";
import { useAuth } from "../auth/AuthContext";

const INSUMOS_QUERY = gql`
  query InsumosParaMedicamentos {
    insumos {
      id
      nombre
      tipo
      stock
    }
  }
`;

const FORM_VACIO = {
  alimentoId: "",
  medicamentoId: "",
  dosisPorKg: "",
  fechaInicio: new Date().toISOString().split("T")[0],
  fechaFin: "",
  periodoRetiroDias: 0,
  observaciones: "",
};

export default function MedicamentosAlimento() {
  const { tieneRol } = useAuth();
  const puedeEditar = tieneRol(["superadmin", "admin_granja", "encargado_produccion", "encargado_almacen"]);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");

  const { data: dataInsumos } = useQuery(INSUMOS_QUERY, { fetchPolicy: "network-only" });
  const { data, loading, refetch } = useQuery(MEDICAMENTOS_ALIMENTO_QUERY, { fetchPolicy: "network-only" });
  const [crear, { loading: guardando }] = useMutation(CREAR_MEDICAMENTO_ALIMENTO);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.alimentoId || !form.medicamentoId || !form.dosisPorKg) {
      setError("Completa los campos obligatorios.");
      return;
    }
    try {
      await crear({
        variables: {
          alimentoId: form.alimentoId,
          medicamentoId: form.medicamentoId,
          dosisPorKg: parseFloat(form.dosisPorKg),
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin || null,
          periodoRetiroDias: parseInt(form.periodoRetiroDias) || 0,
          observaciones: form.observaciones,
        },
      });
      setModalOpen(false);
      setForm(FORM_VACIO);
      refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const alimentos = dataInsumos?.insumos?.filter((i) => i.tipo === "alimento") ?? [];
  const medicamentos = dataInsumos?.insumos?.filter((i) => i.tipo === "medicamento") ?? [];
  const asociaciones = data?.medicamentosAlimento ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
            <Pill className="w-8 h-8 text-brand-500" /> Medicamentos en Alimento
          </h1>
          <p className="text-gray-500 text-base mt-1 font-medium">Controla qué medicamentos contienen tus alimentos y sus días de retiro</p>
        </div>
        {puedeEditar && (
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus className="w-5 h-5" /> Asociar medicamento
          </button>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead className="bg-brand-50 text-brand-800 text-sm uppercase tracking-wider">
              <tr>
                <th className="text-left p-4 font-bold">Alimento</th>
                <th className="text-left p-4 font-bold">Medicamento</th>
                <th className="text-right p-4 font-bold">Dosis (g/kg)</th>
                <th className="text-left p-4 font-bold">Fechas</th>
                <th className="text-right p-4 font-bold">Días Retiro</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">Cargando...</td></tr>
              ) : asociaciones.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">No hay asociaciones registradas.</td></tr>
              ) : (
                asociaciones.map((m) => (
                  <tr key={m.id} className="border-t border-gray-100 hover:bg-brand-50/30">
                    <td className="p-4 font-bold text-dark">{alimentos.find(a => a.id === m.alimentoId)?.nombre || m.alimentoId}</td>
                    <td className="p-4 text-gray-700">{medicamentos.find(med => med.id === m.medicamentoId)?.nombre || m.medicamentoId}</td>
                    <td className="p-4 text-right font-bold">{m.dosisPorKg}</td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(m.fechaInicio).toLocaleDateString()} — {m.fechaFin ? new Date(m.fechaFin).toLocaleDateString() : "Sin fin"}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-1 rounded-lg font-bold text-xs ${m.periodoRetiroDias > 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                        {m.periodoRetiroDias} días
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Asociar medicamento a alimento">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Alimento *</label>
            <select name="alimentoId" className="input-field" value={form.alimentoId} onChange={onChange} required>
              <option value="">Selecciona un alimento</option>
              {alimentos.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Medicamento *</label>
            <select name="medicamentoId" className="input-field" value={form.medicamentoId} onChange={onChange} required>
              <option value="">Selecciona un medicamento</option>
              {medicamentos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Dosis (g/kg) *</label>
              <input type="number" step="0.001" name="dosisPorKg" className="input-field" value={form.dosisPorKg} onChange={onChange} required />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Días de retiro *</label>
              <input type="number" name="periodoRetiroDias" className="input-field" value={form.periodoRetiroDias} onChange={onChange} required min="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Desde *</label>
              <input type="date" name="fechaInicio" className="input-field" value={form.fechaInicio} onChange={onChange} required />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Hasta (opcional)</label>
              <input type="date" name="fechaFin" className="input-field" value={form.fechaFin} onChange={onChange} />
            </div>
          </div>
          {form.periodoRetiroDias > 0 && (
            <div className="bg-amber-50 text-amber-800 text-sm p-3 rounded-lg border border-amber-200 flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>Alerta: Este alimento tendrá un período de retiro de {form.periodoRetiroDias} días. No se podrán vender huevos durante ese tiempo.</p>
            </div>
          )}
          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primary">{guardando ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}