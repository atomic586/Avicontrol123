import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import {
  Egg, Bird, Plus, Skull, TrendingDown, ArrowRight, Clock, Utensils, Scale, Trash2
} from "lucide-react";
import { PRODUCCIONES_QUERY, REGISTRAR_PRODUCCION } from "../graphql/produccion";
import {
  LOTES_CON_AVES_QUERY,
  MOVIMIENTOS_AVES_QUERY,
  AVANZAR_ETAPA_LOTE,
} from "../graphql/aves";
import { 
  CONSUMOS_QUERY, 
  REGISTRAR_CONSUMO, 
  ELIMINAR_CONSUMO 
} from "../graphql/consumos";
import { useAuth } from "../auth/AuthContext";
import MovimientoAveModal from "../components/MovimientoAveModal";
import Modal from "../components/Modal";

const LOTES_QUERY = gql`
  query LotesParaProduccion {
    lotes { id codigo raza estado }
  }
`;

const INSUMOS_QUERY = gql`
  query InsumosParaConsumo {
    insumos(tipo: "alimento") {
      id
      nombre
      presentacion
      stock
      unidadMedida
    }
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

const FORM_CONSUMO_VACIO = {
  loteId: "",
  insumoId: "",
  fecha: new Date().toISOString().split("T")[0],
  cantidad: "",
  observaciones: "",
};

const ETAPA_LABEL = {
  cria: "Cría",
  recria: "Recría",
  postura: "Postura",
  descarte: "Descarte",
};

const ETAPA_COLOR = {
  cria: "badge-info",
  recria: "badge-warning",
  postura: "badge-success",
  descarte: "badge-danger",
};

const TIPO_LABEL = {
  ingreso: "Ingreso",
  muerte: "Muerte",
  venta: "Venta",
  traslado_salida: "Traslado (sale)",
  traslado_entrada: "Traslado (entra)",
  descarte: "Descarte",
  ajuste: "Ajuste",
};

const TIPO_COLOR = {
  ingreso: "text-green-600",
  muerte: "text-red-600",
  venta: "text-blue-600",
  traslado_salida: "text-amber-600",
  traslado_entrada: "text-amber-600",
  descarte: "text-gray-600",
  ajuste: "text-purple-600",
};

export default function Produccion() {
  const { tieneRol } = useAuth();
  const puedeRegistrar = tieneRol(["superadmin", "admin_granja", "encargado_produccion"]);
  const puedeAlmacen = tieneRol(["superadmin", "admin_granja", "encargado_produccion", "encargado_almacen"]);

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("seccion");
  const tab = requestedTab === "aves" || requestedTab === "alimento" ? requestedTab : "produccion";

  // ==========================================
  // TAB 1: PRODUCCIÓN
  // ==========================================
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const { data: dataLotes } = useQuery(LOTES_QUERY, { fetchPolicy: "network-only" });
  const { data, loading, error: qError, refetch } = useQuery(PRODUCCIONES_QUERY, { fetchPolicy: "network-only" });
  const [registrar, { loading: guardando }] = useMutation(REGISTRAR_PRODUCCION);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "loteId" || name === "fecha" ? value : parseInt(value) || 0 });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");
    if (!form.loteId) { setError("Debes seleccionar un lote."); return; }
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
  const totalHoy = producciones
    .filter((p) => p.fecha === new Date().toISOString().split("T")[0])
    .reduce((a, p) => a + p.total, 0);

  // ==========================================
  // TAB 2: AVES
  // ==========================================
  const {
    data: dataLotesAves,
    loading: cargandoLotes,
    refetch: refetchLotesAves,
  } = useQuery(LOTES_CON_AVES_QUERY, { fetchPolicy: "network-only" });

  const [avanzarEtapa] = useMutation(AVANZAR_ETAPA_LOTE);

  const [modalMovOpen, setModalMovOpen] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);
  const [modalHistorialOpen, setModalHistorialOpen] = useState(false);
  const [loteHistorial, setLoteHistorial] = useState(null);

  const abrirMovimiento = (lote) => {
    setLoteSeleccionado(lote);
    setModalMovOpen(true);
  };

  const abrirHistorial = (lote) => {
    setLoteHistorial(lote);
    setModalHistorialOpen(true);
  };

  const onAvanzarEtapa = async (lote) => {
    if (!window.confirm(`¿Avanzar "${lote.codigo}" de "${ETAPA_LABEL[lote.etapa]}" a la siguiente etapa?`)) return;
    try {
      await avanzarEtapa({ variables: { loteId: lote.id } });
      refetchLotesAves();
    } catch (err) {
      alert(err.message);
    }
  };

  const lotesAves = dataLotesAves?.lotesConAves ?? [];

  // ==========================================
  // TAB 3: ALIMENTO (CONSUMOS)
  // ==========================================
  const [formConsumo, setFormConsumo] = useState(FORM_CONSUMO_VACIO);
  const [errorConsumo, setErrorConsumo] = useState("");
  const [exitoConsumo, setExitoConsumo] = useState("");

  const { data: dataInsumos } = useQuery(INSUMOS_QUERY, { fetchPolicy: "network-only" });
  const { data: dataConsumos, loading: cargandoConsumos, refetch: refetchConsumos } = useQuery(CONSUMOS_QUERY, { fetchPolicy: "network-only" });
  
  const [registrarConsumo, { loading: guardandoConsumo }] = useMutation(REGISTRAR_CONSUMO);
  const [eliminarConsumo] = useMutation(ELIMINAR_CONSUMO);

  const onChangeConsumo = (e) => {
    setFormConsumo({ ...formConsumo, [e.target.name]: e.target.value });
  };

  const onSubmitConsumo = async (e) => {
    e.preventDefault();
    setErrorConsumo("");
    setExitoConsumo("");
    
    if (!formConsumo.loteId) { setErrorConsumo("Debes seleccionar un lote."); return; }
    if (!formConsumo.insumoId) { setErrorConsumo("Debes seleccionar un alimento."); return; }
    if (!formConsumo.cantidad || parseFloat(formConsumo.cantidad) <= 0) { setErrorConsumo("La cantidad debe ser mayor a 0."); return; }

    try {
      await registrarConsumo({
        variables: {
          loteId: formConsumo.loteId,
          insumoId: formConsumo.insumoId,
          fecha: formConsumo.fecha,
          cantidad: parseFloat(formConsumo.cantidad),
          observaciones: formConsumo.observaciones,
        },
      });
      setExitoConsumo("Consumo registrado. El stock fue descontado.");
      setFormConsumo({ ...FORM_CONSUMO_VACIO, loteId: formConsumo.loteId });
      refetchConsumos();
    } catch (err) {
      setErrorConsumo(err.message);
    }
  };

  const onEliminarConsumo = async (id) => {
    if (!window.confirm("¿Eliminar este consumo? El stock será devuelto al inventario.")) return;
    try {
      await eliminarConsumo({ variables: { id } });
      refetchConsumos();
    } catch (err) {
      alert(err.message);
    }
  };

  const consumos = dataConsumos?.consumosGranja ?? [];
  const insumosAlimento = dataInsumos?.insumos ?? [];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
            <Egg className="w-8 h-8 text-brand-500" /> Producción
          </h1>
          <p className="text-gray-500 text-base mt-1 font-medium">
            Producción de huevos, control de aves y consumo de alimento
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: "produccion", label: "Producción diaria", icon: Egg },
          { key: "aves", label: `Aves (${lotesAves.length})`, icon: Bird },
          { key: "alimento", label: "Consumo Alimento", icon: Utensils },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setSearchParams(t.key === "produccion" ? {} : { seccion: t.key }, { replace: true })}
              className={`px-4 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                tab === t.key
                  ? "border-brand-500 text-brand-700"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ============ TAB PRODUCCIÓN ============ */}
      {tab === "produccion" && (
        <>
          {qError && (
            <div className="card bg-red-50 border-red-200 text-red-700 p-4">
              <p className="font-bold mb-1">Error al cargar producción:</p>
              <p className="text-sm font-mono bg-white p-2 rounded border border-red-200">{qError.message}</p>
            </div>
          )}

          <div className={puedeRegistrar ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : "grid grid-cols-1 gap-6"}>
            {puedeRegistrar && (
              <div className="card lg:col-span-1">
                <h2 className="text-xl font-black text-dark mb-4">Registrar producción</h2>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-1 block">Lote *</label>
                    <select name="loteId" className="input-field" value={form.loteId} onChange={onChange} required>
                      <option value="">Selecciona un lote</option>
                      {dataLotes?.lotes?.map((l) => (
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
                  {exito && (
                    <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg border border-green-200">
                      <p className="font-bold">{exito}</p>
                      <p className="text-xs mt-1">El stock de los productos se ha actualizado automáticamente.</p>
                    </div>
                  )}
                  <button type="submit" disabled={guardando} className="btn-primary w-full">
                    {guardando ? "Guardando..." : "Guardar producción"}
                  </button>
                </form>
              </div>
            )}

            <div className={puedeRegistrar ? "card lg:col-span-2" : "card"}>
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
                      producciones.map((p) => (
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
        </>
      )}

      {/* ============ TAB AVES ============ */}
      {tab === "aves" && (
        <>
          {cargandoLotes ? (
            <div className="card text-center py-12 text-gray-500">Cargando lotes...</div>
          ) : lotesAves.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">
              No hay lotes activos. Crea uno desde la sección de lotes.
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-base">
                  <thead className="bg-brand-50 text-brand-800 text-sm uppercase tracking-wider">
                    <tr>
                      <th className="text-left p-4 font-bold">Lote</th>
                      <th className="text-left p-4 font-bold">Etapa</th>
                      <th className="text-right p-4 font-bold">Aves iniciales</th>
                      <th className="text-right p-4 font-bold">Aves actuales</th>
                      <th className="text-right p-4 font-bold">Mortalidad</th>
                      <th className="text-right p-4 font-bold">Edad</th>
                      <th className="text-right p-4 font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lotesAves.map((l) => (
                      <tr key={l.id} className="border-t border-gray-100 hover:bg-brand-50/30">
                        <td className="p-4 font-bold text-dark">
                          <p>{l.codigo}</p>
                          <p className="text-xs text-gray-500 font-normal">{l.raza}</p>
                        </td>
                        <td className="p-4">
                          <span className={ETAPA_COLOR[l.etapa] || "badge-info"}>
                            {ETAPA_LABEL[l.etapa] || l.etapa}
                          </span>
                        </td>
                        <td className="p-4 text-right text-gray-600">{l.cantidadAves.toLocaleString()}</td>
                        <td className="p-4 text-right font-black text-brand-700">{l.avesActuales.toLocaleString()}</td>
                        <td className="p-4 text-right">
                          <span className={l.porcentajeMortalidad > 5 ? "text-red-600 font-bold" : "text-gray-700"}>
                            {l.porcentajeMortalidad}%
                          </span>
                        </td>
                        <td className="p-4 text-right text-gray-600">
                          {l.edadSemanas != null ? `${l.edadSemanas} sem` : "—"}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          {puedeRegistrar && (
                            <>
                              <button onClick={() => abrirMovimiento(l)} className="text-brand-700 hover:text-brand-900 hover:bg-brand-50 p-2 rounded-lg" title="Registrar movimiento">
                                <Plus className="w-4 h-4" />
                              </button>
                              <button onClick={() => abrirHistorial(l)} className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 p-2 rounded-lg ml-1" title="Ver historial">
                                <Clock className="w-4 h-4" />
                              </button>
                              {l.etapa !== "descarte" && (
                                <button onClick={() => onAvanzarEtapa(l)} className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg ml-1" title="Avanzar etapa">
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <MovimientoAveModal
            open={modalMovOpen}
            onClose={() => setModalMovOpen(false)}
            lote={loteSeleccionado}
            lotesDisponibles={lotesAves}
            onSuccess={() => {
              refetchLotesAves();
              setModalMovOpen(false);
            }}
          />

          <Modal open={modalHistorialOpen} onClose={() => setModalHistorialOpen(false)} title={`Historial — ${loteHistorial?.codigo ?? ""}`}>
            {loteHistorial && <HistorialLote loteId={loteHistorial.id} />}
          </Modal>
        </>
      )}

      {/* ============ TAB ALIMENTO ============ */}
      {tab === "alimento" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de Registro */}
          {puedeAlmacen && (
            <div className="card lg:col-span-1 h-fit">
              <h2 className="text-xl font-black text-dark mb-4 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-brand-500" /> Registrar consumo
              </h2>
              <form onSubmit={onSubmitConsumo} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-1 block">Lote *</label>
                  <select name="loteId" className="input-field" value={formConsumo.loteId} onChange={onChangeConsumo} required>
                    <option value="">Selecciona un lote</option>
                    {dataLotes?.lotes?.map((l) => (
                      <option key={l.id} value={l.id}>{l.codigo} — {l.raza}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-1 block">Alimento *</label>
                  <select name="insumoId" className="input-field" value={formConsumo.insumoId} onChange={onChangeConsumo} required>
                    <option value="">Selecciona un alimento</option>
                    {insumosAlimento.map((i) => (
                      <option key={i.id} value={i.id}>{i.nombre} (Stock: {i.stock})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-1 block">Cantidad (kg) *</label>
                    <input type="number" step="0.01" name="cantidad" className="input-field" value={formConsumo.cantidad} onChange={onChangeConsumo} required min="0.01" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-1 block">Fecha *</label>
                    <input type="date" name="fecha" className="input-field" value={formConsumo.fecha} onChange={onChangeConsumo} required />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-1 block">Observaciones</label>
                  <input type="text" name="observaciones" className="input-field" value={formConsumo.observaciones} onChange={onChangeConsumo} placeholder="Opcional..." />
                </div>
                
                {errorConsumo && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{errorConsumo}</div>}
                {exitoConsumo && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg border border-green-200">{exitoConsumo}</div>}
                
                <button type="submit" disabled={guardandoConsumo} className="btn-primary w-full">
                  {guardandoConsumo ? "Guardando..." : "Registrar y descontar stock"}
                </button>
              </form>
            </div>
          )}

          {/* Historial de Consumos */}
          <div className={puedeAlmacen ? "card lg:col-span-2" : "card lg:col-span-3"}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-dark">Historial de consumo</h2>
                <p className="text-sm text-gray-500 mt-1">{consumos.length} registros</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-50 text-brand-800 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="text-left p-3 font-bold">Fecha</th>
                    <th className="text-left p-3 font-bold">Lote</th>
                    <th className="text-left p-3 font-bold">Alimento</th>
                    <th className="text-right p-3 font-bold">Cantidad</th>
                    <th className="text-center p-3 font-bold">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {cargandoConsumos ? (
                    <tr><td colSpan={5} className="p-6 text-center text-gray-500">Cargando consumos...</td></tr>
                  ) : consumos.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-gray-500">No hay consumos registrados aún.</td></tr>
                  ) : (
                    consumos.map((c) => (
                      <tr key={c.id} className="border-t border-gray-100 hover:bg-brand-50/30">
                        <td className="p-3 font-bold text-dark">{new Date(c.fecha).toLocaleDateString("es-BO")}</td>
                        <td className="p-3 text-gray-600">{c.loteId}</td>
                        <td className="p-3 text-gray-600">{c.insumoId}</td>
                        <td className="p-3 text-right font-black text-brand-700">{Number(c.cantidad).toLocaleString()} kg</td>
                        <td className="p-3 text-center">
                          {puedeAlmacen && (
                            <button 
                              onClick={() => onEliminarConsumo(c.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                              title="Eliminar consumo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sub-componente: Historial de un lote (Aves)
// ============================================================
function HistorialLote({ loteId }) {
  const { data, loading, error } = useQuery(MOVIMIENTOS_AVES_QUERY, {
    variables: { loteId },
    fetchPolicy: "network-only",
  });

  if (loading) return <p className="text-center py-6 text-gray-500">Cargando historial...</p>;
  if (error) return <p className="text-red-600 p-4">{error.message}</p>;

  const movs = data?.movimientosAvesLote ?? [];

  if (movs.length === 0) {
    return <p className="text-center py-6 text-gray-500">Este lote no tiene movimientos registrados.</p>;
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {movs.map((m) => (
        <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div>
            <p className={`font-bold text-sm ${TIPO_COLOR[m.tipo] || "text-gray-700"}`}>
              {TIPO_LABEL[m.tipo] || m.tipo}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(m.fecha).toLocaleDateString("es-BO")}
              {m.motivo && ` — ${m.motivo}`}
            </p>
          </div>
          <p className="font-black text-lg text-dark">{m.cantidad.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
