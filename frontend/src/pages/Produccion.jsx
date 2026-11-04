import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { Egg, Calendar, TrendingUp } from "lucide-react";
import { PRODUCCIONES_QUERY, REGISTRAR_PRODUCCION } from "../graphql/produccion";

const LOTES_QUERY = gql`
  query LotesParaProduccion {
    lotes { id codigo raza estado }
  }
`;

const FORM_VACIO = {
  loteId: "",
  fecha: new Date().toISOString().split("T")[0],
  huevosPrimera: 0,
  huevosSegunda: 0,
  huevosTercera: 0,
  huevosDescartados: 0,
};

export default function Produccion() {
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const { data: dataLotes } = useQuery(LOTES_QUERY, { fetchPolicy: "network-only" });
  const { data, loading, refetch } = useQuery(PRODUCCIONES_QUERY, { fetchPolicy: "network-only" });
  const [registrar, { loading: guardando }] = useMutation(REGISTRAR_PRODUCCION);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "loteId" || name === "fecha" ? value : parseInt(value) || 0 });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");
    if (!form.loteId) {
      setError("Debes seleccionar un lote.");
      return;
    }
    try {
      await registrar({
        variables: {
          loteId: form.loteId,
          fecha: form.fecha,
          huevosPrimera: form.huevosPrimera,
          huevosSegunda: form.huevosSegunda,
          huevosTercera: form.huevosTercera,
          huevosDescartados: form.huevosDescartados,
        },
      });
      setExito("Producción registrada correctamente.");
      setForm({ ...FORM_VACIO, loteId: form.loteId });
      refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const total = form.huevosPrimera + form.huevosSegunda + form.huevosTercera + form.huevosDescartados;
  const producciones = data?.producciones ?? [];
  const totalHoy = producciones.filter(p => p.fecha === new Date().toISOString().split("T")[0]).reduce((a, p) => a + p.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
            <Egg className="w-8 h-8 text-brand-500" /> Producción
          </h1>
          <p className="text-gray-500 text-base mt-1 font-medium">Registra la recolección de huevos por lote y fecha</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1">
          <h2 className="text-xl font-black text-dark mb-4">Registrar producción</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Lote *</label>
              <select name="loteId" className="input-field" value={form.loteId} onChange={onChange} required>
                <option value="">Selecciona un lote</option>
                {dataLotes?.lotes?.map(l => (
                  <option key={l.id} value={l.id}>{l.codigo} — {l.raza}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Fecha *</label>
              <input type="date" name="fecha" className="input-field" value={form.fecha} onChange={onChange} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Primera</label>
                <input type="number" name="huevosPrimera" className="input-field" value={form.huevosPrimera} onChange={onChange} min="0" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Segunda</label>
                <input type="number" name="huevosSegunda" className="input-field" value={form.huevosSegunda} onChange={onChange} min="0" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Tercera</label>
                <input type="number" name="huevosTercera" className="input-field" value={form.huevosTercera} onChange={onChange} min="0" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Descartados</label>
                <input type="number" name="huevosDescartados" className="input-field" value={form.huevosDescartados} onChange={onChange} min="0" />
              </div>
            </div>
            <div className="bg-brand-50 p-4 rounded-xl border border-brand-100">
              <p className="text-sm font-bold text-brand-800">Total de huevos</p>
              <p className="text-3xl font-black text-brand-700">{total.toLocaleString()}</p>
            </div>
            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
            {exito && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg border border-green-200">{exito}</div>}
            <button type="submit" disabled={guardando} className="btn-primary w-full">
              {guardando ? "Guardando..." : "Guardar producción"}
            </button>
          </form>
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-dark">Historial de producción</h2>
              <p className="text-sm text-gray-500 mt-1">{producciones.length} registros</p>
            </div>
            <div className="bg-brand-50 px-4 py-2 rounded-xl">
              <p className="text-xs font-bold text-brand-700 uppercase">Hoy</p>
              <p className="text-2xl font-black text-brand-700">{totalHoy.toLocaleString()}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-50 text-brand-800 uppercase text-xs tracking-wider">
                <tr>
                  <th className="text-left p-3 font-bold">Fecha</th>
                  <th className="text-right p-3 font-bold">1ra</th>
                  <th className="text-right p-3 font-bold">2da</th>
                  <th className="text-right p-3 font-bold">3ra</th>
                  <th className="text-right p-3 font-bold">Desc.</th>
                  <th className="text-right p-3 font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-500">Cargando...</td></tr>
                ) : producciones.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-500">No hay registros aún.</td></tr>
                ) : (
                  producciones.map(p => (
                    <tr key={p.id} className="border-t border-gray-100 hover:bg-brand-50/30">
                      <td className="p-3 font-bold text-dark">{new Date(p.fecha).toLocaleDateString("es-BO")}</td>
                      <td className="p-3 text-right">{p.huevosPrimera.toLocaleString()}</td>
                      <td className="p-3 text-right">{p.huevosSegunda.toLocaleString()}</td>
                      <td className="p-3 text-right">{p.huevosTercera.toLocaleString()}</td>
                      <td className="p-3 text-right text-red-600">{p.huevosDescartados.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-brand-700">{p.total.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}