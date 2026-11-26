import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Wheat, Plus } from "lucide-react";
import { ABONO_QUERY, GALPONES_QUERY, REGISTRAR_ABONO } from "../graphql/abono";
import Modal from "../components/Modal";

const ESTADOS = [
  { value: "fresco", label: "Fresco", color: "badge-warning" },
  { value: "en_tratamiento", label: "En tratamiento", color: "badge-info" },
  { value: "seco", label: "Seco", color: "badge-success" },
  { value: "listo", label: "Listo para vender", color: "badge-success" },
  { value: "descartado", label: "Descartado", color: "badge-danger" },
];

const FORM_VACIO = {
  galponId: "",
  fecha: new Date().toISOString().split("T")[0],
  cantidadKg: "",
  estado: "fresco",
  responsable: "",
  observaciones: "",
};

export default function Abono() {
  const [modalOpen, setModalOpen] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");

  const { data, loading, refetch } = useQuery(ABONO_QUERY, {
    variables: { estado: filtro || null },
    fetchPolicy: "network-only",
  });
  const { data: dataGalpones } = useQuery(GALPONES_QUERY, { fetchPolicy: "network-only" });
  const [registrar, { loading: guardando }] = useMutation(REGISTRAR_ABONO);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.galponId) { setError("Selecciona un galpón."); return; }
    try {
      await registrar({
        variables: {
          galponId: form.galponId,
          fecha: form.fecha,
          cantidadKg: parseFloat(form.cantidadKg),
          estado: form.estado,
          loteId: null,
          responsable: form.responsable,
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

  const generaciones = data?.generacionesAbono ?? [];
  const totalKg = generaciones.reduce((acc, g) => acc + parseFloat(g.cantidadKg), 0);
  const listos = generaciones.filter(g => g.estado === "listo").reduce((acc, g) => acc + parseFloat(g.cantidadKg), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
            <Wheat className="w-8 h-8 text-brand-500" /> Abono y Subproductos
          </h1>
          <p className="text-gray-500 text-base mt-1 font-medium">
            Registro de recolección de gallinaza por galpón
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus className="w-5 h-5" /> Registrar recolección
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm font-bold text-gray-500 uppercase">Total registros</p>
          <p className="text-3xl font-black text-dark mt-1">{generaciones.length}</p>
        </div>
        <div className="card bg-brand-50 border-brand-100">
          <p className="text-sm font-bold text-brand-700 uppercase">Total generado</p>
          <p className="text-3xl font-black text-brand-700 mt-1">{totalKg.toFixed(2)} kg</p>
        </div>
        <div className="card bg-green-50 border-green-100">
          <p className="text-sm font-bold text-green-700 uppercase">Listo para vender</p>
          <p className="text-3xl font-black text-green-700 mt-1">{listos.toFixed(2)} kg</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFiltro("")}
          className={`px-4 py-2 rounded-xl font-bold text-sm ${filtro === "" ? "bg-brand-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
        >
          Todos ({generaciones.length})
        </button>
        {ESTADOS.map(e => (
          <button
            key={e.value}
            onClick={() => setFiltro(e.value)}
            className={`px-4 py-2 rounded-xl font-bold text-sm ${filtro === e.value ? "bg-brand-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
          >
            {e.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card text-center py-12 text-gray-500">Cargando...</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-brand-50 text-brand-800 text-sm uppercase tracking-wider">
                <tr>
                  <th className="text-left p-4 font-bold">Fecha</th>
                  <th className="text-left p-4 font-bold">Galpón</th>
                  <th className="text-right p-4 font-bold">Cantidad (kg)</th>
                  <th className="text-left p-4 font-bold">Estado</th>
                  <th className="text-left p-4 font-bold">Responsable</th>
                </tr>
              </thead>
              <tbody>
                {generaciones.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No hay registros de abono aún.
                    </td>
                  </tr>
                ) : (
                  generaciones.map(g => {
                    const estadoConfig = ESTADOS.find(e => e.value === g.estado);
                    return (
                      <tr key={g.id} className="border-t border-gray-100 hover:bg-brand-50/30">
                        <td className="p-4 font-bold text-dark">
                          {new Date(g.fecha).toLocaleDateString("es-BO")}
                        </td>
                        <td className="p-4 text-gray-700">Galpón #{g.galponId}</td>
                        <td className="p-4 text-right font-bold text-gray-800">{parseFloat(g.cantidadKg).toFixed(2)} kg</td>
                        <td className="p-4">
                          <span className={estadoConfig?.color || "badge-info"}>
                            {estadoConfig?.label || g.estado}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600">{g.responsable || "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar recolección de abono">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Galpón *</label>
            <select name="galponId" className="input-field" value={form.galponId} onChange={onChange} required>
              <option value="">Selecciona un galpón</option>
              {dataGalpones?.galpones?.map(g => (
                <option key={g.id} value={g.id}>{g.codigo}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Fecha *</label>
              <input type="date" name="fecha" className="input-field" value={form.fecha} onChange={onChange} required />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Cantidad (kg) *</label>
              <input type="number" step="0.01" name="cantidadKg" className="input-field" value={form.cantidadKg} onChange={onChange} required />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Estado *</label>
            <select name="estado" className="input-field" value={form.estado} onChange={onChange}>
              {ESTADOS.map(e => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Responsable</label>
            <input name="responsable" className="input-field" value={form.responsable} onChange={onChange} />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Observaciones</label>
            <textarea name="observaciones" className="input-field" rows={2} value={form.observaciones} onChange={onChange} />
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primary">
              {guardando ? "Guardando..." : "Registrar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}