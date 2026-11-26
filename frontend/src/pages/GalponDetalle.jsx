import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import {
  Home, Egg, ArrowLeft, LayoutDashboard, Activity, ClipboardList,
  ChevronRight, Calendar, Users
} from "lucide-react";

const GALPON_DETALLE_QUERY = gql`
  query GalponDetalle($id: ID!) {
    galpon(id: $id) {
      id
      codigo
      capacidadAves
      activo
      avesActuales
      granjaId
    }
  }
`;

export default function GalponDetalle() {
  const { id } = useParams();
  const [tab, setTab] = useState("resumen");

  const { data, loading, error } = useQuery(GALPON_DETALLE_QUERY, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  if (loading) return <div className="p-12 text-center text-gray-500">Cargando galpón...</div>;
  if (error) return <div className="card text-red-600 p-4">Error: {error.message}</div>;

  const galpon = data?.galpon;
  if (!galpon) return <div className="card text-center py-12 text-gray-500">Galpón no encontrado.</div>;

  const ocupacion = galpon.capacidadAves > 0
    ? Math.round((galpon.avesActuales / galpon.capacidadAves) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-10">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
        <Link to="/granjas" className="hover:text-orange-600">Granjas</Link>
        <span>/</span>
        <Link to={`/granjas/${galpon.granjaId}`} className="hover:text-orange-600">Granja</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-bold">Galpón {galpon.codigo}</span>
      </div>

      {/* HERO */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="h-48 w-full bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 flex items-end justify-between gap-4">
            <div className="text-white">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${
                galpon.activo
                  ? "bg-green-500/20 text-green-100 border-green-400/30"
                  : "bg-red-500/20 text-red-100 border-red-400/30"
              }`}>
                {galpon.activo ? "Activo" : "Inactivo"}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black mt-2">Galpón {galpon.codigo}</h1>
            </div>
            <div className="text-right text-white">
              <p className="text-xs uppercase tracking-wider opacity-70 font-bold">Ocupación</p>
              <p className="text-3xl font-black">{ocupacion}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-soft">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Capacidad</p>
          <p className="text-2xl font-black text-dark dark:text-white mt-1">
            {Number(galpon.capacidadAves).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-soft">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Aves actuales</p>
          <p className="text-2xl font-black text-orange-600 mt-1">
            {Number(galpon.avesActuales).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-soft">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Disponibles</p>
          <p className="text-2xl font-black text-green-600 mt-1">
            {Math.max(0, galpon.capacidadAves - galpon.avesActuales).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-soft">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Lotes</p>
          <p className="text-2xl font-black text-blue-600 mt-1">—</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "resumen", label: "Resumen", icon: LayoutDashboard },
          { key: "lotes", label: "Lotes", icon: Egg },
          { key: "movimientos", label: "Movimientos", icon: Activity },
          { key: "produccion", label: "Producción", icon: ClipboardList },
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

      {/* CONTENIDO */}
      {tab === "resumen" && (
        <div className="card text-center py-12 text-gray-500 dark:text-gray-400">
          Próximamente: resumen del galpón.
        </div>
      )}
      {tab === "lotes" && (
        <div className="card text-center py-12 text-gray-500 dark:text-gray-400">
          Próximamente: listado de lotes filtrable.
        </div>
      )}
      {tab === "movimientos" && (
        <div className="card text-center py-12 text-gray-500 dark:text-gray-400">
          Próximamente: movimientos de aves.
        </div>
      )}
      {tab === "produccion" && (
        <div className="card text-center py-12 text-gray-500 dark:text-gray-400">
          Próximamente: producción del galpón.
        </div>
      )}
    </div>
  );
}