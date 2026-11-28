// frontend/src/pages/Aves.jsx
import { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { ModuloGate } from "../components/ModuloGate";

const LOTES = gql`query { lotes { id codigo etapa avesActuales } }`;
const PESOS = gql`
  query PesosLote($loteId: ID!) {
    pesosLote(loteId: $loteId) { id fecha pesoPromedioKg muestras observaciones }
  }
`;
const COSTO = gql`
  query CostoLote($loteId: ID!) {
    costoLote(loteId: $loteId) {
      alimentoTotal medicinasTotal vacunasTotal manoObraTotal
      huevosProducidos costoPorHuevo costoTotal
    }
  }
`;

const CREAR_PESO = gql`
  mutation RegistrarPeso($loteId: ID!, $fecha: Date!, $peso: Decimal!, $muestras: Int) {
    registrarPeso(loteId: $loteId, fecha: $fecha, pesoPromedioKg: $peso, muestras: $muestras) {
      id fecha pesoPromedioKg
    }
  }
`;

const ACT_COSTO = gql`
  mutation ActCosto($loteId: ID!, $alimento: Decimal, $medicinas: Decimal, $vacunas: Decimal, $manoObra: Decimal) {
    actualizarCostoLote(
      loteId: $loteId, alimentoTotal: $alimento, medicinasTotal: $medicinas,
      vacunasTotal: $vacunas, manoObraTotal: $manoObra
    ) {
      alimentoTotal medicinasTotal vacunasTotal manoObraTotal costoTotal costoPorHuevo
    }
  }
`;

const TABS = ["Crecimiento", "Costos", "Incubación", "Ventas"];

export default function Aves() {
  const [tab, setTab] = useState("Crecimiento");
  return (
    <ModuloGate codigo="aves">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Aves + Trazabilidad</h1>
        <div className="flex gap-2 mb-6 border-b">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 ${tab === t ? "border-b-2 border-blue-600 font-semibold" : ""}`}>
              {t}
            </button>
          ))}
        </div>
        {tab === "Crecimiento" && <TabCrecimiento />}
        {tab === "Costos" && <TabCostos />}
        {tab === "Incubación" && <p>Incubación (UI pendiente)</p>}
        {tab === "Ventas" && <p>Ventas de aves (UI pendiente)</p>}
      </div>
    </ModuloGate>
  );
}

function TabCrecimiento() {
  const { data: lotes } = useQuery(LOTES);
  const [loteId, setLoteId] = useState("");
  const { data, loading } = useQuery(PESOS, { variables: { loteId }, skip: !loteId });
  const [crearPeso] = useMutation(CREAR_PESO, {
    refetchQueries: ["PesosLote"],
  });
  const [form, setForm] = useState({ fecha: "", peso: "", muestras: "" });

  const submit = async (e) => {
    e.preventDefault();
    await crearPeso({
      variables: {
        loteId, fecha: form.fecha,
        peso: form.peso, muestras: parseInt(form.muestras) || 0,
      },
    });
    setForm({ fecha: "", peso: "", muestras: "" });
  };

  return (
    <div className="space-y-4 max-w-xl">
      <select value={loteId} onChange={e => setLoteId(e.target.value)} className="w-full border p-2 rounded">
        <option value="">— Selecciona lote —</option>
        {lotes?.lotes.map(l => <option key={l.id} value={l.id}>{l.codigo} ({l.etapa})</option>)}
      </select>

      {loteId && (
        <>
          <form onSubmit={submit} className="grid grid-cols-3 gap-2">
            <input required type="date" value={form.fecha}
              onChange={e => setForm({ ...form, fecha: e.target.value })}
              className="border p-2 rounded" />
            <input required type="number" step="0.01" placeholder="Peso kg"
              value={form.peso}
              onChange={e => setForm({ ...form, peso: e.target.value })}
              className="border p-2 rounded" />
            <input type="number" placeholder="Muestras"
              value={form.muestras}
              onChange={e => setForm({ ...form, muestras: e.target.value })}
              className="border p-2 rounded" />
            <button className="col-span-3 bg-blue-600 text-white px-4 py-2 rounded">
              Registrar peso
            </button>
          </form>

          {loading ? <p>Cargando…</p> : (
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Fecha</th>
                  <th className="p-2 text-left">Peso (kg)</th>
                  <th className="p-2 text-left">Muestras</th>
                </tr>
              </thead>
              <tbody>
                {data?.pesosLote?.map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{p.fecha}</td>
                    <td className="p-2">{p.pesoPromedioKg}</td>
                    <td className="p-2">{p.muestras}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

function TabCostos() {
  const { data: lotes } = useQuery(LOTES);
  const [loteId, setLoteId] = useState("");
  const { data, loading } = useQuery(COSTO, { variables: { loteId }, skip: !loteId });
  const [actCosto] = useMutation(ACT_COSTO, {
    refetchQueries: ["CostoLote"],
  });
  const [form, setForm] = useState({ alimento: "", medicinas: "", vacunas: "", manoObra: "" });

  const submit = async (e) => {
    e.preventDefault();
    await actCosto({
      variables: {
        loteId,
        alimento: form.alimento || null,
        medicinas: form.medicinas || null,
        vacunas: form.vacunas || null,
        manoObra: form.manoObra || null,
      },
    });
  };

  return (
    <div className="space-y-4 max-w-xl">
      <select value={loteId} onChange={e => setLoteId(e.target.value)} className="w-full border p-2 rounded">
        <option value="">— Selecciona lote —</option>
        {lotes?.lotes.map(l => <option key={l.id} value={l.id}>{l.codigo}</option>)}
      </select>

      {loteId && (
        <>
          <form onSubmit={submit} className="grid grid-cols-2 gap-2">
            <input type="number" step="0.01" placeholder="Alimento total"
              value={form.alimento}
              onChange={e => setForm({ ...form, alimento: e.target.value })}
              className="border p-2 rounded" />
            <input type="number" step="0.01" placeholder="Medicinas total"
              value={form.medicinas}
              onChange={e => setForm({ ...form, medicinas: e.target.value })}
              className="border p-2 rounded" />
            <input type="number" step="0.01" placeholder="Vacunas total"
              value={form.vacunas}
              onChange={e => setForm({ ...form, vacunas: e.target.value })}
              className="border p-2 rounded" />
            <input type="number" step="0.01" placeholder="Mano de obra"
              value={form.manoObra}
              onChange={e => setForm({ ...form, manoObra: e.target.value })}
              className="border p-2 rounded" />
            <button className="col-span-2 bg-blue-600 text-white px-4 py-2 rounded">
              Guardar y recalcular
            </button>
          </form>

          {loading ? <p>Cargando…</p> : data?.costoLote ? (
            <div className="border rounded p-4 space-y-1">
              <p><strong>Alimento:</strong> {data.costoLote.alimentoTotal}</p>
              <p><strong>Medicinas:</strong> {data.costoLote.medicinasTotal}</p>
              <p><strong>Vacunas:</strong> {data.costoLote.vacunasTotal}</p>
              <p><strong>Mano de obra:</strong> {data.costoLote.manoObraTotal}</p>
              <p><strong>Total:</strong> {data.costoLote.costoTotal}</p>
              <p><strong>Huevos producidos:</strong> {data.costoLote.huevosProducidos}</p>
              <p><strong>Costo por huevo:</strong> {data.costoLote.costoPorHuevo}</p>
            </div>
          ) : <p>Sin datos de costo aún.</p>}
        </>
      )}
    </div>
  );
}