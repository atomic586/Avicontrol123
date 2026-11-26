import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import {
  Egg, Activity, ClipboardList, ShoppingBag, LayoutDashboard,
  Calendar, TrendingUp, AlertCircle, Plus
} from "lucide-react";
import ProduccionChart from "../components/ProduccionChart";

const LOTE_DETALLE_QUERY = gql`
  query LoteDetalle($id: ID!) {
    lote(id: $id) {
      id
      galponId
      codigo
      raza
      fechaIngreso
      fechaNacimiento
      cantidadAves
      estado
      etapa
      avesActuales
      porcentajeMortalidad
      edadSemanas
    }
  }
`;

export default function LoteDetalle() {
  const { id } = useParams();
  const [tab, setTab] = useState("resumen");

  const { data, loading, error } = useQuery(LOTE_DETALLE_QUERY, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  if (loading) return <div className="p-12 text-center text-gray-500">Cargando lote...</div>;
  if (error) return <div className="card text-red-600 p-4">Error: {error.message}</div>;

  const lote = data?.lote;
  if (!lote) return <div className="card text-center py-12 text-gray-500">Lote no encontrado.</div>;

  const avesPerdidas = lote.cantidadAves - lote.avesActuales;

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
        <button className="btn-primary">
          <Plus className="w-5 h-5" /> Registrar Movimiento
        </button>
        <button className="btn-secondary">
          <Plus className="w-5 h-5" /> Registrar Producción
        </button>
        <button className="btn-secondary">
          <Plus className="w-5 h-5" /> Registrar Consumo
        </button>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "resumen", label: "Resumen", icon: LayoutDashboard },
          { key: "movimientos", label: "Movimientos", icon: Activity },
          { key: "produccion", label: "Producción", icon: Egg },
          { key: "consumos", label: "Consumos", icon: ShoppingBag },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${
                active
                  ? "bg-dark dark:bg-white text-white dark:text-dark shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-white dark:text-dark" : "text-gray-400"}`} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "resumen" && (
        <div className="card text-center py-12 text-gray-500 dark:text-gray-400">
          Próximamente: resumen completo del lote.
        </div>
      )}
      {tab === "movimientos" && (
        <div className="card text-center py-12 text-gray-500 dark:text-gray-400">
          Próximamente: historial de movimientos de aves.
        </div>
      )}
      {tab === "produccion" && (
        <div className="card text-center py-12 text-gray-500 dark:text-gray-400">
          Próximamente: producción diaria del lote (con gráfico).
        </div>
      )}
      {tab === "consumos" && (
        <div className="card text-center py-12 text-gray-500 dark:text-gray-400">
          Próximamente: consumos de alimento del lote.
        </div>
      )}
    </div>
  );
}