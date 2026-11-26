import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  Building2, Plus, Pencil, MapPin, Phone, Mail, Power, PowerOff,
} from "lucide-react";
import {
  GRANJAS_QUERY,
  CAMBIAR_ESTADO_GRANJA,
} from "../graphql/granjas";
import ModalCrearGranja from "../components/ModalCrearGranja";

export default function Granjas() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);

  const { data, loading, error: qError, refetch } = useQuery(GRANJAS_QUERY, {
    fetchPolicy: "network-only",
  });

  const [cambiarEstadoGranja] = useMutation(CAMBIAR_ESTADO_GRANJA);

  const abrirCrear = () => {
    setEditando(null);
    setModalOpen(true);
  };

  const abrirEditar = (g) => {
    setEditando(g);
    setModalOpen(true);
  };

  const toggleEstado = async (g) => {
    const nuevoEstado = !g.activo;
    const verbo = nuevoEstado ? "activar" : "suspender";
    if (!window.confirm(`¿Seguro que quieres ${verbo} la granja "${g.nombre}"?`)) return;
    try {
      await cambiarEstadoGranja({
        variables: { id: g.id, activo: nuevoEstado },
      });
      refetch();
    } catch (err) {
      alert(`Error al ${verbo} la granja: ${err.message}`);
    }
  };

  const granjas = data?.granjas ?? [];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-dark dark:text-white tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-orange-500" /> Granjas
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base mt-1 font-medium">
            Administra todas las granjas de la plataforma
          </p>
        </div>
        <button onClick={abrirCrear} className="btn-primary">
          <Plus className="w-5 h-5" /> Nueva granja
        </button>
      </div>

      {/* ERROR */}
      {qError && (
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-700 dark:text-red-300 font-bold">
          {qError.message}
        </div>
      )}

      {/* LISTA */}
      {loading ? (
        <div className="card text-center py-12 text-gray-500 dark:text-gray-400">
          Cargando granjas...
        </div>
      ) : granjas.length === 0 ? (
        <div className="card text-center py-12 text-gray-500 dark:text-gray-400">
          No hay granjas registradas. ¡Crea la primera!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {granjas.map((g) => (
            <div
              key={g.id}
              className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-soft border border-gray-100 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-500 transition-all group"
            >
              {/* Imagen Hero como fondo de la tarjeta */}
              <Link to={`/granjas/${g.id}`} className="block relative h-40 bg-gray-900 overflow-hidden">
                {g.heroFinal ? (
                  <img
                    src={g.heroFinal}
                    alt={g.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600"></div>
                )}
                {/* Gradiente inferior para el texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                {/* Badge de estado */}
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${
                    g.activo
                      ? "bg-green-500/20 text-green-100 border-green-400/30"
                      : "bg-red-500/20 text-red-100 border-red-400/30"
                  }`}>
                    {g.activo ? "Activa" : "Suspendida"}
                  </span>
                </div>

                {/* Código (abajo izquierda) */}
                <div className="absolute bottom-3 left-3 text-white/90 text-xs font-mono bg-black/40 backdrop-blur-md px-2 py-1 rounded-md">
                  {g.codigo}
                </div>
              </Link>

              {/* Contenido de la tarjeta */}
              <div className="p-5">
                <Link to={`/granjas/${g.id}`}>
                  <h3 className="text-xl font-black text-dark dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
                    {g.nombre}
                  </h3>
                  {g.razonSocial && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 truncate">
                      {g.razonSocial}
                    </p>
                  )}
                </Link>

                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mt-3">
                  <p className="flex items-center gap-2 truncate">
                    <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span className="truncate">{g.ubicacion}</span>
                  </p>
                  {g.telefono && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-orange-500 flex-shrink-0" /> {g.telefono}
                    </p>
                  )}
                  {g.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <span className="truncate">{g.email}</span>
                    </p>
                  )}
                </div>

                {/* Botones */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => abrirEditar(g)}
                    className="text-sm inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-bold bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Pencil className="w-4 h-4" /> Editar
                  </button>
                  <button
                    onClick={() => toggleEstado(g)}
                    className={
                      g.activo
                        ? "text-sm inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                        : "text-sm inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    }
                  >
                    {g.activo ? (
                      <><PowerOff className="w-4 h-4" /> Suspender</>
                    ) : (
                      <><Power className="w-4 h-4" /> Activar</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL NUEVO */}
      <ModalCrearGranja
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        granjaEditando={editando}
        onSuccess={() => refetch()}
      />
    </div>
  );
}