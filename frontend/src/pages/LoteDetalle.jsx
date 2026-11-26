import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import {
  Egg, Activity, ClipboardList, ShoppingBag, LayoutDashboard,
  Plus, ArrowUpRight, ArrowDownRight, Home as HomeIcon
} from "lucide-react";
import { LOTE_DETALLE_QUERY } from "../graphql/lotes";
import ProduccionChart from "../components/ProduccionChart";
import HuevoMascota from "../components/HuevoMascota";
import ModalMovimientoAve from "../components/ModalMovimientoAve";
import ModalProduccion from "../components/ModalProduccion";
import ModalConsumo from "../components/ModalConsumo";

const TIPO_LABEL = {
  ingreso: "Ingreso",
  muerte: "Muerte",
  venta: "Venta",
  traslado_salida: "Traslado sale",
  traslado_entrada: "Traslado entra",
  descarte: "Descarte",
  ajuste_positivo: "Ajuste +",
  ajuste_negativo: "Ajuste −",
};

const TIPO_COLOR = {
  ingreso: "badge-success",
  traslado_entrada: "badge-success",
  ajuste_positivo: "badge-success",
  muerte: "badge-danger",
  descarte: "badge-danger",
  ajuste_negativo: "badge-danger",
  venta: "badge-info",
  traslado_salida: "badge-warning",
};

export default function LoteDetalle() {
  const { id } = useParams();
  const [tab, setTab] = useState("resumen");
  const [modalMov, setModalMov] = useState(false);
  const [modalProd, setModalProd] = useState(false);
  const [modalCons, setModalCons] = useState(false);

  const { data, loading, error, refetch } = useQuery(LOTE_DETALLE_QUERY, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
        <HuevoMascota phase="loading" />
        <p className="text-gray-500 dark:text-gray-400 font-bold mt-6">Cargando lote...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
        <p className="font-bold mb-2">Error al cargar el lote:</p>
        <p className="text-sm font-mono">{error.message}</p>
      </div>
    );
  }

  const lote = data?.lote;
  if (!lote) {
    return <div className="card text-center py-12 text-gray-500">Lote no encontrado.</div>;
  }

  const movimientos = data?.movimientosAvesLote ?? [];
  const producciones = data?.producciones ?? [];
  const consumos = data?.consumosLote ?? [];

  const avesPerdidas = lote.cantidadAves - lote.avesActuales;

  // Últimos 30 días de producción para el gráfico
  const produccionChart = [...producciones]
    .slice(0, 30)
    .reverse()
    .map((p) => ({
      fecha: new Date(p.fecha).toLocaleDateString("es-BO", { day: "2-digit", month: "short" }),
      huevos: p.total,
    }));

  return (
    <div className="space-y-6 pb-10">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium flex-wrap">
        <Link to="/granjas" className="hover:text-orange-600">Granjas</Link>
        <span>/</span>
        <Link to={`/galpones/${lote.galponId}`} className="hover:text-orange-600">Galpón</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-bold">Lote {lote.codigo}</span>
      </div>

      {/* HERO */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="h-48 w-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 flex items-end justify-between gap-4">
            <div className="text-white">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md bg-blue-500/20 text-blue-100 border border-blue-400/30">
                {lote.etapa}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black mt-2">Lote {lote.codigo}</h1>
              <p className="text-white/80 text-sm mt-1">{lote.raza}</p>
            </div>
            <div className="text-right text-white">
              <p className="text-xs uppercase tracking-wider opacity-70 font-bold">Edad</p>
              <p className="text-3xl font-black">
                {lote.edadSemanas !== null ? `${lote.edadSemanas} sem` : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-soft">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Aves iniciales</p>
          <p className="text-2xl font-black text-dark dark:text-white mt-1">
            {Number(lote.cantidadAves).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-soft">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Aves actuales</p>
          <p className="text-2xl font-black text-orange-600 mt-1">
            {Number(lote.avesActuales).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-soft">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Mortalidad</p>
          <p className={`text-2xl font-black mt-1 ${lote.porcentajeMortalidad > 5 ? "text-red-500" : "text-gray-700 dark:text-gray-300"}`}>
            {lote.porcentajeMortalidad}%
          </p>
          <p className="text-xs text-gray-400 mt-1">{avesPerdidas} aves perdidas</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-soft">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Ingreso</p>
          <p className="text-lg font-black text-gray-700 dark:text-gray-300 mt-1">
            {new Date(lote.fechaIngreso).toLocaleDateString("es-BO")}
          </p>
        </div>
      </div>

      {/* ACCIONES RÁPIDAS */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setModalMov(true)} className="btn-primary">
          <Plus className="w-5 h-5" /> Registrar Movimiento
        </button>
        <button onClick={() => setModalProd(true)} className="btn-secondary">
          <Plus className="w-5 h-5" /> Registrar Producción
        </button>
        <button onClick={() => setModalCons(true)} className="btn-secondary">
          <Plus className="w-5 h-5" /> Registrar Consumo
        </button>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "resumen", label: "Resumen", icon: LayoutDashboard },
          { key: "movimientos", label: `Movimientos (${movimientos.length})`, icon: Activity },
          { key: "produccion", label: `Producción (${producciones.length})`, icon: Egg },
          { key: "consumos", label: `Consumos (${consumos.length})`, icon: ShoppingBag },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
                active
                  ? "bg-dark text-white dark:bg-white dark:text-dark shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-white dark:text-dark" : "text-gray-400"}`} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* CONTENIDO */}
      {tab === "resumen" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <ProduccionChart data={produccionChart} loading={loading} />
        </div>
      )}

      {tab === "movimientos" && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {movimientos.length === 0 ? (
            <p className="p-12 text-center text-gray-500 dark:text-gray-400">
              Este lote no tiene movimientos registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left p-4 font-bold">Fecha</th>
                    <th className="text-left p-4 font-bold">Tipo</th>
                    <th className="text-right p-4 font-bold">Cantidad</th>
                    <th className="text-left p-4 font-bold">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m) => (
                    <tr key={m.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                      <td className="p-4 text-gray-700 dark:text-gray-300">
                        {new Date(m.fecha).toLocaleDateString("es-BO")}
                      </td>
                      <td className="p-4">
                        <span className={TIPO_COLOR[m.tipo] || "badge-info"}>
                          {TIPO_LABEL[m.tipo] || m.tipo}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-dark dark:text-white">
                        {m.tipo.includes("entrada") || m.tipo === "ingreso" || m.tipo === "ajuste_positivo" ? (
                          <span className="text-green-600 flex items-center justify-end gap-1">
                            <ArrowUpRight className="w-4 h-4" /> {m.cantidad}
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center justify-end gap-1">
                            <ArrowDownRight className="w-4 h-4" /> {m.cantidad}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-500 dark:text-gray-400">{m.motivo || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "produccion" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <ProduccionChart data={produccionChart} loading={loading} />
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
            {producciones.length === 0 ? (
              <p className="p-12 text-center text-gray-500 dark:text-gray-400">
                No hay producciones registradas.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left p-4 font-bold">Fecha</th>
                      <th className="text-right p-4 font-bold">1ra</th>
                      <th className="text-right p-4 font-bold">2da</th>
                      <th className="text-right p-4 font-bold">3ra</th>
                      <th className="text-right p-4 font-bold">Descartados</th>
                      <th className="text-right p-4 font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {producciones.map((p) => (
                      <tr key={p.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                        <td className="p-4 text-gray-700 dark:text-gray-300">
                          {new Date(p.fecha).toLocaleDateString("es-BO")}
                        </td>
                        <td className="p-4 text-right text-gray-700 dark:text-gray-300">{p.huevosPrimera}</td>
                        <td className="p-4 text-right text-gray-700 dark:text-gray-300">{p.huevosSegunda}</td>
                        <td className="p-4 text-right text-gray-700 dark:text-gray-300">{p.huevosTercera}</td>
                        <td className="p-4 text-right text-gray-500">{p.huevosDescartados}</td>
                        <td className="p-4 text-right font-black text-orange-600">{p.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "consumos" && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {consumos.length === 0 ? (
            <p className="p-12 text-center text-gray-500 dark:text-gray-400">
              No hay consumos registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left p-4 font-bold">Fecha</th>
                    <th className="text-right p-4 font-bold">Cantidad (kg)</th>
                    <th className="text-left p-4 font-bold">Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {consumos.map((c) => (
                    <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                      <td className="p-4 text-gray-700 dark:text-gray-300">
                        {new Date(c.fecha).toLocaleDateString("es-BO")}
                      </td>
                      <td className="p-4 text-right font-bold text-orange-600">{c.cantidad} kg</td>
                      <td className="p-4 text-gray-500 dark:text-gray-400">{c.observaciones || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODALES */}
      <ModalMovimientoAve
        open={modalMov}
        onClose={() => setModalMov(false)}
        lote={lote}
        onSuccess={() => refetch()}
      />
      <ModalProduccion
        open={modalProd}
        onClose={() => setModalProd(false)}
        lote={lote}
        onSuccess={() => refetch()}
      />
      <ModalConsumo
        open={modalCons}
        onClose={() => setModalCons(false)}
        lote={lote}
        onSuccess={() => refetch()}
      />
    </div>
  );
}