import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  Building2, Home, ClipboardList, Plus, MapPin, Phone, Mail,
  CheckCircle, XCircle, Egg,
} from "lucide-react";
import { GRANJAS_QUERY, CREAR_GRANJA } from "../graphql/granjas";
import { GALPONES_QUERY, CREAR_GALPON } from "../graphql/galpones";
import { LOTES_QUERY, CREAR_LOTE } from "../graphql/lotes";
import { useGranja } from "../context/GranjaContext";
import Modal from "../components/Modal";

const TABS = [
  { key: "granjas", label: "Granjas", icon: Building2 },
  { key: "galpones", label: "Galpones", icon: Home },
  { key: "lotes", label: "Lotes", icon: ClipboardList },
];

const ETAPAS = [
  { value: "cria", label: "Cría (0-6 semanas)" },
  { value: "recria", label: "Recría (6-18 semanas)" },
  { value: "postura", label: "Postura (18-80 semanas)" },
  { value: "descarte", label: "Descarte (>80 semanas)" },
];

const RAZAS = ["Hy-Line Brown", "Lohmann Brown", "Isa Brown", "Babcock Brown", "Otra"];

export default function Infraestructura() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabInicial = searchParams.get("tab") || "granjas";
  const [tab, setTab] = useState(tabInicial);
  const { granjaActiva } = useGranja();

  useEffect(() => {
    setSearchParams({ tab }, { replace: true });
  }, [tab, setSearchParams]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
          <Building2 className="w-8 h-8 text-brand-500" /> Infraestructura
        </h1>
        <p className="text-gray-500 text-base mt-1 font-medium">
          {granjaActiva
            ? `Mostrando datos de: ${granjaActiva.codigo} - ${granjaActiva.nombre}`
            : "Administra granjas, galpones y lotes"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${
                active
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-white" : "text-gray-400"}`} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "granjas" && <TabGranjas />}
      {tab === "galpones" && <TabGalpones />}
      {tab === "lotes" && <TabLotes />}
    </div>
  );
}

// ============================================================
// TAB GRANJAS
// ============================================================
function TabGranjas() {
  const { data, loading, refetch } = useQuery(GRANJAS_QUERY, { fetchPolicy: "network-only" });
  const [crearGranja, { loading: creando }] = useMutation(CREAR_GRANJA);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", codigo: "", ubicacion: "", telefono: "", email: "" });
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await crearGranja({ variables: form });
      setModalOpen(false);
      setForm({ nombre: "", codigo: "", ubicacion: "", telefono: "", email: "" });
      refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const granjas = data?.granjas ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus className="w-5 h-5" /> Nueva granja
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-gray-500">Cargando granjas...</div>
      ) : granjas.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No hay granjas registradas.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {granjas.map((g) => (
            <div key={g.id} className="card relative hover:border-brand-200 transition-colors">
              <Link to={`/granjas/${g.id}`} className="block">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-black text-lg">
                    {g.codigo.slice(0, 3)}
                  </div>
                  <span className={g.activo ? "badge-success" : "badge-danger"}>
                    {g.activo ? "Activa" : "Suspendida"}
                  </span>
                </div>
                <h3 className="text-xl font-black text-dark">{g.nombre}</h3>
                <p className="text-sm text-gray-500 font-bold mb-3">Código: {g.codigo}</p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> {g.ubicacion}</p>
                  {g.telefono && <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> {g.telefono}</p>}
                  {g.email && <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> {g.email}</p>}
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva granja">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Nombre *</label>
            <input className="input-field" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Código *</label>
            <input className="input-field" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} required placeholder="Ej: GLP-001" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Ubicación *</label>
            <input className="input-field" value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Teléfono</label>
              <input className="input-field" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Email</label>
              <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={creando} className="btn-primary">{creando ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ============================================================
// TAB GALPONES
// ============================================================
function TabGalpones() {
  const { granjaActiva } = useGranja();
  const { data: granjasData } = useQuery(GRANJAS_QUERY);
  const { data, loading, refetch } = useQuery(GALPONES_QUERY, {
    variables: { granjaId: granjaActiva?.id || undefined },
    fetchPolicy: "network-only",
  });
  const [crearGalpon, { loading: creando }] = useMutation(CREAR_GALPON);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ granjaId: "", codigo: "", capacidadAves: "" });
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await crearGalpon({
        variables: {
          granjaId: form.granjaId,
          codigo: form.codigo,
          capacidadAves: parseInt(form.capacidadAves, 10),
        },
      });
      setModalOpen(false);
      setForm({ granjaId: "", codigo: "", capacidadAves: "" });
      refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const abrirModal = () => {
    setForm({ granjaId: granjaActiva?.id || "", codigo: "", capacidadAves: "" });
    setError("");
    setModalOpen(true);
  };

  const galpones = data?.galpones ?? [];
  const granjas = granjasData?.granjas ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={abrirModal} className="btn-primary">
          <Plus className="w-5 h-5" /> Nuevo galpón
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-gray-500">Cargando galpones...</div>
      ) : galpones.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          {granjaActiva ? `No hay galpones en ${granjaActiva.nombre}.` : "No hay galpones registrados."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galpones.map((gal) => (
            <div key={gal.id} className="card relative">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Home className="w-6 h-6" />
                </div>
                <span className={gal.activo ? "badge-success" : "badge-danger"}>
                  {gal.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <h3 className="text-xl font-black text-dark">Galpón {gal.codigo}</h3>
              <p className="text-sm text-gray-500 font-bold mb-3">Capacidad: {Number(gal.capacidadAves).toLocaleString()} aves</p>
              <p className="text-sm text-gray-600">Aves actuales: <strong>{gal.avesActuales}</strong></p>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo galpón">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Granja *</label>
            <select className="input-field" value={form.granjaId} onChange={(e) => setForm({ ...form, granjaId: e.target.value })} required>
              <option value="">Selecciona una granja</option>
              {granjas.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre} ({g.codigo})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Código *</label>
            <input className="input-field" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} required placeholder="Ej: G-01" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Capacidad de aves *</label>
            <input type="number" className="input-field" value={form.capacidadAves} onChange={(e) => setForm({ ...form, capacidadAves: e.target.value })} required min="1" placeholder="Ej: 1000" />
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={creando} className="btn-primary">{creando ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ============================================================
// TAB LOTES
// ============================================================
function TabLotes() {
  const { granjaActiva } = useGranja();
  const { data: galponesData } = useQuery(GALPONES_QUERY, {
    variables: { granjaId: granjaActiva?.id || undefined },
  });
  const { data, loading, refetch } = useQuery(LOTES_QUERY, { fetchPolicy: "network-only" });
  const [crearLote, { loading: creando }] = useMutation(CREAR_LOTE);
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

  const abrirModal = () => {
    setForm({
      galponId: "",
      codigo: "",
      raza: "Hy-Line Brown",
      fechaIngreso: new Date().toISOString().split("T")[0],
      cantidadAves: "",
      etapa: "cria",
    });
    setError("");
    setModalOpen(true);
  };

  // Filtrado cliente por granja activa
  const todosLotes = data?.lotes ?? [];
  const lotes = granjaActiva
    ? todosLotes.filter((l) => String(l.granjaId) === String(granjaActiva.id))
    : todosLotes;
  const galpones = galponesData?.galpones ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={abrirModal} className="btn-primary">
          <Plus className="w-5 h-5" /> Nuevo lote
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-gray-500">Cargando lotes...</div>
      ) : lotes.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          {granjaActiva ? `No hay lotes en ${granjaActiva.nombre}.` : "No hay lotes registrados."}
        </div>
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
            <select className="input-field" value={form.galponId} onChange={(e) => setForm({ ...form, galponId: e.target.value })} required>
              <option value="">Selecciona un galpón</option>
              {galpones.map((g) => (
                <option key={g.id} value={g.id}>Galpón {g.codigo} (Cap: {g.capacidadAves})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Código *</label>
            <input className="input-field" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} required placeholder="Ej: L-01" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Raza *</label>
            <select className="input-field" value={form.raza} onChange={(e) => setForm({ ...form, raza: e.target.value })} required>
              {RAZAS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Fecha de ingreso *</label>
            <input type="date" className="input-field" value={form.fechaIngreso} onChange={(e) => setForm({ ...form, fechaIngreso: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Cantidad de aves *</label>
            <input type="number" className="input-field" value={form.cantidadAves} onChange={(e) => setForm({ ...form, cantidadAves: e.target.value })} required min="1" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Etapa *</label>
            <select className="input-field" value={form.etapa} onChange={(e) => setForm({ ...form, etapa: e.target.value })} required>
              {ETAPAS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={creando} className="btn-primary">{creando ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}