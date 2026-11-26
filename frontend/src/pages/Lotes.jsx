import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Egg, Plus } from "lucide-react";
import { LOTES_QUERY, CREAR_LOTE } from "../graphql/lotes";
import { GALPONES_QUERY } from "../graphql/galpones";
import Modal from "../components/Modal";

const ETAPAS = [
  { value: "cria", label: "Cría (0-6 semanas)" },
  { value: "recria", label: "Recría (6-18 semanas)" },
  { value: "postura", label: "Postura (18-80 semanas)" },
  { value: "descarte", label: "Descarte (>80 semanas)" },
];

const RAZAS = [
  "Hy-Line Brown", "Lohmann Brown", "Isa Brown", "Babcock Brown", "Otra",
];

export default function Lotes() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    galponId: "",
    codigo: "",
    raza: "Hy-Line Brown",
    fechaIngreso: new Date().toISOString().split("T")[0],
    cantidadAves: "",
    etapa: "cria",
  });
  const [error, setError] = useState("");

  const { data: galponesData } = useQuery(GALPONES_QUERY);
  const { data, loading, refetch } = useQuery(LOTES_QUERY, {
    fetchPolicy: "network-only",
  });
  const [crearLote, { loading: creando }] = useMutation(CREAR_LOTE);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await crearLote({
        variables: {
          galponId: form.galponId,
          codigo: form.codigo,
          raza: form.raza,
          fechaIngreso: form.fechaIngreso,
          cantidadAves: parseInt(form.cantidadAves, 10),
          etapa: form.etapa,
        },
      });
      setModalOpen(false);
      setForm({
        galponId: "",
        codigo: "",
        raza: "Hy-Line Brown",
        fechaIngreso: new Date().toISOString().split("T")[0],
        cantidadAves: "",
        etapa: "cria",
      });
      refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const galpones = galponesData?.galpones ?? [];
  const lotes = data?.lotes ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
            <Egg className="w-8 h-8 text-brand-500" /> Lotes
          </h1>
          <p className="text-gray-500 text-base mt-1 font-medium">
            Administra los lotes de aves
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus className="w-5 h-5" /> Nuevo lote
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-gray-500">Cargando lotes...</div>
      ) : lotes.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No hay lotes registrados.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lotes.map((l) => (
            <div key={l.id} className="card relative">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Egg className="w-6 h-6" />
                </div>
                <span className="badge-info">{l.etapa}</span>
              </div>
              <h3 className="text-xl font-black text-dark">Lote {l.codigo}</h3>
              <p className="text-sm text-gray-500 font-bold mb-3">{l.raza}</p>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Aves iniciales: <strong>{Number(l.cantidadAves).toLocaleString()}</strong></p>
                <p>Aves actuales: <strong>{l.avesActuales}</strong></p>
                <p>Ingreso: {new Date(l.fechaIngreso).toLocaleDateString("es-BO")}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo lote">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Galpón *</label>
            <select name="galponId" className="input-field" value={form.galponId} onChange={onChange} required>
              <option value="">Selecciona un galpón</option>
              {galpones.map((g) => (
                <option key={g.id} value={g.id}>Galpón {g.codigo} (Cap: {g.capacidadAves})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Código *</label>
            <input name="codigo" className="input-field" value={form.codigo} onChange={onChange} required placeholder="Ej: L-01" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Raza *</label>
            <select name="raza" className="input-field" value={form.raza} onChange={onChange} required>
              {RAZAS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Fecha de ingreso *</label>
            <input type="date" name="fechaIngreso" className="input-field" value={form.fechaIngreso} onChange={onChange} required />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Cantidad de aves *</label>
            <input type="number" name="cantidadAves" className="input-field" value={form.cantidadAves} onChange={onChange} required min="1" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Etapa *</label>
            <select name="etapa" className="input-field" value={form.etapa} onChange={onChange} required>
              {ETAPAS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={creando} className="btn-primary">
              {creando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}