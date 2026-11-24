import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { ABONO_QUERY, GALPONES_QUERY, REGISTRAR_ABONO } from "../../graphql/abono";

const ESTADOS = [
  { value: "fresco", label: "Fresco" }, { value: "en_tratamiento", label: "En tratamiento" },
  { value: "seco", label: "Seco" }, { value: "listo", label: "Listo para vender" },
  { value: "descartado", label: "Descartado" },
];

export default function RecoleccionGalpon() {
  const [filtro, setFiltro] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ galponId: "", fecha: new Date().toISOString().slice(0, 10), cantidadKg: "", estado: "fresco", responsable: "", observaciones: "" });
  const { data, loading, refetch } = useQuery(ABONO_QUERY, { variables: { estado: filtro || null }, fetchPolicy: "network-only" });
  const { data: galponData } = useQuery(GALPONES_QUERY, { fetchPolicy: "network-only" });
  const [registrar, { loading: guardando }] = useMutation(REGISTRAR_ABONO);
  const filas = data?.generacionesAbono ?? [];

  async function submit(e) {
    e.preventDefault(); setError("");
    try {
      await registrar({ variables: { ...form, cantidadKg: Number(form.cantidadKg), loteId: null } });
      setModalOpen(false); setForm({ galponId: "", fecha: new Date().toISOString().slice(0, 10), cantidadKg: "", estado: "fresco", responsable: "", observaciones: "" }); await refetch();
    } catch (err) { setError(err.message); }
  }

  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-black text-dark">Recolección por galpón</h2><p className="text-gray-500">Historial original de generación y tratamiento.</p></div><button className="btn-primary" onClick={() => setModalOpen(true)}>Registrar recolección</button></div>
    <div className="flex flex-wrap gap-2"><button className={`rounded-xl px-4 py-2 font-bold ${!filtro ? "bg-brand-500 text-white" : "bg-white border"}`} onClick={() => setFiltro("")}>Todos</button>{ESTADOS.map(e => <button key={e.value} className={`rounded-xl px-4 py-2 font-bold ${filtro === e.value ? "bg-brand-500 text-white" : "bg-white border"}`} onClick={() => setFiltro(e.value)}>{e.label}</button>)}</div>
    <div className="card overflow-x-auto p-0"><table className="w-full text-left"><thead className="bg-brand-50 text-brand-800"><tr>{["Fecha", "Galpón", "Cantidad", "Estado", "Responsable"].map(h => <th key={h} className="p-4">{h}</th>)}</tr></thead><tbody>{loading ? <tr><td className="p-6" colSpan={5}>Cargando…</td></tr> : filas.map(g => <tr key={g.id} className="border-t"><td className="p-4">{g.fecha}</td><td className="p-4">#{g.galponId}</td><td className="p-4">{Number(g.cantidadKg).toFixed(2)} kg</td><td className="p-4">{ESTADOS.find(e => e.value === g.estado)?.label || g.estado}</td><td className="p-4">{g.responsable || "—"}</td></tr>)}{!loading && !filas.length && <tr><td colSpan={5} className="p-8 text-center text-gray-500">Sin registros.</td></tr>}</tbody></table></div>
    {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6"><h3 className="text-xl font-black">Registrar recolección</h3><select className="input-field" required value={form.galponId} onChange={e => setForm({ ...form, galponId: e.target.value })}><option value="">Selecciona galpón</option>{galponData?.galpones?.map(g => <option key={g.id} value={g.id}>{g.codigo}</option>)}</select><div className="grid grid-cols-2 gap-3"><input className="input-field" type="date" required value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })}/><input className="input-field" type="number" min="0.01" step="0.01" placeholder="Cantidad kg" required value={form.cantidadKg} onChange={e => setForm({ ...form, cantidadKg: e.target.value })}/></div><select className="input-field" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>{ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}</select><input className="input-field" placeholder="Responsable" value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })}/><textarea className="input-field" placeholder="Observaciones" value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })}/>{error && <p className="text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button><button disabled={guardando} className="btn-primary">{guardando ? "Guardando…" : "Guardar"}</button></div></form></div>}
  </section>;
}
