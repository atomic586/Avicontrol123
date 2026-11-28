// frontend/src/pages/Sanidad.jsx
import { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { ModuloGate } from "../components/ModuloGate";
import {
  AlertTriangle, Syringe, Pill, Sparkles, Rat,
  Plus, CheckCircle2, Clock, Calendar, X, ShieldAlert
} from "lucide-react";

// ============================================================
// QUERIES
// ============================================================
const LOTES_QUERY = gql`
  query LotesSanidad {
    lotes {
      id
      codigo
      etapa
      avesActuales
    }
  }
`;

const GALPONES_QUERY = gql`
  query GalponesSanidad {
    galpones {
      id
      codigo
      granjaId
    }
  }
`;

const VACUNAS_QUERY = gql`
  query Vacunas {
    vacunas(soloActivas: false) {
      id
      nombre
      enfermedad
      tipo
      laboratorio
      dosisRecomendada
      viaAdministracion
      periodoRetiroDias
      activo
    }
  }
`;

const ALERTAS_QUERY = gql`
  query AlertasSanitarias {
    alertasSanitarias {
      tipo
      severidad
      mensaje
      referenciaId
      fechaReferencia
    }
  }
`;

const PLAN_QUERY = gql`
  query PlanSanitarioLote($loteId: ID!, $soloPendientes: Boolean) {
    planSanitarioLote(loteId: $loteId, soloPendientes: $soloPendientes) {
      id
      fechaProgramada
      dosis
      aplicada
      fechaAplicacion
      responsable
      observaciones
      vacuna {
        id
        nombre
        enfermedad
      }
    }
  }
`;

const TRATAMIENTOS_QUERY = gql`
  query TratamientosLote($loteId: ID!, $soloActivos: Boolean) {
    tratamientosLote(loteId: $loteId, soloActivos: $soloActivos) {
      id
      dosis
      fechaInicio
      fechaFin
      periodoRetiroDias
      motivo
      completado
      medicamento {
        id
        nombre
      }
    }
  }
`;

const LIMPIEZAS_QUERY = gql`
  query LimpiezasGalpon($galponId: ID!, $dias: Int) {
    limpiezasGalpon(galponId: $galponId, dias: $dias) {
      id
      fecha
      tipo
      productosUsados
      responsable
    }
  }
`;

const ROEDORES_QUERY = gql`
  query ControlesRoedores($dias: Int) {
    controlesRoedores(dias: $dias) {
      id
      fecha
      tipo
      ubicacion
      productosUsados
      responsable
      observaciones
    }
  }
`;

const INSUMOS_MEDICAMENTOS_QUERY = gql`
  query MedicamentosDisponibles {
    insumos(tipo: "medicamento") {
      id
      nombre
      stock
    }
  }
`;

// ============================================================
// MUTATIONS
// ============================================================
const CREAR_VACUNA = gql`
  mutation CrearVacuna(
    $nombre: String!
    $enfermedad: String!
    $tipo: String!
    $laboratorio: String
    $dosisRecomendada: String
    $viaAdministracion: String
    $periodoRetiroDias: Int
  ) {
    crearVacuna(
      nombre: $nombre
      enfermedad: $enfermedad
      tipo: $tipo
      laboratorio: $laboratorio
      dosisRecomendada: $dosisRecomendada
      viaAdministracion: $viaAdministracion
      periodoRetiroDias: $periodoRetiroDias
    ) {
      id
      nombre
    }
  }
`;

const CREAR_PLAN = gql`
  mutation CrearPlanSanitario(
    $loteId: ID!
    $vacunaId: ID!
    $fechaProgramada: Date!
    $dosis: String
    $responsable: String
    $observaciones: String
  ) {
    crearPlanSanitario(
      loteId: $loteId
      vacunaId: $vacunaId
      fechaProgramada: $fechaProgramada
      dosis: $dosis
      responsable: $responsable
      observaciones: $observaciones
    ) {
      id
    }
  }
`;

const APLICAR_VACUNA = gql`
  mutation AplicarVacuna($planId: ID!, $fechaAplicacion: Date, $responsable: String) {
    aplicarVacuna(planId: $planId, fechaAplicacion: $fechaAplicacion, responsable: $responsable) {
      id
      aplicada
      fechaAplicacion
    }
  }
`;

const CREAR_TRATAMIENTO = gql`
  mutation CrearTratamiento(
    $loteId: ID!
    $medicamentoId: ID!
    $dosis: String!
    $fechaInicio: Date!
    $fechaFin: Date
    $periodoRetiroDias: Int
    $motivo: String
  ) {
    crearTratamiento(
      loteId: $loteId
      medicamentoId: $medicamentoId
      dosis: $dosis
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      periodoRetiroDias: $periodoRetiroDias
      motivo: $motivo
    ) {
      id
    }
  }
`;

const COMPLETAR_TRATAMIENTO = gql`
  mutation CompletarTratamiento($id: ID!, $fechaFin: Date) {
    completarTratamiento(id: $id, fechaFin: $fechaFin) {
      id
      completado
    }
  }
`;

const REGISTRAR_LIMPIEZA = gql`
  mutation RegistrarLimpieza(
    $galponId: ID!
    $fecha: Date!
    $tipo: String!
    $productosUsados: String
    $responsable: String
  ) {
    registrarLimpieza(
      galponId: $galponId
      fecha: $fecha
      tipo: $tipo
      productosUsados: $productosUsados
      responsable: $responsable
    ) {
      id
    }
  }
`;

const REGISTRAR_ROEDORES = gql`
  mutation RegistrarControlRoedores(
    $fecha: Date!
    $ubicacion: String!
    $tipo: String
    $productosUsados: String
    $responsable: String
    $observaciones: String
  ) {
    registrarControlRoedores(
      fecha: $fecha
      ubicacion: $ubicacion
      tipo: $tipo
      productosUsados: $productosUsados
      responsable: $responsable
      observaciones: $observaciones
    ) {
      id
    }
  }
`;

// ============================================================
// CONSTANTES
// ============================================================
const TABS = [
  { key: "alertas", label: "Alertas", icon: AlertTriangle },
  { key: "plan", label: "Plan Sanitario", icon: Syringe },
  { key: "tratamientos", label: "Tratamientos", icon: Pill },
  { key: "limpieza", label: "Limpieza", icon: Sparkles },
  { key: "roedores", label: "Control de Roedores", icon: Rat },
];

const SEVERIDAD_CONFIG = {
  alta: { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-500/30" },
  media: { bg: "bg-yellow-500/10", text: "text-yellow-600", border: "border-yellow-500/30" },
  baja: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/30" },
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function Sanidad() {
  const [tab, setTab] = useState("alertas");

  return (
    <ModuloGate codigo="sanidad">
      <div className="space-y-6">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-3xl bg-[var(--bg-sidebar)] p-8 shadow-lg">
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-4 bg-[var(--accent)] rounded-2xl shadow-lg">
              <ShieldAlert className="w-10 h-10 text-black" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Sanidad + Bioseguridad
              </h1>
              <p className="text-white/80 text-lg mt-1">
                Plan sanitario, tratamientos, limpieza y control SENASAG
              </p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 overflow-x-auto border-b border-[var(--border-color)] pb-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-sm whitespace-nowrap transition-colors ${
                  tab === t.key
                    ? "bg-[var(--accent)] text-[var(--accent-text)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-card)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* CONTENIDO */}
        {tab === "alertas" && <TabAlertas />}
        {tab === "plan" && <TabPlanSanitario />}
        {tab === "tratamientos" && <TabTratamientos />}
        {tab === "limpieza" && <TabLimpieza />}
        {tab === "roedores" && <TabRoedores />}
      </div>
    </ModuloGate>
  );
}

// ============================================================
// TAB 1: ALERTAS
// ============================================================
function TabAlertas() {
  const { data, loading, error, refetch } = useQuery(ALERTAS_QUERY, {
    fetchPolicy: "network-only",
  });

  if (loading) return <p className="text-[var(--text-secondary)]">Cargando alertas…</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  const alertas = data?.alertasSanitarias || [];

  const grouped = alertas.reduce((acc, a) => {
    if (!acc[a.severidad]) acc[a.severidad] = [];
    acc[a.severidad].push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          {alertas.length} alerta{alertas.length !== 1 ? "s" : ""} activa{alertas.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => refetch()}
          className="text-sm font-bold text-[var(--accent)] hover:underline"
        >
          Refrescar
        </button>
      </div>

      {alertas.length === 0 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-lg font-bold text-green-600">Sin alertas pendientes</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Todos los protocolos sanitarios están al día
          </p>
        </div>
      )}

      {["alta", "media", "baja"].map((sev) => {
        const items = grouped[sev] || [];
        if (items.length === 0) return null;
        const cfg = SEVERIDAD_CONFIG[sev];

        return (
          <div key={sev} className="space-y-2">
            <h3 className={`text-sm font-black uppercase tracking-wider ${cfg.text}`}>
              Severidad {sev} ({items.length})
            </h3>
            {items.map((a, idx) => (
              <div
                key={`${a.tipo}-${a.referenciaId}-${idx}`}
                className={`${cfg.bg} ${cfg.border} border rounded-xl p-4 flex items-start gap-3`}
              >
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.text}`} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{a.mensaje}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 capitalize">
                    {a.tipo.replaceAll("_", " ")}
                    {a.fechaReferencia && ` · ${a.fechaReferencia}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// TAB 2: PLAN SANITARIO
// ============================================================
function TabPlanSanitario() {
  const [loteId, setLoteId] = useState("");
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [modalVacunaOpen, setModalVacunaOpen] = useState(false);
  const [modalPlanOpen, setModalPlanOpen] = useState(false);

  const { data: lotesData } = useQuery(LOTES_QUERY);
  const { data: vacunasData, refetch: refetchVacunas } = useQuery(VACUNAS_QUERY);

  const { data, loading, refetch } = useQuery(PLAN_QUERY, {
    variables: { loteId, soloPendientes },
    skip: !loteId,
    fetchPolicy: "network-only",
  });

  const [aplicarVacuna] = useMutation(APLICAR_VACUNA, {
    refetchQueries: ["AlertasSanitarias"],
  });

  const planes = data?.planSanitarioLote || [];
  const lotes = lotesData?.lotes || [];
  const vacunas = vacunasData?.vacunas || [];

  const handleAplicar = async (planId) => {
    if (!window.confirm("¿Marcar esta vacuna como aplicada hoy?")) return;
    try {
      await aplicarVacuna({
        variables: { planId, fechaAplicacion: new Date().toISOString().split("T")[0] },
      });
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Selector de lote + botones */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <select
          value={loteId}
          onChange={(e) => setLoteId(e.target.value)}
          className="flex-1 input-field"
        >
          <option value="">— Selecciona lote —</option>
          {lotes.map((l) => (
            <option key={l.id} value={l.id}>
              {l.codigo} ({l.etapa}) · {l.avesActuales} aves
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] cursor-pointer">
          <input
            type="checkbox"
            checked={soloPendientes}
            onChange={(e) => setSoloPendientes(e.target.checked)}
            className="w-4 h-4"
          />
          Solo pendientes
        </label>

        <button
          onClick={() => setModalVacunaOpen(true)}
          className="btn-secondary flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nueva vacuna
        </button>

        <button
          onClick={() => setModalPlanOpen(true)}
          disabled={!loteId}
          className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Programar
        </button>
      </div>

      {/* Tabla */}
      {!loteId ? (
        <p className="text-[var(--text-secondary)] text-center py-8">
          Selecciona un lote para ver su plan sanitario
        </p>
      ) : loading ? (
        <p className="text-[var(--text-secondary)]">Cargando…</p>
      ) : planes.length === 0 ? (
        <p className="text-[var(--text-secondary)] text-center py-8">
          No hay vacunas programadas para este lote
        </p>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-main)] text-[var(--text-secondary)] text-xs uppercase">
              <tr>
                <th className="text-left p-3 font-bold">Fecha prog.</th>
                <th className="text-left p-3 font-bold">Vacuna</th>
                <th className="text-left p-3 font-bold">Enfermedad</th>
                <th className="text-left p-3 font-bold">Estado</th>
                <th className="text-right p-3 font-bold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {planes.map((p) => (
                <tr key={p.id} className="border-t border-[var(--border-color)]">
                  <td className="p-3">{p.fechaProgramada}</td>
                  <td className="p-3 font-bold">{p.vacuna.nombre}</td>
                  <td className="p-3">{p.vacuna.enfermedad}</td>
                  <td className="p-3">
                    {p.aplicada ? (
                      <span className="inline-flex items-center gap-1 text-green-600 font-bold text-xs bg-green-500/10 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Aplicada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-yellow-600 font-bold text-xs bg-yellow-500/10 px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3" /> Pendiente
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {!p.aplicada && (
                      <button
                        onClick={() => handleAplicar(p.id)}
                        className="text-xs font-bold text-[var(--accent)] hover:underline"
                      >
                        Marcar aplicada
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalVacunaOpen && (
        <ModalNuevaVacuna
          onClose={() => setModalVacunaOpen(false)}
          onSaved={() => {
            setModalVacunaOpen(false);
            refetchVacunas();
          }}
        />
      )}
      {modalPlanOpen && (
        <ModalNuevoPlan
          loteId={loteId}
          vacunas={vacunas}
          onClose={() => setModalPlanOpen(false)}
          onSaved={() => {
            setModalPlanOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// TAB 3: TRATAMIENTOS
// ============================================================
function TabTratamientos() {
  const [loteId, setLoteId] = useState("");
  const [soloActivos, setSoloActivos] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: lotesData } = useQuery(LOTES_QUERY);
  const { data: medsData } = useQuery(INSUMOS_MEDICAMENTOS_QUERY);
  const { data, loading, refetch } = useQuery(TRATAMIENTOS_QUERY, {
    variables: { loteId, soloActivos },
    skip: !loteId,
    fetchPolicy: "network-only",
  });
  const [completar] = useMutation(COMPLETAR_TRATAMIENTO, {
    refetchQueries: ["AlertasSanitarias"],
  });

  const tratamientos = data?.tratamientosLote || [];
  const lotes = lotesData?.lotes || [];
  const medicamentos = medsData?.insumos || [];

  const handleCompletar = async (id) => {
    if (!window.confirm("¿Marcar este tratamiento como completado?")) return;
    try {
      await completar({ variables: { id } });
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={loteId} onChange={(e) => setLoteId(e.target.value)} className="flex-1 input-field">
          <option value="">— Selecciona lote —</option>
          {lotes.map((l) => (
            <option key={l.id} value={l.id}>{l.codigo} ({l.etapa})</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] cursor-pointer">
          <input type="checkbox" checked={soloActivos} onChange={(e) => setSoloActivos(e.target.checked)} className="w-4 h-4" />
          Solo activos
        </label>

        <button onClick={() => setModalOpen(true)} disabled={!loteId} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Plus className="w-4 h-4" /> Nuevo tratamiento
        </button>
      </div>

      {!loteId ? (
        <p className="text-[var(--text-secondary)] text-center py-8">Selecciona un lote</p>
      ) : loading ? (
        <p className="text-[var(--text-secondary)]">Cargando…</p>
      ) : tratamientos.length === 0 ? (
        <p className="text-[var(--text-secondary)] text-center py-8">Sin tratamientos registrados</p>
      ) : (
        <div className="grid gap-3">
          {tratamientos.map((t) => {
            const enRetiro = !t.completado && t.periodoRetiroDias > 0;
            return (
              <div key={t.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Pill className="w-4 h-4 text-[var(--accent)]" />
                      <h3 className="font-bold text-[var(--text-primary)]">{t.medicamento.nombre}</h3>
                      {t.completado ? (
                        <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-bold">Completado</span>
                      ) : enRetiro ? (
                        <span className="text-xs bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> En retiro ({t.periodoRetiroDias}d)
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded-full font-bold">Activo</span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Dosis: <strong>{t.dosis}</strong> · Desde {t.fechaInicio}
                      {t.fechaFin && ` · Hasta ${t.fechaFin}`}
                    </p>
                    {t.motivo && <p className="text-xs text-[var(--text-secondary)] mt-1 italic">Motivo: {t.motivo}</p>}
                  </div>
                  {!t.completado && (
                    <button onClick={() => handleCompletar(t.id)} className="text-xs font-bold text-[var(--accent)] hover:underline whitespace-nowrap">
                      Completar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <ModalNuevoTratamiento
          loteId={loteId}
          medicamentos={medicamentos}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); refetch(); }}
        />
      )}
    </div>
  );
}

// ============================================================
// TAB 4: LIMPIEZA
// ============================================================
function TabLimpieza() {
  const [galponId, setGalponId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { data: galponesData } = useQuery(GALPONES_QUERY);
  const { data, loading, refetch } = useQuery(LIMPIEZAS_QUERY, {
    variables: { galponId, dias: 90 },
    skip: !galponId,
    fetchPolicy: "network-only",
  });

  const galpones = galponesData?.galpones || [];
  const limpiezas = data?.limpiezasGalpon || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={galponId} onChange={(e) => setGalponId(e.target.value)} className="flex-1 input-field">
          <option value="">— Selecciona galpón —</option>
          {galpones.map((g) => (
            <option key={g.id} value={g.id}>{g.codigo}</option>
          ))}
        </select>
        <button onClick={() => setModalOpen(true)} disabled={!galponId} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Plus className="w-4 h-4" /> Registrar limpieza
        </button>
      </div>

      {!galponId ? (
        <p className="text-[var(--text-secondary)] text-center py-8">Selecciona un galpón</p>
      ) : loading ? (
        <p className="text-[var(--text-secondary)]">Cargando…</p>
      ) : limpiezas.length === 0 ? (
        <p className="text-[var(--text-secondary)] text-center py-8">Sin registros en los últimos 90 días</p>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-main)] text-[var(--text-secondary)] text-xs uppercase">
              <tr>
                <th className="text-left p-3">Fecha</th>
                <th className="text-left p-3">Tipo</th>
                <th className="text-left p-3">Productos</th>
                <th className="text-left p-3">Responsable</th>
              </tr>
            </thead>
            <tbody>
              {limpiezas.map((l) => (
                <tr key={l.id} className="border-t border-[var(--border-color)]">
                  <td className="p-3">{l.fecha}</td>
                  <td className="p-3 capitalize font-bold">{l.tipo.replaceAll("_", " ")}</td>
                  <td className="p-3 text-[var(--text-secondary)]">{l.productosUsados || "—"}</td>
                  <td className="p-3">{l.responsable || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <ModalLimpieza
          galponId={galponId}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); refetch(); }}
        />
      )}
    </div>
  );
}

// ============================================================
// TAB 5: ROEDORES
// ============================================================
function TabRoedores() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data, loading, refetch } = useQuery(ROEDORES_QUERY, {
    variables: { dias: 90 },
    fetchPolicy: "network-only",
  });

  const controles = data?.controlesRoedores || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Registrar control
        </button>
      </div>

      {loading ? (
        <p className="text-[var(--text-secondary)]">Cargando…</p>
      ) : controles.length === 0 ? (
        <p className="text-[var(--text-secondary)] text-center py-8">Sin controles en los últimos 90 días</p>
      ) : (
        <div className="grid gap-3">
          {controles.map((c) => (
            <div key={c.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Rat className="w-4 h-4 text-[var(--accent)]" />
                    <h3 className="font-bold">{c.ubicacion}</h3>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {c.fecha} {c.tipo && `· ${c.tipo}`} {c.responsable && `· ${c.responsable}`}
                  </p>
                  {c.productosUsados && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Productos: {c.productosUsados}</p>
                  )}
                  {c.observaciones && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1 italic">{c.observaciones}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <ModalRoedores
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); refetch(); }}
        />
      )}
    </div>
  );
}

// ============================================================
// MODALES
// ============================================================
function ModalNuevaVacuna({ onClose, onSaved }) {
  const [crear, { loading }] = useMutation(CREAR_VACUNA);
  const [form, setForm] = useState({
    nombre: "", enfermedad: "", tipo: "viva",
    laboratorio: "", dosisRecomendada: "", viaAdministracion: "", periodoRetiroDias: 0,
  });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await crear({
        variables: { ...form, periodoRetiroDias: parseInt(form.periodoRetiroDias) || 0 },
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <ModalBase title="Nueva vacuna" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Nombre *</label>
          <input required className="input-field" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </div>
        <div>
          <label className="label">Enfermedad *</label>
          <input required className="input-field" value={form.enfermedad} onChange={(e) => setForm({ ...form, enfermedad: e.target.value })} />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select className="input-field" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            <option value="viva">Viva</option>
            <option value="inactivada">Inactivada</option>
          </select>
        </div>
        <div>
          <label className="label">Laboratorio</label>
          <input className="input-field" value={form.laboratorio} onChange={(e) => setForm({ ...form, laboratorio: e.target.value })} />
        </div>
        <div>
          <label className="label">Período de retiro (días)</label>
          <input type="number" className="input-field" value={form.periodoRetiroDias} onChange={(e) => setForm({ ...form, periodoRetiroDias: e.target.value })} />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Guardando…" : "Crear vacuna"}
          </button>
        </div>
      </form>
    </ModalBase>
  );
}

function ModalNuevoPlan({ loteId, vacunas, onClose, onSaved }) {
  const [crear, { loading }] = useMutation(CREAR_PLAN);
  const [form, setForm] = useState({ vacunaId: "", fechaProgramada: "", dosis: "", responsable: "", observaciones: "" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await crear({ variables: { loteId, ...form } });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <ModalBase title="Programar vacuna" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Vacuna *</label>
          <select required className="input-field" value={form.vacunaId} onChange={(e) => setForm({ ...form, vacunaId: e.target.value })}>
            <option value="">— Selecciona —</option>
            {vacunas.map((v) => (
              <option key={v.id} value={v.id}>{v.nombre} ({v.enfermedad})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Fecha programada *</label>
          <input required type="date" className="input-field" value={form.fechaProgramada} onChange={(e) => setForm({ ...form, fechaProgramada: e.target.value })} />
        </div>
        <div>
          <label className="label">Dosis</label>
          <input className="input-field" value={form.dosis} onChange={(e) => setForm({ ...form, dosis: e.target.value })} placeholder="Ej: 0.5 ml" />
        </div>
        <div>
          <label className="label">Responsable</label>
          <input className="input-field" value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} />
        </div>
        <div>
          <label className="label">Observaciones</label>
          <textarea className="input-field" rows={2} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Guardando…" : "Programar"}
          </button>
        </div>
      </form>
    </ModalBase>
  );
}

function ModalNuevoTratamiento({ loteId, medicamentos, onClose, onSaved }) {
  const [crear, { loading }] = useMutation(CREAR_TRATAMIENTO);
  const [form, setForm] = useState({
    medicamentoId: "", dosis: "", fechaInicio: "", fechaFin: "",
    periodoRetiroDias: 0, motivo: "",
  });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await crear({
        variables: {
          loteId,
          medicamentoId: form.medicamentoId,
          dosis: form.dosis,
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin || null,
          periodoRetiroDias: parseInt(form.periodoRetiroDias) || 0,
          motivo: form.motivo,
        },
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <ModalBase title="Nuevo tratamiento" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Medicamento *</label>
          <select required className="input-field" value={form.medicamentoId} onChange={(e) => setForm({ ...form, medicamentoId: e.target.value })}>
            <option value="">— Selecciona —</option>
            {medicamentos.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre} (stock: {m.stock})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Dosis *</label>
          <input required className="input-field" value={form.dosis} onChange={(e) => setForm({ ...form, dosis: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Inicio *</label>
            <input required type="date" className="input-field" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} />
          </div>
          <div>
            <label className="label">Fin</label>
            <input type="date" className="input-field" value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Período de retiro (días)</label>
          <input type="number" className="input-field" value={form.periodoRetiroDias} onChange={(e) => setForm({ ...form, periodoRetiroDias: e.target.value })} />
        </div>
        <div>
          <label className="label">Motivo</label>
          <input className="input-field" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Guardando…" : "Crear tratamiento"}
          </button>
        </div>
      </form>
    </ModalBase>
  );
}

function ModalLimpieza({ galponId, onClose, onSaved }) {
  const [crear, { loading }] = useMutation(REGISTRAR_LIMPIEZA);
  const [form, setForm] = useState({ fecha: "", tipo: "limpieza", productosUsados: "", responsable: "" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await crear({ variables: { galponId, ...form } });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <ModalBase title="Registrar limpieza" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Fecha *</label>
          <input required type="date" className="input-field" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select className="input-field" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            <option value="limpieza">Limpieza</option>
            <option value="desinfeccion">Desinfección</option>
            <option value="vacio_sanitario">Vacío sanitario</option>
          </select>
        </div>
        <div>
          <label className="label">Productos usados</label>
          <textarea className="input-field" rows={2} value={form.productosUsados} onChange={(e) => setForm({ ...form, productosUsados: e.target.value })} />
        </div>
        <div>
          <label className="label">Responsable</label>
          <input className="input-field" value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Guardando…" : "Registrar"}
          </button>
        </div>
      </form>
    </ModalBase>
  );
}

function ModalRoedores({ onClose, onSaved }) {
  const [crear, { loading }] = useMutation(REGISTRAR_ROEDORES);
  const [form, setForm] = useState({ fecha: "", ubicacion: "", tipo: "", productosUsados: "", responsable: "", observaciones: "" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await crear({ variables: form });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <ModalBase title="Registrar control de roedores" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Fecha *</label>
          <input required type="date" className="input-field" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
        </div>
        <div>
          <label className="label">Ubicación *</label>
          <input required className="input-field" value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} placeholder="Ej: Galpón 1, perímetro, bodega" />
        </div>
        <div>
          <label className="label">Tipo</label>
          <input className="input-field" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} placeholder="Ej: cebos, trampas" />
        </div>
        <div>
          <label className="label">Productos usados</label>
          <textarea className="input-field" rows={2} value={form.productosUsados} onChange={(e) => setForm({ ...form, productosUsados: e.target.value })} />
        </div>
        <div>
          <label className="label">Responsable</label>
          <input className="input-field" value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} />
        </div>
        <div>
          <label className="label">Observaciones</label>
          <textarea className="input-field" rows={2} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Guardando…" : "Registrar"}
          </button>
        </div>
      </form>
    </ModalBase>
  );
}

function ModalBase({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-[var(--text-primary)]">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--bg-main)] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}